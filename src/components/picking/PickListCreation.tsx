import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ArrowLeft, Package, Check, ChevronsUpDown, Plus, RefreshCw } from "lucide-react";
import { PickListPurpose } from "../../pages/PickList";
import { useMaterialRequestAPI, useSalesOrderAPI, useWorkOrderAPI } from "@/hooks/useERPNextAPI";
import { getUserDefaultCompany, createERPNextAPI } from "@/services/erpnextApi";
import { useToast } from "@/hooks/use-toast";

interface PickListCreationProps {
  onPickListCreated: (pickListData: any) => void;
  onBack: () => void;
}

const PickListCreation = ({ onPickListCreated, onBack }: PickListCreationProps) => {
  const [purpose, setPurpose] = useState<PickListPurpose>("Material Transfer");
  const [relatedDocument, setRelatedDocument] = useState("");
  const [availableDocuments, setAvailableDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  
  const { getMaterialRequests } = useMaterialRequestAPI();
  const { getSalesOrders } = useSalesOrderAPI();
  const { getWorkOrders } = useWorkOrderAPI();
  const { toast } = useToast();

  const purposeOptions: PickListPurpose[] = [
    "Material Transfer", 
    "Delivery", 
    "Material Transfer for Manufacture"
  ];

  useEffect(() => {
    fetchDocuments();
  }, [purpose]);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const company = await getUserDefaultCompany();
      let documents = [];

      if (purpose === "Material Transfer") {
        const response = await getMaterialRequests([
          ['docstatus', '=', 1],
          ['material_request_type', '=', 'Material Transfer'],
          ['per_ordered', '<', 100]
        ]);
        documents = (response as any)?.data?.data || (response as any)?.data || [];
      } else if (purpose === "Delivery") {
        const response = await getSalesOrders([
          ['docstatus', '=', 1],
          ['status', 'in', ['To Deliver and Bill', 'To Deliver']],
          ['per_delivered', '<', 100]
        ]);
        documents = (response as any)?.data?.data || (response as any)?.data || [];
      } else if (purpose === "Material Transfer for Manufacture") {
        const response = await getWorkOrders([
          ['docstatus', '=', 1],
          ['status', 'in', ['Not Started', 'In Process']]
        ]);
        documents = (response as any)?.data?.data || (response as any)?.data || [];
      }

      setAvailableDocuments(documents);
    } catch (error) {
      console.error('Error fetching documents:', error);
      toast({
        title: "Error",
        description: "Failed to fetch documents",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePickList = async () => {
    if (!relatedDocument) {
      toast({
        title: "Document Required",
        description: "Please select a document to create pick list from",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);
      const api = await createERPNextAPI();
      const company = await getUserDefaultCompany();
      
      if (!api) {
        throw new Error("Failed to initialize ERPNext API");
      }

      // Create pick list with proper ERPNext structure
      const pickListData = {
        purpose: purpose,
        company: company,
        ...(purpose === "Material Transfer" && { material_request: relatedDocument }),
        ...(purpose === "Delivery" && { sales_order: relatedDocument }),
        ...(purpose === "Material Transfer for Manufacture" && { work_order: relatedDocument })
      };

      console.log('Creating pick list with data:', pickListData);
      
      // Create the pick list
      const result = await api.createPickList(pickListData);
      const pickListName = result.data?.name;
      
      if (!pickListName) {
        throw new Error("Pick List created but no name returned");
      }

      console.log('Pick list created:', pickListName);

      // Get item locations using ERPNext's correct method based on purpose
      let methodName = '';
      if (purpose === "Material Transfer") {
        methodName = 'get_items_from_material_request';
      } else if (purpose === "Delivery") {
        methodName = 'get_items_from_sales_order';  
      } else if (purpose === "Material Transfer for Manufacture") {
        methodName = 'get_items_from_work_order';
      }

      if (methodName) {
        try {
          await api.callMethod('Pick List', pickListName, methodName);
          console.log(`Called ${methodName} successfully`);
        } catch (methodError) {
          console.warn(`Method ${methodName} failed, trying alternative approach:`, methodError);
          // Fallback: try to get items manually and populate locations
          await populatePickListItems(api, pickListName, purpose, relatedDocument);
        }
      }
      
      // Fetch the updated pick list with items
      const pickListDetails = await api.getPickList(pickListName);
      const plData = pickListDetails.data?.data || pickListDetails.data;
      
      console.log('Pick list with items:', plData);

      // Format items for our interface
      const formattedItems = Array.isArray(plData.locations) ? plData.locations.map((item: any, index: number) => ({
        id: (index + 1).toString(),
        item_code: item.item_code,
        code: item.item_code,
        item_name: item.item_name || item.item_code,
        name: item.item_name || item.item_code,
        warehouse: item.warehouse,
        bin: item.warehouse,
        batch_no: item.batch_no || '',
        batch: item.batch_no || '',
        serial_no: item.serial_no || '',
        serial: item.serial_no || '',
        qty: item.qty || 0,
        requiredQty: item.qty || 0,
        picked_qty: item.picked_qty || 0,
        pickedQty: item.picked_qty || 0,
        has_batch_no: item.has_batch_no || false,
        has_serial_no: item.has_serial_no || false,
        status: (item.picked_qty || 0) === 0 ? "pending" : 
                (item.picked_qty || 0) < item.qty ? "partial" : "completed"
      })) : [];

      const createdPickList = {
        name: plData.name,
        purpose: plData.purpose,
        company: plData.company,
        relatedDocument: relatedDocument,
        items: formattedItems,
        locations: plData.locations
      };

      toast({
        title: "Pick List Created",
        description: `Pick List ${pickListName} created with ${formattedItems.length} items`,
      });

      onPickListCreated(createdPickList);
      
    } catch (error) {
      console.error('Error creating pick list:', error);
      toast({
        title: "Error",
        description: "Failed to create pick list",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getDocumentLabel = () => {
    switch (purpose) {
      case "Material Transfer":
        return "Material Request";
      case "Delivery":
        return "Sales Order";
      case "Material Transfer for Manufacture":
        return "Work Order";
      default:
        return "Document";
    }
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="outline" size="sm" onClick={onBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Create New Pick List</h1>
              <p className="text-muted-foreground">Follow ERPNext pick list workflow</p>
            </div>
          </div>
        </div>

        {/* Creation Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Package className="h-5 w-5" />
              <span>Pick List Details</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Purpose Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Purpose</label>
              <Select value={purpose} onValueChange={(value) => setPurpose(value as PickListPurpose)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select purpose" />
                </SelectTrigger>
                <SelectContent>
                  {purposeOptions.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Document Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium">{getDocumentLabel()}</label>
              <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between"
                    disabled={loading}
                  >
                    {relatedDocument
                      ? availableDocuments.find((doc) => doc.name === relatedDocument)?.name
                      : `Select ${getDocumentLabel().toLowerCase()}...`}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0">
                  <Command>
                    <CommandInput placeholder={`Search ${getDocumentLabel().toLowerCase()}...`} />
                    <CommandEmpty>No documents found.</CommandEmpty>
                    <CommandGroup>
                      <CommandList>
                        {availableDocuments.map((doc) => (
                          <CommandItem
                            key={doc.name}
                            value={doc.name}
                            onSelect={(currentValue) => {
                              setRelatedDocument(currentValue === relatedDocument ? "" : currentValue);
                              setOpen(false);
                            }}
                          >
                            <Check
                              className={`mr-2 h-4 w-4 ${
                                relatedDocument === doc.name ? "opacity-100" : "opacity-0"
                              }`}
                            />
                            <div className="flex-1">
                              <div className="font-medium">{doc.name}</div>
                              {doc.customer && (
                                <div className="text-sm text-muted-foreground">Customer: {doc.customer}</div>
                              )}
                              {doc.transaction_date && (
                                <div className="text-xs text-muted-foreground">Date: {new Date(doc.transaction_date).toLocaleDateString()}</div>
                              )}
                            </div>
                          </CommandItem>
                        ))}
                      </CommandList>
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {/* Create Button */}
            <div className="flex justify-end space-x-3">
              <Button variant="outline" onClick={fetchDocuments} disabled={loading}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
              <Button 
                onClick={handleCreatePickList} 
                disabled={loading || !relatedDocument}
                className="min-w-32"
              >
                {loading ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4 mr-2" />
                )}
                Create Pick List
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800">
          <CardContent className="p-4">
            <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-2">How it works:</h3>
            <ol className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-decimal list-inside">
              <li>Select the purpose for your pick list</li>
              <li>Choose the related document (Material Request, Sales Order, or Work Order)</li>
              <li>ERPNext will create the pick list and fetch items from the source document</li>
              <li>You can then proceed to pick the items using barcode scanning</li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// Helper function to manually populate pick list items when ERPNext methods fail
const populatePickListItems = async (api: any, pickListName: string, purpose: string, relatedDocument: string) => {
  try {
    let items: any[] = [];
    
    if (purpose === "Material Transfer") {
      const mrResponse = await api.getMaterialRequest(relatedDocument);
      const mrData = (mrResponse as any)?.data?.data || (mrResponse as any)?.data;
      items = mrData?.items || [];
    } else if (purpose === "Delivery") {
      const soResponse = await api.getSalesOrder(relatedDocument);
      const soData = (soResponse as any)?.data?.data || (soResponse as any)?.data;
      items = soData?.items || [];
    } else if (purpose === "Material Transfer for Manufacture") {
      const woResponse = await api.getWorkOrder(relatedDocument);
      const woData = woResponse?.data?.data || woResponse?.data;
      items = woData?.required_items || [];
    }

    if (items.length > 0) {
      const locations = items.map((item: any) => ({
        item_code: item.item_code,
        item_name: item.item_name,
        qty: item.qty || item.pending_qty || item.required_qty || 1,
        stock_qty: item.stock_qty || item.qty || item.pending_qty || item.required_qty || 1,
        uom: item.uom || item.stock_uom || 'Nos',
        stock_uom: item.stock_uom || item.uom || 'Nos',
        warehouse: item.from_warehouse || item.warehouse || item.source_warehouse || '',
        batch_no: item.batch_no || '',
        serial_no: item.serial_no || '',
        conversion_factor: item.conversion_factor || 1
      }));

      await api.updatePickList(pickListName, {
        locations: locations
      });
      
      console.log('Manually populated pick list items:', locations);
    }
  } catch (error) {
    console.error('Failed to manually populate pick list:', error);
  }
};

export default PickListCreation;
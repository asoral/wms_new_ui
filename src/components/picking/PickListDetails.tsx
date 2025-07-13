import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Package, Play } from "lucide-react";
import { PickList, PickListPurpose } from "../../pages/PickList";
import { useMaterialRequestAPI, useSalesOrderAPI } from "@/hooks/useERPNextAPI";
import { getUserDefaultCompany } from "@/services/erpnextApi";
import { useToast } from "@/hooks/use-toast";

interface PickListDetailsProps {
  pickList: PickList | null;
  isCreatingNew: boolean;
  onStartPicking: (pickList: PickList) => void;
  onBack: () => void;
}

const PickListDetails = ({ pickList, isCreatingNew, onStartPicking, onBack }: PickListDetailsProps) => {
  const [purpose, setPurpose] = useState<PickListPurpose>(pickList?.purpose || "Material Transfer");
  const [relatedDocument, setRelatedDocument] = useState(pickList?.relatedDocument || "");
  const [availableMaterialRequests, setAvailableMaterialRequests] = useState<any[]>([]);
  const [availableSalesOrders, setAvailableSalesOrders] = useState<any[]>([]);
  const [loadingMaterialRequests, setLoadingMaterialRequests] = useState(false);
  const { getMaterialRequests, getMaterialRequest } = useMaterialRequestAPI();
  const { getSalesOrders, getSalesOrder } = useSalesOrderAPI();
  const { toast } = useToast();

  const purposeOptions: PickListPurpose[] = ["Material Transfer", "Delivery", "Manufacturing"];

  useEffect(() => {
    if (isCreatingNew) {
      if (purpose === "Material Transfer") {
        fetchMaterialRequests();
      } else if (purpose === "Delivery") {
        fetchSalesOrders();
      }
    }
  }, [purpose, isCreatingNew]);

  const fetchMaterialRequests = async () => {
    try {
      setLoadingMaterialRequests(true);
      const company = await getUserDefaultCompany();
      console.log('Fetching material requests for company:', company);
      
      // First, let's fetch ALL material requests to debug
      let filters: any[] = [];
      
      if (company) {
        filters.push(['company', '=', company]);
      }
      
      console.log('Initial filters for material requests:', filters);
      
      const response = await getMaterialRequests(filters);
      console.log('Raw API response for material requests:', response);
      
      // Check the actual structure of the response
      console.log('Response data type:', typeof response?.data);
      console.log('Response data:', response?.data);
      
      // ERPNext API typically returns data in response.data.data format
      let materialRequests = [];
      if ((response as any)?.data?.data && Array.isArray((response as any).data.data)) {
        materialRequests = (response as any).data.data;
      } else if ((response as any)?.data && Array.isArray((response as any).data)) {
        materialRequests = (response as any).data;
      } else {
        console.log('Unexpected response structure:', {
          hasData: !!(response as any)?.data,
          dataType: typeof (response as any)?.data,
          hasNestedData: !!(response as any)?.data?.data,
          nestedDataType: typeof (response as any)?.data?.data,
          fullResponse: response
        });
      }
      
      if (materialRequests.length > 0) {
        console.log('Material Requests found:', materialRequests);
        console.log('Number of material requests found:', materialRequests.length);
        
        // Log the structure of the first material request to see available fields
        console.log('First Material Request structure:', materialRequests[0]);
        console.log('Available fields:', Object.keys(materialRequests[0]));
        
        // Filter for Material Transfer type - but first check what fields are available
        const transferRequests = materialRequests.filter((mr: any) => {
          console.log(`Material Request ${mr.name}:`, {
            // Try different possible field names
            material_request_type: mr.material_request_type,
            type: mr.type,
            purpose: mr.purpose,
            status: mr.status,
            workflow_state: mr.workflow_state,
            docstatus: mr.docstatus,
            company: mr.company,
            // Log all fields to see what's actually available
            allFields: mr
          });
          
          // For now, include all material requests to see them in the dropdown
          // We'll filter properly once we know the correct field names
          return true;
        });
        
        console.log('Filtered Material Transfer requests:', transferRequests);
        setAvailableMaterialRequests(transferRequests);
        
        // Auto-select the first one if available
        if (transferRequests.length > 0 && !relatedDocument) {
          setRelatedDocument(transferRequests[0].name);
        }
      } else {
        console.log('No material requests found in API response');
        setAvailableMaterialRequests([]);
      }
    } catch (error) {
      console.error('Error fetching material requests:', error);
      toast({
        title: "Error",
        description: "Failed to fetch material requests",
        variant: "destructive"
      });
    } finally {
      setLoadingMaterialRequests(false);
    }
  };

  const fetchSalesOrders = async () => {
    try {
      setLoadingMaterialRequests(true);
      const company = await getUserDefaultCompany();
      console.log('Fetching sales orders for company:', company);
      
      let filters: any[] = [];
      
      if (company) {
        filters.push(['company', '=', company]);
      }
      
      console.log('Initial filters for sales orders:', filters);
      
      const response = await getSalesOrders(filters);
      console.log('Raw API response for sales orders:', response);
      
      if (response?.data && Array.isArray(response.data)) {
        console.log('All Sales Orders from API:', response.data);
        console.log('Number of sales orders found:', response.data.length);
        
        // Filter for orders that can be picked
        const deliverableOrders = response.data.filter((so: any) => {
          console.log(`Sales Order ${so.name}:`, {
            status: so.status,
            docstatus: so.docstatus,
            company: so.company
          });
          return so.status === 'To Deliver' || so.status === 'To Bill';
        });
        
        console.log('Deliverable sales orders:', deliverableOrders);
        setAvailableSalesOrders(deliverableOrders);
        
        // Auto-select the first one if available
        if (deliverableOrders.length > 0 && !relatedDocument) {
          setRelatedDocument(deliverableOrders[0].name);
        }
      } else {
        console.log('No sales orders returned from API or data is not an array:', response);
        setAvailableSalesOrders([]);
      }
    } catch (error) {
      console.error('Error fetching sales orders:', error);
      toast({
        title: "Error",
        description: "Failed to fetch sales orders",
        variant: "destructive"
      });
    } finally {
      setLoadingMaterialRequests(false);
    }
  };

  const getRelatedDocumentLabel = (purpose: PickListPurpose) => {
    switch (purpose) {
      case "Material Transfer":
        return "Material Request";
      case "Delivery":
        return "Sales Order";
      case "Manufacturing":
        return "Work Order";
      default:
        return "Related Document";
    }
  };

  const handleStartPicking = async () => {
    if (isCreatingNew) {
      if (purpose === "Material Transfer" && relatedDocument) {
        // Fetch items from the selected material request
        try {
          const materialRequestResponse = await getMaterialRequest(relatedDocument);
          
          if (materialRequestResponse?.data) {
            const mrData: any = materialRequestResponse.data;
            console.log('Material Request Data:', mrData);
            
            // Convert material request items to pick list items
            const items = Array.isArray(mrData.items) ? mrData.items.map((item: any, index: number) => ({
              id: (index + 1).toString(),
              item_code: item.item_code,
              code: item.item_code,
              item_name: item.item_name,
              name: item.item_name,
              warehouse: item.warehouse,
              bin: item.warehouse, // Use warehouse as bin for now
              batch_no: item.batch_no,
              batch: item.batch_no,
              serial_no: item.serial_no,
              serial: item.serial_no,
              qty: item.qty,
              requiredQty: item.qty,
              picked_qty: 0,
              pickedQty: 0,
              status: "pending"
            })) : [];

            const newPickList: PickList = {
              name: `STO-PICK-2025-${String(Math.floor(Math.random() * 10000)).padStart(5, '0')}`,
              number: `STO-PICK-2025-${String(Math.floor(Math.random() * 10000)).padStart(5, '0')}`,
              purpose,
              relatedDocument,
              status: "Draft",
              company: (mrData as any).company || "Default Company",
              docstatus: 0,
              creation: new Date().toISOString(),
              createdDate: new Date().toISOString(),
              owner: "Administrator",
              items
            };
            
            console.log('New Pick List with real items:', newPickList);
            onStartPicking(newPickList);
          } else {
            toast({
              title: "Error",
              description: "Failed to fetch material request items",
              variant: "destructive"
            });
          }
        } catch (error) {
          console.error('Error fetching material request items:', error);
          toast({
            title: "Error",
            description: "Failed to fetch material request items",
            variant: "destructive"
          });
        }
      } else if (purpose === "Delivery" && relatedDocument) {
        // Fetch items from the selected sales order
        try {
          const salesOrderResponse = await getSalesOrder(relatedDocument);
          
          if (salesOrderResponse?.data) {
            const soData: any = salesOrderResponse.data;
            console.log('Sales Order Data:', soData);
            
            // Convert sales order items to pick list items
            const items = Array.isArray(soData.items) ? soData.items.map((item: any, index: number) => ({
              id: (index + 1).toString(),
              item_code: item.item_code,
              code: item.item_code,
              item_name: item.item_name,
              name: item.item_name,
              warehouse: item.warehouse,
              bin: item.warehouse,
              batch_no: item.batch_no,
              batch: item.batch_no,
              serial_no: item.serial_no,
              serial: item.serial_no,
              qty: item.qty,
              requiredQty: item.qty,
              picked_qty: 0,
              pickedQty: 0,
              status: "pending"
            })) : [];

            const newPickList: PickList = {
              name: `STO-PICK-2025-${String(Math.floor(Math.random() * 10000)).padStart(5, '0')}`,
              number: `STO-PICK-2025-${String(Math.floor(Math.random() * 10000)).padStart(5, '0')}`,
              purpose,
              relatedDocument,
              status: "Draft",
              company: (soData as any).company || "Default Company",
              docstatus: 0,
              creation: new Date().toISOString(),
              createdDate: new Date().toISOString(),
              owner: "Administrator",
              items
            };
            
            console.log('New Pick List with real SO items:', newPickList);
            onStartPicking(newPickList);
          } else {
            toast({
              title: "Error",
              description: "Failed to fetch sales order items",
              variant: "destructive"
            });
          }
        } catch (error) {
          console.error('Error fetching sales order items:', error);
          toast({
            title: "Error",
            description: "Failed to fetch sales order items",
            variant: "destructive"
          });
        }
      } else {
        toast({
          title: "No Document Selected",
          description: "Please select a document to create pick list from",
          variant: "destructive"
        });
      }
    } else if (pickList) {
      // Map existing pick list to proper format
      const formattedPickList: PickList = {
        ...pickList,
        items: pickList.locations?.map((item, index) => ({
          ...item,
          id: (index + 1).toString(),
          code: item.item_code,
          name: item.item_name,
          requiredQty: item.qty,
          pickedQty: item.picked_qty || 0,
          bin: item.warehouse,
          batch: item.batch_no,
          serial: item.serial_no,
          status: (item.picked_qty || 0) === 0 ? "pending" : 
                  (item.picked_qty || 0) < item.qty ? "partial" : "completed"
        })) || []
      };
      onStartPicking(formattedPickList);
    }
  };

  const canStartPicking = purpose && (isCreatingNew ? relatedDocument : true);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ', ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header with stepper */}
      <div className="flex items-center space-x-2 mb-6">
        <Package className="w-6 h-6 text-blue-600" />
        <h1 className="text-2xl font-bold">Pick List</h1>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center space-x-4 mb-6">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-400 flex items-center justify-center text-sm font-medium">
            1
          </div>
          <span className="text-gray-400">Select</span>
        </div>
        <div className="w-8 h-px bg-gray-200"></div>
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-medium">
            2
          </div>
          <span className="text-blue-600 font-medium">Details</span>
        </div>
        <div className="w-8 h-px bg-gray-200"></div>
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-400 flex items-center justify-center text-sm font-medium">
            3
          </div>
          <span className="text-gray-400">Pick</span>
        </div>
      </div>

      {/* Back Button */}
      <Button variant="ghost" onClick={onBack} className="flex items-center space-x-2">
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Selection</span>
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Package className="w-5 h-5 text-blue-600" />
            <span>{isCreatingNew ? "Create New Pick List" : "Pick List Details"}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {!isCreatingNew && pickList && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-600">Pick List Number:</span>
                  <p className="text-gray-900">{pickList.number || pickList.name}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Created Date:</span>
                  <p className="text-gray-900">{formatDate(pickList.createdDate || pickList.creation)}</p>
                </div>
              </div>
            </div>
          )}

          {/* Purpose Selection */}
          <div className="space-y-2">
            <Label htmlFor="purpose">Purpose</Label>
            <Select 
              value={purpose} 
              onValueChange={(value: PickListPurpose) => setPurpose(value)}
              disabled={!isCreatingNew}
            >
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

          {/* Related Document Selection */}
          <div className="space-y-2">
            <Label htmlFor="relatedDocument">{getRelatedDocumentLabel(purpose)}</Label>
            <Select 
              value={relatedDocument || (pickList?.relatedDocument || "")} 
              onValueChange={setRelatedDocument}
              disabled={!isCreatingNew || loadingMaterialRequests}
            >
              <SelectTrigger>
                <SelectValue placeholder={
                  loadingMaterialRequests 
                    ? "Loading material requests..." 
                    : `Select ${getRelatedDocumentLabel(purpose).toLowerCase()}`
                } />
              </SelectTrigger>
              <SelectContent>
                {isCreatingNew ? (
                  purpose === "Material Transfer" ? (
                    availableMaterialRequests.length > 0 ? (
                      availableMaterialRequests.map((mr) => (
                        <SelectItem key={mr.name} value={mr.name}>
                          {mr.name} - {mr.title || 'Material Transfer'}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="no-data" disabled>
                        {loadingMaterialRequests ? "Loading..." : "No material requests available"}
                      </SelectItem>
                    )
                  ) : purpose === "Delivery" ? (
                    availableSalesOrders.length > 0 ? (
                      availableSalesOrders.map((so) => (
                        <SelectItem key={so.name} value={so.name}>
                          {so.name} - {so.customer_name || so.customer}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="no-data" disabled>
                        {loadingMaterialRequests ? "Loading..." : "No sales orders available"}
                      </SelectItem>
                    )
                  ) : (
                    <SelectItem value="not-implemented" disabled>
                      {purpose} selection coming soon
                    </SelectItem>
                  )
                ) : (
                  <SelectItem value={pickList?.relatedDocument || ""}>
                    {pickList?.relatedDocument || ""}
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Summary */}
          {purpose && (relatedDocument || !isCreatingNew) && (
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Summary</h4>
              <div className="text-sm text-blue-800 space-y-1">
                <p><span className="font-medium">Purpose:</span> {purpose}</p>
                <p><span className="font-medium">{getRelatedDocumentLabel(purpose)}:</span> {relatedDocument || pickList?.relatedDocument || ""}</p>
                {isCreatingNew && (
                  <p className="text-xs text-blue-600 mt-2">
                    {purpose === "Material Transfer" 
                      ? `${availableMaterialRequests.length} material request(s) available for picking`
                      : purpose === "Delivery"
                      ? `${availableSalesOrders.length} sales order(s) available for picking`
                      : ""}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Start Picking Button */}
          <div className="flex justify-end pt-4">
            <Button 
              onClick={handleStartPicking}
              disabled={!canStartPicking}
              className="flex items-center space-x-2 bg-gray-800 hover:bg-gray-900"
            >
              <Play className="w-4 h-4" />
              <span>Start Picking</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PickListDetails;
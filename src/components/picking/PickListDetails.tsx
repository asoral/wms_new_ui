import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ArrowLeft, Package, Play, Check, ChevronsUpDown, Search } from "lucide-react";
import { PickList, PickListPurpose } from "../../pages/PickList";
import { useMaterialRequestAPI, useSalesOrderAPI, useWorkOrderAPI, useCustomerAPI } from "@/hooks/useERPNextAPI";
import { getUserDefaultCompany } from "@/services/erpnextApi";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";

interface PickListDetailsProps {
  pickList: PickList | null;
  isCreatingNew: boolean;
  onStartPicking: (pickList: PickList) => void;
  onBack: () => void;
}

const PickListDetails = ({ pickList, isCreatingNew, onStartPicking, onBack }: PickListDetailsProps) => {
  const [purpose, setPurpose] = useState<PickListPurpose>(pickList?.purpose || "Material Transfer");
  const [relatedDocument, setRelatedDocument] = useState(pickList?.relatedDocument || "");
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [showSalesOrders, setShowSalesOrders] = useState(false);
  const [selectedSalesOrders, setSelectedSalesOrders] = useState<string[]>([]);
  
  // Available options
  const [availableMaterialRequests, setAvailableMaterialRequests] = useState<any[]>([]);
  const [availableWorkOrders, setAvailableWorkOrders] = useState<any[]>([]);
  const [availableCustomers, setAvailableCustomers] = useState<any[]>([]);
  const [availableSalesOrders, setAvailableSalesOrders] = useState<any[]>([]);
  
  // Loading states
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [customerOpen, setCustomerOpen] = useState(false);
  
  // API hooks
  const { getMaterialRequests, getMaterialRequest } = useMaterialRequestAPI();
  const { getSalesOrders, getSalesOrder } = useSalesOrderAPI();
  const { getWorkOrders, getWorkOrder, searchWorkOrders } = useWorkOrderAPI();
  const { searchCustomers, getSalesOrdersForCustomer } = useCustomerAPI();
  const { toast } = useToast();

  const purposeOptions: PickListPurpose[] = ["Material Transfer", "Delivery", "Material Transfer for Manufacture"];

  useEffect(() => {
    if (isCreatingNew) {
      if (purpose === "Material Transfer") {
        fetchMaterialRequests();
      } else if (purpose === "Material Transfer for Manufacture") {
        fetchWorkOrders();
      } else if (purpose === "Delivery") {
        fetchCustomers();
      }
    }
  }, [purpose, isCreatingNew]);

  const fetchMaterialRequests = async () => {
    try {
      setLoading(true);
      const company = await getUserDefaultCompany();
      
      let filters: any[] = [
        ['docstatus', '=', 1], // Only submitted material requests
        ['material_request_type', '=', 'Material Transfer'] // Only transfer type
      ];
      
      if (company) {
        filters.push(['company', '=', company]);
      }
      
      const response = await getMaterialRequests(filters);
      
      if ((response as any)?.data?.data && Array.isArray((response as any).data.data)) {
        setAvailableMaterialRequests((response as any).data.data);
        if ((response as any).data.data.length > 0 && !relatedDocument) {
          setRelatedDocument((response as any).data.data[0].name);
        }
      } else if ((response as any)?.data && Array.isArray((response as any).data)) {
        setAvailableMaterialRequests((response as any).data);
        if ((response as any).data.length > 0 && !relatedDocument) {
          setRelatedDocument((response as any).data[0].name);
        }
      }
    } catch (error) {
      console.error('Error fetching material requests:', error);
      toast({
        title: "Error",
        description: "Failed to fetch material requests",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchWorkOrders = async () => {
    try {
      setLoading(true);
      const company = await getUserDefaultCompany();
      
      let filters: any[] = [
        ['docstatus', '=', 1], // Only submitted work orders
        ['status', 'in', ['Not Started', 'In Process']] // Only orders ready for picking
      ];
      
      if (company) {
        filters.push(['company', '=', company]);
      }
      
      const response = await getWorkOrders(filters, company, 20);
      
      if (response?.data?.data && Array.isArray(response.data.data)) {
        setAvailableWorkOrders(response.data.data);
      } else if (response?.data && Array.isArray(response.data)) {
        setAvailableWorkOrders(response.data);
      }
    } catch (error) {
      console.error('Error fetching work orders:', error);
      toast({
        title: "Error",
        description: "Failed to fetch work orders",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const company = await getUserDefaultCompany();
      
      const response = await searchCustomers("", company, 50);
      
      if (response?.data?.data && Array.isArray(response.data.data)) {
        setAvailableCustomers(response.data.data);
      } else if (response?.data && Array.isArray(response.data)) {
        setAvailableCustomers(response.data);
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
      toast({
        title: "Error",
        description: "Failed to fetch customers",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGetItems = async () => {
    if (!selectedCustomer) {
      toast({
        title: "Customer Required",
        description: "Please select a customer first",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);
      const company = await getUserDefaultCompany();
      
      const response = await getSalesOrdersForCustomer(selectedCustomer, company);
      
      if (response?.data?.data && Array.isArray(response.data.data)) {
        setAvailableSalesOrders(response.data.data);
      } else if (response?.data && Array.isArray(response.data)) {
        setAvailableSalesOrders(response.data);
      }
      
      setShowSalesOrders(true);
    } catch (error) {
      console.error('Error fetching sales orders for customer:', error);
      toast({
        title: "Error",
        description: "Failed to fetch sales orders for customer",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSalesOrderSelection = (salesOrderName: string, checked: boolean) => {
    if (checked) {
      setSelectedSalesOrders(prev => [...prev, salesOrderName]);
    } else {
      setSelectedSalesOrders(prev => prev.filter(so => so !== salesOrderName));
    }
  };

  const getRelatedDocumentLabel = (purpose: PickListPurpose) => {
    switch (purpose) {
      case "Material Transfer":
        return "Material Request";
      case "Delivery":
        return "Customer";
      case "Material Transfer for Manufacture":
        return "Work Order";
      default:
        return "Related Document";
    }
  };

  const handleStartPicking = async () => {
    if (!isCreatingNew) {
      // Existing pick list - just start picking
      onStartPicking(pickList!);
      return;
    }

    // Create new pick list based on purpose
    try {
      setLoading(true);
      
      if (purpose === "Material Transfer" && relatedDocument) {
        await createPickListFromMaterialRequest();
      } else if (purpose === "Material Transfer for Manufacture" && relatedDocument) {
        await createPickListFromWorkOrder();
      } else if (purpose === "Delivery" && selectedSalesOrders.length > 0) {
        await createPickListFromSalesOrders();
      } else {
        toast({
          title: "Selection Required",
          description: "Please select the required documents first",
          variant: "destructive"
        });
      }
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

  const createPickListFromMaterialRequest = async () => {
    const materialRequestResponse = await getMaterialRequest(relatedDocument);
    const mrData = (materialRequestResponse as any)?.data?.data || (materialRequestResponse as any)?.data;
    
    if (mrData && mrData.items && Array.isArray(mrData.items)) {
      const pickListData = {
        purpose: "Material Transfer",
        material_request: relatedDocument,
        company: mrData.company || await getUserDefaultCompany()
      };

      await createAndProcessPickList(pickListData, mrData.items);
    }
  };

  const createPickListFromWorkOrder = async () => {
    const workOrderResponse = await getWorkOrder(relatedDocument);
    const woData = workOrderResponse?.data?.data || workOrderResponse?.data;
    
    if (woData) {
      const pickListData = {
        purpose: "Material Transfer for Manufacture",
        work_order: relatedDocument,
        company: woData.company || await getUserDefaultCompany()
      };

      // Work orders require calling get_items to fetch required materials
      await createAndProcessPickList(pickListData, []);
    }
  };

  const createPickListFromSalesOrders = async () => {
    const company = await getUserDefaultCompany();
    const pickListData = {
      purpose: "Delivery",
      company: company
    };

    // Collect all items from selected sales orders
    const allItems: any[] = [];
    
    for (const soName of selectedSalesOrders) {
      const soResponse = await getSalesOrder(soName);
      const soData = (soResponse as any)?.data?.data || (soResponse as any)?.data;
      
      if (soData && soData.items) {
        allItems.push(...soData.items.map((item: any) => ({
          ...item,
          against_sales_order: soName
        })));
      }
    }

    await createAndProcessPickList(pickListData, allItems);
  };

  const createAndProcessPickList = async (pickListData: any, items: any[]) => {
    const { createERPNextAPI } = await import('@/services/erpnextApi');
    const api = await createERPNextAPI();
    
    if (!api) {
      throw new Error("Failed to initialize ERPNext API connection");
    }

    // Create the pick list
    const createdPickList = await api.createPickList(pickListData);
    const pickListName = createdPickList.data?.name;
    
    if (!pickListName) {
      throw new Error("Pick List created but no name returned");
    }

    // Call get_item_locations method to populate items and warehouses
    try {
      await api.callMethod('Pick List', pickListName, 'get_item_locations', {});
    } catch (error) {
      console.warn('get_item_locations method call failed:', error);
    }

    // Fetch the updated pick list with items
    const pickListDetails = await api.getPickList(pickListName);
    const plData = pickListDetails.data?.data || pickListDetails.data;
    
    // Convert to local format
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
      status: (item.picked_qty || 0) === 0 ? "pending" : 
              (item.picked_qty || 0) < item.qty ? "partial" : "completed"
    })) : [];

    const newPickList: PickList = {
      name: plData.name,
      number: plData.name,
      purpose: plData.purpose as PickListPurpose,
      relatedDocument: plData.material_request || plData.work_order || selectedSalesOrders.join(', '),
      status: plData.status || "Draft",
      company: plData.company || "Default Company",
      docstatus: plData.docstatus || 0,
      creation: plData.creation || new Date().toISOString(),
      createdDate: plData.creation || new Date().toISOString(),
      owner: plData.owner || "Administrator",
      items: formattedItems
    };
    
    onStartPicking(newPickList);
  };

  if (!isCreatingNew && pickList) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm" onClick={onBack}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-2xl font-bold">Pick List Details</h1>
                <p className="text-muted-foreground">Review pick list information</p>
              </div>
            </div>
          </div>

          {/* Steps Indicator */}
          <div className="flex items-center justify-center space-x-4 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                <Check className="h-4 w-4" />
              </div>
              <span className="text-primary font-medium">1. Select</span>
            </div>
            <div className="w-8 h-0.5 bg-primary"></div>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-full bg-muted border-2 border-primary text-primary flex items-center justify-center">
                2
              </div>
              <span className="text-primary font-medium">2. Details</span>
            </div>
            <div className="w-8 h-0.5 bg-muted"></div>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center">
                3
              </div>
              <span className="text-muted-foreground">3. Picking</span>
            </div>
          </div>

          {/* Pick List Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Package className="h-5 w-5" />
                <span>Pick List Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Pick List Number</Label>
                  <p className="text-lg font-semibold">{pickList.name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Purpose</Label>
                  <p className="text-lg">{pickList.purpose}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Company</Label>
                  <p className="text-lg">{pickList.company}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <p className="text-lg">{pickList.status}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Related Document</Label>
                  <p className="text-lg">{pickList.relatedDocument}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Items Count</Label>
                  <p className="text-lg">{pickList.items?.length || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4">
            <Button variant="outline" onClick={onBack}>
              Cancel
            </Button>
            <Button onClick={handleStartPicking} disabled={loading}>
              <Play className="h-4 w-4 mr-2" />
              Start Picking
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="outline" size="sm" onClick={onBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold">New Pick List</h1>
              <p className="text-muted-foreground">Create a new pick list</p>
            </div>
          </div>
        </div>

        {/* Steps Indicator */}
        <div className="flex items-center justify-center space-x-4 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
              <Check className="h-4 w-4" />
            </div>
            <span className="text-primary font-medium">1. Select</span>
          </div>
          <div className="w-8 h-0.5 bg-primary"></div>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-muted border-2 border-primary text-primary flex items-center justify-center">
              2
            </div>
            <span className="text-primary font-medium">2. Details</span>
          </div>
          <div className="w-8 h-0.5 bg-muted"></div>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center">
              3
            </div>
            <span className="text-muted-foreground">3. Picking</span>
          </div>
        </div>

        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle>Pick List Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Purpose Selection */}
            <div className="space-y-2">
              <Label>Purpose</Label>
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

            {/* Document Selection based on Purpose */}
            {purpose === "Material Transfer" && (
              <div className="space-y-2">
                <Label>Material Request</Label>
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
                        ? availableMaterialRequests.find((mr) => mr.name === relatedDocument)?.name
                        : "Select material request..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <Command>
                      <CommandInput placeholder="Search material requests..." />
                      <CommandList>
                        <CommandEmpty>No material requests found.</CommandEmpty>
                        <CommandGroup>
                          {availableMaterialRequests.map((mr) => (
                            <CommandItem
                              key={mr.name}
                              onSelect={() => {
                                setRelatedDocument(mr.name);
                                setOpen(false);
                              }}
                            >
                              <Check
                                className={`mr-2 h-4 w-4 ${
                                  relatedDocument === mr.name ? "opacity-100" : "opacity-0"
                                }`}
                              />
                              <div className="flex flex-col">
                                <span className="font-medium">{mr.name}</span>
                                <span className="text-sm text-muted-foreground">
                                  Status: {mr.status} | Items: {mr.items?.length || 0}
                                </span>
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            )}

            {purpose === "Material Transfer for Manufacture" && (
              <div className="space-y-2">
                <Label>Work Order</Label>
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
                        ? availableWorkOrders.find((wo) => wo.name === relatedDocument)?.name
                        : "Select work order..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <Command>
                      <CommandInput placeholder="Search work orders..." />
                      <CommandList>
                        <CommandEmpty>No work orders found.</CommandEmpty>
                        <CommandGroup>
                          {availableWorkOrders.map((wo) => (
                            <CommandItem
                              key={wo.name}
                              onSelect={() => {
                                setRelatedDocument(wo.name);
                                setOpen(false);
                              }}
                            >
                              <Check
                                className={`mr-2 h-4 w-4 ${
                                  relatedDocument === wo.name ? "opacity-100" : "opacity-0"
                                }`}
                              />
                              <div className="flex flex-col">
                                <span className="font-medium">{wo.name}</span>
                                <span className="text-sm text-muted-foreground">
                                  Item: {wo.production_item} | Qty: {wo.qty} | Status: {wo.status}
                                </span>
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            )}

            {purpose === "Delivery" && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Customer</Label>
                  <Popover open={customerOpen} onOpenChange={setCustomerOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={customerOpen}
                        className="w-full justify-between"
                        disabled={loading}
                      >
                        {selectedCustomer
                          ? availableCustomers.find((c) => c.name === selectedCustomer)?.customer_name || selectedCustomer
                          : "Select customer..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0">
                      <Command>
                        <CommandInput placeholder="Search customers..." />
                        <CommandList>
                          <CommandEmpty>No customers found.</CommandEmpty>
                          <CommandGroup>
                            {availableCustomers.map((customer) => (
                              <CommandItem
                                key={customer.name}
                                onSelect={() => {
                                  setSelectedCustomer(customer.name);
                                  setCustomerOpen(false);
                                  setShowSalesOrders(false);
                                  setSelectedSalesOrders([]);
                                }}
                              >
                                <Check
                                  className={`mr-2 h-4 w-4 ${
                                    selectedCustomer === customer.name ? "opacity-100" : "opacity-0"
                                  }`}
                                />
                                <div className="flex flex-col">
                                  <span className="font-medium">{customer.customer_name || customer.name}</span>
                                  <span className="text-sm text-muted-foreground">{customer.name}</span>
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                {selectedCustomer && (
                  <Button onClick={handleGetItems} disabled={loading} className="w-full">
                    <Search className="h-4 w-4 mr-2" />
                    Get Items
                  </Button>
                )}

                {showSalesOrders && availableSalesOrders.length > 0 && (
                  <div className="space-y-2">
                    <Label>Select Sales Orders</Label>
                    <div className="border rounded-lg p-4 space-y-3 max-h-64 overflow-y-auto">
                      {availableSalesOrders.map((so) => (
                        <div key={so.name} className="flex items-start space-x-3">
                          <Checkbox
                            id={so.name}
                            checked={selectedSalesOrders.includes(so.name)}
                            onCheckedChange={(checked) =>
                              handleSalesOrderSelection(so.name, checked as boolean)
                            }
                          />
                          <div className="grid gap-1.5 leading-none">
                            <label
                              htmlFor={so.name}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              {so.name}
                            </label>
                            <p className="text-xs text-muted-foreground">
                              Customer: {so.customer_name} | Total: {so.grand_total} | Status: {so.status}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-4">
          <Button variant="outline" onClick={onBack}>
            Cancel
          </Button>
          <Button 
            onClick={handleStartPicking} 
            disabled={loading || !canProceed()}
          >
            <Play className="h-4 w-4 mr-2" />
            {loading ? "Creating..." : "Create & Start Picking"}
          </Button>
        </div>
      </div>
    </div>
  );

  function canProceed(): boolean {
    if (purpose === "Material Transfer") {
      return !!relatedDocument;
    } else if (purpose === "Material Transfer for Manufacture") {
      return !!relatedDocument;
    } else if (purpose === "Delivery") {
      return selectedSalesOrders.length > 0;
    }
    return false;
  }
};

export default PickListDetails;

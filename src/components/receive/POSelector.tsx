
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Package, Calendar, User, DollarSign, Loader2, ChevronDown, Check } from "lucide-react";
import { createERPNextAPI, getUserDefaultCompany } from "@/services/erpnextApi";
import { useToast } from "@/hooks/use-toast";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface PurchaseOrder {
  name: string;
  supplier: string;
  supplier_name: string;
  schedule_date: string;
  grand_total: number;
  status: string;
  per_received: number;
}

interface POSelectorProps {
  onOrderSelected: (order: any) => void;
  loading: boolean;
}

const POSelector = ({ onOrderSelected, loading }: POSelectorProps) => {
  const [open, setOpen] = useState(false);
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [searchValue, setSearchValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadPurchaseOrders();
  }, []);

  const loadPurchaseOrders = async () => {
    try {
      setIsLoading(true);
      const erpnextAPI = await createERPNextAPI();
      if (!erpnextAPI) {
        toast({
          title: "ERPNext Not Configured",
          description: "Please configure your ERPNext settings in the Profile page.",
          variant: "destructive"
        });
        return;
      }

      const company = await getUserDefaultCompany();
      
      // Search for submitted POs with proper receiving status
      const filters = {
        docstatus: 1, // Submitted documents only
        status: ['in', ['To Receive', 'To Receive and Bill', 'Partially Received']]
      };
      
      const result = await erpnextAPI.getPurchaseOrders(filters, company, 50);
      
      if (result.data && Array.isArray(result.data)) {
        const transformedResults: PurchaseOrder[] = result.data.map((po: any) => ({
          name: po.name,
          supplier: po.supplier,
          supplier_name: po.supplier_name || po.supplier,
          schedule_date: po.schedule_date || po.transaction_date,
          grand_total: po.grand_total || 0,
          status: po.status,
          per_received: po.per_received || 0
        }));
        
        setPurchaseOrders(transformedResults);
      }
    } catch (error) {
      console.error('Error loading purchase orders:', error);
      toast({
        title: "Error",
        description: "Failed to load purchase orders from ERPNext",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const selectPurchaseOrder = async (po: PurchaseOrder) => {
    try {
      setIsLoading(true);
      const erpnextAPI = await createERPNextAPI();
      if (!erpnextAPI) return;

      // Get full PO details
      const fullPOResult = await erpnextAPI.getPurchaseOrder(po.name);
      if (fullPOResult.data) {
        const fullPO = fullPOResult.data;
        
        const transformedPO = {
          number: fullPO.name,
          supplier: fullPO.supplier_name || fullPO.supplier,
          status: fullPO.status,
          scheduleDate: fullPO.schedule_date || fullPO.transaction_date,
          totalItems: fullPO.items ? fullPO.items.length : 0,
          totalValue: fullPO.grand_total || 0,
          items: fullPO.items ? fullPO.items.map((item: any) => ({
            itemCode: item.item_code,
            itemName: item.item_name,
            orderedQty: item.qty || 0,
            receivedQty: item.received_qty || 0,
            pendingQty: (item.qty || 0) - (item.received_qty || 0),
            rate: item.rate || 0,
            uom: item.stock_uom || item.uom,
            warehouse: item.warehouse || 'Main Store',
            qtyToReceive: (item.qty || 0) - (item.received_qty || 0)
          })) : []
        };

        setSelectedPO(po);
        setOpen(false);
        
        // Call the parent handler to proceed to receiving
        onOrderSelected(transformedPO);
      }
    } catch (error) {
      console.error('Error fetching PO details:', error);
      toast({
        title: "Error",
        description: "Failed to fetch Purchase Order details",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "To Receive": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "To Receive and Bill": return "bg-blue-100 text-blue-800 border-blue-200";
      case "Partially Received": return "bg-orange-100 text-orange-800 border-orange-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const filteredOrders = purchaseOrders.filter(po => 
    po.name.toLowerCase().includes(searchValue.toLowerCase()) ||
    po.supplier_name.toLowerCase().includes(searchValue.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Package className="w-5 h-5" />
            <span>Select Purchase Order to Receive</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="po-selector">Purchase Order</Label>
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={open}
                  className="w-full justify-between"
                  disabled={isLoading}
                >
                  {selectedPO ? selectedPO.name : "Select Purchase Order..."}
                  {isLoading ? (
                    <Loader2 className="ml-2 h-4 w-4 shrink-0 animate-spin" />
                  ) : (
                    <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0" align="start">
                <Command>
                  <CommandInput 
                    placeholder="Search purchase orders..." 
                    value={searchValue}
                    onValueChange={setSearchValue}
                  />
                  <CommandList>
                    <CommandEmpty>No purchase orders found.</CommandEmpty>
                    <CommandGroup>
                      {filteredOrders.map((po) => (
                        <CommandItem
                          key={po.name}
                          onSelect={() => selectPurchaseOrder(po)}
                          className="flex flex-col items-start p-3 cursor-pointer"
                        >
                          <div className="flex w-full items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <Check
                                className={cn(
                                  "h-4 w-4",
                                  selectedPO?.name === po.name ? "opacity-100" : "opacity-0"
                                )}
                              />
                              <div>
                                <div className="font-semibold text-sm">{po.name}</div>
                                <div className="text-xs text-gray-600 flex items-center">
                                  <User className="w-3 h-3 mr-1" />
                                  {po.supplier_name}
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-semibold text-green-600 text-sm flex items-center">
                                <DollarSign className="w-3 h-3 mr-1" />
                                ₹{po.grand_total.toLocaleString()}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2 mt-2 w-full">
                            <Badge className={getStatusColor(po.status)} variant="outline">
                              {po.status}
                            </Badge>
                            <div className="text-xs text-gray-500 flex items-center">
                              <Calendar className="w-3 h-3 mr-1" />
                              Due: {new Date(po.schedule_date).toLocaleDateString()}
                            </div>
                            <div className="text-xs text-gray-500">
                              Received: {po.per_received}%
                            </div>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* Selected PO Summary */}
          {selectedPO && (
            <div className="mt-4 p-4 border border-green-200 rounded-lg bg-green-50">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <div>
                  <p className="text-gray-600">PO Number</p>
                  <p className="font-medium">{selectedPO.name}</p>
                </div>
                <div>
                  <p className="text-gray-600">Supplier</p>
                  <p className="font-medium">{selectedPO.supplier_name}</p>
                </div>
                <div>
                  <p className="text-gray-600">Due Date</p>
                  <p className="font-medium">{new Date(selectedPO.schedule_date).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-gray-600">Total Amount</p>
                  <p className="font-medium">₹{selectedPO.grand_total.toLocaleString()}</p>
                </div>
              </div>
            </div>
          )}

          {purchaseOrders.length === 0 && !isLoading && (
            <div className="mt-4 p-4 border border-gray-200 rounded-lg text-center text-gray-500">
              <Package className="w-8 h-8 mx-auto mb-2 text-gray-400" />
              <p>No purchase orders available for receiving</p>
              <p className="text-sm mt-1">Purchase orders must be submitted and have pending quantities to receive</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default POSelector;

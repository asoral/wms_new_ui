import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Package, Calendar, User, DollarSign, Loader2, Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { createERPNextAPI, getUserDefaultCompany } from "@/services/erpnextApi";
import { useToast } from "@/hooks/use-toast";
import { offlineStorage } from "@/services/offlineStorage";

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
  isLoading: boolean;
}

const POSelector = ({ onOrderSelected, isLoading }: POSelectorProps) => {
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [isLoadingPOs, setIsLoadingPOs] = useState(false);
  const [open, setOpen] = useState(false);
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);
  const [searchValue, setSearchValue] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    return () => {
      setOpen(false);
    };
  }, []);

  useEffect(() => {
    loadInitialPurchaseOrders();
  }, []);

  const loadInitialPurchaseOrders = async () => {
    setIsLoadingPOs(true);
    try {
      const cached = await offlineStorage.getCachedData('purchase_orders_receive');
      if (cached && Array.isArray(cached) && cached.length > 0) {
        setPurchaseOrders(cached);
        setIsLoadingPOs(false);
        return;
      }
      await fetchPurchaseOrders("");
    } catch (error) {
      console.error('Failed to load initial purchase orders:', error);
      setIsLoadingPOs(false);
    }
  };

  const fetchPurchaseOrders = async (search: string = "") => {
    setIsLoadingPOs(true);
    try {
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
      let filters: any[] = [
        ['docstatus', '=', 1],
        ['status', 'in', ['To Receive', 'To Receive and Bill', 'Partially Received']],
        ['company', '=', company]
      ];
      
      if (search.trim()) {
        filters.push(['name', 'like', `%${search}%`]);
      }
      
      // Use the resource API directly
      const response = await fetch(`${erpnextAPI.baseURL}/api/resource/Purchase Order?filters=${JSON.stringify(filters)}&limit_page_length=50`, {
        headers: {
          'Authorization': `token ${erpnextAPI.apiKey}:${erpnextAPI.apiSecret}`,
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
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
        
        if (!search.trim()) {
          await offlineStorage.cacheData('purchase_orders_receive', transformedResults, 300000);
        }
      } else {
        setPurchaseOrders([]);
      }
    } catch (error) {
      console.error('Error loading purchase orders:', error);
      toast({
        title: "Error",
        description: "Failed to load purchase orders from ERPNext",
        variant: "destructive"
      });
      
      try {
        const cached = await offlineStorage.getCachedData('purchase_orders_receive');
        if (cached && Array.isArray(cached)) {
          setPurchaseOrders(cached);
        }
      } catch (cacheError) {
        console.error('Failed to load cached purchase orders:', cacheError);
      }
    } finally {
      setIsLoadingPOs(false);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchValue !== undefined) {
        fetchPurchaseOrders(searchValue);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchValue]);

  const selectPurchaseOrder = async (po: PurchaseOrder) => {
    try {
      setIsLoadingPOs(true);
      const erpnextAPI = await createERPNextAPI();
      if (!erpnextAPI) return;

      // Get full PO details
      const response = await fetch(`${erpnextAPI.baseURL}/api/resource/Purchase Order/${po.name}`, {
        headers: {
          'Authorization': `token ${erpnextAPI.apiKey}:${erpnextAPI.apiSecret}`,
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const fullPOResult = await response.json();
      
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
      setIsLoadingPOs(false);
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

  const filteredOrders = useMemo(() => {
    if (!searchValue) return purchaseOrders;
    const lowercaseSearch = searchValue.toLowerCase();
    return purchaseOrders.filter(po => 
      po.name.toLowerCase().includes(lowercaseSearch) ||
      po.supplier_name.toLowerCase().includes(lowercaseSearch)
    );
  }, [purchaseOrders, searchValue]);

  return (
    <div className="space-y-4">
      <div>
        <Label>Purchase Order</Label>
        <div className="flex-1 min-w-0 mt-1">
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={open}
                className="w-full justify-between text-left h-auto min-h-[40px] py-2 px-3"
                disabled={isLoading}
              >
                <div className="flex-1 min-w-0 text-left">
                  <div className="truncate">
                    {selectedPO 
                      ? selectedPO.name
                      : "Select Purchase Order..."
                    }
                  </div>
                  {selectedPO && (
                    <div className="text-sm text-muted-foreground truncate">
                      {selectedPO.supplier_name} - ₹{selectedPO.grand_total.toLocaleString()}
                    </div>
                  )}
                </div>
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0 bg-white border border-gray-200 shadow-lg z-[10000]" align="start">
              <Command shouldFilter={false}>
                <CommandInput 
                  placeholder="Search purchase orders..." 
                  value={searchValue}
                  onValueChange={setSearchValue}
                />
                <CommandList>
                  <CommandEmpty>
                    {isLoadingPOs ? "Loading purchase orders..." : "No purchase orders found."}
                  </CommandEmpty>
                  {isLoadingPOs && (
                    <CommandGroup>
                      <div className="flex items-center justify-center p-4">
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        <span className="text-sm text-muted-foreground">Loading purchase orders...</span>
                      </div>
                    </CommandGroup>
                  )}
                  {!isLoadingPOs && filteredOrders.length > 0 && (
                    <CommandGroup>
                      {filteredOrders.map((po) => (
                        <CommandItem
                          key={po.name}
                          value={po.name}
                          onSelect={() => selectPurchaseOrder(po)}
                          className="flex flex-col items-start p-3"
                        >
                          <div className="flex w-full items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <Check
                                className={cn(
                                  "h-4 w-4",
                                  selectedPO?.name === po.name ? "opacity-100" : "opacity-0"
                                )}
                              />
                              <Package className="w-4 h-4 text-muted-foreground shrink-0" />
                              <div>
                                <div className="font-semibold text-sm">{po.name}</div>
                                <div className="text-xs text-gray-600 flex items-center">
                                  <User className="w-3 h-3 mr-1" />
                                  {po.supplier_name}
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-semibold text-green-600 text-sm">
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
                              Due: {po.schedule_date ? new Date(po.schedule_date).toLocaleDateString() : 'N/A'}
                            </div>
                            <div className="text-xs text-gray-500">
                              Received: {po.per_received}%
                            </div>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  )}
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </div>
  );
};

export default POSelector;
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
import { SalesOrder } from "@/types";

interface SOSelectorProps {
  onOrderSelected: (order: SalesOrder) => void;
  isLoading: boolean;
}

const SOSelector = ({ onOrderSelected, isLoading }: SOSelectorProps) => {
  const [salesOrders, setSalesOrders] = useState<SalesOrder[]>([]);
  const [isLoadingSOs, setIsLoadingSOs] = useState(false);
  const [open, setOpen] = useState(false);
  const [selectedSO, setSelectedSO] = useState<SalesOrder | null>(null);
  const [searchValue, setSearchValue] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    return () => {
      setOpen(false);
    };
  }, []);

  useEffect(() => {
    loadInitialSalesOrders();
  }, []);

  const loadInitialSalesOrders = async () => {
    setIsLoadingSOs(true);
    try {
      const cached = await offlineStorage.getCachedData('sales_orders_deliver');
      if (cached && Array.isArray(cached) && cached.length > 0) {
        setSalesOrders(cached);
        setIsLoadingSOs(false);
        return;
      }
      await fetchSalesOrders("");
    } catch (error) {
      console.error('Failed to load initial sales orders:', error);
      setIsLoadingSOs(false);
    }
  };

  const fetchSalesOrders = async (search: string = "") => {
    setIsLoadingSOs(true);
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
        ['status', 'in', ['To Deliver', 'To Deliver and Bill', 'Partially Delivered']],
        ['company', '=', company]
      ];
      
      if (search.trim()) {
        filters.push(['name', 'like', `%${search}%`]);
      }
      
      // Use the correct Frappe Resource API format
      const url = `${erpnextAPI.baseURL}/api/resource/Sales Order`;
      const params = new URLSearchParams({
        filters: JSON.stringify(filters),
        fields: JSON.stringify(['name', 'customer', 'delivery_date', 'grand_total', 'status', 'per_delivered']),
        limit_page_length: '50'
      });
      
      const response = await fetch(`${url}?${params}`, {
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
        const transformedResults: SalesOrder[] = result.data.map((so: any) => ({
          id: so.name,
          name: so.name,
          number: so.name,
          customer: so.customer,
          status: so.status,
          delivery_date: so.delivery_date,
          grand_total: so.grand_total,
          totalValue: so.grand_total,
          totalItems: so.items?.length || 0,
          percentDelivered: so.per_delivered || 0,
          items: so.items || []
        }));
        
        setSalesOrders(transformedResults);
        
        if (!search.trim()) {
          await offlineStorage.cacheData('sales_orders_deliver', transformedResults, 300000);
        }
      } else {
        setSalesOrders([]);
      }
    } catch (error) {
      console.error('Error loading sales orders:', error);
      toast({
        title: "Error",
        description: "Failed to load sales orders from ERPNext",
        variant: "destructive"
      });
      
      try {
        const cached = await offlineStorage.getCachedData('sales_orders_deliver');
        if (cached && Array.isArray(cached)) {
          setSalesOrders(cached);
        }
      } catch (cacheError) {
        console.error('Failed to load cached sales orders:', cacheError);
      }
    } finally {
      setIsLoadingSOs(false);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchValue !== undefined) {
        fetchSalesOrders(searchValue);
      }
    }, 800);

    return () => clearTimeout(timeoutId);
  }, [searchValue]);

  const selectSalesOrder = async (so: SalesOrder) => {
    try {
      setIsLoadingSOs(true);
      const erpnextAPI = await createERPNextAPI();
      if (!erpnextAPI) return;

      // Get full SO details using centralized API
      const soResponse = await erpnextAPI.getSalesOrder(so.name);
      
      if (soResponse?.data) {
        const fullSO = soResponse.data;
        
        const transformedSO: SalesOrder = {
          id: fullSO.name,
          name: fullSO.name,
          number: fullSO.name,
          customer: fullSO.customer,
          status: fullSO.status,
          delivery_date: fullSO.delivery_date,
          grand_total: fullSO.grand_total,
          totalValue: fullSO.grand_total,
          totalItems: fullSO.items ? fullSO.items.length : 0,
          percentDelivered: fullSO.per_delivered || 0,
          items: fullSO.items ? fullSO.items.map((item: any) => ({
            itemCode: item.item_code,
            itemName: item.item_name,
            orderedQty: item.qty || 0,
            deliveredQty: item.delivered_qty || 0,
            pendingQty: (item.qty || 0) - (item.delivered_qty || 0),
            rate: item.rate || 0,
            uom: item.stock_uom || item.uom,
            warehouse: item.warehouse || 'Main Store',
            qtyToDeliver: (item.qty || 0) - (item.delivered_qty || 0)
          })) : []
        };

        setSelectedSO(so);
        setOpen(false);
        onOrderSelected(transformedSO);
      }
    } catch (error) {
      console.error('Error fetching SO details:', error);
      toast({
        title: "Error",
        description: "Failed to fetch Sales Order details",
        variant: "destructive"
      });
    } finally {
      setIsLoadingSOs(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "To Deliver": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "To Deliver and Bill": return "bg-blue-100 text-blue-800 border-blue-200";
      case "Partially Delivered": return "bg-orange-100 text-orange-800 border-orange-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const filteredOrders = useMemo(() => {
    if (!searchValue) return salesOrders;
    const lowercaseSearch = searchValue.toLowerCase();
    return salesOrders.filter(so => 
      so.name.toLowerCase().includes(lowercaseSearch) ||
      so.customer.toLowerCase().includes(lowercaseSearch)
    );
  }, [salesOrders, searchValue]);

  return (
    <div className="space-y-4">
      <div>
        <Label>Search Sales Order</Label>
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
                    {selectedSO 
                      ? selectedSO.name
                      : "Select Sales Order..."
                    }
                  </div>
                  {selectedSO && (
                    <div className="text-sm text-muted-foreground truncate">
                      {selectedSO.customer} - ₹{selectedSO.grand_total.toLocaleString()}
                    </div>
                  )}
                </div>
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0 bg-popover border border-border shadow-lg z-[10000]" align="start">
              <Command shouldFilter={false}>
                <CommandInput 
                  placeholder="Search sales orders..." 
                  value={searchValue}
                  onValueChange={setSearchValue}
                />
                <CommandList>
                  <CommandEmpty>
                    {isLoadingSOs ? "Loading sales orders..." : "No sales orders found."}
                  </CommandEmpty>
                  {isLoadingSOs && (
                    <CommandGroup>
                      <div className="flex items-center justify-center p-4">
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        <span className="text-sm text-muted-foreground">Loading sales orders...</span>
                      </div>
                    </CommandGroup>
                  )}
                  {!isLoadingSOs && filteredOrders.length > 0 && (
                    <CommandGroup>
                      {filteredOrders.map((so) => (
                        <CommandItem
                          key={so.name}
                          value={so.name}
                          onSelect={() => selectSalesOrder(so)}
                          className="flex flex-col items-start p-3"
                        >
                          <div className="flex w-full items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <Check
                                className={cn(
                                  "h-4 w-4",
                                  selectedSO?.name === so.name ? "opacity-100" : "opacity-0"
                                )}
                              />
                              <Package className="w-4 h-4 text-muted-foreground shrink-0" />
                              <div>
                                <div className="font-semibold text-sm">{so.name}</div>
                                <div className="text-xs text-gray-600 flex items-center">
                                  <User className="w-3 h-3 mr-1" />
                                  {so.customer}
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-semibold text-green-600 text-sm">
                                ₹{so.grand_total.toLocaleString()}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2 mt-2 w-full">
                            <Badge className={getStatusColor(so.status)} variant="outline">
                              {so.status}
                            </Badge>
                            <div className="text-xs text-gray-500 flex items-center">
                              <Calendar className="w-3 h-3 mr-1" />
                              Due: {so.delivery_date ? new Date(so.delivery_date).toLocaleDateString() : 'N/A'}
                            </div>
                            <div className="text-xs text-gray-500">
                              Delivered: {so.percentDelivered}%
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

export default SOSelector;
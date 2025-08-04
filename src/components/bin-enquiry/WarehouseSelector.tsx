import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Warehouse, Loader2, Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { createERPNextAPI, getUserDefaultCompany } from "@/services/erpnextApi";
import { offlineStorage } from "@/services/offlineStorage";

interface WarehouseInfo {
  name: string;
  warehouse_name: string;
  is_group?: number;
  company?: string;
}

interface WarehouseSelectorProps {
  onWarehouseSelected: (warehouseCode: string) => void;
  isLoading: boolean;
}

const WarehouseSelector = ({ onWarehouseSelected, isLoading }: WarehouseSelectorProps) => {
  const [warehouses, setWarehouses] = useState<WarehouseInfo[]>([]);
  const [isLoadingWarehouses, setIsLoadingWarehouses] = useState(false);
  const [open, setOpen] = useState(false);
  const [selectedWarehouse, setSelectedWarehouse] = useState<WarehouseInfo | null>(null);
  const [searchValue, setSearchValue] = useState("");

  useEffect(() => {
    return () => {
      setOpen(false);
    };
  }, []);

  useEffect(() => {
    loadInitialWarehouses();
  }, []);

  const loadInitialWarehouses = async () => {
    setIsLoadingWarehouses(true);
    try {
      const cached = await offlineStorage.getCachedData('warehouses_page_1');
      if (cached && Array.isArray(cached) && cached.length > 0) {
        setWarehouses(cached);
        setIsLoadingWarehouses(false);
        return;
      }

      await fetchWarehouses("");
    } catch (error) {
      console.error('Failed to load initial warehouses:', error);
      setIsLoadingWarehouses(false);
    }
  };

  const fetchWarehouses = async (search: string = "") => {
    setIsLoadingWarehouses(true);
    
    try {
      const erpnextAPI = await createERPNextAPI();
      if (!erpnextAPI) {
        const cached = await offlineStorage.getCachedData('warehouses_page_1');
        if (cached && Array.isArray(cached)) {
          setWarehouses(cached);
        }
        setIsLoadingWarehouses(false);
        return;
      }

      let filters: any[] = [];
      
      if (search.trim()) {
        filters.push(['warehouse_name', 'like', `%${search}%`]);
      }

      const defaultCompany = await getUserDefaultCompany();
      if (defaultCompany) {
        filters.push(['company', "=", defaultCompany])
      }
      
      const result = await erpnextAPI.getWarehouses(filters);
      
      if (result && result.data) {
        const warehouseData: WarehouseInfo[] = result.data.map(warehouse => ({
          name: warehouse.name,
          warehouse_name: warehouse.warehouse_name || warehouse.name,
          is_group: warehouse.is_group,
          company: (warehouse as any).company
        }));
        
        // Sort warehouses by warehouse_name
        warehouseData.sort((a, b) => (a.warehouse_name || a.name).localeCompare(b.warehouse_name || b.name));
        
        setWarehouses(warehouseData);
        
        if (!search.trim()) {
          await offlineStorage.cacheData('warehouses_page_1', warehouseData, 300000);
        }
      } else {
        setWarehouses([]);
      }
    } catch (error) {
      console.error('Failed to fetch warehouses:', error);
      
      try {
        const cacheKey = search.trim() ? `warehouses_search_${search}` : 'warehouses_page_1';
        const cached = await offlineStorage.getCachedData(cacheKey);
        if (cached && Array.isArray(cached)) {
          setWarehouses(cached);
        }
      } catch (cacheError) {
        console.error('Failed to load cached warehouses:', cacheError);
      }
    } finally {
      setIsLoadingWarehouses(false);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchValue !== undefined) {
        fetchWarehouses(searchValue);
      }
    }, 800); // Increased to 800ms to reduce API calls

    return () => clearTimeout(timeoutId);
  }, [searchValue]);

  const handleWarehouseSelect = (warehouse: WarehouseInfo) => {
    setSelectedWarehouse(warehouse);
    setOpen(false);
    onWarehouseSelected(warehouse.name);
  };

  const filteredWarehouses = useMemo(() => {
    let result = warehouses;
    
    if (searchValue) {
      const lowercaseSearch = searchValue.toLowerCase();
      result = warehouses.filter(warehouse => 
        warehouse.name.toLowerCase().includes(lowercaseSearch) ||
        warehouse.warehouse_name.toLowerCase().includes(lowercaseSearch)
      );
    }
    
    // Always sort by warehouse_name
    result.sort((a, b) => (a.warehouse_name || a.name).localeCompare(b.warehouse_name || b.name));
    
    return result;
  }, [warehouses, searchValue]);

  return (
    <div className="space-y-3">
      <div>
        <Label htmlFor="warehouse-search" className="text-sm font-medium">Warehouse Code / Name</Label>
        <div className="mt-2">
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={open}
                className="w-full justify-between text-left h-auto min-h-[44px] py-3 px-4"
                disabled={isLoading}
              >
                <div className="flex-1 min-w-0 text-left">
                  <div className="truncate">
                    {selectedWarehouse 
                      ? selectedWarehouse.name
                      : "Search warehouse by code or name..."
                    }
                  </div>
                  {selectedWarehouse && (
                    <div className="text-sm text-muted-foreground truncate">
                      {selectedWarehouse.warehouse_name}
                    </div>
                  )}
                </div>
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[calc(100vw-2rem)] sm:w-full max-w-md p-0 bg-popover border border-border shadow-lg z-[10000]" align="start">
              <Command shouldFilter={false}>
                <CommandInput 
                  placeholder="Search warehouses..." 
                  value={searchValue}
                  onValueChange={setSearchValue}
                />
                <CommandList>
                  <CommandEmpty>
                    {isLoadingWarehouses ? "Loading warehouses..." : "No warehouses found."}
                  </CommandEmpty>
                  {isLoadingWarehouses && (
                    <CommandGroup>
                      <div className="flex items-center justify-center p-4">
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        <span className="text-sm text-muted-foreground">Loading warehouses...</span>
                      </div>
                    </CommandGroup>
                  )}
                  {!isLoadingWarehouses && filteredWarehouses.length > 0 && (
                    <CommandGroup>
                      {filteredWarehouses.map((warehouse) => (
                        <CommandItem
                          key={warehouse.name}
                          value={warehouse.name}
                          onSelect={(currentValue) => {
                            const selectedWarehouseData = filteredWarehouses.find(w => w.name === currentValue);
                            if (selectedWarehouseData) {
                              handleWarehouseSelect(selectedWarehouseData);
                            }
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedWarehouse?.name === warehouse.name ? "opacity-100" : "opacity-0"
                            )}
                          />
                          <div className="flex items-center space-x-3 flex-1 min-w-0">
                            <Warehouse className="w-4 h-4 text-muted-foreground shrink-0" />
                            <div className="flex-1 min-w-0">
                              <div className="font-medium truncate">{warehouse.warehouse_name || warehouse.name}</div>
                              <div className="text-sm text-muted-foreground truncate">{warehouse.name}</div>
                              {warehouse.is_group === 1 && (
                                <span className="text-xs px-1 py-0.5 bg-blue-100 text-blue-600 rounded mt-1 inline-block">Group</span>
                              )}
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

export default WarehouseSelector;

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Warehouse, Loader2, Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { createERPNextAPI } from "@/services/erpnextApi";
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
  const [searchTerm, setSearchTerm] = useState("");
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  // Debounced search function
  const searchWarehouses = useMemo(() => {
    let timeoutId: NodeJS.Timeout;
    
    return (searchValue: string, isNewSearch: boolean = false) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        fetchWarehouses(searchValue, isNewSearch);
      }, 300);
    };
  }, []);

  // Load initial warehouses and cached warehouses
  useEffect(() => {
    loadInitialWarehouses();
  }, []);

  const loadInitialWarehouses = async () => {
    try {
      // First try to load from cache
      const cached = await offlineStorage.getCachedData('warehouses_page_1');
      if (cached && Array.isArray(cached) && cached.length > 0) {
        console.log('Loading warehouses from cache:', cached.length);
        setWarehouses(cached);
        return;
      }

      // If no cache, fetch from API
      console.log('No cached warehouses found, fetching from API...');
      await fetchWarehouses("", true);
    } catch (error) {
      console.error('Failed to load initial warehouses:', error);
    }
  };

  const loadCachedWarehouses = async () => {
    try {
      const cached = await offlineStorage.getCachedData('warehouses_page_1');
      if (cached && Array.isArray(cached)) {
        console.log('Loading cached warehouses:', cached.length);
        setWarehouses(cached);
      }
    } catch (error) {
      console.error('Failed to load cached warehouses:', error);
    }
  };

  // Fetch warehouses with search and pagination
  const fetchWarehouses = async (search: string = "", isNewSearch: boolean = false) => {
    setIsLoadingWarehouses(true);
    console.log('Fetching warehouses:', { search, isNewSearch, currentPage });
    
    try {
      const erpnextAPI = await createERPNextAPI();
      if (!erpnextAPI) {
        console.error('ERPNext API not configured');
        // Try to load from cache if API is not available
        await loadCachedWarehouses();
        return;
      }

      const pageToFetch = isNewSearch ? 1 : currentPage;
      const limit = 20;
      
      // Build search filters - use the same approach as items
      let filters: any[] = [
        ['disabled', '=', 0] // Only enabled warehouses
      ];
      
      if (search.trim()) {
        // Use simple search format that works with ERPNext
        filters.push(['warehouse_name', 'like', `%${search}%`]);
      }
      
      console.log('Fetching warehouses with filters:', filters);
      
      const params: any = {
        limit_page_length: limit,
        limit_start: (pageToFetch - 1) * limit,
        fields: JSON.stringify(['name', 'warehouse_name', 'company', 'is_group'])
      };
      
      if (filters.length > 0) {
        params.filters = filters;
      }
      
      const result = await erpnextAPI.makeRequest('Warehouse', 'GET', null, params);
      
      console.log('Warehouse API result:', result);
      
      if (result.data) {
        const warehouseData = result.data;
        
        if (isNewSearch) {
          setWarehouses(warehouseData);
          setCurrentPage(1);
          
          // Cache the results
          const cacheKey = search.trim() ? `warehouses_search_${search}` : 'warehouses_page_1';
          await offlineStorage.cacheData(cacheKey, warehouseData, 300000); // 5 minutes
        } else {
          setWarehouses(prev => [...prev, ...warehouseData]);
        }
        
        // Check if there are more warehouses
        setHasMore(warehouseData.length === limit);
        
        if (!isNewSearch) {
          setCurrentPage(prev => prev + 1);
        }
      } else {
        console.log('No warehouse data returned');
        if (isNewSearch) {
          setWarehouses([]);
        }
      }
    } catch (error) {
      console.error('Failed to fetch warehouses:', error);
      
      // Try to load from cache on error
      try {
        const cacheKey = search.trim() ? `warehouses_search_${search}` : 'warehouses_page_1';
        const cached = await offlineStorage.getCachedData(cacheKey);
        if (cached && Array.isArray(cached)) {
          console.log('Loading warehouses from cache after error:', cached.length);
          setWarehouses(cached);
        }
      } catch (cacheError) {
        console.error('Failed to load cached warehouses:', cacheError);
      }
    } finally {
      setIsLoadingWarehouses(false);
    }
  };

  // Handle search term changes
  useEffect(() => {
    if (searchTerm.trim()) {
      console.log('Searching for warehouses:', searchTerm);
      searchWarehouses(searchTerm, true);
    } else {
      console.log('Search term empty, loading initial warehouses');
      loadInitialWarehouses();
    }
  }, [searchTerm, searchWarehouses]);

  const handleWarehouseSelect = (warehouse: WarehouseInfo) => {
    console.log('Warehouse selected:', warehouse);
    setSelectedWarehouse(warehouse);
    setOpen(false);
    onWarehouseSelected(warehouse.name);
  };

  const loadMoreWarehouses = () => {
    if (hasMore && !isLoadingWarehouses) {
      console.log('Loading more warehouses...');
      fetchWarehouses(searchTerm, false);
    }
  };

  console.log('Current warehouses:', warehouses.length);

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="warehouse-search">Warehouse Code / Name</Label>
        <div className="flex-1 min-w-0 mt-1">
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={open}
                className="w-full justify-between text-left h-auto min-h-[40px] py-2 px-3"
                disabled={isLoadingWarehouses || isLoading}
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
            <PopoverContent className="w-full p-0">
              <Command>
                <CommandInput 
                  placeholder="Search warehouses..." 
                  value={searchTerm}
                  onValueChange={setSearchTerm}
                />
                <CommandList>
                  <CommandEmpty>
                    {isLoadingWarehouses ? "Loading warehouses..." : "No warehouses found."}
                  </CommandEmpty>
                  <CommandGroup>
                    {warehouses.map((warehouse) => (
                      <CommandItem
                        key={warehouse.name}
                        value={`${warehouse.name} ${warehouse.warehouse_name}`}
                        onSelect={() => handleWarehouseSelect(warehouse)}
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
                    {hasMore && (
                      <CommandItem onSelect={loadMoreWarehouses}>
                        <div className="flex items-center justify-center w-full py-2">
                          {isLoadingWarehouses ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <span className="text-sm text-muted-foreground">Load more warehouses...</span>
                          )}
                        </div>
                      </CommandItem>
                    )}
                  </CommandGroup>
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

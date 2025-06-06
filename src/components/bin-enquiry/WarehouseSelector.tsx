
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

  // Load cached warehouses first
  useEffect(() => {
    loadCachedWarehouses();
  }, []);

  const loadCachedWarehouses = async () => {
    try {
      const cached = await offlineStorage.getCachedData('warehouses_all');
      if (cached && Array.isArray(cached)) {
        setWarehouses(cached.slice(0, 20)); // Show first 20 from cache
      }
    } catch (error) {
      console.error('Failed to load cached warehouses:', error);
    }
  };

  // Fetch warehouses with search and pagination
  const fetchWarehouses = async (search: string = "", isNewSearch: boolean = false) => {
    setIsLoadingWarehouses(true);
    try {
      const erpnextAPI = await createERPNextAPI();
      if (!erpnextAPI) {
        console.error('ERPNext API not configured');
        // Try to load from cache if API is not available
        const cached = await offlineStorage.getCachedData('warehouses_all');
        if (cached && Array.isArray(cached)) {
          const filtered = cached.filter((w: WarehouseInfo) => 
            w.warehouse_name?.toLowerCase().includes(search.toLowerCase()) ||
            w.name?.toLowerCase().includes(search.toLowerCase())
          );
          setWarehouses(filtered.slice(0, 20));
        }
        return;
      }

      const pageToFetch = isNewSearch ? 1 : currentPage;
      
      // Build search filters - simplified approach
      let filters: any[] = [
        ['disabled', '=', 0] // Only enabled warehouses
      ];
      
      if (search.trim()) {
        // Use a simpler OR filter approach
        filters.push([
          ['warehouse_name', 'like', `%${search}%`],
          'or',
          ['name', 'like', `%${search}%`]
        ]);
      }
      
      console.log('Fetching warehouses with filters:', filters);
      
      const result = await erpnextAPI.getWarehouses(filters, undefined);
      
      console.log('Warehouse API result:', result);
      
      if (result.data) {
        if (isNewSearch) {
          setWarehouses(result.data);
          setCurrentPage(1);
          
          // Cache the search results
          await offlineStorage.cacheData(`warehouses_search_${search}`, result.data, 300000); // 5 minutes
        } else {
          setWarehouses(prev => [...prev, ...result.data]);
        }
        
        // Check if there are more warehouses
        setHasMore(result.data.length === 20);
        
        if (!isNewSearch) {
          setCurrentPage(prev => prev + 1);
        }
      }
    } catch (error) {
      console.error('Failed to fetch warehouses:', error);
      
      // Try to load from cache on error
      try {
        const cacheKey = search.trim() ? `warehouses_search_${search}` : 'warehouses_all';
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

  // Handle search term changes
  useEffect(() => {
    if (searchTerm.trim()) {
      searchWarehouses(searchTerm, true);
    } else {
      // If search is empty, load cached warehouses
      loadCachedWarehouses();
    }
  }, [searchTerm, searchWarehouses]);

  const handleWarehouseSelect = (warehouse: WarehouseInfo) => {
    setSelectedWarehouse(warehouse);
    setOpen(false);
    onWarehouseSelected(warehouse.name);
  };

  const loadMoreWarehouses = () => {
    if (hasMore && !isLoadingWarehouses && searchTerm.trim()) {
      fetchWarehouses(searchTerm, false);
    }
  };

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
                    {hasMore && searchTerm.trim() && (
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

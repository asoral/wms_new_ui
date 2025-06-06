
import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Warehouse, Loader2, Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { ERPNextAPI } from "@/services/erpnextApi";
import { offlineStorage } from "@/services/offlineStorage";
import { supabase } from "@/integrations/supabase/client";

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

  // Load initial warehouses
  useEffect(() => {
    loadInitialWarehouses();
  }, []);

  const loadInitialWarehouses = async () => {
    setIsLoadingWarehouses(true);
    try {
      // First try to load from cache
      const cached = await offlineStorage.getCachedData('warehouses_page_1');
      if (cached && Array.isArray(cached) && cached.length > 0) {
        console.log('Loading warehouses from cache:', cached.length);
        setWarehouses(cached);
        setIsLoadingWarehouses(false);
        return;
      }

      // If no cache, fetch from API
      console.log('No cached warehouses found, fetching from API...');
      await fetchWarehouses("");
    } catch (error) {
      console.error('Failed to load initial warehouses:', error);
      setIsLoadingWarehouses(false);
    }
  };

  // Get ERPNext configuration from user profile
  const getERPNextConfig = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('No user found');
        return null;
      }

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('erpnext_url, erpnext_api_key, erpnext_api_secret')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        return null;
      }

      if (!profile?.erpnext_url || !profile?.erpnext_api_key || !profile?.erpnext_api_secret) {
        console.error('ERPNext configuration incomplete in profile');
        return null;
      }

      return {
        baseURL: profile.erpnext_url,
        apiKey: profile.erpnext_api_key,
        apiSecret: profile.erpnext_api_secret
      };
    } catch (error) {
      console.error('Failed to get ERPNext config:', error);
      return null;
    }
  };

  // Fetch warehouses with search
  const fetchWarehouses = async (search: string = "") => {
    setIsLoadingWarehouses(true);
    console.log('Fetching warehouses with search:', search);
    
    try {
      const config = await getERPNextConfig();
      if (!config) {
        console.error('ERPNext configuration not available');
        setIsLoadingWarehouses(false);
        return;
      }

      const erpnextAPI = new ERPNextAPI(config);
      
      // Build search filters
      let filters: any[] = [
        ['disabled', '=', 0] // Only enabled warehouses
      ];
      
      if (search.trim()) {
        filters.push(['warehouse_name', 'like', `%${search}%`]);
      }
      
      console.log('Fetching warehouses with filters:', filters);
      
      const params: any = {
        limit_page_length: 50,
        limit_start: 0,
        fields: JSON.stringify(['name', 'warehouse_name', 'company', 'is_group'])
      };
      
      if (filters.length > 0) {
        params.filters = JSON.stringify(filters);
      }
      
      const result = await erpnextAPI.makeRequest('Warehouse', 'GET', null, params);
      
      console.log('Warehouse API result:', result);
      
      if (result && result.data) {
        const warehouseData = result.data;
        console.log('Setting warehouses:', warehouseData.length);
        setWarehouses(warehouseData);
        
        // Cache the results
        const cacheKey = search.trim() ? `warehouses_search_${search}` : 'warehouses_page_1';
        await offlineStorage.cacheData(cacheKey, warehouseData, 300000); // 5 minutes
      } else {
        console.log('No warehouse data returned or unexpected format');
        setWarehouses([]);
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

  // Handle search with debouncing
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm !== undefined) {
        fetchWarehouses(searchTerm);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const handleWarehouseSelect = (warehouse: WarehouseInfo) => {
    console.log('Warehouse selected:', warehouse);
    setSelectedWarehouse(warehouse);
    setOpen(false);
    onWarehouseSelected(warehouse.name);
  };

  console.log('Current warehouses count:', warehouses.length);
  console.log('Is loading warehouses:', isLoadingWarehouses);
  console.log('Dropdown open:', open);

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
            <PopoverContent className="w-full p-0" align="start">
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
                  {isLoadingWarehouses && (
                    <CommandGroup>
                      <div className="flex items-center justify-center p-4">
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        <span className="text-sm text-muted-foreground">Loading warehouses...</span>
                      </div>
                    </CommandGroup>
                  )}
                  {!isLoadingWarehouses && warehouses.length > 0 && (
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


import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Warehouse, Loader2, Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { createERPNextAPI } from "@/services/erpnextApi";

interface WarehouseInfo {
  name: string;
  warehouse_name: string;
  is_group: number;
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

  // Fetch warehouses with search and pagination
  const fetchWarehouses = async (search: string = "", isNewSearch: boolean = false) => {
    // Only search if there's a search term
    if (!search.trim()) {
      setWarehouses([]);
      return;
    }

    setIsLoadingWarehouses(true);
    try {
      const erpnextAPI = await createERPNextAPI();
      if (!erpnextAPI) {
        console.error('ERPNext API not configured');
        return;
      }

      const pageToFetch = isNewSearch ? 1 : currentPage;
      
      // Build search filters
      let filters: any[] = [
        ['disabled', '=', 0] // Only enabled warehouses
      ];
      
      if (search.trim()) {
        filters.push([
          ['warehouse_name', 'like', `%${search}%`],
          'or',
          ['name', 'like', `%${search}%`]
        ]);
      }
      
      const result = await erpnextAPI.getWarehouses(filters, 20, pageToFetch);
      
      if (result.data) {
        if (isNewSearch) {
          setWarehouses(result.data);
          setCurrentPage(1);
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
    } finally {
      setIsLoadingWarehouses(false);
    }
  };

  // Handle search term changes
  useEffect(() => {
    searchWarehouses(searchTerm, true);
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
                    <div className="text-sm text-gray-500 truncate">
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
                    {isLoadingWarehouses ? "Loading warehouses..." : searchTerm.trim() ? "No warehouses found." : "Type to search warehouses..."}
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
                          <Warehouse className="w-4 h-4 text-gray-500 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">{warehouse.warehouse_name || warehouse.name}</div>
                            <div className="text-sm text-gray-500 truncate">{warehouse.name}</div>
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
                            <span className="text-sm text-gray-500">Load more warehouses...</span>
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

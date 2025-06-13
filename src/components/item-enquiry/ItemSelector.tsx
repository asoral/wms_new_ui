
import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Package, Loader2, Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { createERPNextAPI, getUserDefaultCompany } from "@/services/erpnextApi";
import { offlineStorage } from "@/services/offlineStorage";

export interface Item {
  name?: string;
  item_code: string;
  item_name: string;
  stock_uom: string;
  has_batch_no?: boolean;
  has_serial_no?: boolean;
}

interface ItemSelectorProps {
  onItemSelected: (itemCode: string) => void;
  isLoading: boolean;
}

const ItemSelector = ({ onItemSelected, isLoading }: ItemSelectorProps) => {
  const [items, setItems] = useState<Item[]>([]);
  const [isLoadingItems, setIsLoadingItems] = useState(false);
  const [open, setOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const timeoutRef = useRef<NodeJS.Timeout>();
  // Cleanup when component unmounts
  useEffect(() => {
    return () => {
      setOpen(false);
    };
  }, []);

  // Debounced search function

const searchItems = useCallback((searchValue: string) => {
  if (timeoutRef.current) clearTimeout(timeoutRef.current);
  timeoutRef.current = setTimeout(() => {
    fetchItems(searchValue);
  }, 300);
}, []);


  // Load initial items and cached items
  useEffect(() => {
    loadInitialItems();
  }, []);

  const loadInitialItems = async () => {
    try {
      // First try to load from cache
      const cached = await offlineStorage.getCachedData('items_initial');
      if (cached && Array.isArray(cached) && cached.length > 0) {
        setItems(cached);
        return;
      }

      // If no cache, fetch from API
      await fetchItems("");
    } catch (error) {
      console.error('Failed to load initial items:', error);
    }
  };

  const loadCachedItems = async () => {
    try {
      const cached = await offlineStorage.getCachedData('items_initial');
      if (cached && Array.isArray(cached)) {
        setItems(cached);
      }
    } catch (error) {
      console.error('Failed to load cached items:', error);
    }
  };

  // Fetch items with search
  const fetchItems = async (search: string = "") => {
    setIsLoadingItems(true);
    
    try {
      const erpnextAPI = await createERPNextAPI();
      
      if (!erpnextAPI) {
        console.error('ERPNext API not configured');
        await loadCachedItems();
        return;
      }

      const defaultCompany = await getUserDefaultCompany();
      console.log("default company:----->",defaultCompany)
      const limit = 50;
      
      let result;
      if (search.trim()) {
        console.log('Searching items with term:', search);
        // Check if search term looks like a barcode (numeric or alphanumeric)
        if (/^[0-9]+$/.test(search) || search.length > 10) {
          // Try barcode search first
          try {
            result = await erpnextAPI.searchItemsByBarcode(search);
            if (!result.data || result.data.length === 0) {
              // If barcode search fails, try regular search
              result = await erpnextAPI.searchItems(search, defaultCompany || undefined, limit);
            }
          } catch (error) {
            // Fallback to regular search
            result = await erpnextAPI.searchItems(search, defaultCompany || undefined, limit);
          }
        } else {
          // Regular text search
          result = await erpnextAPI.searchItems(search, defaultCompany || undefined, limit);
        }
      } else {
        console.log('Fetching initial items');
        result = await erpnextAPI.getItemsPaginated(undefined, undefined, defaultCompany || undefined, limit, 1);
      }
      
      console.log('API result:', result);
      
      if (result.data && Array.isArray(result.data)) {
        if (JSON.stringify(result.data) !== JSON.stringify(items)) {
          setItems(result.data);
        }

        
        // Cache the results
        const cacheKey = search.trim() ? `items_search_${search}` : 'items_initial';
        await offlineStorage.cacheData(cacheKey, result.data, 300000); // 5 minutes
      } else {
        setItems([]);
      }
    } catch (error) {
      console.error('Failed to fetch items:', error);
      
      // Try to load from cache on error
      try {
        const cacheKey = search.trim() ? `items_search_${search}` : 'items_initial';
        const cached = await offlineStorage.getCachedData(cacheKey);
        if (cached && Array.isArray(cached)) {
          setItems(cached);
        }
      } catch (cacheError) {
        console.error('Failed to load cached items:', cacheError);
      }
    } finally {
      setIsLoadingItems(false);
    }
  };

  // Handle search term changes
  useEffect(() => {
    if (searchTerm.trim()) {
      searchItems(searchTerm);
    } else {
      loadInitialItems();
    }
  }, [searchTerm, searchItems]);

  const handleItemSelect = (item: Item) => {
    setSelectedItem(item);
    setOpen(false);
    onItemSelected(item.item_code);
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="item-search">Item Code / Name</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between text-left h-auto min-h-[40px] py-2 px-3"
            disabled={isLoading || isLoadingItems}
          >
            <div className="flex-1 min-w-0 text-left">
              <div className="truncate">
                {selectedItem 
                  ? selectedItem.item_code
                  : "Search item by code, name or barcode..."
                }
              </div>
              {selectedItem && (
                <div className="text-sm text-muted-foreground truncate">
                  {selectedItem.item_name}
                </div>
              )}
            </div>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0 bg-white border border-gray-200 shadow-lg z-50" align="start">
          <Command>
            <CommandInput 
              placeholder="Search by item code, name or barcode..." 
              value={searchTerm}
              onValueChange={setSearchTerm}
            />
            <CommandList>
              <CommandEmpty>
                {isLoadingItems ? "Loading items..." : "No items found."}
              </CommandEmpty>
              <CommandGroup>
                {items.map((item) => (
                  <CommandItem
                    key={item.item_code}
                    value={`${item.item_code} ${item.item_name}`}
                    onSelect={() => handleItemSelect(item)}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        selectedItem?.item_code === item.item_code ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      <Package className="w-4 h-4 text-muted-foreground shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{item.item_name || item.item_code}</div>
                        <div className="text-sm text-muted-foreground truncate">{item.item_code}</div>
                        <span className="text-xs px-1 py-0.5 bg-gray-100 text-gray-600 rounded mt-1 inline-block">
                          {item.stock_uom || 'Nos'}
                        </span>
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
  );
};

export default ItemSelector;

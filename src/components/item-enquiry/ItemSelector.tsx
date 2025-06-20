
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
  const [searchValue, setSearchValue] = useState("");
  const timeoutRef = useRef<NodeJS.Timeout>();
  
  useEffect(() => {
    return () => {
      setOpen(false);
    };
  }, []);

  const searchItems = useCallback((searchTerm: string) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      fetchItems(searchTerm);
    }, 300);
  }, []);

  useEffect(() => {
    loadInitialItems();
  }, []);

  const loadInitialItems = async () => {
    try {
      console.log('Loading initial items...');
      const cached = await offlineStorage.getCachedData('items_initial');
      if (cached && Array.isArray(cached) && cached.length > 0) {
        console.log('Loaded items from cache:', cached.length);
        setItems(cached);
        return;
      }
      await fetchItems("");
    } catch (error) {
      console.error('Failed to load initial items:', error);
    }
  };

  const loadCachedItems = async () => {
    try {
      const cached = await offlineStorage.getCachedData('items_initial');
      if (cached && Array.isArray(cached)) {
        console.log('Setting cached items:', cached.length);
        setItems(cached);
      }
    } catch (error) {
      console.error('Failed to load cached items:', error);
    }
  };

  const fetchItems = async (search: string = "") => {
    console.log('fetchItems called with search:', search);
    setIsLoadingItems(true);
    
    try {
      const erpnextAPI = await createERPNextAPI();
      
      if (!erpnextAPI) {
        console.error('ERPNext API not configured');
        await loadCachedItems();
        return;
      }

      const defaultCompany = await getUserDefaultCompany();
      console.log("default company:", defaultCompany);
      const limit = 50;
      
      let result;
      if (search.trim()) {
        console.log('Searching items with term:', search);
        if (/^[0-9]+$/.test(search) || search.length > 10) {
          try {
            result = await erpnextAPI.searchItemsByBarcode(search);
            if (!result.data || result.data.length === 0) {
              result = await erpnextAPI.searchItems(search, limit);
            }
          } catch (error) {
            console.log('Barcode search failed, trying regular search');
            result = await erpnextAPI.searchItems(search, limit);
          }
        } else {
          result = await erpnextAPI.searchItems(search, limit);
        }
      } else {
        console.log('Fetching initial items');
        result = await erpnextAPI.getItemsPaginated([], ['item_code', 'item_name', 'stock_uom', 'has_batch_no', 'has_serial_no'], limit, 1);
      }
      
      console.log('API result:', result);
      
      if (result && result.data && Array.isArray(result.data)) {
        console.log('Setting items:', result.data.length);
        setItems(result.data);

        const cacheKey = search.trim() ? `items_search_${search}` : 'items_initial';
        await offlineStorage.cacheData(cacheKey, result.data, 300000);
      } else {
        console.log('No items found or invalid response format');
        setItems([]);
      }
    } catch (error) {
      console.error('Failed to fetch items:', error);
      
      try {
        const cacheKey = search.trim() ? `items_search_${search}` : 'items_initial';
        const cached = await offlineStorage.getCachedData(cacheKey);
        if (cached && Array.isArray(cached)) {
          console.log('Loaded fallback cached items:', cached.length);
          setItems(cached);
        }
      } catch (cacheError) {
        console.error('Failed to load cached items:', cacheError);
      }
    } finally {
      setIsLoadingItems(false);
    }
  };

  useEffect(() => {
    if (searchValue.trim()) {
      searchItems(searchValue);
    } else {
      loadInitialItems();
    }
  }, [searchValue, searchItems]);

  const handleItemSelect = (item: Item) => {
    console.log('Item selected:', item);
    setSelectedItem(item);
    setOpen(false);
    onItemSelected(item.item_code);
  };

  const filteredItems = useMemo(() => {
    console.log('Filtering items. Total items:', items.length, 'Search value:', searchValue);
    if (!searchValue) return items;
    const lowercaseSearch = searchValue.toLowerCase();
    const filtered = items.filter(item => 
      item.item_code.toLowerCase().includes(lowercaseSearch) ||
      item.item_name.toLowerCase().includes(lowercaseSearch)
    );
    console.log('Filtered items count:', filtered.length);
    return filtered;
  }, [items, searchValue]);

  console.log('Rendering ItemSelector. Items count:', items.length, 'Filtered count:', filteredItems.length, 'Loading:', isLoadingItems);

  return (
    <div className="space-y-2">
      <Label htmlFor="item-search">Item Code / Name</Label>
      <Popover open={open} onOpenChange={(newOpen) => {
        console.log('Popover open state changing:', newOpen);
        setOpen(newOpen);
      }}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between text-left h-auto min-h-[40px] py-2 px-3"
            disabled={isLoading || isLoadingItems}
            onClick={() => {
              console.log('Popover trigger clicked. Current open state:', open);
            }}
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
        <PopoverContent className="w-full p-0 bg-white border border-gray-200 shadow-lg z-[9999]" align="start">
          <Command shouldFilter={false}>
            <CommandInput 
              placeholder="Search by item code, name or barcode..." 
              value={searchValue}
              onValueChange={(value) => {
                console.log('Search value changing to:', value);
                setSearchValue(value);
              }}
            />
            <CommandList>
              <CommandEmpty>
                {isLoadingItems ? "Loading items..." : "No items found."}
              </CommandEmpty>
              <CommandGroup>
                {filteredItems.map((item) => {
                  console.log('Rendering item:', item.item_code, item.item_name);
                  return (
                    <CommandItem
                      key={item.item_code}
                      value={item.item_code}
                      onSelect={(currentValue) => {
                        console.log('CommandItem onSelect called with:', currentValue);
                        const selectedItemData = filteredItems.find(i => i.item_code === currentValue);
                        if (selectedItemData) {
                          handleItemSelect(selectedItemData);
                        }
                      }}
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
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default ItemSelector;

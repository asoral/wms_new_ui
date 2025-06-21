
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

  const fetchItems = async (search: string = "") => {
    console.log('fetchItems called with search:', search);
    
    // Only search when user types something
    if (!search.trim()) {
      setItems([]);
      return;
    }
    
    setIsLoadingItems(true);
    
    try {
      const erpnextAPI = await createERPNextAPI();
      
      if (!erpnextAPI) {
        console.error('ERPNext API not configured');
        return;
      }

      const limit = 50;
      
      let result;
      console.log('Searching items with term:', search);
      
      // Check if it's a barcode (numeric or long string)
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
      
      console.log('API result:', result);
      
      if (result && result.data && Array.isArray(result.data)) {
        const validItems = result.data
          .slice(0, limit)
          .filter(item => {
            const isValid = item && item.item_code && item.item_name;
            if (!isValid) {
              console.warn('Filtering out invalid item:', item);
            }
            return isValid;
          })
          .map(item => ({
            name: item.name,
            item_code: item.item_code || item.name || '',
            item_name: item.item_name || item.item_code || item.name || '',
            stock_uom: item.stock_uom || 'Nos',
            has_batch_no: item.has_batch_no || false,
            has_serial_no: item.has_serial_no || false
          }));
        
        console.log('Setting items:', validItems.length);
        console.log('Sample items with names:', validItems.slice(0, 3).map(i => ({ code: i.item_code, name: i.item_name })));
        setItems(validItems);

        // Cache the results
        const cacheKey = `items_search_${search}`;
        await offlineStorage.cacheData(cacheKey, validItems, 300000);
      } else {
        console.log('No items found or invalid response format');
        setItems([]);
      }
    } catch (error) {
      console.error('Failed to fetch items:', error);
      
      // Try to load from cache as fallback
      try {
        const cacheKey = `items_search_${search}`;
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
      setItems([]); // Clear items when search is empty
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
    const filtered = items.filter(item => {
      const itemCode = (item.item_code || '').toLowerCase();
      const itemName = (item.item_name || '').toLowerCase();
      return itemCode.includes(lowercaseSearch) || itemName.includes(lowercaseSearch);
    });
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
          >
            <div className="flex-1 min-w-0 text-left">
              {selectedItem ? (
                <div className="space-y-1">
                  <div className="font-medium truncate text-sm md:text-base">
                    {selectedItem.item_name}
                  </div>
                  {selectedItem.item_name !== selectedItem.item_code && (
                    <div className="text-xs md:text-sm text-muted-foreground truncate">
                      {selectedItem.item_code}
                    </div>
                  )}
                </div>
              ) : (
                <div className="truncate text-muted-foreground text-sm md:text-base">
                  Search item by code, name or barcode...
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
              className="text-sm md:text-base"
            />
            <CommandList>
              <CommandEmpty>
                {isLoadingItems ? "Loading items..." : searchValue ? "No items found." : "Start typing to search items..."}
              </CommandEmpty>
              <CommandGroup>
                {filteredItems.map((item) => {
                  const showSeparateCode = item.item_name !== item.item_code;
                  
                  console.log('Rendering item:', {
                    item_code: item.item_code,
                    item_name: item.item_name,
                    showSeparateCode
                  });
                  
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
                      className="py-3"
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4 shrink-0",
                          selectedItem?.item_code === item.item_code ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <div className="flex items-center space-x-3 flex-1 min-w-0">
                        <Package className="w-4 h-4 text-muted-foreground shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate text-gray-900 text-sm md:text-base">
                            {item.item_name}
                          </div>
                          {showSeparateCode && (
                            <div className="text-xs md:text-sm text-muted-foreground truncate">
                              {item.item_code}
                            </div>
                          )}
                          <div className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded mt-1 inline-block">
                            {item.stock_uom}
                          </div>
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

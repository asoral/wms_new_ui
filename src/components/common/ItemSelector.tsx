import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Package, Loader2, Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { createERPNextAPI } from "@/services/erpnextApi";
import { offlineStorage } from "@/services/offlineStorage";

interface Item {
  name: string;
  item_code: string;
  item_name: string;
  stock_uom: string;
  description?: string;
  has_serial_no?: number;
  has_batch_no?: number;
  item_group?: string;
}

interface ItemSelectorProps {
  onItemSelect: (item: Item) => void;
  selectedItem?: Item | null;
  placeholder?: string;
  isLoading?: boolean;
}

const ItemSelector = ({ onItemSelect, selectedItem, placeholder = "Search and select item...", isLoading = false }: ItemSelectorProps) => {
  const [items, setItems] = useState<Item[]>([]);
  const [isLoadingItems, setIsLoadingItems] = useState(false);
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  useEffect(() => {
    return () => {
      setOpen(false);
    };
  }, []);

  useEffect(() => {
    loadInitialItems();
  }, []);

  const loadInitialItems = async () => {
    setIsLoadingItems(true);
    try {
      console.log('Loading initial items...');
      
      const cached = await offlineStorage.getCachedData('items_page_1');
      if (cached && Array.isArray(cached) && cached.length > 0) {
        console.log('Loading items from cache:', cached.length);
        setItems(cached);
        setIsLoadingItems(false);
        return;
      }

      await fetchItems("");
    } catch (error) {
      console.error('Failed to load initial items:', error);
      setIsLoadingItems(false);
    }
  };

  const fetchItems = async (search: string = "") => {
    console.log('fetchItems called with search:', search);
    setIsLoadingItems(true);
    
    try {
      console.log('Fetching items from API, search:', search);
      const erpnextAPI = await createERPNextAPI();
      if (!erpnextAPI) {
        console.error('ERPNext API not configured');
        const cached = await offlineStorage.getCachedData('items_page_1');
        if (cached && Array.isArray(cached)) {
          setItems(cached);
        }
        setIsLoadingItems(false);
        return;
      }

      console.log('API search for items:', search);
      
      const result = await erpnextAPI.searchItems(search || "", 50);
      console.log('Item API result:', result);
      
      if (result && result.data) {
        const itemData: Item[] = result.data.map(item => ({
          name: item.name,
          item_code: item.item_code,
          item_name: item.item_name || item.item_code,
          stock_uom: item.stock_uom || 'Nos',
          description: item.description,
          has_serial_no: item.has_serial_no,
          has_batch_no: item.has_batch_no,
          item_group: item.item_group
        }));
        
        console.log('Setting items:', itemData.length);
        setItems(itemData);
        
        if (!search.trim()) {
          await offlineStorage.cacheData('items_page_1', itemData, 300000);
        }
      } else {
        console.log('No items found in API response');
        setItems([]);
      }
    } catch (error) {
      console.error('Failed to fetch items:', error);
      
      try {
        const cacheKey = search.trim() ? `items_search_${search}` : 'items_page_1';
        const cached = await offlineStorage.getCachedData(cacheKey);
        if (cached && Array.isArray(cached)) {
          console.log('Loading items from cache after error');
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
    const timeoutId = setTimeout(() => {
      if (searchValue !== undefined && searchValue.trim()) {
        fetchItems(searchValue);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchValue]);

  const handleItemSelect = (item: Item) => {
    console.log('Item selected:', item);
    setOpen(false);
    onItemSelect(item);
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
      <Popover open={open} onOpenChange={(newOpen) => {
        console.log('Item Popover open state changing:', newOpen);
        setOpen(newOpen);
      }}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between text-left h-auto min-h-[40px] py-2 px-3"
            disabled={isLoading}
            onClick={() => {
              console.log('Item Popover trigger clicked. Current open state:', open);
            }}
          >
            <div className="flex-1 min-w-0 text-left">
              <div className="truncate">
                {selectedItem 
                  ? selectedItem.item_name
                  : placeholder
                }
              </div>
              {selectedItem && (
                <div className="text-sm text-muted-foreground truncate">
                  {selectedItem.item_code}
                </div>
              )}
            </div>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0 bg-white border border-gray-200 shadow-lg z-[10000]" align="start">
          <Command shouldFilter={false}>
            <CommandInput 
              placeholder="Search items..." 
              value={searchValue}
              onValueChange={(value) => {
                console.log('Item Search value changing to:', value);
                setSearchValue(value);
              }}
            />
            <CommandList>
              <CommandEmpty>
                {isLoadingItems ? "Loading items..." : "No items found."}
              </CommandEmpty>
              {isLoadingItems && (
                <CommandGroup>
                  <div className="flex items-center justify-center p-4">
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    <span className="text-sm text-muted-foreground">Loading items...</span>
                  </div>
                </CommandGroup>
              )}
              {!isLoadingItems && filteredItems.length > 0 && (
                <CommandGroup>
                  {filteredItems.map((item) => {
                    console.log('Rendering item:', item.item_code, item.item_name);
                    return (
                      <CommandItem
                        key={item.name}
                        value={item.item_code}
                        onSelect={(currentValue) => {
                          console.log('Item CommandItem onSelect called with:', currentValue);
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
                            <div className="font-medium truncate">{item.item_name}</div>
                            <div className="text-sm text-muted-foreground truncate">{item.item_code}</div>
                            <div className="text-xs text-muted-foreground truncate">{item.stock_uom}</div>
                          </div>
                        </div>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default ItemSelector;

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Package, Loader2, Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { createERPNextAPI } from "@/services/erpnextApi";
import { offlineStorage } from "@/services/offlineStorage";

interface ItemInfo {
  name?: string;
  item_code: string;
  item_name: string;
  stock_uom: string;
}

interface ItemSelectorProps {
  onItemSelected: (item: ItemInfo) => void;
  isLoading: boolean;
}

const ItemSelector = ({ onItemSelected, isLoading }: ItemSelectorProps) => {
  const [items, setItems] = useState<ItemInfo[]>([]);
  const [isLoadingItems, setIsLoadingItems] = useState(false);
  const [open, setOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ItemInfo | null>(null);
  const [searchValue, setSearchValue] = useState("");
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    return () => {
      setOpen(false);
    };
  }, []);

  const searchItems = useMemo(() => {
    let timeoutId: NodeJS.Timeout;
    
    return (searchTerm: string, isNewSearch: boolean = false) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        fetchItems(searchTerm, isNewSearch);
      }, 300);
    };
  }, []);

  useEffect(() => {
    loadInitialItems();
  }, []);

  const loadInitialItems = async () => {
    try {
      console.log('Loading initial items for stock count...');
      const cached = await offlineStorage.getCachedData('items_page_1');
      if (cached && Array.isArray(cached) && cached.length > 0) {
        console.log('Loaded items from cache:', cached.length);
        setItems(cached);
        return;
      }
      await fetchItems("", true);
    } catch (error) {
      console.error('Failed to load initial items:', error);
    }
  };

  const loadCachedItems = async () => {
    try {
      const cached = await offlineStorage.getCachedData('items_page_1');
      if (cached && Array.isArray(cached)) {
        console.log('Setting cached items:', cached.length);
        setItems(cached);
      }
    } catch (error) {
      console.error('Failed to load cached items:', error);
    }
  };

  const fetchItems = async (search: string = "", isNewSearch: boolean = false) => {
    console.log('fetchItems called with search:', search, 'isNewSearch:', isNewSearch);
    setIsLoadingItems(true);
    
    try {
      const erpnextAPI = await createERPNextAPI();
      
      if (!erpnextAPI) {
        console.error('ERPNext API not configured');
        await loadCachedItems();
        return;
      }

      const pageToFetch = isNewSearch ? 1 : currentPage;
      const limit = 20;
      
      let result;
      
      console.log("Search:", search.trim());
      if (search.trim()) {
        result = await erpnextAPI.searchItems(search, limit);
      } else {
        result = await erpnextAPI.getItemsPaginated([], ['name', 'item_code', 'item_name', 'stock_uom'], limit, pageToFetch);
      }
      
      console.log('API result:', result);
      
      if (result && result.data) {
        const itemData = Array.isArray(result.data) ? result.data : [];
        if (!Array.isArray(result.data)) {
          console.error("Invalid data format:", result.data);
          return;
        }

        // Filter out items with missing essential properties and transform to ItemInfo
        const validItems = itemData
          .filter(item => {
            const isValid = item && (item.item_code || item.name) && (item.item_name || item.item_code || item.name);
            if (!isValid) {
              console.warn('Filtering out invalid item:', item);
            }
            return isValid;
          })
          .map(item => ({
            name: item.name,
            item_code: item.item_code || item.name || '',
            item_name: item.item_name || item.item_code || item.name || '',
            stock_uom: item.stock_uom || 'Nos'
          }));

        console.log("valid item data:", validItems.length, "out of", itemData.length);
        console.log('Sample items:', validItems.slice(0, 3));
        
        if (isNewSearch) {
          setItems(validItems);
          setCurrentPage(1);
          
          const cacheKey = search.trim() ? `items_search_${search}` : 'items_page_1';
          await offlineStorage.cacheData(cacheKey, validItems, 300000);
        } else {
          setItems(prev => [...prev, ...validItems]);
        }
        
        setHasMore(validItems.length === limit);
        
        if (!isNewSearch) {
          setCurrentPage(prev => prev + 1);
        }
      } else {
        console.log('No items found or invalid response');
        if (isNewSearch) {
          setItems([]);
        }
      }
    } catch (error) {
      console.error('Failed to fetch items:', error);
      
      try {
        const cacheKey = search.trim() ? `items_search_${search}` : 'items_page_1';
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
      searchItems(searchValue, true);
    } else {
      loadInitialItems();
    }
  }, [searchValue, searchItems]);

  const handleItemSelect = (item: ItemInfo) => {
    console.log('Item selected:', item);
    setSelectedItem(item);
    setOpen(false);
    onItemSelected(item);
  };

  const loadMoreItems = () => {
    if (hasMore && !isLoadingItems) {
      fetchItems(searchValue, false);
    }
  };

  const filteredItems = useMemo(() => {
    console.log('Filtering items. Total items:', items.length, 'Search value:', searchValue);
    if (!searchValue) return items;
    const lowercaseSearch = searchValue.toLowerCase();
    const filtered = items.filter(item => {
      // Search both item code and item name with null checks
      const itemCode = (item.item_code || '').toLowerCase();
      const itemName = (item.item_name || '').toLowerCase();
      return itemCode.includes(lowercaseSearch) || itemName.includes(lowercaseSearch);
    });
    console.log('Filtered items count:', filtered.length);
    return filtered;
  }, [items, searchValue]);

  console.log('Rendering Stock Count ItemSelector. Items count:', items.length, 'Filtered count:', filteredItems.length, 'Loading:', isLoadingItems);

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="item-search">Item Code / Name</Label>
        <div className="flex-1 min-w-0 mt-1">
          <Popover open={open} onOpenChange={(newOpen) => {
            console.log('Stock Count Popover open state changing:', newOpen);
            setOpen(newOpen);
          }}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={open}
                className="w-full justify-between text-left h-auto min-h-[40px] py-2 px-3"
                disabled={isLoadingItems || isLoading}
                onClick={() => {
                  console.log('Stock Count Popover trigger clicked. Current open state:', open);
                }}
              >
                <div className="flex-1 min-w-0 text-left">
                  {selectedItem ? (
                    <div>
                      <div className="font-medium truncate">
                        {selectedItem.item_name}
                      </div>
                      {selectedItem.item_name !== selectedItem.item_code && (
                        <div className="text-sm text-muted-foreground truncate">
                          {selectedItem.item_code}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="truncate text-muted-foreground">
                      Search item by code or name...
                    </div>
                  )}
                </div>
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0 bg-white border border-gray-200 shadow-lg z-[9999]" align="start">
              <Command shouldFilter={false}>
                <CommandInput 
                  placeholder="Search items..." 
                  value={searchValue}
                  onValueChange={(value) => {
                    console.log('Stock Count Search value changing to:', value);
                    setSearchValue(value);
                  }}
                />
                <CommandList>
                  <CommandEmpty>
                    {isLoadingItems ? "Loading items..." : "No items found."}
                  </CommandEmpty>
                  <CommandGroup>
                    {filteredItems.map((item) => {
                      const showSeparateCode = item.item_name !== item.item_code;
                      
                      console.log('Rendering stock count item:', {
                        item_code: item.item_code,
                        item_name: item.item_name,
                        stock_uom: item.stock_uom
                      });
                      
                      return (
                        <CommandItem
                          key={item.item_code}
                          value={item.item_code}
                          onSelect={(currentValue) => {
                            console.log('Stock Count CommandItem onSelect called with:', currentValue);
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
                              <div className="font-medium truncate text-gray-900">{item.item_name}</div>
                              {showSeparateCode && (
                                <div className="text-sm text-muted-foreground truncate">{item.item_code}</div>
                              )}
                              <div className="text-xs px-1 py-0.5 bg-gray-100 text-gray-600 rounded mt-1 inline-block">
                                {item.stock_uom}
                              </div>
                            </div>
                          </div>
                        </CommandItem>
                      );
                    })}
                    {hasMore && (
                      <CommandItem 
                        key="load-more"
                        value="load-more"
                        onSelect={loadMoreItems}
                      >
                        <div className="flex items-center justify-center w-full py-2">
                          {isLoadingItems ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <span className="text-sm text-muted-foreground">Load more items...</span>
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

export default ItemSelector;

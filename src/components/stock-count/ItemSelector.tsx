
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
  const [searchTerm, setSearchTerm] = useState("");
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  // Cleanup when component unmounts
  useEffect(() => {
    return () => {
      setOpen(false);
    };
  }, []);

  // Debounced search function
  const searchItems = useMemo(() => {
    let timeoutId: NodeJS.Timeout;
    
    return (searchValue: string, isNewSearch: boolean = false) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        fetchItems(searchValue, isNewSearch);
      }, 300);
    };
  }, []);

  // Load initial items and cached items
  useEffect(() => {
    loadInitialItems();
  }, []);

  const loadInitialItems = async () => {
    try {
      // First try to load from cache
      const cached = await offlineStorage.getCachedData('items_page_1');
      if (cached && Array.isArray(cached) && cached.length > 0) {
        setItems(cached);
        return;
      }

      // If no cache, fetch from API
      await fetchItems("", true);
    } catch (error) {
      console.error('Failed to load initial items:', error);
    }
  };

  const loadCachedItems = async () => {
    try {
      const cached = await offlineStorage.getCachedData('items_page_1');
      if (cached && Array.isArray(cached)) {
        setItems(cached);
      }
    } catch (error) {
      console.error('Failed to load cached items:', error);
    }
  };

  // Fetch items with search and pagination
  const fetchItems = async (search: string = "", isNewSearch: boolean = false) => {
    setIsLoadingItems(true);
    
    try {
      const erpnextAPI = await createERPNextAPI();
      
      if (!erpnextAPI) {
        console.error('ERPNext API not configured');
        // Try to load from cache if API is not available
        await loadCachedItems();
        return;
      }

      const pageToFetch = isNewSearch ? 1 : currentPage;
      const limit = 20;
      
      let result;
      
      console.log("Search:", search.trim());
      if (search.trim()) {
        // Use search method for better performance
        result = await erpnextAPI.searchItems(search, undefined, limit);
      } else {
        // Use paginated method for initial load
        result = await erpnextAPI.getItemsPaginated(undefined, ['item_code', 'item_name', 'stock_uom'], undefined, limit, pageToFetch);
      }
      
      if (result.data) {
        // const itemData = result.data;
        const itemData = Array.isArray(result.data) ? result.data : [];
        if (!Array.isArray(result.data)) {
          console.error("Invalid data format:", result.data);
          return;
        }
        

        console.log("item data:----->",itemData)
        
        if (isNewSearch) {
          setItems(itemData);
          setCurrentPage(1);
          
          // Cache the results
          const cacheKey = search.trim() ? `items_search_${search}` : 'items_page_1';
          await offlineStorage.cacheData(cacheKey, itemData, 300000); // 5 minutes
        } else {
          setItems(prev => [...prev, ...itemData]);
        }
        
        // Check if there are more items
        setHasMore(itemData.length === limit);
        
        if (!isNewSearch) {
          setCurrentPage(prev => prev + 1);
        }
      } else {
        if (isNewSearch) {
          setItems([]);
        }
      }
    } catch (error) {
      console.error('Failed to fetch items:', error);
      
      // Try to load from cache on error
      try {
        const cacheKey = search.trim() ? `items_search_${search}` : 'items_page_1';
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
      searchItems(searchTerm, true);
    } else {
      loadInitialItems();
    }
  }, [searchTerm, searchItems]);

  const handleItemSelect = (item: ItemInfo) => {
    setSelectedItem(item);
    setOpen(false);
    onItemSelected(item);
  };

  const loadMoreItems = () => {
    if (hasMore && !isLoadingItems) {
      fetchItems(searchTerm, false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="item-search">Item Code / Name</Label>
        <div className="flex-1 min-w-0 mt-1">
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={open}
                className="w-full justify-between text-left h-auto min-h-[40px] py-2 px-3"
                disabled={isLoadingItems || isLoading}
              >
                <div className="flex-1 min-w-0 text-left">
                  <div className="truncate">
                    {selectedItem 
                      ? selectedItem.item_code
                      : "Search item by code or name..."
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
            <PopoverContent className="w-full p-0 bg-white border border-gray-200 shadow-lg" align="start">
              <Command>
                <CommandInput 
                  placeholder="Search items..." 
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
                    {hasMore && (
                      <CommandItem onSelect={loadMoreItems}>
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

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

  // Remove automatic initial loading - only load when user searches
  // useEffect(() => {
  //   loadInitialItems();
  // }, []);

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
        setItems([]);
        setIsLoadingItems(false);
        return;
      }

      console.log('API search for items:', search);
      
      // Apply filters for stock items only and search
      const filters = [
        ['is_stock_item', '=', 1],
        ['disabled', '=', 0]
      ];

      // Add search filters if search term is provided
      const orFilters = search ? [
        ['item_code', 'like', `%${search}%`],
        ['item_name', 'like', `%${search}%`]
      ] : undefined;

      const params = new URLSearchParams({
        filters: JSON.stringify(filters),
        fields: JSON.stringify([
          'name',
          'item_code',
          'item_name',
          'stock_uom',
          'is_stock_item',
          'has_variants',
          'variant_of',
          'has_serial_no',
          'has_batch_no',
          'item_group'
        ]),
        limit_page_length: String(20) // Reduced from 50 to 20
      });

      if (orFilters) {
        params.append('or_filters', JSON.stringify(orFilters));
      }

      // Use centralized API instead of direct fetch
      const result = await erpnextAPI.callAPI('/api/resource/Item', 'GET', null, filters, 20, [
        'name',
        'item_code', 
        'item_name',
        'stock_uom',
        'is_stock_item',
        'has_variants',
        'variant_of',
        'has_serial_no',
        'has_batch_no',
        'item_group'
      ]);

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
        
        // Sort items by item_code
        itemData.sort((a, b) => a.item_code.localeCompare(b.item_code));
        
        console.log('Setting items:', itemData.length);
        setItems(itemData);
      } else {
        console.log('No items found in API response');
        setItems([]);
      }
    } catch (error) {
      console.error('Failed to fetch items:', error);
      setItems([]);
    } finally {
      setIsLoadingItems(false);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchValue && searchValue.trim().length >= 2) { // Only search when user types at least 2 characters
        fetchItems(searchValue);
      } else if (searchValue && searchValue.trim().length === 0) {
        setItems([]); // Clear items when search is cleared
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
    let result = items;
    
    if (searchValue) {
      const lowercaseSearch = searchValue.toLowerCase();
      result = items.filter(item => 
        item.item_code.toLowerCase().includes(lowercaseSearch) ||
        item.item_name.toLowerCase().includes(lowercaseSearch)
      );
    }
    
    // Always sort by item_code
    result.sort((a, b) => a.item_code.localeCompare(b.item_code));
    
    console.log('Filtered items count:', result.length);
    return result;
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
        <PopoverContent className="w-full p-0 bg-popover border border-border shadow-lg z-[10000]" align="start">
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
                {isLoadingItems ? "Loading items..." : searchValue && searchValue.trim().length >= 2 ? "No items found matching your search." : "Type at least 2 characters to search for items..."}
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
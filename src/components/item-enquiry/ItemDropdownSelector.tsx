
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Package, Loader2, Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { createERPNextAPI, getUserDefaultCompany } from "@/services/erpnextApi";
import { offlineStorage } from "@/services/offlineStorage";

interface ItemInfo {
  item_code: string;
  item_name: string;
  stock_uom: string;
  has_batch_no?: number;
  has_serial_no?: number;
}

interface ItemDropdownSelectorProps {
  onItemSelected: (itemCode: string) => void;
  isLoading: boolean;
}

const ItemDropdownSelector = ({ onItemSelected, isLoading }: ItemDropdownSelectorProps) => {
  const [items, setItems] = useState<ItemInfo[]>([]);
  const [isLoadingItems, setIsLoadingItems] = useState(false);
  const [open, setOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ItemInfo | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

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

      const defaultCompany = await getUserDefaultCompany();
      
      let result;
      if (search.trim()) {
        result = await erpnextAPI.searchItems(search, defaultCompany || undefined, 50);
      } else {
        result = await erpnextAPI.getItemsPaginated(undefined, ['item_code', 'item_name', 'stock_uom', 'has_batch_no', 'has_serial_no'], defaultCompany || undefined, 50, 1);
      }
      
      console.log('API result:', result);
      
      if (result && result.data) {
        const itemData: ItemInfo[] = result.data.map(item => ({
          item_code: item.item_code,
          item_name: item.item_name || item.item_code,
          stock_uom: item.stock_uom || 'Nos',
          has_batch_no: item.has_batch_no,
          has_serial_no: item.has_serial_no
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
      if (searchTerm !== undefined) {
        fetchItems(searchTerm);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const handleItemSelect = (item: ItemInfo) => {
    setSelectedItem(item);
    setOpen(false);
    onItemSelected(item.item_code);
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
                disabled={isLoading}
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
                  {isLoadingItems && (
                    <CommandGroup>
                      <div className="flex items-center justify-center p-4">
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        <span className="text-sm text-muted-foreground">Loading items...</span>
                      </div>
                    </CommandGroup>
                  )}
                  {!isLoadingItems && items.length > 0 && (
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

export default ItemDropdownSelector;

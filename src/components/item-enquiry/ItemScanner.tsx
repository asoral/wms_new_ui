
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Search, Scan, Loader2, Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { createERPNextAPI } from "@/services/erpnextApi";

interface ItemScannerProps {
  onItemScanned: (itemCode: string) => void;
  isLoading: boolean;
}

interface Item {
  item_code: string;
  item_name: string;
}

const ItemScanner = ({ onItemScanned, isLoading }: ItemScannerProps) => {
  const [itemCode, setItemCode] = useState("");
  const [items, setItems] = useState<Item[]>([]);
  const [isLoadingItems, setIsLoadingItems] = useState(false);
  const [open, setOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);

  // Fetch items from ERPNext for autocomplete
  useEffect(() => {
    const fetchItems = async () => {
      setIsLoadingItems(true);
      try {
        const erpnextAPI = await createERPNextAPI();
        if (erpnextAPI) {
          const result = await erpnextAPI.getItems([], ['item_code', 'item_name']);
          if (result.data) {
            setItems(result.data);
          }
        }
      } catch (error) {
        console.error('Failed to fetch items:', error);
      } finally {
        setIsLoadingItems(false);
      }
    };

    fetchItems();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const codeToSubmit = selectedItem?.item_code || itemCode.trim();
    if (codeToSubmit) {
      onItemScanned(codeToSubmit);
    }
  };

  const handleScan = () => {
    // In a real app, this would trigger camera/scanner
    console.log("Scanner activated");
    // For demo, we'll just use a mock scan
    const mockScanResult = "ITM-001";
    setItemCode(mockScanResult);
    onItemScanned(mockScanResult);
  };

  const handleItemSelect = (item: Item) => {
    setSelectedItem(item);
    setItemCode(item.item_code);
    setOpen(false);
  };

  const filteredItems = items.filter(item =>
    item.item_code.toLowerCase().includes(itemCode.toLowerCase()) ||
    item.item_name.toLowerCase().includes(itemCode.toLowerCase())
  );

  return (
    <Tabs defaultValue="manual" className="w-full">
      <TabsList className="grid w-full grid-cols-2 mb-4">
        <TabsTrigger value="manual">Manual Entry</TabsTrigger>
        <TabsTrigger value="scan">Scan Code</TabsTrigger>
      </TabsList>
      
      <TabsContent value="manual">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="itemCode">Item Code / Name</Label>
            <div className="flex space-x-2 mt-1">
              <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="flex-1 justify-between"
                    disabled={isLoadingItems}
                  >
                    {selectedItem 
                      ? `${selectedItem.item_code} - ${selectedItem.item_name}`
                      : itemCode || "Search item by code or name..."
                    }
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0">
                  <Command>
                    <CommandInput 
                      placeholder="Search items..." 
                      value={itemCode}
                      onValueChange={setItemCode}
                    />
                    <CommandList>
                      <CommandEmpty>
                        {isLoadingItems ? "Loading items..." : "No items found."}
                      </CommandEmpty>
                      <CommandGroup>
                        {filteredItems.slice(0, 50).map((item) => (
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
                            <div>
                              <div className="font-medium">{item.item_code}</div>
                              <div className="text-sm text-gray-500">{item.item_name}</div>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              <Button type="submit" disabled={isLoading || (!selectedItem && !itemCode.trim())}>
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
                Search
              </Button>
            </div>
          </div>
        </form>
      </TabsContent>
      
      <TabsContent value="scan">
        <div className="text-center space-y-4">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8">
            <Scan className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600 mb-4">Position item barcode in the scanner area</p>
            <Button onClick={handleScan} disabled={isLoading} size="lg">
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Scan className="w-4 h-4 mr-2" />
              )}
              Start Scanning
            </Button>
          </div>
        </div>
      </TabsContent>
    </Tabs>
  );
};

export default ItemScanner;

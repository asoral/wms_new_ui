import { useState, useEffect, useRef, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Search, Scan, Loader2, Check, ChevronsUpDown, X, Wifi, WifiOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { createERPNextAPI, getUserDefaultCompany } from "@/services/erpnextApi";
import { offlineStorage } from "@/services/offlineStorage";

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
  const [isScanning, setIsScanning] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Debounced search function
  const searchItems = useMemo(() => {
    let timeoutId: NodeJS.Timeout;
    
    return (searchValue: string, isNewSearch: boolean = false) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(async () => {
        await fetchItems(searchValue, isNewSearch);
      }, 300);
    };
  }, []);

  // Fetch items with search and pagination
  const fetchItems = async (search: string = "", isNewSearch: boolean = false) => {
    setIsLoadingItems(true);
    try {
      // Try to get cached items first if offline
      if (!isOnline) {
        const cachedItems = await offlineStorage.getCachedData('items_list');
        if (cachedItems) {
          let filteredItems = cachedItems;
          if (search.trim()) {
            filteredItems = cachedItems.filter((item: Item) => 
              item.item_code.toLowerCase().includes(search.toLowerCase()) ||
              item.item_name.toLowerCase().includes(search.toLowerCase())
            );
          }
          setItems(filteredItems.slice(0, 20)); // Show first 20 items
          setHasMore(filteredItems.length > 20);
          toast({
            title: "Offline Mode",
            description: "Showing cached items list",
            variant: "default"
          });
          return;
        } else {
          toast({
            title: "No Cached Data",
            description: "No items available offline. Please connect to internet.",
            variant: "destructive"
          });
          return;
        }
      }

      const erpnextAPI = await createERPNextAPI();
      if (erpnextAPI) {
        const defaultCompany = await getUserDefaultCompany();
        const pageToFetch = isNewSearch ? 1 : currentPage;
        
        // Build search filters
        let filters: any[] = [
          ['disabled', '=', 0] // Only enabled items
        ];
        
        if (search.trim()) {
          // Create OR condition for item_code and item_name search
          filters.push([
            ['item_code', 'like', `%${search}%`],
            'or',
            ['item_name', 'like', `%${search}%`]
          ]);
        }
        
        const result = await erpnextAPI.getItemsPaginated(
          filters,
          ['item_code', 'item_name', 'stock_uom'],
          defaultCompany || undefined,
          20, // limit per page
          pageToFetch
        );
        
        if (result.data) {
          if (isNewSearch) {
            setItems(result.data);
            setCurrentPage(1);
            
            // Cache all items for offline use (only if no search term to get full list)
            if (!search.trim()) {
              await offlineStorage.cacheData('items_list', result.data, 3600000); // Cache for 1 hour
            }
          } else {
            setItems(prev => [...prev, ...result.data]);
          }
          
          // Check if there are more items
          setHasMore(result.data.length === 20);
          
          if (!isNewSearch) {
            setCurrentPage(prev => prev + 1);
          }
        }
      } else {
        // Try to load from cache if API is not available
        try {
          const cachedItems = await offlineStorage.getCachedData('items_list');
          if (cachedItems) {
            let filteredItems = cachedItems;
            if (search.trim()) {
              filteredItems = cachedItems.filter((item: Item) => 
                item.item_code.toLowerCase().includes(search.toLowerCase()) ||
                item.item_name.toLowerCase().includes(search.toLowerCase())
              );
            }
            setItems(filteredItems.slice(0, 20));
            setHasMore(filteredItems.length > 20);
            toast({
              title: "API Not Available",
              description: "Showing cached items list. Please configure ERPNext settings.",
              variant: "default"
            });
          }
        } catch (cacheError) {
          console.error('Cache access failed:', cacheError);
        }
      }
    } catch (error) {
      console.error('Failed to fetch items:', error);
      
      // Try to load from cache if online request fails
      try {
        const cachedItems = await offlineStorage.getCachedData('items_list');
        if (cachedItems) {
          let filteredItems = cachedItems;
          if (search.trim()) {
            filteredItems = cachedItems.filter((item: Item) => 
              item.item_code.toLowerCase().includes(search.toLowerCase()) ||
              item.item_name.toLowerCase().includes(search.toLowerCase())
            );
          }
          setItems(filteredItems.slice(0, 20));
          setHasMore(filteredItems.length > 20);
          toast({
            title: "Using Cached Data",
            description: "Network error. Showing cached items list.",
            variant: "default"
          });
        }
      } catch (cacheError) {
        console.error('Cache access failed:', cacheError);
      }
    } finally {
      setIsLoadingItems(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchItems("", true);
  }, []);

  // Handle search term changes
  useEffect(() => {
    if (searchTerm !== itemCode) {
      searchItems(searchTerm, true);
    }
  }, [searchTerm, searchItems]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const codeToSubmit = selectedItem?.item_code || itemCode.trim();
    if (codeToSubmit) {
      onItemScanned(codeToSubmit);
    }
  };

  const startCamera = async () => {
    setIsScanning(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      toast({
        title: "Camera Error",
        description: "Camera access denied or not available. Please check permissions.",
        variant: "destructive"
      });
      setIsScanning(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsScanning(false);
  };

  const captureFrame = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    const context = canvas.getContext('2d');
    
    if (!context) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0);
    
    canvas.toBlob(async (blob) => {
      if (blob) {
        const mockBarcode = await simulateBarcodeDetection();
        if (mockBarcode) {
          setItemCode(mockBarcode);
          onItemScanned(mockBarcode);
          stopCamera();
        }
      }
    });
  };

  const simulateBarcodeDetection = async (): Promise<string | null> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        if (items.length > 0) {
          const randomItem = items[Math.floor(Math.random() * items.length)];
          resolve(randomItem.item_code);
        } else {
          resolve(null);
        }
      }, 1000);
    });
  };

  const handleScan = () => {
    if (isScanning) {
      captureFrame();
    } else {
      startCamera();
    }
  };

  const handleItemSelect = (item: Item) => {
    setSelectedItem(item);
    setItemCode(item.item_code);
    setOpen(false);
  };

  const loadMoreItems = () => {
    if (hasMore && !isLoadingItems && isOnline) {
      fetchItems(searchTerm, false);
    }
  };

  return (
    <Tabs defaultValue="manual" className="w-full">
      <TabsList className="grid w-full grid-cols-2 mb-4">
        <TabsTrigger value="manual">Manual Entry</TabsTrigger>
        <TabsTrigger value="scan">Scan Code</TabsTrigger>
      </TabsList>
      
      <TabsContent value="manual">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="itemCode" className="flex items-center gap-2">
              Item Code / Name
              {isOnline ? (
                <Wifi className="w-4 h-4 text-green-600" />
              ) : (
                <WifiOff className="w-4 h-4 text-red-600" />
              )}
            </Label>
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 mt-1">
              <div className="flex-1 min-w-0">
                <Popover open={open} onOpenChange={setOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={open}
                      className="w-full justify-between text-left h-auto min-h-[40px] py-2 px-3"
                      disabled={isLoadingItems}
                    >
                      <div className="flex-1 min-w-0 text-left">
                        <div className="truncate">
                          {selectedItem 
                            ? selectedItem.item_code
                            : itemCode || "Search item by code or name..."
                          }
                        </div>
                        {selectedItem && (
                          <div className="text-sm text-gray-500 truncate">
                            {selectedItem.item_name}
                          </div>
                        )}
                      </div>
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0 bg-white z-50">
                    <Command>
                      <CommandInput 
                        placeholder="Search items..." 
                        value={searchTerm}
                        onValueChange={(value) => {
                          setSearchTerm(value);
                          setItemCode(value);
                        }}
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
                              <div className="flex-1 min-w-0">
                                <div className="font-medium truncate">{item.item_code}</div>
                                <div className="text-sm text-gray-500 break-words">{item.item_name}</div>
                              </div>
                            </CommandItem>
                          ))}
                          {hasMore && isOnline && (
                            <CommandItem onSelect={loadMoreItems}>
                              <div className="flex items-center justify-center w-full py-2">
                                {isLoadingItems ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <span className="text-sm text-gray-500">Load more items...</span>
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
              <Button 
                type="submit" 
                disabled={isLoading || (!selectedItem && !itemCode.trim())}
                className="w-full sm:w-auto sm:min-w-[100px]"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
                <span className="ml-2 sm:inline">Search</span>
              </Button>
            </div>
          </div>
        </form>
      </TabsContent>
      
      <TabsContent value="scan">
        <div className="text-center space-y-4">
          {!isScanning ? (
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
          ) : (
            <div className="space-y-4">
              <div className="relative border-2 border-blue-500 rounded-lg overflow-hidden">
                <video
                  ref={videoRef}
                  className="w-full h-64 object-cover"
                  playsInline
                  muted
                />
                <div className="absolute inset-0 border-4 border-red-500 border-opacity-50 m-8"></div>
                <Button
                  onClick={stopCamera}
                  variant="outline"
                  size="icon"
                  className="absolute top-2 right-2 bg-white"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex space-x-2">
                <Button onClick={captureFrame} className="flex-1">
                  <Scan className="w-4 h-4 mr-2" />
                  Capture & Scan
                </Button>
                <Button onClick={stopCamera} variant="outline">
                  Cancel
                </Button>
              </div>
              <canvas ref={canvasRef} className="hidden" />
            </div>
          )}
        </div>
      </TabsContent>
    </Tabs>
  );
};

export default ItemScanner;

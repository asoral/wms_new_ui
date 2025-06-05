
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Search, Scan, Loader2, Check, ChevronsUpDown, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { createERPNextAPI, getUserDefaultCompany } from "@/services/erpnextApi";

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
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Fetch all enabled items from ERPNext for autocomplete with company filter
  useEffect(() => {
    const fetchItems = async () => {
      setIsLoadingItems(true);
      try {
        const erpnextAPI = await createERPNextAPI();
        if (erpnextAPI) {
          const defaultCompany = await getUserDefaultCompany();
          
          // Fetch all enabled items without pagination limits
          const result = await erpnextAPI.getAllEnabledItems(defaultCompany || undefined);
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

  const startCamera = async () => {
    setIsScanning(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' } // Use back camera if available
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      alert('Camera access denied or not available. Please check permissions.');
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
    
    // Convert canvas to blob and process for barcode detection
    canvas.toBlob(async (blob) => {
      if (blob) {
        // For now, we'll use a simple mock implementation
        // In a real app, you'd use a barcode detection library like QuaggaJS or ZXing
        const mockBarcode = await simulateBarcodeDetection();
        if (mockBarcode) {
          setItemCode(mockBarcode);
          onItemScanned(mockBarcode);
          stopCamera();
        }
      }
    });
  };

  // Mock barcode detection for demonstration
  const simulateBarcodeDetection = async (): Promise<string | null> => {
    // This is a mock implementation
    // In reality, you'd use a barcode scanning library
    return new Promise((resolve) => {
      setTimeout(() => {
        // Return a random item code from the items list for demonstration
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
                    className="flex-1 justify-between text-left h-auto min-h-[40px] py-2 px-3"
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
                            <div className="flex-1 min-w-0">
                              <div className="font-medium truncate">{item.item_code}</div>
                              <div className="text-sm text-gray-500 break-words">{item.item_name}</div>
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

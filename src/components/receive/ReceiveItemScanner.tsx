
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, ScanBarcode } from "lucide-react";
import { POItem } from "../../pages/Receive";
import CameraScanner from "../item-enquiry/CameraScanner";

interface ReceiveItemScannerProps {
  poItems: POItem[];
  onItemScanned: (itemCode: string) => void;
  isLoading: boolean;
}

const ReceiveItemScanner = ({ poItems, onItemScanned, isLoading }: ReceiveItemScannerProps) => {
  const [activeTab, setActiveTab] = useState("manual");
  const [showCamera, setShowCamera] = useState(false);
  const [selectedItem, setSelectedItem] = useState("");

  // Filter to only show items with pending quantity
  const availableItems = poItems.filter(item => item.pendingQty > 0);

  const handleItemSelected = (itemCode: string) => {
    setSelectedItem(itemCode);
    onItemScanned(itemCode);
  };

  const handleBarcodeScanned = (code: string) => {
    console.log('Barcode scanned in ReceiveItemScanner:', code);
    // Check if the scanned code matches any PO item
    const matchingItem = availableItems.find(item => 
      item.itemCode === code || item.itemName.toLowerCase().includes(code.toLowerCase())
    );
    
    if (matchingItem) {
      onItemScanned(matchingItem.itemCode);
    } else {
      onItemScanned(code); // Let parent handle if not found in PO
    }
    setShowCamera(false);
    setActiveTab("manual");
  };

  const startScanning = () => {
    setShowCamera(true);
  };

  const stopScanning = () => {
    setShowCamera(false);
  };

  return (
    <div className="w-full space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="manual" className="flex items-center space-x-2">
            <Search className="w-4 h-4" />
            <span>Manual Entry</span>
          </TabsTrigger>
          <TabsTrigger value="scan" className="flex items-center space-x-2">
            <ScanBarcode className="w-4 h-4" />
            <span>Scan Barcode</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="manual" className="mt-4">
          <div className="space-y-2">
            <Label htmlFor="item-select">Item Code / Name</Label>
            <Select 
              value={selectedItem} 
              onValueChange={handleItemSelected}
              disabled={isLoading}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select an item to receive..." />
              </SelectTrigger>
              <SelectContent>
                {availableItems.map((item) => (
                  <SelectItem key={item.itemCode} value={item.itemCode}>
                    <div className="flex flex-col">
                      <span className="font-medium">{item.itemName}</span>
                      <span className="text-sm text-gray-500">
                        {item.itemCode} - Pending: {item.pendingQty} {item.uom}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </TabsContent>

        <TabsContent value="scan" className="mt-4">
          {!showCamera ? (
            <div className="text-center space-y-4">
              <div className="p-8 border-2 border-dashed border-gray-300 rounded-lg">
                <ScanBarcode className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Scan Item Barcode
                </h3>
                <p className="text-gray-600 mb-6">
                  Use your camera to scan an item barcode from the Purchase Order
                </p>
                <Button 
                  onClick={startScanning}
                  disabled={isLoading}
                  className="flex items-center space-x-2"
                >
                  <ScanBarcode className="w-4 h-4" />
                  <span>Start Camera</span>
                </Button>
              </div>
            </div>
          ) : (
            <CameraScanner
              onBarcodeScanned={handleBarcodeScanned}
              onClose={stopScanning}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ReceiveItemScanner;

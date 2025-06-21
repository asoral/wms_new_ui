
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Search, ScanBarcode } from "lucide-react";
import { POItem } from "../../pages/Receive";
import CameraScanner from "../item-enquiry/CameraScanner";
import ItemSelector from "../item-enquiry/ItemSelector";

interface ReceiveItemScannerProps {
  poItems: POItem[];
  onItemScanned: (itemCode: string) => void;
  isLoading: boolean;
}

const ReceiveItemScanner = ({ poItems, onItemScanned, isLoading }: ReceiveItemScannerProps) => {
  const [activeTab, setActiveTab] = useState("manual");
  const [showCamera, setShowCamera] = useState(false);

  // Filter to only show items with pending quantity
  const availableItems = poItems.filter(item => item.pendingQty > 0);

  const handleItemSelected = (itemCode: string) => {
    // Check if the selected item is in the PO and has pending quantity
    const matchingItem = availableItems.find(item => item.itemCode === itemCode);
    
    if (matchingItem) {
      onItemScanned(itemCode);
    } else {
      // If not found in PO items, still pass it to parent to handle
      onItemScanned(itemCode);
    }
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
          <ItemSelector 
            onItemSelected={handleItemSelected}
            isLoading={isLoading}
          />
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

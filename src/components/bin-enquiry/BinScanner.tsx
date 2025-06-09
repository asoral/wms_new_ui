
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Camera, Search } from "lucide-react";
import WarehouseSelector from "./WarehouseSelector";
import CameraScanner from "./CameraScanner";

interface BinScannerProps {
  onBinScanned: (binCode: string) => void;
  isLoading: boolean;
}

const BinScanner = ({ onBinScanned, isLoading }: BinScannerProps) => {
  const [activeTab, setActiveTab] = useState("manual");
  const [showCamera, setShowCamera] = useState(false);

  const handleWarehouseSelected = (warehouseCode: string) => {
    onBinScanned(warehouseCode);
  };

  const handleBarcodeDetected = (code: string) => {
    console.log('Barcode detected in BinScanner:', code);
    onBinScanned(code);
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
            <Camera className="w-4 h-4" />
            <span>Scan Barcode</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="manual" className="mt-4">
          <WarehouseSelector 
            onWarehouseSelected={handleWarehouseSelected}
            isLoading={isLoading}
          />
        </TabsContent>

        <TabsContent value="scan" className="mt-4">
          {!showCamera ? (
            <div className="text-center space-y-4">
              <div className="p-8 border-2 border-dashed border-gray-300 rounded-lg">
                <Camera className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Scan Warehouse Barcode
                </h3>
                <p className="text-gray-600 mb-6">
                  Use your camera to scan a warehouse or bin barcode
                </p>
                <Button 
                  onClick={startScanning}
                  disabled={isLoading}
                  className="flex items-center space-x-2"
                >
                  <Camera className="w-4 h-4" />
                  <span>Start Camera</span>
                </Button>
              </div>
            </div>
          ) : (
            <CameraScanner
              onBarcodeDetected={handleBarcodeDetected}
              isActive={showCamera}
              onClose={stopScanning}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BinScanner;

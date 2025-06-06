
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Scan, Loader2 } from "lucide-react";
import WarehouseSelector from "./WarehouseSelector";

interface BinScannerProps {
  onBinScanned: (binCode: string) => void;
  isLoading: boolean;
}

const BinScanner = ({ onBinScanned, isLoading }: BinScannerProps) => {
  const [binCode, setBinCode] = useState("");
  const [isScanning, setIsScanning] = useState(false);

  const handleScan = () => {
    setIsScanning(true);
    console.log("Scanner activated");
    
    // Simulate barcode scan
    setTimeout(() => {
      const scannedCode = "WH-001-A1";
      setBinCode(scannedCode);
      onBinScanned(scannedCode);
      setIsScanning(false);
    }, 2000);
  };

  const handleWarehouseSelected = (warehouseCode: string) => {
    onBinScanned(warehouseCode);
  };

  return (
    <Tabs defaultValue="warehouse" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="warehouse">Select Warehouse</TabsTrigger>
        <TabsTrigger value="scan">Barcode Scanner</TabsTrigger>
      </TabsList>

      <TabsContent value="warehouse" className="space-y-4">
        <WarehouseSelector 
          onWarehouseSelected={handleWarehouseSelected}
          isLoading={isLoading}
        />
      </TabsContent>

      <TabsContent value="scan" className="space-y-4">
        <div className="text-center space-y-4">
          <p className="text-gray-600">Click the button below to activate the barcode scanner</p>
          <Button 
            onClick={handleScan} 
            disabled={isScanning || isLoading}
            size="lg"
            className="w-full"
          >
            {isScanning ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Scanning...
              </>
            ) : (
              <>
                <Scan className="w-4 h-4 mr-2" />
                Start Scanning
              </>
            )}
          </Button>
          {binCode && (
            <div className="mt-4 p-3 bg-green-50 rounded-lg">
              <p className="text-sm text-green-600">Last scanned: {binCode}</p>
            </div>
          )}
        </div>
      </TabsContent>
    </Tabs>
  );
};

export default BinScanner;


import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Scan, Search, Loader2 } from "lucide-react";

interface BinScannerProps {
  onBinScanned: (binCode: string) => void;
  isLoading: boolean;
}

const BinScanner = ({ onBinScanned, isLoading }: BinScannerProps) => {
  const [binCode, setBinCode] = useState("");
  const [isScanning, setIsScanning] = useState(false);

  const handleManualSearch = () => {
    if (binCode.trim()) {
      onBinScanned(binCode.trim());
    }
  };

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

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleManualSearch();
    }
  };

  return (
    <Tabs defaultValue="manual" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="manual">Manual Entry</TabsTrigger>
        <TabsTrigger value="scan">Barcode Scanner</TabsTrigger>
      </TabsList>

      <TabsContent value="manual" className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="binCode">Bin/Warehouse Code</Label>
          <div className="flex space-x-2">
            <Input
              id="binCode"
              placeholder="Enter bin or warehouse code..."
              value={binCode}
              onChange={(e) => setBinCode(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isLoading}
            />
            <Button 
              onClick={handleManualSearch} 
              disabled={!binCode.trim() || isLoading}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
              Search
            </Button>
          </div>
        </div>
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


import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Scan } from "lucide-react";

interface PalletScannerProps {
  onPalletScanned: (palletCode: string) => void;
}

const PalletScanner = ({ onPalletScanned }: PalletScannerProps) => {
  const [palletCode, setPalletCode] = useState("");
  const [isScanning, setIsScanning] = useState(false);

  const handleScan = () => {
    setIsScanning(true);
    // Simulate barcode scan
    setTimeout(() => {
      const scannedCode = "PLT-2025-00001";
      setPalletCode(scannedCode);
      onPalletScanned(scannedCode);
      setIsScanning(false);
    }, 2000);
  };

  const handleManualEntry = () => {
    if (palletCode.trim()) {
      onPalletScanned(palletCode);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <Button 
          onClick={handleScan}
          disabled={isScanning}
          className="flex items-center space-x-2"
        >
          <Scan className="w-4 h-4" />
          <span>{isScanning ? "Scanning..." : "Scan Pallet"}</span>
        </Button>
        <span className="text-sm text-gray-500 self-center">or</span>
        <div className="flex-1 space-y-2">
          <Label htmlFor="palletCode">Enter Pallet Code</Label>
          <div className="flex gap-2">
            <Input
              id="palletCode"
              placeholder="PLT-2025-00001"
              value={palletCode}
              onChange={(e) => setPalletCode(e.target.value)}
              className="flex-1"
            />
            <Button onClick={handleManualEntry} disabled={!palletCode.trim()}>
              Load
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PalletScanner;

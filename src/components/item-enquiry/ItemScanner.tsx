
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Scan, X } from "lucide-react";

interface ItemScannerProps {
  onBarcodeScanned: (barcode: string) => Promise<void>;
  isLoading: boolean;
}

const ItemScanner = ({ onBarcodeScanned, isLoading }: ItemScannerProps) => {
  const [barcode, setBarcode] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (barcode.trim()) {
      await onBarcodeScanned(barcode.trim());
      setBarcode("");
    }
  };

  const handleClear = () => {
    setBarcode("");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Barcode Scanner</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="barcode">Barcode</Label>
            <Input
              id="barcode"
              type="text"
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              placeholder="Scan or enter barcode"
              disabled={isLoading}
            />
          </div>
          <div className="flex space-x-2">
            <Button type="submit" disabled={!barcode.trim() || isLoading}>
              <Scan className="w-4 h-4 mr-2" />
              {isLoading ? "Searching..." : "Search"}
            </Button>
            <Button type="button" variant="secondary" onClick={handleClear}>
              <X className="w-4 h-4 mr-2" />
              Clear
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default ItemScanner;


import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Scan, Loader2 } from "lucide-react";

interface ItemScannerProps {
  onItemScanned: (itemCode: string) => void;
  isLoading: boolean;
}

const ItemScanner = ({ onItemScanned, isLoading }: ItemScannerProps) => {
  const [itemCode, setItemCode] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (itemCode.trim()) {
      onItemScanned(itemCode.trim());
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

  return (
    <Tabs defaultValue="manual" className="w-full">
      <TabsList className="grid w-full grid-cols-2 mb-4">
        <TabsTrigger value="manual">Manual Entry</TabsTrigger>
        <TabsTrigger value="scan">Scan Code</TabsTrigger>
      </TabsList>
      
      <TabsContent value="manual">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="itemCode">Item Code</Label>
            <div className="flex space-x-2 mt-1">
              <Input
                id="itemCode"
                placeholder="Enter item code..."
                value={itemCode}
                onChange={(e) => setItemCode(e.target.value)}
                className="flex-1"
              />
              <Button type="submit" disabled={isLoading || !itemCode.trim()}>
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


import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Scan, Plus, Loader2 } from "lucide-react";
import ItemSelector from "./ItemSelector";

interface ItemInfo {
  item_code: string;
  item_name: string;
  stock_uom: string;
}

interface StockCountFormProps {
  onAddEntry: (entry: {
    itemCode: string;
    itemName: string;
    warehouse: string;
    batch?: string;
    serial?: string;
    systemQty: number;
    scannedQty: number;
    uom: string;
  }) => void;
}

const StockCountForm = ({ onAddEntry }: StockCountFormProps) => {
  const [formData, setFormData] = useState({
    warehouse: 'Main Store',
    batch: '',
    serial: '',
    scannedQty: 0
  });
  const [isScanning, setIsScanning] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ItemInfo | null>(null);

  const mockSystemQtyLookup = (itemCode: string) => {
    // This would typically fetch from ERPNext API
    return Math.floor(Math.random() * 200) + 50;
  };

  const handleItemScan = () => {
    setIsScanning(true);
    
    setTimeout(() => {
      const scannedItem = {
        item_code: "ITM-001",
        item_name: "Sample Scanned Item",
        stock_uom: "Nos"
      };
      setSelectedItem(scannedItem);
      setIsScanning(false);
    }, 2000);
  };

  const handleItemSelected = (item: ItemInfo) => {
    setSelectedItem(item);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedItem) return;

    const systemQty = mockSystemQtyLookup(selectedItem.item_code);

    onAddEntry({
      itemCode: selectedItem.item_code,
      itemName: selectedItem.item_name,
      warehouse: formData.warehouse,
      batch: formData.batch || undefined,
      serial: formData.serial || undefined,
      systemQty,
      scannedQty: formData.scannedQty,
      uom: selectedItem.stock_uom
    });

    // Reset form
    setFormData({
      warehouse: 'Main Store',
      batch: '',
      serial: '',
      scannedQty: 0
    });
    setSelectedItem(null);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Item Selection */}
      <Card>
        <CardContent className="pt-6">
          <Tabs defaultValue="manual" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="manual">Manual Entry</TabsTrigger>
              <TabsTrigger value="scan">Scan Item</TabsTrigger>
            </TabsList>

            <TabsContent value="manual" className="space-y-4">
              <ItemSelector 
                onItemSelected={handleItemSelected}
                isLoading={false}
              />
            </TabsContent>

            <TabsContent value="scan" className="space-y-4">
              <div className="text-center">
                <Button 
                  type="button"
                  onClick={handleItemScan} 
                  disabled={isScanning}
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
                      Scan Item
                    </>
                  )}
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Item Details */}
      {selectedItem && (
        <Card className="bg-blue-50">
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <Label>Item Name</Label>
                <p className="font-medium">{selectedItem.item_name}</p>
              </div>
              <div>
                <Label>System Qty</Label>
                <p className="font-medium">{mockSystemQtyLookup(selectedItem.item_code)} {selectedItem.stock_uom}</p>
              </div>
              <div>
                <Label>UOM</Label>
                <p className="font-medium">{selectedItem.stock_uom}</p>
              </div>
              <div>
                <Label>Warehouse</Label>
                <p className="font-medium">{formData.warehouse}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Additional Fields */}
      {selectedItem && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="batch">Batch Number (Optional)</Label>
            <Input
              id="batch"
              value={formData.batch}
              onChange={(e) => setFormData(prev => ({ ...prev, batch: e.target.value }))}
              placeholder="Enter batch number..."
            />
          </div>
          <div>
            <Label htmlFor="serial">Serial Number (Optional)</Label>
            <Input
              id="serial"
              value={formData.serial}
              onChange={(e) => setFormData(prev => ({ ...prev, serial: e.target.value }))}
              placeholder="Enter serial number..."
            />
          </div>
          <div>
            <Label htmlFor="scannedQty">Actual Quantity *</Label>
            <Input
              id="scannedQty"
              type="number"
              value={formData.scannedQty}
              onChange={(e) => setFormData(prev => ({ ...prev, scannedQty: Number(e.target.value) }))}
              placeholder="Enter actual quantity..."
              required
            />
          </div>
        </div>
      )}

      {/* Submit */}
      {selectedItem && (
        <Button type="submit" className="w-full">
          <Plus className="w-4 h-4 mr-2" />
          Add to Count
        </Button>
      )}
    </form>
  );
};

export default StockCountForm;

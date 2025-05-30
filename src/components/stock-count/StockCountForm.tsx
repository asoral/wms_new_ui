
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Scan, Plus, Loader2 } from "lucide-react";

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
    itemCode: '',
    warehouse: 'Main Store',
    batch: '',
    serial: '',
    scannedQty: 0
  });
  const [isScanning, setIsScanning] = useState(false);
  const [itemDetails, setItemDetails] = useState<any>(null);

  const mockItemLookup = (itemCode: string) => {
    return {
      itemName: 'Sample Item',
      systemQty: 100,
      uom: 'Nos'
    };
  };

  const handleItemScan = () => {
    setIsScanning(true);
    
    setTimeout(() => {
      const scannedItem = "ITM-001";
      setFormData(prev => ({ ...prev, itemCode: scannedItem }));
      setItemDetails(mockItemLookup(scannedItem));
      setIsScanning(false);
    }, 2000);
  };

  const handleItemLookup = () => {
    if (formData.itemCode) {
      setItemDetails(mockItemLookup(formData.itemCode));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!itemDetails || !formData.itemCode) return;

    onAddEntry({
      itemCode: formData.itemCode,
      itemName: itemDetails.itemName,
      warehouse: formData.warehouse,
      batch: formData.batch || undefined,
      serial: formData.serial || undefined,
      systemQty: itemDetails.systemQty,
      scannedQty: formData.scannedQty,
      uom: itemDetails.uom
    });

    // Reset form
    setFormData({
      itemCode: '',
      warehouse: 'Main Store',
      batch: '',
      serial: '',
      scannedQty: 0
    });
    setItemDetails(null);
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
              <div className="flex space-x-2">
                <div className="flex-1">
                  <Label htmlFor="itemCode">Item Code</Label>
                  <Input
                    id="itemCode"
                    value={formData.itemCode}
                    onChange={(e) => setFormData(prev => ({ ...prev, itemCode: e.target.value }))}
                    placeholder="Enter item code..."
                  />
                </div>
                <div className="pt-6">
                  <Button type="button" onClick={handleItemLookup}>
                    Lookup
                  </Button>
                </div>
              </div>
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
      {itemDetails && (
        <Card className="bg-blue-50">
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <Label>Item Name</Label>
                <p className="font-medium">{itemDetails.itemName}</p>
              </div>
              <div>
                <Label>System Qty</Label>
                <p className="font-medium">{itemDetails.systemQty} {itemDetails.uom}</p>
              </div>
              <div>
                <Label>UOM</Label>
                <p className="font-medium">{itemDetails.uom}</p>
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
      {itemDetails && (
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
      {itemDetails && (
        <Button type="submit" className="w-full">
          <Plus className="w-4 h-4 mr-2" />
          Add to Count
        </Button>
      )}
    </form>
  );
};

export default StockCountForm;

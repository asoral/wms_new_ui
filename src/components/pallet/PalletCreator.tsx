import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Scan, Plus, Trash2, Package } from "lucide-react";
import { PalletItem } from "../../pages/Pallet";

const PalletCreator = () => {
  const [items, setItems] = useState<PalletItem[]>([]);
  const [currentItem, setCurrentItem] = useState({
    itemCode: "",
    itemName: "",
    qty: 1,
    uom: "Nos",
    batchNo: "",
    serialNo: "",
    warehouse: ""
  });
  const [isScanning, setIsScanning] = useState(false);

  const warehouses = [
    "Main Store",
    "Raw Material Store", 
    "Finished Goods Store",
    "Quality Store",
    "Packaging Store"
  ];

  const handleScanItem = () => {
    setIsScanning(true);
    // Simulate barcode scan
    setTimeout(() => {
      setCurrentItem({
        ...currentItem,
        itemCode: "ITM-001",
        itemName: "Laptop Dell Inspiron",
        uom: "Nos"
      });
      setIsScanning(false);
    }, 2000);
  };

  const handleAddItem = () => {
    if (currentItem.itemCode && currentItem.warehouse) {
      setItems([...items, { ...currentItem }]);
      setCurrentItem({
        itemCode: "",
        itemName: "",
        qty: 1,
        uom: "Nos",
        batchNo: "",
        serialNo: "",
        warehouse: currentItem.warehouse // Keep same warehouse
      });
    }
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleCreatePallet = () => {
    if (items.length > 0) {
      const palletId = `PLT-2025-${String(Math.floor(Math.random() * 100000)).padStart(5, '0')}`;
      console.log("Creating pallet:", palletId, items);
      alert(`Pallet ${palletId} created successfully!`);
      setItems([]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Add Item Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Plus className="w-5 h-5" />
            <span>Add Items to Pallet</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <Button 
              onClick={handleScanItem}
              disabled={isScanning}
              className="flex items-center space-x-2"
            >
              <Scan className="w-4 h-4" />
              <span>{isScanning ? "Scanning..." : "Scan Item"}</span>
            </Button>
            <span className="text-sm text-gray-500 self-center hidden sm:block">or enter manually</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="itemCode">Item Code</Label>
              <Input
                id="itemCode"
                placeholder="ITM-001"
                value={currentItem.itemCode}
                onChange={(e) => setCurrentItem({...currentItem, itemCode: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="itemName">Item Name</Label>
              <Input
                id="itemName"
                placeholder="Item Name"
                value={currentItem.itemName}
                onChange={(e) => setCurrentItem({...currentItem, itemName: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="qty">Quantity</Label>
              <Input
                id="qty"
                type="number"
                min="1"
                value={currentItem.qty}
                onChange={(e) => setCurrentItem({...currentItem, qty: parseInt(e.target.value)})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="uom">UOM</Label>
              <Input
                id="uom"
                placeholder="Nos"
                value={currentItem.uom}
                onChange={(e) => setCurrentItem({...currentItem, uom: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="batchNo">Batch No (Optional)</Label>
              <Input
                id="batchNo"
                placeholder="BATCH-001"
                value={currentItem.batchNo}
                onChange={(e) => setCurrentItem({...currentItem, batchNo: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="serialNo">Serial No (Optional)</Label>
              <Input
                id="serialNo"
                placeholder="SRL-001"
                value={currentItem.serialNo}
                onChange={(e) => setCurrentItem({...currentItem, serialNo: e.target.value})}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="warehouse">Warehouse</Label>
            <Select value={currentItem.warehouse} onValueChange={(value) => setCurrentItem({...currentItem, warehouse: value})}>
              <SelectTrigger>
                <SelectValue placeholder="Select warehouse" />
              </SelectTrigger>
              <SelectContent>
                {warehouses.map((warehouse) => (
                  <SelectItem key={warehouse} value={warehouse}>
                    {warehouse}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button 
            onClick={handleAddItem}
            disabled={!currentItem.itemCode || !currentItem.warehouse}
            className="w-full"
          >
            Add Item to Pallet
          </Button>
        </CardContent>
      </Card>

      {/* Items in Pallet */}
      {items.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Items in Pallet ({items.length})</span>
              <Button onClick={handleCreatePallet} className="flex items-center space-x-2">
                <Package className="w-4 h-4" />
                <span>Create Pallet</span>
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {items.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <h4 className="font-medium">{item.itemCode}</h4>
                      <span className="text-sm text-gray-600">{item.itemName}</span>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-1">
                      <span className="text-sm font-medium">{item.qty} {item.uom}</span>
                      <span className="text-sm text-gray-600">{item.warehouse}</span>
                      {item.batchNo && (
                        <Badge variant="outline" className="text-xs">Batch: {item.batchNo}</Badge>
                      )}
                      {item.serialNo && (
                        <Badge variant="outline" className="text-xs">Serial: {item.serialNo}</Badge>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRemoveItem(index)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {items.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">No items added yet. Scan or add items to create a new pallet.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PalletCreator;

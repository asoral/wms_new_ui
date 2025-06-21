
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Scan, Plus, Save } from "lucide-react";
import { StockCount, StockCountItem } from "../../pages/StockCount";

interface StockCountFormProps {
  initialData?: StockCount | null;
  onSave: (count: StockCount) => void;
  onCancel: () => void;
}

const StockCountForm = ({ initialData, onSave, onCancel }: StockCountFormProps) => {
  const [formData, setFormData] = useState({
    warehouse: initialData?.warehouse || "",
    countDate: initialData?.countDate || new Date().toISOString().split('T')[0],
    countedBy: initialData?.countedBy || "",
    remarks: ""
  });

  const [items, setItems] = useState<StockCountItem[]>(initialData?.items || []);
  const [currentItem, setCurrentItem] = useState({
    itemCode: "",
    currentQty: 0,
    countedQty: 0
  });

  const warehouses = [
    "Main Store",
    "Raw Material Store", 
    "Finished Goods Store",
    "Quality Store",
    "Packaging Store"
  ];

  const handleScanItem = () => {
    // Simulate scanning
    setCurrentItem({
      ...currentItem,
      itemCode: "ITM-001",
      currentQty: 10
    });
  };

  const handleAddItem = () => {
    if (currentItem.itemCode) {
      const newItem: StockCountItem = {
        itemCode: currentItem.itemCode,
        itemName: "Sample Item", // Would be fetched from API
        warehouse: formData.warehouse,
        currentQty: currentItem.currentQty,
        countedQty: currentItem.countedQty,
        difference: currentItem.countedQty - currentItem.currentQty,
        uom: "Nos"
      };

      setItems([...items, newItem]);
      setCurrentItem({ itemCode: "", currentQty: 0, countedQty: 0 });
    }
  };

  const handleSave = () => {
    const stockCount: StockCount = {
      id: initialData?.id || `SC-${Date.now()}`,
      number: initialData?.number || `Stock-Count-${Date.now()}`,
      warehouse: formData.warehouse,
      status: "draft",
      countDate: formData.countDate,
      countedBy: formData.countedBy,
      items: items,
      totalItems: items.length,
      completionPercentage: items.length > 0 ? 100 : 0
    };

    onSave(stockCount);
  };

  return (
    <div className="space-y-6">
      {/* Count Details */}
      <Card>
        <CardHeader>
          <CardTitle>Stock Count Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="warehouse">Warehouse</Label>
              <Select value={formData.warehouse} onValueChange={(value) => setFormData({...formData, warehouse: value})}>
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

            <div>
              <Label htmlFor="countDate">Count Date</Label>
              <Input
                id="countDate"
                type="date"
                value={formData.countDate}
                onChange={(e) => setFormData({...formData, countDate: e.target.value})}
              />
            </div>

            <div>
              <Label htmlFor="countedBy">Counted By</Label>
              <Input
                id="countedBy"
                value={formData.countedBy}
                onChange={(e) => setFormData({...formData, countedBy: e.target.value})}
                placeholder="Enter counter name"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add Items */}
      <Card>
        <CardHeader>
          <CardTitle>Add Items to Count</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="itemCode">Item Code</Label>
              <div className="flex space-x-2">
                <Input
                  id="itemCode"
                  value={currentItem.itemCode}
                  onChange={(e) => setCurrentItem({...currentItem, itemCode: e.target.value})}
                  placeholder="Scan or enter"
                />
                <Button type="button" variant="outline" onClick={handleScanItem}>
                  <Scan className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div>
              <Label htmlFor="currentQty">System Qty</Label>
              <Input
                id="currentQty"
                type="number"
                value={currentItem.currentQty}
                onChange={(e) => setCurrentItem({...currentItem, currentQty: parseInt(e.target.value) || 0})}
                readOnly
              />
            </div>

            <div>
              <Label htmlFor="countedQty">Counted Qty</Label>
              <Input
                id="countedQty"
                type="number"
                value={currentItem.countedQty}
                onChange={(e) => setCurrentItem({...currentItem, countedQty: parseInt(e.target.value) || 0})}
                placeholder="Enter counted qty"
              />
            </div>

            <div className="flex items-end">
              <Button onClick={handleAddItem} disabled={!currentItem.itemCode} className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Add Item
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Items List */}
      {items.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Items to Count ({items.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {items.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium">{item.itemCode}</h4>
                    <p className="text-sm text-gray-600">{item.itemName}</p>
                    <div className="flex items-center space-x-4 mt-1">
                      <span className="text-sm">System: {item.currentQty} {item.uom}</span>
                      <span className="text-sm">Counted: {item.countedQty} {item.uom}</span>
                      <Badge variant={item.difference === 0 ? "default" : "destructive"}>
                        Diff: {item.difference > 0 ? '+' : ''}{item.difference}
                      </Badge>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setItems(items.filter((_, i) => i !== index))}
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex justify-end space-x-4">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={!formData.warehouse || items.length === 0}>
          <Save className="w-4 h-4 mr-2" />
          Save Stock Count
        </Button>
      </div>
    </div>
  );
};

export default StockCountForm;

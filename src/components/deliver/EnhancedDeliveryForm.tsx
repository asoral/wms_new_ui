import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Scan, Package } from "lucide-react";
import { DeliveryEntry, SOItem } from "@/types";
import { createERPNextAPI } from "@/services/erpnextApi";
import { useToast } from "@/hooks/use-toast";

interface EnhancedDeliveryFormProps {
  soItems: SOItem[];
  onAddEntry: (entry: DeliveryEntry) => void;
}

const EnhancedDeliveryForm = ({ soItems, onAddEntry }: EnhancedDeliveryFormProps) => {
  const [formData, setFormData] = useState({
    itemCode: "",
    warehouse: "",
    batch: "",
    serial: "",
    actualQty: ""
  });

  const { toast } = useToast();
  const currentItem = soItems.find(item => item.itemCode === formData.itemCode);

  const handleScan = (field: string) => {
    // Simulate scanning
    if (field === "item" && soItems.length > 0) {
      setFormData(prev => ({ ...prev, itemCode: soItems[0].itemCode }));
    } else if (field === "warehouse") {
      setFormData(prev => ({ ...prev, warehouse: "Main Store" }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.itemCode || !formData.warehouse || !formData.actualQty || !currentItem) {
      return;
    }

    const entry: DeliveryEntry = {
      itemCode: formData.itemCode,
      itemName: currentItem.itemName,
      warehouse: formData.warehouse,
      batch: formData.batch || undefined,
      serial: formData.serial || undefined,
      deliveredQty: parseInt(formData.actualQty),
      actualQty: parseInt(formData.actualQty),
      rate: currentItem.rate,
      uom: currentItem.uom
    };

    onAddEntry(entry);
    
    setFormData({
      itemCode: "",
      warehouse: "",
      batch: "",
      serial: "",
      actualQty: ""
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Package className="w-5 h-5" />
          <span>Enhanced Delivery Form</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="itemCode">Item Code</Label>
              <div className="flex space-x-2">
                <Input
                  id="itemCode"
                  value={formData.itemCode}
                  onChange={(e) => setFormData(prev => ({ ...prev, itemCode: e.target.value }))}
                  placeholder="Scan or enter item code"
                />
                <Button type="button" variant="outline" onClick={() => handleScan("item")}>
                  <Scan className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div>
              <Label htmlFor="warehouse">Warehouse</Label>
              <div className="flex space-x-2">
                <Input
                  id="warehouse"
                  value={formData.warehouse}
                  onChange={(e) => setFormData(prev => ({ ...prev, warehouse: e.target.value }))}
                  placeholder="Scan or enter warehouse"
                />
                <Button type="button" variant="outline" onClick={() => handleScan("warehouse")}>
                  <Scan className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div>
              <Label htmlFor="batch">Batch Number (Optional)</Label>
              <Input
                id="batch"
                value={formData.batch}
                onChange={(e) => setFormData(prev => ({ ...prev, batch: e.target.value }))}
                placeholder="Enter batch number"
              />
            </div>

            <div>
              <Label htmlFor="serial">Serial Number (Optional)</Label>
              <Input
                id="serial"
                value={formData.serial}
                onChange={(e) => setFormData(prev => ({ ...prev, serial: e.target.value }))}
                placeholder="Enter serial number"
              />
            </div>

            <div>
              <Label htmlFor="actualQty">Actual Quantity to Deliver</Label>
              <Input
                id="actualQty"
                type="number"
                value={formData.actualQty}
                onChange={(e) => setFormData(prev => ({ ...prev, actualQty: e.target.value }))}
                placeholder="Enter quantity"
                min="1"
                max={currentItem ? currentItem.pendingQty : undefined}
              />
            </div>
          </div>

          {currentItem && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium mb-2">Item Details:</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                <div>
                  <span className="text-gray-600">Name:</span>
                  <div className="font-medium">{currentItem.itemName}</div>
                </div>
                <div>
                  <span className="text-gray-600">Pending:</span>
                  <div className="font-medium">{currentItem.pendingQty} {currentItem.uom}</div>
                </div>
                <div>
                  <span className="text-gray-600">Rate:</span>
                  <div className="font-medium">₹{currentItem.rate.toLocaleString()}</div>
                </div>
                <div>
                  <span className="text-gray-600">UOM:</span>
                  <div className="font-medium">{currentItem.uom}</div>
                </div>
              </div>
            </div>
          )}

          <Button type="submit" className="w-full" disabled={!currentItem}>
            Add Item to Delivery
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default EnhancedDeliveryForm;

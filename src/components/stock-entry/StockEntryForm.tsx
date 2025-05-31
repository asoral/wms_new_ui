
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Scan, Plus, Database } from "lucide-react";
import { StockEntryType, StockEntryItem } from "../../pages/StockEntry";

interface StockEntryFormProps {
  type: StockEntryType;
  onBack: () => void;
}

const StockEntryForm = ({ type, onBack }: StockEntryFormProps) => {
  const [items, setItems] = useState<StockEntryItem[]>([]);
  const [purpose, setPurpose] = useState("");
  const [formData, setFormData] = useState({
    itemCode: "",
    qty: "",
    fromWarehouse: "",
    toWarehouse: "",
    batch: "",
    serial: ""
  });

  const mockItem = {
    itemCode: "ITM-001",
    itemName: "Laptop Dell Inspiron",
    uom: "Nos",
    rate: 25000
  };

  const warehouses = ["Main Store", "Raw Material Store", "Finished Goods", "Work In Progress"];

  const isTransferType = type.includes("Transfer") || type === "Material Issue" || type === "Material Receipt";
  const requiresBothWarehouses = type.includes("Transfer");
  const requiresFromWarehouse = type === "Material Issue" || requiresBothWarehouses;
  const requiresToWarehouse = type === "Material Receipt" || requiresBothWarehouses;

  const handleScan = (field: string) => {
    if (field === "item") {
      setFormData(prev => ({ ...prev, itemCode: mockItem.itemCode }));
    } else if (field === "fromWarehouse") {
      setFormData(prev => ({ ...prev, fromWarehouse: warehouses[0] }));
    } else if (field === "toWarehouse") {
      setFormData(prev => ({ ...prev, toWarehouse: warehouses[1] }));
    }
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.itemCode || !formData.qty) return;

    const newItem: StockEntryItem = {
      itemCode: formData.itemCode,
      itemName: mockItem.itemName,
      qty: parseInt(formData.qty),
      uom: mockItem.uom,
      rate: mockItem.rate,
      fromWarehouse: formData.fromWarehouse || undefined,
      toWarehouse: formData.toWarehouse || undefined,
      batch: formData.batch || undefined,
      serial: formData.serial || undefined
    };

    setItems([...items, newItem]);
    
    // Reset form
    setFormData({
      itemCode: "",
      qty: "",
      fromWarehouse: "",
      toWarehouse: "",
      batch: "",
      serial: ""
    });
  };

  const handleSubmit = () => {
    console.log("Submitting stock entry:", { type, purpose, items });
    // Here you would call the API to create the stock entry
  };

  return (
    <div className="space-y-6">
      {/* Entry Type Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Stock Entry - {type}
            <Badge>{type}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div>
            <Label htmlFor="purpose">Purpose</Label>
            <Textarea
              id="purpose"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              placeholder="Enter the purpose of this stock entry..."
              className="mt-1"
            />
          </div>
        </CardContent>
      </Card>

      {/* Add Items Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Plus className="w-5 h-5" />
            <span>Add Items</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddItem} className="space-y-4">
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
                <Label htmlFor="qty">Quantity</Label>
                <Input
                  id="qty"
                  type="number"
                  value={formData.qty}
                  onChange={(e) => setFormData(prev => ({ ...prev, qty: e.target.value }))}
                  placeholder="Enter quantity"
                  min="1"
                />
              </div>

              {requiresFromWarehouse && (
                <div>
                  <Label htmlFor="fromWarehouse">From Warehouse</Label>
                  <div className="flex space-x-2">
                    <Select value={formData.fromWarehouse} onValueChange={(value) => setFormData(prev => ({ ...prev, fromWarehouse: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select source warehouse" />
                      </SelectTrigger>
                      <SelectContent>
                        {warehouses.map((warehouse) => (
                          <SelectItem key={warehouse} value={warehouse}>
                            {warehouse}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button type="button" variant="outline" onClick={() => handleScan("fromWarehouse")}>
                      <Scan className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}

              {requiresToWarehouse && (
                <div>
                  <Label htmlFor="toWarehouse">To Warehouse</Label>
                  <div className="flex space-x-2">
                    <Select value={formData.toWarehouse} onValueChange={(value) => setFormData(prev => ({ ...prev, toWarehouse: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select target warehouse" />
                      </SelectTrigger>
                      <SelectContent>
                        {warehouses.map((warehouse) => (
                          <SelectItem key={warehouse} value={warehouse}>
                            {warehouse}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button type="button" variant="outline" onClick={() => handleScan("toWarehouse")}>
                      <Scan className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}

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
            </div>

            {formData.itemCode && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium mb-2">Item Details:</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                  <div>
                    <span className="text-gray-600">Name:</span>
                    <div className="font-medium">{mockItem.itemName}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">UOM:</span>
                    <div className="font-medium">{mockItem.uom}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Rate:</span>
                    <div className="font-medium">₹{mockItem.rate.toLocaleString()}</div>
                  </div>
                </div>
              </div>
            )}

            <Button type="submit" className="w-full">
              Add Item
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Items List */}
      {items.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Added Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {items.map((item, index) => (
                <div key={index} className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">{item.itemCode} - {item.itemName}</h4>
                      <p className="text-sm text-gray-600">
                        Qty: {item.qty} {item.uom}
                        {item.fromWarehouse && ` | From: ${item.fromWarehouse}`}
                        {item.toWarehouse && ` | To: ${item.toWarehouse}`}
                        {item.batch && ` | Batch: ${item.batch}`}
                        {item.serial && ` | Serial: ${item.serial}`}
                      </p>
                    </div>
                    <div className="text-right">
                      {item.rate && (
                        <p className="font-semibold">₹{(item.rate * item.qty).toLocaleString()}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center mt-6">
              <Button variant="outline" onClick={onBack}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} size="lg">
                <Database className="w-4 h-4 mr-2" />
                Submit Stock Entry
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default StockEntryForm;

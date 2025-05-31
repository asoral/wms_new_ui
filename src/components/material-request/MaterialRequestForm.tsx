
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Scan, Plus, FileText } from "lucide-react";
import { MaterialRequestPurpose, MaterialRequestItem } from "../../pages/MaterialRequest";

interface MaterialRequestFormProps {
  purpose: MaterialRequestPurpose;
  onBack: () => void;
}

const MaterialRequestForm = ({ purpose, onBack }: MaterialRequestFormProps) => {
  const [items, setItems] = useState<MaterialRequestItem[]>([]);
  const [formData, setFormData] = useState({
    itemCode: "",
    qty: "",
    warehouse: "",
    fromWarehouse: "",
    toWarehouse: ""
  });

  const mockItem = {
    itemCode: "ITM-001",
    itemName: "Laptop Dell Inspiron",
    uom: "Nos",
    rate: 25000
  };

  const warehouses = ["Main Store", "Raw Material Store", "Finished Goods", "Work In Progress"];

  const handleScan = (field: string) => {
    if (field === "item") {
      setFormData(prev => ({ ...prev, itemCode: mockItem.itemCode }));
    } else if (field === "warehouse") {
      setFormData(prev => ({ ...prev, warehouse: warehouses[0] }));
    }
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.itemCode || !formData.qty) return;

    const newItem: MaterialRequestItem = {
      itemCode: formData.itemCode,
      itemName: mockItem.itemName,
      qty: parseInt(formData.qty),
      uom: mockItem.uom,
      warehouse: formData.warehouse || undefined,
      fromWarehouse: formData.fromWarehouse || undefined,
      toWarehouse: formData.toWarehouse || undefined,
      rate: mockItem.rate
    };

    setItems([...items, newItem]);
    
    // Reset form
    setFormData({
      itemCode: "",
      qty: "",
      warehouse: "",
      fromWarehouse: "",
      toWarehouse: ""
    });
  };

  const handleSubmit = () => {
    console.log("Submitting material request:", { purpose, items });
    // Here you would call the API to create the material request
  };

  const isTransferType = purpose === "Material Transfer";

  return (
    <div className="space-y-6">
      {/* Purpose Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Material Request - {purpose}
            <Badge>{purpose}</Badge>
          </CardTitle>
        </CardHeader>
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

              {isTransferType ? (
                <>
                  <div>
                    <Label htmlFor="fromWarehouse">From Warehouse</Label>
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
                  </div>

                  <div>
                    <Label htmlFor="toWarehouse">To Warehouse</Label>
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
                  </div>
                </>
              ) : (
                <div>
                  <Label htmlFor="warehouse">Warehouse</Label>
                  <div className="flex space-x-2">
                    <Select value={formData.warehouse} onValueChange={(value) => setFormData(prev => ({ ...prev, warehouse: value }))}>
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
                    <Button type="button" variant="outline" onClick={() => handleScan("warehouse")}>
                      <Scan className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
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
                        {isTransferType ? 
                          ` | From: ${item.fromWarehouse} → To: ${item.toWarehouse}` :
                          ` | Warehouse: ${item.warehouse}`
                        }
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">₹{((item.rate || 0) * item.qty).toLocaleString()}</p>
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
                <FileText className="w-4 h-4 mr-2" />
                Submit Material Request
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MaterialRequestForm;

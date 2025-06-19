import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Plus, Trash2, Save } from "lucide-react";
import { MaterialRequestPurpose, MaterialRequestItem, MaterialRequest } from "@/pages/MaterialRequest";

interface MaterialRequestFormProps {
  purpose: MaterialRequestPurpose;
  editingRequest?: MaterialRequest | null;
  onBack: () => void;
  onSave: () => void;
}

const MaterialRequestForm = ({ purpose, editingRequest, onBack, onSave }: MaterialRequestFormProps) => {
  const [items, setItems] = useState<MaterialRequestItem[]>(
    editingRequest?.items || [
      {
        itemCode: "",
        itemName: "",
        qty: 0,
        uom: "Nos"
      }
    ]
  );

  const addItem = () => {
    setItems([
      ...items,
      {
        itemCode: "",
        itemName: "",
        qty: 0,
        uom: "Nos"
      }
    ]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const updateItem = (index: number, field: keyof MaterialRequestItem, value: any) => {
    const updatedItems = [...items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    setItems(updatedItems);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Submitting material request:", { purpose, items });
    // Implement submission logic here
    alert(`Material request ${editingRequest ? 'updated' : 'created'} successfully!`);
    onSave();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-3">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <h2 className="text-xl font-semibold">
          {editingRequest ? `Edit ${purpose} Request` : `Create ${purpose} Request`}
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Request Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="requestType">Request Type</Label>
                <Input
                  id="requestType"
                  value={purpose}
                  disabled
                  className="bg-gray-50"
                />
              </div>
              <div>
                <Label htmlFor="priority">Priority</Label>
                <Select defaultValue={editingRequest?.priority || "Medium"}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Low">Low</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="High">High</SelectItem>
                    <SelectItem value="Urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {purpose === "Material Transfer" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="fromWarehouse">From Warehouse</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select source warehouse" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="main-store">Main Store</SelectItem>
                      <SelectItem value="site-store">Site Store</SelectItem>
                      <SelectItem value="raw-materials">Raw Materials</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="toWarehouse">To Warehouse</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select target warehouse" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="main-store">Main Store</SelectItem>
                      <SelectItem value="site-store">Site Store</SelectItem>
                      <SelectItem value="finished-goods">Finished Goods</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Enter request description..."
                rows={3}
                defaultValue={editingRequest?.remarks || ""}
              />
            </div>
          </CardContent>
        </Card>

        {/* Items */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Items</CardTitle>
            <Button type="button" onClick={addItem} size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Add Item
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {items.map((item, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-4">
                  <div className="flex justify-between items-start">
                    <h4 className="font-medium">Item {index + 1}</h4>
                    {items.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeItem(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label>Item Code</Label>
                      <Input
                        value={item.itemCode}
                        onChange={(e) => updateItem(index, 'itemCode', e.target.value)}
                        placeholder="Enter item code"
                      />
                    </div>
                    <div>
                      <Label>Item Name</Label>
                      <Input
                        value={item.itemName}
                        onChange={(e) => updateItem(index, 'itemName', e.target.value)}
                        placeholder="Enter item name"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label>Quantity</Label>
                        <Input
                          type="number"
                          value={item.qty}
                          onChange={(e) => updateItem(index, 'qty', parseFloat(e.target.value) || 0)}
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <Label>UOM</Label>
                        <Select
                          value={item.uom}
                          onValueChange={(value) => updateItem(index, 'uom', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Nos">Nos</SelectItem>
                            <SelectItem value="Kg">Kg</SelectItem>
                            <SelectItem value="Liters">Liters</SelectItem>
                            <SelectItem value="Meters">Meters</SelectItem>
                            <SelectItem value="Bags">Bags</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  {purpose === "Purchase" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Rate</Label>
                        <Input
                          type="number"
                          value={item.rate || ""}
                          onChange={(e) => updateItem(index, 'rate', parseFloat(e.target.value) || 0)}
                          placeholder="0.00"
                        />
                      </div>
                      <div>
                        <Label>Warehouse</Label>
                        <Select
                          value={item.warehouse || ""}
                          onValueChange={(value) => updateItem(index, 'warehouse', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select warehouse" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="main-store">Main Store</SelectItem>
                            <SelectItem value="raw-materials">Raw Materials</SelectItem>
                            <SelectItem value="finished-goods">Finished Goods</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Submit Actions */}
        <div className="flex justify-end space-x-4">
          <Button type="button" variant="outline" onClick={onBack}>
            Cancel
          </Button>
          <Button type="submit">
            <Save className="w-4 h-4 mr-2" />
            {editingRequest ? 'Update Request' : 'Create Request'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default MaterialRequestForm;

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Calendar, Building, FileText } from "lucide-react";
import { MaterialRequestPurpose, MaterialRequestItem, MaterialRequest } from "../../pages/MaterialRequest";

interface MaterialRequestFormProps {
  purpose: MaterialRequestPurpose;
  editingRequest?: MaterialRequest | null;
  onBack: () => void;
  onSave: (request: MaterialRequest) => void;
}

const MaterialRequestForm = ({ purpose, editingRequest, onBack, onSave }: MaterialRequestFormProps) => {
  const [formData, setFormData] = useState({
    transactionDate: new Date().toISOString().split('T')[0],
    requiredBy: "",
    requestedBy: "Current User",
    company: "Default Company",
    costCenter: "",
    project: "",
    remarks: "",
    printHeading: ""
  });

  const [items, setItems] = useState<MaterialRequestItem[]>([]);

  useEffect(() => {
    if (editingRequest) {
      setFormData({
        transactionDate: editingRequest.transactionDate,
        requiredBy: editingRequest.requiredBy || "",
        requestedBy: editingRequest.requestedBy,
        company: editingRequest.company,
        costCenter: editingRequest.costCenter || "",
        project: editingRequest.project || "",
        remarks: editingRequest.remarks || "",
        printHeading: editingRequest.printHeading || ""
      });
      setItems(editingRequest.items);
    }
  }, [editingRequest]);

  const addItem = () => {
    const newItem: MaterialRequestItem = {
      itemCode: "",
      itemName: "",
      qty: 1,
      uom: "Nos",
      warehouse: "",
      rate: 0,
      description: ""
    };

    if (purpose === "Material Transfer") {
      newItem.fromWarehouse = "";
      newItem.toWarehouse = "";
    }

    setItems([...items, newItem]);
  };

  const updateItem = (index: number, field: keyof MaterialRequestItem, value: any) => {
    const updatedItems = [...items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    setItems(updatedItems);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    const newRequest: MaterialRequest = {
      id: editingRequest?.id || `MR-${Date.now()}`,
      name: editingRequest?.name || `MAT-REQ-${Date.now()}`,
      purpose,
      status: "Draft",
      transactionDate: formData.transactionDate,
      requiredBy: formData.requiredBy,
      requestedBy: formData.requestedBy,
      company: formData.company,
      costCenter: formData.costCenter,
      project: formData.project,
      items,
      totalValue: items.reduce((sum, item) => sum + (item.rate || 0) * item.qty, 0),
      remarks: formData.remarks,
      printHeading: formData.printHeading
    };

    onSave(newRequest);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="w-5 h-5" />
            <span>{purpose} Request</span>
            <Badge variant="outline">{editingRequest ? "Edit" : "New"}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Form fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="transactionDate">Transaction Date</Label>
              <Input
                id="transactionDate"
                type="date"
                value={formData.transactionDate}
                onChange={(e) => setFormData({ ...formData, transactionDate: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="requiredBy">Required By</Label>
              <Input
                id="requiredBy"
                type="date"
                value={formData.requiredBy}
                onChange={(e) => setFormData({ ...formData, requiredBy: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="requestedBy">Requested By</Label>
              <Input
                id="requestedBy"
                value={formData.requestedBy}
                onChange={(e) => setFormData({ ...formData, requestedBy: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="company">Company</Label>
              <Input
                id="company"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              />
            </div>
          </div>

          {/* Items section and rest of the form */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Items</h3>
              <Button onClick={addItem} size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Add Item
              </Button>
            </div>

            {items.length === 0 ? (
              <div className="text-center p-8 border-2 border-dashed border-gray-300 rounded-lg">
                <p className="text-gray-500">No items added yet</p>
                <Button onClick={addItem} className="mt-2">
                  <Plus className="w-4 h-4 mr-2" />
                  Add First Item
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {items.map((item, index) => (
                  <Card key={index}>
                    <CardContent className="p-4">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="space-y-2">
                          <Label>Item Code</Label>
                          <Input
                            value={item.itemCode}
                            onChange={(e) => updateItem(index, "itemCode", e.target.value)}
                            placeholder="Enter item code"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label>Quantity</Label>
                          <Input
                            type="number"
                            value={item.qty}
                            onChange={(e) => updateItem(index, "qty", parseFloat(e.target.value) || 0)}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>UOM</Label>
                          <Select
                            value={item.uom}
                            onValueChange={(value) => updateItem(index, "uom", value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Nos">Nos</SelectItem>
                              <SelectItem value="Kg">Kg</SelectItem>
                              <SelectItem value="Meter">Meter</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="flex items-end">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => removeItem(index)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={onBack}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={items.length === 0}>
              Save Request
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MaterialRequestForm;

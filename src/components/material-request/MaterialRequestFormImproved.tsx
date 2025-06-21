import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Plus, Trash2, Save } from "lucide-react";
import { MaterialRequestPurpose, MaterialRequestItem, MaterialRequest } from "@/pages/MaterialRequest";
import ItemSelector from "../item-enquiry/ItemSelector";
import WarehouseSelector from "../bin-enquiry/WarehouseSelector";
import { createERPNextAPI, getUserDefaultCompany } from "@/services/erpnextApi";
import { useToast } from "@/hooks/use-toast";
import UOMSelector from "./UOMSelector";

interface MaterialRequestFormImprovedProps {
  purpose: MaterialRequestPurpose;
  editingRequest?: MaterialRequest | null;
  onBack: () => void;
  onSave: () => void;
}

const MaterialRequestFormImproved = ({ purpose, editingRequest, onBack, onSave }: MaterialRequestFormImprovedProps) => {
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
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: editingRequest?.title || "",
    priority: editingRequest?.priority || "Medium",
    description: editingRequest?.remarks || "",
    fromWarehouse: "",
    toWarehouse: ""
  });
  const { toast } = useToast();

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

  const handleItemSelected = async (index: number, itemCode: string) => {
    console.log('Item selected:', itemCode);
    try {
      const erpnextAPI = await createERPNextAPI();
      if (!erpnextAPI) return;

      const itemDetails = await erpnextAPI.getItemDetails(itemCode);
      if (itemDetails.data) {
        console.log('Item details:', itemDetails.data);
        updateItem(index, 'itemCode', itemCode);
        updateItem(index, 'itemName', itemDetails.data.item_name || itemCode);
        updateItem(index, 'uom', itemDetails.data.stock_uom || 'Nos');
      }
    } catch (error) {
      console.error('Error fetching item details:', error);
      updateItem(index, 'itemCode', itemCode);
      updateItem(index, 'itemName', itemCode);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const erpnextAPI = await createERPNextAPI();
      if (!erpnextAPI) {
        throw new Error('ERPNext API not configured');
      }

      const company = await getUserDefaultCompany();
      
      // Validate items
      const validItems = items.filter(item => item.itemCode && item.qty > 0);
      if (validItems.length === 0) {
        throw new Error('Please add at least one item with valid quantity');
      }

      // Prepare material request data
      const materialRequestData = {
        title: formData.title || `${purpose} Request`,
        material_request_type: purpose,
        transaction_date: new Date().toISOString().split('T')[0],
        company: company,
        items: validItems.map(item => {
          const itemData: any = {
            item_code: item.itemCode,
            qty: item.qty,
            uom: item.uom,
            warehouse: item.warehouse
          };

          if (purpose === "Material Transfer") {
            if (formData.fromWarehouse) itemData.s_warehouse = formData.fromWarehouse;
            if (formData.toWarehouse) itemData.t_warehouse = formData.toWarehouse;
          }

          if (item.rate) itemData.rate = item.rate;
          if (item.requiredBy) itemData.schedule_date = item.requiredBy;

          return itemData;
        }),
        remarks: formData.description
      };

      let result;
      if (editingRequest) {
        result = await erpnextAPI.updateMaterialRequest(editingRequest.name, materialRequestData);
        toast({
          title: "Success",
          description: `Material request ${editingRequest.name} updated successfully!`,
        });
      } else {
        result = await erpnextAPI.createMaterialRequest(materialRequestData);
        toast({
          title: "Success", 
          description: `Material request created successfully!`,
        });
      }

      onSave();
    } catch (error) {
      console.error('Error saving material request:', error);
      toast({
        title: "Error",
        description: `Failed to save material request: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
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
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  placeholder="Enter request title..."
                />
              </div>
              <div>
                <Label htmlFor="priority">Priority</Label>
                <Select value={formData.priority} onValueChange={(value) => setFormData({...formData, priority: value as any})}>
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
                  <Label>From Warehouse</Label>
                  <WarehouseSelector
                    onWarehouseSelected={(warehouse) => setFormData({...formData, fromWarehouse: warehouse})}
                    placeholder="Select source warehouse"
                  />
                </div>
                <div>
                  <Label>To Warehouse</Label>
                  <WarehouseSelector
                    onWarehouseSelected={(warehouse) => setFormData({...formData, toWarehouse: warehouse})}
                    placeholder="Select target warehouse"
                  />
                </div>
              </div>
            )}

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Enter request description..."
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
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
            <div className="space-y-6">
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

                  <div className="space-y-4">
                    {/* Item Selection */}
                    <ItemSelector
                      onItemSelected={(itemCode) => handleItemSelected(index, itemCode)}
                      isLoading={false}
                    />

                    {/* Show selected item name */}
                    {item.itemName && (
                      <div className="p-2 bg-gray-50 rounded">
                        <span className="text-sm text-gray-600">Selected: </span>
                        <span className="font-medium">{item.itemName}</span>
                      </div>
                    )}

                    {/* Quantity and UOM */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label>Quantity *</Label>
                        <Input
                          type="number"
                          value={item.qty}
                          onChange={(e) => updateItem(index, 'qty', parseFloat(e.target.value) || 0)}
                          placeholder="0"
                          min="0"
                          step="0.01"
                        />
                      </div>
                      <div>
                        <Label>UOM</Label>
                        <UOMSelector
                          value={item.uom}
                          onValueChange={(value) => updateItem(index, 'uom', value)}
                          disabled={!item.itemCode}
                        />
                      </div>
                      <div>
                        <Label>Required By</Label>
                        <Input
                          type="date"
                          value={item.requiredBy || ""}
                          onChange={(e) => updateItem(index, 'requiredBy', e.target.value)}
                        />
                      </div>
                    </div>

                    {/* Additional fields for Purchase */}
                    {purpose === "Purchase" && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label>Expected Rate</Label>
                          <Input
                            type="number"
                            value={item.rate || ""}
                            onChange={(e) => updateItem(index, 'rate', parseFloat(e.target.value) || 0)}
                            placeholder="0.00"
                            min="0"
                            step="0.01"
                          />
                        </div>
                        <div>
                          <Label>Warehouse</Label>
                          <WarehouseSelector
                            onWarehouseSelected={(warehouse) => updateItem(index, 'warehouse', warehouse)}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Submit Actions */}
        <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-4 pb-6">
          <Button type="button" variant="outline" onClick={onBack} className="w-full sm:w-auto">
            Cancel
          </Button>
          <Button type="submit" disabled={loading} className="w-full sm:w-auto">
            <Save className="w-4 h-4 mr-2" />
            {loading ? 'Saving...' : (editingRequest ? 'Update Request' : 'Create Request')}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default MaterialRequestFormImproved;

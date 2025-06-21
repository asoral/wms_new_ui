
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Plus, Trash2, Save } from "lucide-react";
import { MaterialRequestPurpose, MaterialRequestItem, MaterialRequest } from "@/pages/MaterialRequest";
import ItemSelector from "../item-enquiry/ItemSelector";
import WarehouseSelector from "../bin-enquiry/WarehouseSelector";
import { createERPNextAPI, getUserDefaultCompany } from "@/services/erpnextApi";
import { useToast } from "@/hooks/use-toast";
import UOMSelector from "./UOMSelector";
import SerialBatchBundleSelector from "../stock-count/SerialBatchBundleSelector";

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
        uom: "Nos",
        description: ""
      }
    ]
  );
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    remarks: editingRequest?.remarks || "",
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
        uom: "Nos",
        description: ""
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
    console.log('Item selected for material request:', itemCode);
    try {
      const erpnextAPI = await createERPNextAPI();
      if (!erpnextAPI) return;

      const itemDetails = await erpnextAPI.getItemDetails(itemCode);
      if (itemDetails.data) {
        console.log('Item details fetched:', itemDetails.data);
        updateItem(index, 'itemCode', itemCode);
        updateItem(index, 'itemName', itemDetails.data.item_name || itemCode);
        updateItem(index, 'uom', itemDetails.data.stock_uom || 'Nos');
        updateItem(index, 'description', itemDetails.data.description || '');
        
        toast({
          title: "Item Details Loaded",
          description: `Item ${itemDetails.data.item_name} details loaded successfully`,
        });
      }
    } catch (error) {
      console.error('Error fetching item details:', error);
      updateItem(index, 'itemCode', itemCode);
      updateItem(index, 'itemName', itemCode);
      toast({
        title: "Warning",
        description: "Item selected but details could not be loaded",
        variant: "destructive"
      });
    }
  };

  const handleBundleCreated = (index: number, bundleName: string, totalQty: number) => {
    updateItem(index, 'serialBatchBundle', bundleName);
    updateItem(index, 'qty', totalQty);
    toast({
      title: "Bundle Created",
      description: `Serial and Batch Bundle created: ${bundleName}`,
    });
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
      
      const validItems = items.filter(item => item.itemCode && item.itemCode.trim() !== "" && item.qty > 0);
      
      if (validItems.length === 0) {
        throw new Error('Please add at least one item with valid item code and quantity greater than 0');
      }

      const materialRequestData = {
        material_request_type: purpose,
        transaction_date: new Date().toISOString().split('T')[0],
        company: company,
        items: validItems.map(item => {
          const itemData: any = {
            item_code: item.itemCode,
            qty: item.qty,
            uom: item.uom,
            description: item.description || '',
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
        remarks: formData.remarks
      };

      console.log('Submitting material request data:', materialRequestData);

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
            {purpose === "Material Transfer" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>From Warehouse</Label>
                  <WarehouseSelector
                    onWarehouseSelected={(warehouse) => setFormData({...formData, fromWarehouse: warehouse})}
                    isLoading={false}
                  />
                </div>
                <div>
                  <Label>To Warehouse</Label>
                  <WarehouseSelector
                    onWarehouseSelected={(warehouse) => setFormData({...formData, toWarehouse: warehouse})}
                    isLoading={false}
                  />
                </div>
              </div>
            )}

            <div>
              <Label htmlFor="remarks">Remarks</Label>
              <Textarea
                id="remarks"
                placeholder="Enter request remarks..."
                rows={3}
                value={formData.remarks}
                onChange={(e) => setFormData({...formData, remarks: e.target.value})}
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
                <ItemFormRow 
                  key={index}
                  item={item}
                  index={index}
                  purpose={purpose}
                  onItemSelected={(itemCode) => handleItemSelected(index, itemCode)}
                  onUpdateItem={updateItem}
                  onRemoveItem={removeItem}
                  onBundleCreated={(bundleName, totalQty) => handleBundleCreated(index, bundleName, totalQty)}
                  canRemove={items.length > 1}
                />
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

interface ItemFormRowProps {
  item: MaterialRequestItem;
  index: number;
  purpose: MaterialRequestPurpose;
  onItemSelected: (itemCode: string) => void;
  onUpdateItem: (index: number, field: keyof MaterialRequestItem, value: any) => void;
  onRemoveItem: (index: number) => void;
  onBundleCreated: (bundleName: string, totalQty: number) => void;
  canRemove: boolean;
}

const ItemFormRow = ({ 
  item, 
  index, 
  purpose, 
  onItemSelected, 
  onUpdateItem, 
  onRemoveItem, 
  onBundleCreated,
  canRemove 
}: ItemFormRowProps) => {
  const [itemDetails, setItemDetails] = useState<any>(null);

  // Fetch item details when item code changes
  useEffect(() => {
    const fetchItemDetails = async () => {
      if (item.itemCode) {
        try {
          const erpnextAPI = await createERPNextAPI();
          if (erpnextAPI) {
            const details = await erpnextAPI.getItemDetails(item.itemCode);
            if (details.data) {
              setItemDetails(details.data);
              console.log('Item details for tracking check:', details.data);
            }
          }
        } catch (error) {
          console.error('Error fetching item details for tracking:', error);
        }
      }
    };

    fetchItemDetails();
  }, [item.itemCode]);

  const hasSerialBatchTracking = itemDetails && (itemDetails.has_serial_no || itemDetails.has_batch_no);

  return (
    <div className="border rounded-lg p-4 space-y-4">
      <div className="flex justify-between items-start">
        <h4 className="font-medium">Item {index + 1}</h4>
        {canRemove && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => onRemoveItem(index)}
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        )}
      </div>

      <div className="space-y-4">
        {/* Item Selection */}
        <div>
          <Label>Item Code / Name *</Label>
          <ItemSelector
            onItemSelected={onItemSelected}
            isLoading={false}
          />
        </div>

        {/* Show selected item info */}
        {item.itemName && (
          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="text-sm">
              <div className="font-medium text-blue-900">{item.itemName}</div>
              <div className="text-blue-700">Code: {item.itemCode}</div>
              {itemDetails && (
                <div className="flex gap-2 mt-1">
                  {itemDetails.has_serial_no && <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Serial Tracking</span>}
                  {itemDetails.has_batch_no && <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Batch Tracking</span>}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Item Description */}
        <div>
          <Label>Description</Label>
          <Textarea
            value={item.description || ""}
            onChange={(e) => onUpdateItem(index, 'description', e.target.value)}
            placeholder="Item description..."
            rows={2}
          />
        </div>

        {/* Quantity and UOM */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label>Quantity *</Label>
            <Input
              type="number"
              value={item.qty}
              onChange={(e) => onUpdateItem(index, 'qty', parseFloat(e.target.value) || 0)}
              placeholder="0"
              min="0"
              step="0.01"
            />
          </div>
          <div>
            <Label>UOM</Label>
            <UOMSelector
              value={item.uom}
              onValueChange={(uom) => onUpdateItem(index, 'uom', uom)}
              disabled={false}
            />
          </div>
          <div>
            <Label>Required By</Label>
            <Input
              type="date"
              value={item.requiredBy || ""}
              onChange={(e) => onUpdateItem(index, 'requiredBy', e.target.value)}
            />
          </div>
        </div>

        {/* Serial and Batch Bundle for tracked items */}
        {hasSerialBatchTracking && item.itemCode && (
          <div className="space-y-2">
            <Label>Serial and Batch Bundle</Label>
            <SerialBatchBundleSelector
              itemCode={item.itemCode}
              itemName={item.itemName || item.itemCode}
              itemGroup={itemDetails?.item_group || 'All Item Groups'}
              hasSerial={itemDetails?.has_serial_no || false}
              hasBatch={itemDetails?.has_batch_no || false}
              warehouse={item.warehouse || ''}
              transactionType="Inward"
              onBundleCreated={onBundleCreated}
              initialQuantity={item.qty || 1}
            />
            {item.serialBatchBundle && (
              <p className="text-sm text-muted-foreground">
                Selected Bundle: {item.serialBatchBundle}
              </p>
            )}
          </div>
        )}

        {/* Additional fields for Purchase */}
        {purpose === "Purchase" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Expected Rate</Label>
              <Input
                type="number"
                value={item.rate || ""}
                onChange={(e) => onUpdateItem(index, 'rate', parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                min="0"
                step="0.01"
              />
            </div>
            <div>
              <Label>Warehouse</Label>
              <WarehouseSelector
                onWarehouseSelected={(warehouse) => onUpdateItem(index, 'warehouse', warehouse)}
                isLoading={false}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MaterialRequestFormImproved;

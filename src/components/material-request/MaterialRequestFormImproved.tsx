
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Save } from "lucide-react";
import { MaterialRequestPurpose, MaterialRequestItem, MaterialRequest } from "@/pages/MaterialRequest";
import ItemSelector from "../item-enquiry/ItemSelector";
import WarehouseSelector from "../bin-enquiry/WarehouseSelector";
import { createERPNextAPI, getUserDefaultCompany } from "@/services/erpnextApi";
import { useToast } from "@/hooks/use-toast";
import UOMSelector from "./UOMSelector";

interface MaterialRequestFormImprovedProps {
  purpose: MaterialRequestPurpose;
  draftRequest?: MaterialRequest | null;
  onDraftCreated: (draft: MaterialRequest) => void;
  onReviewAndSubmit: () => void;
  onBack: () => void;
}

const MaterialRequestFormImproved = ({ 
  purpose, 
  draftRequest, 
  onDraftCreated, 
  onReviewAndSubmit, 
  onBack 
}: MaterialRequestFormImprovedProps) => {
  const [items, setItems] = useState<MaterialRequestItem[]>(
    draftRequest?.items || [
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
    remarks: draftRequest?.remarks || "",
    fromWarehouse: "",
    toWarehouse: ""
  });
  const { toast } = useToast();

  const addNewItemRow = () => {
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
        const updatedItems = [...items];
        updatedItems[index] = {
          ...updatedItems[index],
          itemCode: itemCode,
          itemName: itemDetails.data.item_name || itemCode,
          uom: itemDetails.data.stock_uom || 'Nos',
          description: itemDetails.data.description || itemDetails.data.item_name || ''
        };
        setItems(updatedItems);
        
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

  const createOrUpdateDraft = async () => {
    const validItems = items.filter(item => item.itemCode && item.itemCode.trim() !== "" && item.qty > 0);
    
    if (validItems.length === 0) {
      toast({
        title: "Error",
        description: "Please add at least one valid item with quantity greater than 0",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);
      
      if (!draftRequest) {
        await createDraft(validItems);
      } else {
        await updateDraft(validItems);
      }
      
    } catch (error) {
      console.error('Error creating/updating draft:', error);
      toast({
        title: "Error",
        description: "Failed to save material request",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const createDraft = async (itemsToAdd: MaterialRequestItem[]) => {
    try {
      const erpnextAPI = await createERPNextAPI();
      if (!erpnextAPI) return;

      const company = await getUserDefaultCompany();
      
      const materialRequestData = {
        material_request_type: purpose,
        transaction_date: new Date().toISOString().split('T')[0],
        company: company,
        docstatus: 0, // Draft status
        items: itemsToAdd.map(item => ({
          item_code: item.itemCode,
          qty: item.qty || 1,
          uom: item.uom,
          description: item.description || '',
          warehouse: purpose === "Purchase" ? item.warehouse : undefined,
          rate: purpose === "Purchase" ? item.rate : undefined,
          schedule_date: item.requiredBy || new Date().toISOString().split('T')[0]
        })),
        remarks: formData.remarks
      };

      console.log('Creating draft material request:', materialRequestData);

      const result = await erpnextAPI.createMaterialRequest(materialRequestData);
      
      if (result.data) {
        const draft: MaterialRequest = {
          id: result.data.name,
          name: result.data.name,
          purpose: purpose,
          status: "Draft",
          transactionDate: new Date().toISOString().split('T')[0],
          requestedBy: "Current User",
          company: company || "",
          items: itemsToAdd,
          remarks: formData.remarks
        };
        
        onDraftCreated(draft);
        
        toast({
          title: "Draft Created",
          description: `Draft material request ${result.data.name} created successfully with ${itemsToAdd.length} item(s)!`,
        });
      }
    } catch (error) {
      console.error('Error creating draft:', error);
      toast({
        title: "Error",
        description: "Failed to create draft material request",
        variant: "destructive"
      });
    }
  };

  const updateDraft = async (updatedItems: MaterialRequestItem[]) => {
    if (!draftRequest) return;
    
    try {
      const erpnextAPI = await createERPNextAPI();
      if (!erpnextAPI) return;

      const updateData = {
        items: updatedItems.map(item => ({
          item_code: item.itemCode,
          qty: item.qty,
          uom: item.uom,
          description: item.description || '',
          warehouse: purpose === "Purchase" ? item.warehouse : undefined,
          rate: purpose === "Purchase" ? item.rate : undefined,
          schedule_date: item.requiredBy || new Date().toISOString().split('T')[0]
        })),
        remarks: formData.remarks
      };

      await erpnextAPI.updateMaterialRequest(draftRequest.name, updateData);
      
      // Update local draft state
      const updatedDraft = {
        ...draftRequest,
        items: updatedItems,
        remarks: formData.remarks
      };
      onDraftCreated(updatedDraft);
      
      toast({
        title: "Draft Updated",
        description: `Draft updated successfully with ${updatedItems.length} item(s)!`,
      });
      
    } catch (error) {
      console.error('Error updating draft:', error);
      throw error;
    }
  };

  const handleReviewSubmit = async () => {
    await createOrUpdateDraft();
    // Small delay to ensure state is updated
    setTimeout(() => {
      onReviewAndSubmit();
    }, 500);
  };

  const getValidItemsCount = () => {
    return items.filter(item => item.itemCode && item.itemCode.trim() !== "" && item.qty > 0).length;
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">
          {draftRequest ? `Edit ${purpose} Request` : `Create ${purpose} Request`}
        </h2>
        {draftRequest && (
          <div className="text-sm text-gray-600">
            Draft: {draftRequest.name}
          </div>
        )}
      </div>

      <div className="space-y-6">
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
            <Button type="button" onClick={addNewItemRow} size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Add Item Row
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
                  canRemove={items.length > 1}
                />
              ))}
            </div>
            
            {getValidItemsCount() > 0 && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-700">
                  ✓ {getValidItemsCount()} item(s) ready for review and submission
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row justify-between space-y-2 sm:space-y-0 sm:space-x-4 pb-6">
          <Button type="button" variant="outline" onClick={onBack} className="w-full sm:w-auto">
            Back to Dashboard
          </Button>
          <div className="flex space-x-2">
            {draftRequest && (
              <Button type="button" variant="outline" onClick={createOrUpdateDraft} disabled={loading} className="w-full sm:w-auto">
                <Save className="w-4 h-4 mr-2" />
                {loading ? 'Saving...' : 'Save Draft'}
              </Button>
            )}
            <Button 
              type="button" 
              onClick={handleReviewSubmit} 
              disabled={loading || getValidItemsCount() === 0}
              className="w-full sm:w-auto"
            >
              {loading ? 'Processing...' : 'Review & Submit'}
            </Button>
          </div>
        </div>
      </div>
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
  canRemove: boolean;
}

const ItemFormRow = ({ 
  item, 
  index, 
  purpose, 
  onItemSelected, 
  onUpdateItem, 
  onRemoveItem, 
  canRemove
}: ItemFormRowProps) => {
  const isValidItem = item.itemCode && item.itemCode.trim() !== "" && item.qty > 0;

  return (
    <div className={`border rounded-lg p-4 space-y-4 ${isValidItem ? 'border-green-200 bg-green-50' : 'border-gray-200'}`}>
      <div className="flex justify-between items-start">
        <h4 className="font-medium">Item {index + 1}</h4>
        <div className="flex space-x-2">
          {isValidItem && (
            <span className="text-sm text-green-600 font-medium bg-green-100 px-2 py-1 rounded">
              ✓ Ready
            </span>
          )}
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
      </div>

      <div className="space-y-4">
        {/* Item Selection */}
        <div>
          <Label>Item Code / Name *</Label>
          <ItemSelector
            onItemSelected={onItemSelected}
            isLoading={false}
          />
          {item.itemName && item.itemName !== item.itemCode && (
            <p className="text-sm text-gray-600 mt-1">{item.itemName}</p>
          )}
        </div>

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

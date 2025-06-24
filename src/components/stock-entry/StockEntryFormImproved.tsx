import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Save, FileText, Download } from "lucide-react";
import { StockEntryType, StockEntryItem } from "@/pages/StockEntry";
import ItemSelector from "../item-enquiry/ItemSelector";
import WarehouseSelector from "../bin-enquiry/WarehouseSelector";
import UOMSelector from "../material-request/UOMSelector";
import DocumentSelector from "./DocumentSelector";
import { createERPNextAPI, getUserDefaultCompany } from "@/services/erpnextApi";
import { useToast } from "@/hooks/use-toast";

interface StockEntryFormImprovedProps {
  type: StockEntryType;
  draftEntry?: any | null;
  onDraftCreated: (draft: any) => void;
  onReviewAndSubmit: () => void;
  onBack: () => void;
}

const StockEntryFormImproved = ({ 
  type, 
  draftEntry, 
  onDraftCreated, 
  onReviewAndSubmit, 
  onBack 
}: StockEntryFormImprovedProps) => {
  const [items, setItems] = useState<StockEntryItem[]>(
    draftEntry?.items || [
      {
        itemCode: "",
        itemName: "",
        qty: 0,
        uom: "Nos",
        fromWarehouse: "",
        toWarehouse: "",
        rate: 0
      }
    ]
  );
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    purpose: draftEntry?.purpose || "",
    fromWarehouse: draftEntry?.from_warehouse || "",
    toWarehouse: draftEntry?.to_warehouse || "",
    postingDate: draftEntry?.posting_date || new Date().toISOString().split('T')[0],
    postingTime: draftEntry?.posting_time || new Date().toTimeString().split(' ')[0].substring(0, 5),
    getItemsFrom: "",
    selectedDocument: null as any,
    remarks: draftEntry?.remarks || ""
  });
  const { toast } = useToast();

  const isTransferType = type.includes("Transfer") || type === "Material Issue" || type === "Material Receipt";
  const requiresBothWarehouses = type.includes("Transfer");
  const requiresFromWarehouse = type === "Material Issue" || requiresBothWarehouses || type === "Send to Warehouse" || type === "Send to Subcontractor";
  const requiresToWarehouse = type === "Material Receipt" || requiresBothWarehouses || type === "Receive at Warehouse";

  // Get Items From options based on stock entry type
  const getGetItemsFromOptions = () => {
    const options = [];
    
    switch (type) {
      case "Material Transfer":
      case "Material Issue":
      case "Material Receipt":
        options.push({ value: "Material Request", label: "Material Request" });
        break;
      case "Material Transfer for Manufacture":
      case "Material Consumption for Manufacture":
        options.push({ value: "Material Request", label: "Material Request" });
        options.push({ value: "Sales Order", label: "Sales Order" });
        options.push({ value: "BOM", label: "Bill of Materials" });
        break;
      case "Manufacture":
        options.push({ value: "BOM", label: "Bill of Materials" });
        break;
      case "Send to Subcontractor":
        options.push({ value: "Purchase Order", label: "Purchase Order" });
        break;
      default:
        options.push({ value: "Material Request", label: "Material Request" });
        options.push({ value: "Purchase Order", label: "Purchase Order" });
        options.push({ value: "Sales Order", label: "Sales Order" });
        options.push({ value: "BOM", label: "Bill of Materials" });
    }
    
    return options;
  };

  const addNewItemRow = () => {
    setItems([
      ...items,
      {
        itemCode: "",
        itemName: "",
        qty: 0,
        uom: "Nos",
        fromWarehouse: "",
        toWarehouse: "",
        rate: 0
      }
    ]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const updateItem = (index: number, field: keyof StockEntryItem, value: any) => {
    const updatedItems = [...items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    setItems(updatedItems);
  };

  const handleItemSelected = async (index: number, itemCode: string) => {
    console.log('Item selected for stock entry:', itemCode);
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
          uom: itemDetails.data.stock_uom || 'Nos'
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

  const handleDocumentSelected = async (document: any) => {
    setFormData({...formData, selectedDocument: document});
    
    toast({
      title: "Document Selected",
      description: `${formData.getItemsFrom} ${document.name} selected. You can now fetch items from this document.`,
    });
  };

  const fetchItemsFromDocument = async () => {
    if (!formData.selectedDocument || !formData.getItemsFrom) {
      toast({
        title: "Error",
        description: "Please select a document first",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);
      const erpnextAPI = await createERPNextAPI();
      if (!erpnextAPI) return;

      if (formData.getItemsFrom === "Material Request") {
        console.log('Fetching items from Material Request:', formData.selectedDocument.name);
        
        // Fetch items from Material Request
        const itemsResult = await erpnextAPI.stockEntryAPI.getItemsFromMaterialRequest(formData.selectedDocument.name);
        
        if (itemsResult.data && itemsResult.data.length > 0) {
          const fetchedItems: StockEntryItem[] = itemsResult.data.map((item: any) => ({
            itemCode: item.item_code,
            itemName: item.item_name || item.item_code,
            qty: item.qty || 0,
            uom: item.uom || item.stock_uom || "Nos",
            fromWarehouse: item.warehouse || formData.fromWarehouse || "",
            toWarehouse: formData.toWarehouse || "",
            rate: 0
          }));

          // Replace current items with fetched items
          setItems(fetchedItems);
          
          toast({
            title: "Items Fetched Successfully",
            description: `${fetchedItems.length} items loaded from Material Request ${formData.selectedDocument.name}`,
          });
        } else {
          toast({
            title: "No Items Found",
            description: "No items found in the selected Material Request",
            variant: "destructive"
          });
        }
      } else {
        // For other document types, show placeholder message for now
        toast({
          title: "Feature Coming Soon",
          description: `Fetching items from ${formData.getItemsFrom} will be implemented soon`,
        });
      }
      
    } catch (error) {
      console.error('Error fetching items from document:', error);
      toast({
        title: "Error",
        description: "Failed to fetch items from selected document",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
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
      
      if (!draftEntry) {
        await createDraft(validItems);
      } else {
        await updateDraft(validItems);
      }
      
    } catch (error) {
      console.error('Error creating/updating draft:', error);
      toast({
        title: "Error",
        description: "Failed to save stock entry",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const createDraft = async (itemsToAdd: StockEntryItem[]) => {
    try {
      const erpnextAPI = await createERPNextAPI();
      if (!erpnextAPI) return;

      const company = await getUserDefaultCompany();
      
      const stockEntryData = {
        stock_entry_type: type,
        purpose: formData.purpose || type,
        posting_date: formData.postingDate,
        posting_time: formData.postingTime,
        company: company,
        from_warehouse: formData.fromWarehouse || undefined,
        to_warehouse: formData.toWarehouse || undefined,
        docstatus: 0, // Draft status
        items: itemsToAdd.map(item => ({
          item_code: item.itemCode,
          qty: item.qty,
          uom: item.uom,
          s_warehouse: item.fromWarehouse || formData.fromWarehouse || undefined,
          t_warehouse: item.toWarehouse || formData.toWarehouse || undefined,
          basic_rate: item.rate || 0,
          batch_no: item.batch || undefined,
          serial_no: item.serial || undefined
        })),
        remarks: formData.remarks,
        // Link to selected document if available
        material_request: formData.getItemsFrom === "Material Request" ? formData.selectedDocument?.name : undefined,
        purchase_order: formData.getItemsFrom === "Purchase Order" ? formData.selectedDocument?.name : undefined,
        sales_order: formData.getItemsFrom === "Sales Order" ? formData.selectedDocument?.name : undefined,
        bom_no: formData.getItemsFrom === "BOM" ? formData.selectedDocument?.name : undefined
      };

      console.log('Creating draft stock entry:', stockEntryData);

      const result = await erpnextAPI.createStockEntry(stockEntryData);
      
      if (result.data) {
        const draft = {
          id: result.data.name,
          name: result.data.name,
          type: type,
          status: "draft",
          posting_date: formData.postingDate,
          items: itemsToAdd,
          purpose: formData.purpose,
          from_warehouse: formData.fromWarehouse,
          to_warehouse: formData.toWarehouse,
          remarks: formData.remarks
        };
        
        onDraftCreated(draft);
        
        toast({
          title: "Draft Created",
          description: `Draft stock entry ${result.data.name} created successfully with ${itemsToAdd.length} item(s)!`,
        });
      }
    } catch (error) {
      console.error('Error creating draft:', error);
      throw error;
    }
  };

  const updateDraft = async (updatedItems: StockEntryItem[]) => {
    if (!draftEntry) return;
    
    try {
      const erpnextAPI = await createERPNextAPI();
      if (!erpnextAPI) return;

      const updateData = {
        items: updatedItems.map(item => ({
          item_code: item.itemCode,
          qty: item.qty,
          uom: item.uom,
          s_warehouse: item.fromWarehouse || formData.fromWarehouse || undefined,
          t_warehouse: item.toWarehouse || formData.toWarehouse || undefined,
          basic_rate: item.rate || 0,
          batch_no: item.batch || undefined,
          serial_no: item.serial || undefined
        })),
        purpose: formData.purpose,
        remarks: formData.remarks
      };

      await erpnextAPI.updateStockEntry(draftEntry.name, updateData);
      
      const updatedDraft = {
        ...draftEntry,
        items: updatedItems,
        purpose: formData.purpose,
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
          {draftEntry ? `Edit ${type}` : `Create ${type}`}
        </h2>
        {draftEntry && (
          <div className="text-sm text-gray-600">
            Draft: {draftEntry.name}
          </div>
        )}
      </div>

      <div className="space-y-6">
        {/* Entry Details */}
        <Card>
          <CardHeader>
            <CardTitle>Entry Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Purpose</Label>
                <Textarea
                  value={formData.purpose}
                  onChange={(e) => setFormData({...formData, purpose: e.target.value})}
                  placeholder={`Enter purpose for ${type}...`}
                  rows={2}
                />
              </div>
              <div>
                <Label>Get Items From</Label>
                <Select value={formData.getItemsFrom} onValueChange={(value) => setFormData({...formData, getItemsFrom: value, selectedDocument: null})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select source document" />
                  </SelectTrigger>
                  <SelectContent>
                    {getGetItemsFromOptions().map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Document Selector */}
            {formData.getItemsFrom && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <Label>Select {formData.getItemsFrom}</Label>
                  <DocumentSelector
                    doctype={formData.getItemsFrom}
                    stockEntryType={type}
                    onDocumentSelected={handleDocumentSelected}
                    isLoading={loading}
                  />
                </div>
                <div className="flex items-end">
                  <Button 
                    type="button" 
                    onClick={fetchItemsFromDocument}
                    disabled={!formData.selectedDocument || loading}
                    className="w-full"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    {loading ? 'Loading...' : 'Get Items'}
                  </Button>
                </div>
              </div>
            )}

            {formData.selectedDocument && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-700">
                  <strong>Selected:</strong> {formData.selectedDocument.name} - {formData.selectedDocument.title || formData.selectedDocument.supplier || formData.selectedDocument.customer || formData.selectedDocument.item}
                </p>
              </div>
            )}

            {(requiresFromWarehouse || requiresToWarehouse) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {requiresFromWarehouse && (
                  <div>
                    <Label>From Warehouse</Label>
                    <WarehouseSelector
                      onWarehouseSelected={(warehouse) => setFormData({...formData, fromWarehouse: warehouse})}
                      isLoading={false}
                    />
                  </div>
                )}
                {requiresToWarehouse && (
                  <div>
                    <Label>To Warehouse</Label>
                    <WarehouseSelector
                      onWarehouseSelected={(warehouse) => setFormData({...formData, toWarehouse: warehouse})}
                      isLoading={false}
                    />
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Posting Date</Label>
                <Input
                  type="date"
                  value={formData.postingDate}
                  onChange={(e) => setFormData({...formData, postingDate: e.target.value})}
                />
              </div>
              <div>
                <Label>Posting Time</Label>
                <Input
                  type="time"
                  value={formData.postingTime}
                  onChange={(e) => setFormData({...formData, postingTime: e.target.value})}
                />
              </div>
            </div>

            <div>
              <Label>Remarks</Label>
              <Textarea
                value={formData.remarks}
                onChange={(e) => setFormData({...formData, remarks: e.target.value})}
                placeholder="Enter remarks..."
                rows={3}
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
                <StockEntryItemRow 
                  key={index}
                  item={item}
                  index={index}
                  type={type}
                  requiresFromWarehouse={requiresFromWarehouse}
                  requiresToWarehouse={requiresToWarehouse}
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
            <Button type="button" variant="outline" onClick={createOrUpdateDraft} disabled={loading} className="w-full sm:w-auto">
              <Save className="w-4 h-4 mr-2" />
              {loading ? 'Saving...' : draftEntry ? 'Update Draft' : 'Save Draft'}
            </Button>
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

interface StockEntryItemRowProps {
  item: StockEntryItem;
  index: number;
  type: StockEntryType;
  requiresFromWarehouse: boolean;
  requiresToWarehouse: boolean;
  onItemSelected: (itemCode: string) => void;
  onUpdateItem: (index: number, field: keyof StockEntryItem, value: any) => void;
  onRemoveItem: (index: number) => void;
  canRemove: boolean;
}

const StockEntryItemRow = ({ 
  item, 
  index, 
  type,
  requiresFromWarehouse,
  requiresToWarehouse,
  onItemSelected, 
  onUpdateItem, 
  onRemoveItem, 
  canRemove
}: StockEntryItemRowProps) => {
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
          <Label>Item Code *</Label>
          <ItemSelector
            onItemSelected={onItemSelected}
            isLoading={false}
          />
          {item.itemName && item.itemName !== item.itemCode && (
            <p className="text-sm text-gray-600 mt-1">{item.itemName}</p>
          )}
        </div>

        {/* Quantity and UOM */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
        </div>

        {/* Warehouses */}
        {(requiresFromWarehouse || requiresToWarehouse) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {requiresFromWarehouse && (
              <div>
                <Label>From Warehouse</Label>
                <WarehouseSelector
                  onWarehouseSelected={(warehouse) => onUpdateItem(index, 'fromWarehouse', warehouse)}
                  isLoading={false}
                />
              </div>
            )}
            {requiresToWarehouse && (
              <div>
                <Label>To Warehouse</Label>
                <WarehouseSelector
                  onWarehouseSelected={(warehouse) => onUpdateItem(index, 'toWarehouse', warehouse)}
                  isLoading={false}
                />
              </div>
            )}
          </div>
        )}

        {/* Rate and Batch/Serial */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label>Rate</Label>
            <Input
              type="number"
              value={item.rate || 0}
              onChange={(e) => onUpdateItem(index, 'rate', parseFloat(e.target.value) || 0)}
              placeholder="0.00"
              min="0"
              step="0.01"
            />
          </div>
          <div>
            <Label>Batch No</Label>
            <Input
              value={item.batch || ''}
              onChange={(e) => onUpdateItem(index, 'batch', e.target.value)}
              placeholder="Enter batch number"
            />
          </div>
          <div>
            <Label>Serial No</Label>
            <Input
              value={item.serial || ''}
              onChange={(e) => onUpdateItem(index, 'serial', e.target.value)}
              placeholder="Enter serial number"
            />
          </div>
        </div>

        {item.rate && item.qty && (
          <div className="text-right">
            <span className="text-lg font-semibold text-green-600">
              Total: ₹{(item.qty * item.rate).toLocaleString()}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default StockEntryFormImproved;

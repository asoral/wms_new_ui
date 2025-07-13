import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { CalendarIcon, Package, Trash2, Plus, ArrowLeft, Save, ArrowRight } from "lucide-react"
import { createERPNextAPI, getUserDefaultCompany } from "@/services/erpnextApi";
import { useToast } from "@/hooks/use-toast";
import ItemSelector from '@/components/common/ItemSelector';
import WarehouseSelector from '@/components/material-request/WarehouseSelector';
import { Item } from "@/types";

interface MaterialRequestItem {
  item_code: string;
  item_name: string;
  qty: number;
  uom: string;
  rate: number;
  amount: number;
  warehouse: string;
  schedule_date: string;
  description: string;
}

interface MaterialRequestFormProps {
  onSubmit?: (data: any) => void;
  onCancel?: () => void;
  purpose?: string;
  editData?: any; // Add editData prop for editing existing requests
}

const MaterialRequestFormImproved = ({ onSubmit, onCancel, purpose = "Purchase", editData }: MaterialRequestFormProps) => {
  const [formData, setFormData] = useState({
    material_request_type: purpose,
    company: '',
    set_warehouse: ''
  });
  const [items, setItems] = useState<MaterialRequestItem[]>([]);
  const [warehouses, setWarehouses] = useState<string[]>([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    // Load edit data if provided
    if (editData) {
      setFormData({
        material_request_type: editData.material_request_type || purpose,
        company: editData.company || '',
        set_warehouse: editData.set_warehouse || ''
      });
      
      if (editData.items && editData.items.length > 0) {
        const mappedItems = editData.items.map((item: any) => ({
          item_code: item.item_code,
          item_name: item.item_name,
          qty: item.qty || 0,
          uom: item.uom || 'Nos',
          rate: item.rate || 0,
          amount: item.amount || 0,
          warehouse: item.warehouse || '',
          schedule_date: item.schedule_date || new Date().toISOString().split('T')[0],
          description: item.description || ''
        }));
        setItems(mappedItems);
      }
      
      // Set warehouses for transfer
      if (editData.material_request_type === "Material Transfer") {
        setSelectedWarehouse(editData.set_from_warehouse || '');
      } else {
        // For other types, use the first item's warehouse as default
        if (editData.items && editData.items[0]) {
          setSelectedWarehouse(editData.items[0].warehouse || '');
        }
      }
    }
  }, [editData, purpose]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const erpnextAPI = await createERPNextAPI();
      if (!erpnextAPI) {
        toast({
          title: "ERPNext Not Configured",
          description: "Please configure your ERPNext settings in the Profile page.",
          variant: "destructive"
        });
        return;
      }

      // Load company
      const company = await getUserDefaultCompany();
      if (company) {
        setFormData(prev => ({ ...prev, company }));
      }

      // Load warehouses
      const response = await erpnextAPI.getWarehouses();
      if (response?.data) {
        const warehouseNames = response.data.map(warehouse => warehouse.name);
        setWarehouses(warehouseNames);
      } else {
        setWarehouses([]);
      }
    } catch (error) {
      console.error('Failed to load initial data:', error);
      toast({
        title: "Error",
        description: "Failed to load warehouses from ERPNext",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleItemSelect = (item: Item) => {
    const itemCode = item.item_code;
    
    // Check if item is already in the list
    const existingItem = items.find(i => i.item_code === itemCode);
    if (existingItem) {
      toast({
        title: "Item Already Added",
        description: "This item is already in the material request.",
        variant: "destructive"
      });
      return;
    }

    // Add new item to the list
    const newItem: MaterialRequestItem = {
      item_code: itemCode,
      item_name: item.item_name,
      qty: 1,
      uom: item.stock_uom || 'Nos',
      rate: 0,
      amount: 0,
      warehouse: selectedWarehouse, // Use header warehouse
      schedule_date: new Date().toISOString().split('T')[0],
      description: item.description || ''
    };

    setItems([...items, newItem]);
    toast({
      title: "Item Added",
      description: `${item.item_name} has been added to the material request.`,
    });
  };

  const handleItemRemove = (itemCode: string) => {
    setItems(items.filter(item => item.item_code !== itemCode));
  };

  const handleItemUpdate = (itemCode: string, field: keyof MaterialRequestItem, value: any) => {
    setItems(items.map(item => {
      if (item.item_code === itemCode) {
        const updatedItem = { ...item, [field]: value };
        // Recalculate amount if qty or rate changes
        if (field === 'qty' || field === 'rate') {
          updatedItem.amount = updatedItem.qty * updatedItem.rate;
        }
        return updatedItem;
      }
      return item;
    }));
  };


  const handleSaveDraft = async () => {
    if (items.length === 0) {
      toast({
        title: "No Items",
        description: "Please add at least one item to the material request.",
        variant: "destructive"
      });
      return;
    }

    const hasEmptyItems = items.some(item => !item.item_code || !item.item_name);
    if (hasEmptyItems) {
      toast({
        title: "Incomplete Items",
        description: "Please complete all item details.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const erpnextAPI = await createERPNextAPI();
      if (!erpnextAPI) {
        throw new Error('ERPNext API not configured');
      }

      let requestData: any = {
        material_request_type: formData.material_request_type || purpose, // Ensure purpose is set
        company: formData.company,
        items: items.map(item => ({
          item_code: item.item_code,
          qty: item.qty,
          uom: item.uom,
          rate: item.rate,
          warehouse: item.warehouse,
          schedule_date: item.schedule_date,
          description: item.description
        }))
      };

      // For Material Transfer, set the correct warehouse fields
      if ((formData.material_request_type || purpose) === "Material Transfer") {
        requestData.set_from_warehouse = selectedWarehouse; // Source warehouse
        requestData.set_warehouse = formData.set_warehouse; // Target warehouse
      } else {
        requestData.set_warehouse = selectedWarehouse; // Default warehouse for other types
      }

      const response = await erpnextAPI.createMaterialRequest(requestData);

      if (response?.data) {
        toast({
          title: "Draft Saved",
          description: `Material request ${response.data.name} saved as draft.`,
        });
        
        if (onSubmit) {
          onSubmit(response.data);
        }
      }
    } catch (error) {
      console.error('Error creating material request:', error);
      toast({
        title: "Error",
        description: `Failed to create material request: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReviewAndSubmit = async () => {
    // First save as draft
    await handleSaveDraft();
    // Then show review - in the future we can make this a separate component
    setShowReview(true);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {onCancel && (
            <Button variant="ghost" size="icon" onClick={onCancel}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
          )}
          <div>
            <h2 className="text-xl font-semibold">
              {editData ? 'Edit' : 'Create'} {editData?.material_request_type || purpose} Request
            </h2>
            <p className="text-sm text-gray-600">Material Request</p>
          </div>
        </div>
      </div>

      {/* Warehouse Selection for Material Transfer */}
      {purpose === "Material Transfer" ? (
        <Card>
          <CardHeader>
            <CardTitle>Transfer Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label>From Warehouse *</Label>
                <WarehouseSelector
                  value={selectedWarehouse}
                  onValueChange={(value) => {
                    setSelectedWarehouse(value);
                    // Update all items with the source warehouse
                    setItems(items.map(item => ({ ...item, warehouse: value })));
                  }}
                  placeholder="Select source warehouse"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Warehouse from which items will be transferred
                </p>
              </div>
              <div>
                <Label>To Warehouse *</Label>
                <WarehouseSelector
                  value={formData.set_warehouse || ''}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, set_warehouse: value }))}
                  placeholder="Select target warehouse"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Warehouse to which items will be transferred
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Default Warehouse</CardTitle>
          </CardHeader>
          <CardContent>
            <div>
              <Label>Select Default Warehouse</Label>
              <WarehouseSelector
                value={selectedWarehouse}
                onValueChange={(value) => {
                  setSelectedWarehouse(value);
                  // Update all items with the new warehouse
                  setItems(items.map(item => ({ ...item, warehouse: value })));
                }}
                placeholder="Select warehouse for all items..."
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Items Section */}
      <Card>
        <CardHeader>
          <CardTitle>Items</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Item Search */}
          <div>
            <Label>Search and Add Items</Label>
            <ItemSelector onItemSelect={handleItemSelect} placeholder="Search and select items to add..." />
          </div>

          {/* Items List */}
          <div className="space-y-4">
            {items.map((item, index) => (
              <Card key={index} className="bg-green-50 border-green-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium flex items-center">
                      <span className="bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm mr-2">
                        {index + 1}
                      </span>
                      Item {index + 1}
                      {item.item_name && <span className="text-green-600 ml-2">✓ Ready</span>}
                    </h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleItemRemove(item.item_code)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="lg:col-span-2">
                      <Label>Item Code / Name *</Label>
                      <div className="text-sm font-medium text-green-700">
                        {item.item_name || "Item Code / Name"}
                      </div>
                      <div className="text-xs text-gray-500">
                        {item.item_code}
                      </div>
                    </div>

                    <div>
                      <Label>Description</Label>
                      <Textarea
                        placeholder="Item description..."
                        value={item.description}
                        onChange={(e) => handleItemUpdate(item.item_code, 'description', e.target.value)}
                        rows={2}
                      />
                    </div>

                    <div>
                      <Label htmlFor={`qty-${index}`}>Quantity *</Label>
                      <Input
                        id={`qty-${index}`}
                        type="number"
                        value={item.qty}
                        onChange={(e) => handleItemUpdate(item.item_code, 'qty', parseFloat(e.target.value) || 0)}
                        min="0"
                        step="0.01"
                      />
                    </div>

                    <div>
                      <Label>UOM</Label>
                      <Input
                        value={item.uom}
                        onChange={(e) => handleItemUpdate(item.item_code, 'uom', e.target.value)}
                        placeholder="Unit"
                      />
                    </div>

                    <div>
                      <Label>Required By</Label>
                      <Input
                        type="date"
                        value={item.schedule_date}
                        onChange={(e) => handleItemUpdate(item.item_code, 'schedule_date', e.target.value)}
                      />
                    </div>

                    <div>
                      <Label>Expected Rate</Label>
                      <Input
                        type="number"
                        value={item.rate}
                        onChange={(e) => handleItemUpdate(item.item_code, 'rate', parseFloat(e.target.value) || 0)}
                        step="0.01"
                        placeholder="0.00"
                      />
                    </div>

                    <div>
                      <Label>Warehouse</Label>
                      <Input
                        value={item.warehouse}
                        readOnly
                        className="bg-gray-50"
                        placeholder="Select warehouse above"
                      />
                    </div>
                  </div>

                  {item.rate > 0 && item.qty > 0 && (
                    <div className="mt-4 text-right">
                      <span className="text-sm text-gray-600">Amount: </span>
                      <span className="font-medium">{(item.qty * item.rate).toFixed(2)}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}

            {items.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No items added yet.</p>
                <p className="text-sm mt-2">Use the search above to add items to your material request.</p>
              </div>
            )}
          </div>

          {items.length > 0 && (
            <div className="bg-green-100 p-4 rounded-lg">
              <p className="text-green-700 text-sm">
                ✓ {items.length} item(s) ready for review and submission
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row justify-between space-y-2 sm:space-y-0 sm:space-x-4 pb-6">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} className="w-full sm:w-auto">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        )}
        <div className="flex space-x-2">
          <Button 
            type="button" 
            variant="outline"
            onClick={handleSaveDraft} 
            disabled={loading || items.length === 0}
            className="flex-1 sm:flex-none"
          >
            <Save className="w-4 h-4 mr-2" />
            {loading ? 'Saving...' : 'Save Draft'}
          </Button>
          <Button 
            type="button" 
            onClick={handleReviewAndSubmit} 
            disabled={loading || items.length === 0}
            className="flex-1 sm:flex-none"
          >
            <ArrowRight className="w-4 h-4 mr-2" />
            Review & Submit
          </Button>
        </div>
      </div>
    </div>
  );
};

export default MaterialRequestFormImproved;
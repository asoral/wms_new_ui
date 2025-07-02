
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Save, ArrowRight, ArrowLeft } from "lucide-react";
import { createERPNextAPI, getUserDefaultCompany } from "@/services/erpnextApi";
import { useToast } from "@/hooks/use-toast";
import ItemSearch from "@/components/common/ItemSearch";

// Define StockEntryType to match the page
export type StockEntryType = 
  | "Material Issue"
  | "Material Receipt" 
  | "Material Transfer"
  | "Material Transfer for Manufacture"
  | "Material Consumption for Manufacture"
  | "Manufacture"
  | "Repack"
  | "Send to Subcontractor"
  | "Send to Warehouse"
  | "Receive at Warehouse";

interface StockEntryFormImprovedProps {
  type: StockEntryType;
  draftEntry?: any;
  onDraftCreated: (draft: any) => void;
  onReviewAndSubmit: () => void;
  onBack: () => void;
}

interface FormItem {
  itemCode: string;
  itemName: string;
  qty: number;
  uom: string;
  rate?: number;
  warehouse?: string;
  fromWarehouse?: string;
  toWarehouse?: string;
  batch?: string;
  serial?: string;
}

const StockEntryFormImproved = ({ type, draftEntry, onDraftCreated, onReviewAndSubmit, onBack }: StockEntryFormImprovedProps) => {
  const [items, setItems] = useState<FormItem[]>([]);
  const [purpose, setPurpose] = useState("");
  const [company, setCompany] = useState("");
  const [loading, setLoading] = useState(false);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (draftEntry) {
      loadDraftData();
    }
  }, [draftEntry]);

  const loadInitialData = async () => {
    try {
      const defaultCompany = await getUserDefaultCompany();
      if (defaultCompany) {
        setCompany(defaultCompany);
      }

      // Load warehouses
      const erpnextAPI = await createERPNextAPI();
      if (erpnextAPI) {
        const warehouseResponse = await erpnextAPI.getWarehouses();
        if (warehouseResponse?.data) {
          setWarehouses(warehouseResponse.data);
        }
      }
    } catch (error) {
      console.error('Error loading initial data:', error);
    }
  };

  const loadDraftData = () => {
    if (draftEntry) {
      setPurpose(draftEntry.purpose || "");
      setCompany(draftEntry.company || company);
      
      if (draftEntry.items && Array.isArray(draftEntry.items)) {
        const formItems: FormItem[] = draftEntry.items.map((item: any) => ({
          itemCode: item.item_code || item.itemCode || "",
          itemName: item.item_name || item.itemName || "",
          qty: item.qty || item.quantity || 0,
          uom: item.uom || item.stock_uom || "Nos",
          rate: item.rate || item.basic_rate || 0,
          warehouse: item.warehouse || "",
          fromWarehouse: item.s_warehouse || item.fromWarehouse || "",
          toWarehouse: item.t_warehouse || item.toWarehouse || "",
          batch: item.batch_no || item.batch || "",
          serial: item.serial_no || item.serial || ""
        }));
        setItems(formItems);
      }
    }
  };

  const addItem = () => {
    setItems([...items, {
      itemCode: "",
      itemName: "",
      qty: 1,
      uom: "Nos",
      rate: 0,
      warehouse: "",
      fromWarehouse: "",
      toWarehouse: "",
      batch: "",
      serial: ""
    }]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof FormItem, value: any) => {
    const updatedItems = [...items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    setItems(updatedItems);
  };

  const handleItemSelect = (index: number, item: any) => {
    updateItem(index, 'itemCode', item.item_code);
    updateItem(index, 'itemName', item.item_name);
    updateItem(index, 'uom', item.stock_uom || 'Nos');
  };

  const saveDraft = async () => {
    if (items.length === 0) {
      toast({
        title: "No Items",
        description: "Please add at least one item to the stock entry.",
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

      const entryData = {
        stock_entry_type: type,
        company: company,
        purpose: purpose,
        items: items.map(item => ({
          item_code: item.itemCode,
          qty: item.qty,
          uom: item.uom,
          basic_rate: item.rate || 0,
          s_warehouse: item.fromWarehouse,
          t_warehouse: item.toWarehouse,
          batch_no: item.batch,
          serial_no: item.serial
        }))
      };

      let response;
      if (draftEntry?.name) {
        // Update existing draft
        response = await erpnextAPI.updateStockEntry(draftEntry.name, entryData);
      } else {
        // Create new draft
        response = await erpnextAPI.createStockEntry(entryData);
      }

      if (response?.data) {
        onDraftCreated(response.data);
        toast({
          title: "Draft Saved",
          description: `Stock entry draft ${response.data.name} saved successfully.`,
        });
      }

    } catch (error) {
      console.error('Error saving draft:', error);
      toast({
        title: "Error",
        description: `Failed to save stock entry: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const isTransferType = type.includes('Transfer') || type === 'Send to Warehouse' || type === 'Receive at Warehouse';

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h2 className="text-xl font-semibold">Create Stock Entry</h2>
            <p className="text-sm text-gray-600">{type}</p>
          </div>
        </div>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>Entry Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="company">Company</Label>
              <Input
                id="company"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="Company name"
              />
            </div>
            <div>
              <Label htmlFor="type">Entry Type</Label>
              <Input
                id="type"
                value={type}
                readOnly
                className="bg-gray-50"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="purpose">Purpose</Label>
            <Textarea
              id="purpose"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              placeholder="Purpose or remarks for this stock entry"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Items */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Items</CardTitle>
            <Button onClick={addItem} size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Add Item
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {items.map((item, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium">Item {index + 1}</h4>
                  {items.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeItem(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="lg:col-span-2">
                    <Label>Item</Label>
                    <ItemSearch
                      onItemSelect={(selectedItem) => handleItemSelect(index, selectedItem)}
                      placeholder="Search for items..."
                      selectedItem={item.itemCode ? {
                        item_code: item.itemCode,
                        item_name: item.itemName,
                        stock_uom: item.uom
                      } : null}
                    />
                  </div>

                  <div>
                    <Label htmlFor={`qty-${index}`}>Quantity</Label>
                    <Input
                      id={`qty-${index}`}
                      type="number"
                      value={item.qty}
                      onChange={(e) => updateItem(index, 'qty', parseFloat(e.target.value) || 0)}
                      min="0"
                      step="0.01"
                    />
                  </div>

                  <div>
                    <Label htmlFor={`uom-${index}`}>UOM</Label>
                    <Input
                      id={`uom-${index}`}
                      value={item.uom}
                      onChange={(e) => updateItem(index, 'uom', e.target.value)}
                      placeholder="Unit"
                    />
                  </div>

                  <div>
                    <Label htmlFor={`rate-${index}`}>Rate</Label>
                    <Input
                      id={`rate-${index}`}
                      type="number"
                      value={item.rate || 0}
                      onChange={(e) => updateItem(index, 'rate', parseFloat(e.target.value) || 0)}
                      min="0"
                      step="0.01"
                    />
                  </div>

                  {isTransferType ? (
                    <>
                      <div>
                        <Label htmlFor={`from-warehouse-${index}`}>From Warehouse</Label>
                        <Select
                          value={item.fromWarehouse}
                          onValueChange={(value) => updateItem(index, 'fromWarehouse', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select from warehouse" />
                          </SelectTrigger>
                          <SelectContent>
                            {warehouses.map((warehouse) => (
                              <SelectItem key={warehouse.name} value={warehouse.name}>
                                {warehouse.warehouse_name || warehouse.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor={`to-warehouse-${index}`}>To Warehouse</Label>
                        <Select
                          value={item.toWarehouse}
                          onValueChange={(value) => updateItem(index, 'toWarehouse', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select to warehouse" />
                          </SelectTrigger>
                          <SelectContent>
                            {warehouses.map((warehouse) => (
                              <SelectItem key={warehouse.name} value={warehouse.name}>
                                {warehouse.warehouse_name || warehouse.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </>
                  ) : (
                    <div>
                      <Label htmlFor={`warehouse-${index}`}>Warehouse</Label>
                      <Select
                        value={item.warehouse}
                        onValueChange={(value) => updateItem(index, 'warehouse', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select warehouse" />
                        </SelectTrigger>
                        <SelectContent>
                          {warehouses.map((warehouse) => (
                            <SelectItem key={warehouse.name} value={warehouse.name}>
                              {warehouse.warehouse_name || warehouse.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div>
                    <Label htmlFor={`batch-${index}`}>Batch</Label>
                    <Input
                      id={`batch-${index}`}
                      value={item.batch}
                      onChange={(e) => updateItem(index, 'batch', e.target.value)}
                      placeholder="Batch number"
                    />
                  </div>

                  <div>
                    <Label htmlFor={`serial-${index}`}>Serial</Label>
                    <Input
                      id={`serial-${index}`}
                      value={item.serial}
                      onChange={(e) => updateItem(index, 'serial', e.target.value)}
                      placeholder="Serial number"
                    />
                  </div>
                </div>
              </div>
            ))}

            {items.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <p>No items added yet.</p>
                <Button onClick={addItem} className="mt-2">
                  <Plus className="w-4 h-4 mr-2" />
                  Add First Item
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row justify-between space-y-2 sm:space-y-0 sm:space-x-4 pb-6">
        <Button type="button" variant="outline" onClick={onBack} className="w-full sm:w-auto">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>
        <div className="flex space-x-2">
          <Button 
            type="button" 
            variant="outline" 
            onClick={saveDraft} 
            disabled={loading}
            className="flex-1 sm:flex-none"
          >
            <Save className="w-4 h-4 mr-2" />
            {loading ? 'Saving...' : 'Save Draft'}
          </Button>
          <Button 
            type="button" 
            onClick={() => {
              saveDraft().then(() => {
                if (!loading) {
                  onReviewAndSubmit();
                }
              });
            }} 
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

export default StockEntryFormImproved;

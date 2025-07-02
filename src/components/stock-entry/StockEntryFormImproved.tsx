
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Plus, ArrowRight, Package2, Building, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { createERPNextAPI, getUserDefaultCompany } from "@/services/erpnextApi";

export type StockEntryType = 
  | "Material Issue"
  | "Material Receipt" 
  | "Material Transfer"
  | "Manufacture"
  | "Repack"
  | "Send to Subcontractor"
  | "Material Transfer for Manufacture"
  | "Material Consumption for Manufacture";

export interface StockEntryItem {
  item_code: string;
  item_name?: string;
  qty: number;
  uom?: string;
  stock_uom?: string;
  conversion_factor?: number;
  transfer_qty?: number;
  basic_rate?: number;
  basic_amount?: number;
  s_warehouse?: string;
  t_warehouse?: string;
  batch_no?: string;
  serial_no?: string;
  expense_account?: string;
  cost_center?: string;
}

export interface StockEntry {
  stock_entry_type: StockEntryType;
  company?: string;
  posting_date?: string;
  posting_time?: string;
  set_posting_time?: number;
  from_warehouse?: string;
  to_warehouse?: string;
  purpose?: string;
  items: StockEntryItem[];
  total_outgoing_value?: number;
  total_incoming_value?: number;
  value_difference?: number;
  remarks?: string;
}

interface StockEntryFormImprovedProps {
  type: StockEntryType;
  draftEntry?: any;
  onDraftCreated: (draft: any) => void;
  onReviewAndSubmit: () => void;
  onBack: () => void;
}

const StockEntryFormImproved = ({ type, draftEntry, onDraftCreated, onReviewAndSubmit, onBack }: StockEntryFormImprovedProps) => {
  const [stockEntryType, setStockEntryType] = useState<StockEntryType>(type);
  const [fromWarehouse, setFromWarehouse] = useState<string>("");
  const [toWarehouse, setToWarehouse] = useState<string>("");
  const [postingDate, setPostingDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [remarks, setRemarks] = useState<string>("");
  const [items, setItems] = useState<StockEntryItem[]>([]);
  
  // Form state for current item
  const [currentItem, setCurrentItem] = useState<Partial<StockEntryItem>>({
    item_code: "",
    qty: 0,
    uom: "Nos"
  });
  
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [availableItems, setAvailableItems] = useState<any[]>([]);
  const [company, setCompany] = useState<string>("");
  const { toast } = useToast();

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const erpnextAPI = await createERPNextAPI();
      if (!erpnextAPI) return;

      const defaultCompany = await getUserDefaultCompany();
      if (defaultCompany) {
        setCompany(defaultCompany);
      }

      // Load warehouses
      const warehouseResponse = await erpnextAPI.getWarehouses(undefined, defaultCompany);
      if (warehouseResponse?.data) {
        setWarehouses(warehouseResponse.data);
      }

      // Load some items for selection
      const itemsResponse = await erpnextAPI.getItems(undefined, 50);
      if (itemsResponse?.data) {
        setAvailableItems(itemsResponse.data);
      }

    } catch (error) {
      console.error('Error loading initial data:', error);
      toast({
        title: "Error",
        description: "Failed to load form data",
        variant: "destructive"
      });
    }
  };

  const addItem = () => {
    if (!currentItem.item_code || !currentItem.qty) {
      toast({
        title: "Incomplete Item",
        description: "Please fill in item code and quantity",
        variant: "destructive"
      });
      return;
    }

    const newItem: StockEntryItem = {
      item_code: currentItem.item_code,
      item_name: currentItem.item_name,
      qty: currentItem.qty || 0,
      uom: currentItem.uom || "Nos",
      stock_uom: currentItem.stock_uom || currentItem.uom || "Nos",
      conversion_factor: 1,
      transfer_qty: currentItem.qty || 0,
      s_warehouse: stockEntryType === "Material Receipt" ? undefined : fromWarehouse,
      t_warehouse: stockEntryType === "Material Issue" ? undefined : toWarehouse,
      batch_no: currentItem.batch_no,
      serial_no: currentItem.serial_no
    };

    setItems([...items, newItem]);
    
    // Reset current item
    setCurrentItem({
      item_code: "",
      qty: 0,
      uom: "Nos"
    });

    toast({
      title: "Item Added",
      description: `${newItem.item_name || newItem.item_code} added to stock entry`,
    });
  };

  const removeItem = (index: number) => {
    const updatedItems = items.filter((_, i) => i !== index);
    setItems(updatedItems);
  };

  const handleSubmit = async () => {
    if (!stockEntryType) {
      toast({
        title: "Missing Stock Entry Type",
        description: "Please select a stock entry type",
        variant: "destructive"
      });
      return;
    }

    if (items.length === 0) {
      toast({
        title: "No Items",
        description: "Please add at least one item to the stock entry",
        variant: "destructive"
      });
      return;
    }

    // Validate warehouses based on entry type
    if (stockEntryType === "Material Transfer" && (!fromWarehouse || !toWarehouse)) {
      toast({
        title: "Missing Warehouses",
        description: "Material Transfer requires both source and target warehouses",
        variant: "destructive"
      });
      return;
    }

    if (stockEntryType === "Material Issue" && !fromWarehouse) {
      toast({
        title: "Missing Source Warehouse",
        description: "Material Issue requires a source warehouse",
        variant: "destructive"
      });
      return;
    }

    if (stockEntryType === "Material Receipt" && !toWarehouse) {
      toast({
        title: "Missing Target Warehouse",
        description: "Material Receipt requires a target warehouse",
        variant: "destructive"
      });
      return;
    }

    const stockEntry: StockEntry = {
      stock_entry_type: stockEntryType,
      company: company,
      posting_date: postingDate,
      set_posting_time: 1,
      from_warehouse: fromWarehouse || undefined,
      to_warehouse: toWarehouse || undefined,
      purpose: stockEntryType,
      items: items,
      remarks: remarks || undefined
    };

    // Create draft stock entry
    try {
      const erpnextAPI = await createERPNextAPI();
      if (!erpnextAPI) return;

      const response = await erpnextAPI.createStockEntry(stockEntry);
      if (response?.data) {
        onDraftCreated(response.data);
      }
    } catch (error) {
      console.error('Error creating stock entry:', error);
      toast({
        title: "Error",
        description: "Failed to create stock entry",
        variant: "destructive"
      });
    }
  };

  const stockEntryTypes: StockEntryType[] = [
    "Material Issue",
    "Material Receipt", 
    "Material Transfer",
    "Manufacture",
    "Repack",
    "Send to Subcontractor",
    "Material Transfer for Manufacture",
    "Material Consumption for Manufacture"
  ];

  const getWarehouseLabel = (type: StockEntryType) => {
    switch (type) {
      case "Material Issue": return { from: "Source Warehouse", to: null };
      case "Material Receipt": return { from: null, to: "Target Warehouse" };
      case "Material Transfer": return { from: "From Warehouse", to: "To Warehouse" };
      default: return { from: "Source Warehouse", to: "Target Warehouse" };
    }
  };

  const warehouseLabels = getWarehouseLabel(stockEntryType);

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Package2 className="w-5 h-5 text-blue-600" />
            <span>Create Stock Entry - {type}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="stock-entry-type">Stock Entry Type</Label>
              <Select value={stockEntryType} onValueChange={(value: StockEntryType) => setStockEntryType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {stockEntryTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="posting-date">Posting Date</Label>
              <Input
                id="posting-date"
                type="date"
                value={postingDate}
                onChange={(e) => setPostingDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="company">Company</Label>
              <Input
                id="company"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="Company name"
              />
            </div>
          </div>

          {/* Warehouse Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {warehouseLabels.from && (
              <div className="space-y-2">
                <Label htmlFor="from-warehouse">{warehouseLabels.from}</Label>
                <Select value={fromWarehouse} onValueChange={setFromWarehouse}>
                  <SelectTrigger>
                    <SelectValue placeholder={`Select ${warehouseLabels.from.toLowerCase()}`} />
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

            {warehouseLabels.to && (
              <div className="space-y-2">
                <Label htmlFor="to-warehouse">{warehouseLabels.to}</Label>
                <Select value={toWarehouse} onValueChange={setToWarehouse}>
                  <SelectTrigger>
                    <SelectValue placeholder={`Select ${warehouseLabels.to.toLowerCase()}`} />
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
          </div>

          {/* Transfer Indication */}
          {stockEntryType === "Material Transfer" && fromWarehouse && toWarehouse && (
            <div className="flex items-center justify-center p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center space-x-4 text-blue-800">
                <div className="flex items-center space-x-2">
                  <Building className="w-4 h-4" />
                  <span className="font-medium">{fromWarehouse}</span>
                </div>
                <ArrowRight className="w-5 h-5" />
                <div className="flex items-center space-x-2">
                  <Building className="w-4 h-4" />
                  <span className="font-medium">{toWarehouse}</span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Items Card */}
      <Card>
        <CardHeader>
          <CardTitle>Add Items</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="item-code">Item Code</Label>
              <Select
                value={currentItem.item_code || ""}
                onValueChange={(value) => {
                  const item = availableItems.find(i => i.name === value);
                  setCurrentItem({
                    ...currentItem,
                    item_code: item?.name || "",
                    item_name: item?.item_name || "",
                    uom: item?.stock_uom || "Nos",
                    stock_uom: item?.stock_uom || "Nos"
                  });
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select item" />
                </SelectTrigger>
                <SelectContent>
                  {availableItems.map((item) => (
                    <SelectItem key={item.name} value={item.name}>
                      {item.item_name} ({item.item_code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="qty">Quantity</Label>
              <Input
                id="qty"
                type="number"
                placeholder="Enter quantity"
                value={currentItem.qty || ""}
                onChange={(e) => setCurrentItem({ ...currentItem, qty: Number(e.target.value) })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="uom">UOM</Label>
              <Input
                id="uom"
                value={currentItem.uom || "Nos"}
                onChange={(e) => setCurrentItem({ ...currentItem, uom: e.target.value })}
                placeholder="Unit of Measure"
                disabled
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="batch-no">Batch No (Optional)</Label>
              <Input
                id="batch-no"
                placeholder="Enter batch number"
                value={currentItem.batch_no || ""}
                onChange={(e) => setCurrentItem({ ...currentItem, batch_no: e.target.value })}
              />
            </div>
          </div>

          <Button onClick={addItem} className="w-full">
            <Plus className="w-4 h-4 mr-2" />
            Add Item
          </Button>
        </CardContent>
      </Card>

      {/* Items List */}
      {items.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Items ({items.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {items.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <span className="font-medium">{item.item_name || item.item_code}</span>
                    <p className="text-sm text-gray-600">
                      Qty: {item.qty} {item.uom}
                      {item.batch_no && ` | Batch: ${item.batch_no}`}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeItem(index)}
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Remarks */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-2">
            <Label htmlFor="remarks">Remarks (Optional)</Label>
            <Input
              id="remarks"
              placeholder="Enter any remarks or notes"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          Back to Dashboard
        </Button>
        <div className="space-x-2">
          <Button onClick={handleSubmit}>
            Create Draft
          </Button>
          {items.length > 0 && (
            <Button onClick={onReviewAndSubmit}>
              Review & Submit
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default StockEntryFormImproved;

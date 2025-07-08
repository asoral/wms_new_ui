import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Save, ArrowRight, ArrowLeft, Package, Calendar, DollarSign } from "lucide-react";
import { createERPNextAPI, getUserDefaultCompany } from "@/services/erpnextApi";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import ItemSelector from "@/components/common/ItemSelector";
import UOMSelector from "@/components/material-request/UOMSelector";
import WarehouseSelector from "@/components/material-request/WarehouseSelector";

type MaterialRequestPurpose = "Purchase" | "Material Transfer" | "Material Issue" | "Manufacture" | "Customer Provided";

interface MaterialRequestFormProps {
  purpose: MaterialRequestPurpose;
  draftRequest?: any;
  onDraftCreated: (draft: any) => void;
  onReviewAndSubmit: () => void;
  onBack: () => void;
}

interface FormItem {
  itemCode: string;
  itemName: string;
  qty: number;
  uom: string;
  warehouse?: string;
  requiredBy?: string;
  description?: string;
  rate?: number;
  amount?: number;
  project?: string;
  costCenter?: string;
}

const MaterialRequestForm = ({ purpose, draftRequest, onDraftCreated, onReviewAndSubmit, onBack }: MaterialRequestFormProps) => {
  const [items, setItems] = useState<FormItem[]>([]);
  const [remarks, setRemarks] = useState("");
  const [company, setCompany] = useState("");
  const [requiredBy, setRequiredBy] = useState("");
  const [requestedBy, setRequestedBy] = useState("");
  const [costCenter, setCostCenter] = useState("");
  const [project, setProject] = useState("");
  const [loading, setLoading] = useState(false);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [sourceWarehouse, setSourceWarehouse] = useState("");
  const [targetWarehouse, setTargetWarehouse] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (draftRequest) {
      loadDraftData();
    }
  }, [draftRequest]);

  const loadInitialData = async () => {
    try {
      const defaultCompany = await getUserDefaultCompany();
      if (defaultCompany) {
        setCompany(defaultCompany);
      }

      // Set default required by date to today
      const today = new Date().toISOString().split('T')[0];
      setRequiredBy(today);

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
    if (draftRequest) {
      setRemarks(draftRequest.remarks || "");
      setCompany(draftRequest.company || company);
      setRequiredBy(draftRequest.schedule_date || "");
      setRequestedBy(draftRequest.requested_by || "");
      setCostCenter(draftRequest.cost_center || "");
      setProject(draftRequest.project || "");
      setSourceWarehouse(draftRequest.set_from_warehouse || "");
      setTargetWarehouse(draftRequest.set_warehouse || "");
      
      if (draftRequest.items && Array.isArray(draftRequest.items)) {
        const formItems: FormItem[] = draftRequest.items.map((item: any) => ({
          itemCode: item.item_code || item.itemCode || "",
          itemName: item.item_name || item.itemName || "",
          qty: item.qty || item.quantity || 0,
          uom: item.uom || item.stock_uom || "Nos",
          warehouse: item.warehouse || "",
          requiredBy: item.schedule_date || item.requiredBy || "",
          description: item.description || "",
          rate: item.rate || 0,
          amount: item.amount || 0,
          project: item.project || "",
          costCenter: item.cost_center || ""
        }));
        setItems(formItems);
      }
    }
  };

  const addItem = () => {
    const defaultRequiredBy = requiredBy || new Date().toISOString().split('T')[0];
    setItems([...items, {
      itemCode: "",
      itemName: "",
      qty: 1,
      uom: "Nos",
      warehouse: purpose === "Material Transfer" ? sourceWarehouse : "",
      requiredBy: defaultRequiredBy,
      description: "",
      rate: 0,
      amount: 0,
      project: project,
      costCenter: costCenter
    }]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof FormItem, value: any) => {
    const updatedItems = [...items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    
    // Auto-calculate amount when qty or rate changes
    if (field === 'qty' || field === 'rate') {
      const qty = field === 'qty' ? value : updatedItems[index].qty;
      const rate = field === 'rate' ? value : updatedItems[index].rate;
      updatedItems[index].amount = qty * rate;
    }
    
    setItems(updatedItems);
  };

  const handleItemSelect = (index: number, item: any) => {
    updateItem(index, 'itemCode', item.item_code);
    updateItem(index, 'itemName', item.item_name);
    updateItem(index, 'uom', item.stock_uom || 'Nos');
    updateItem(index, 'description', item.description || '');
  };

  const handleWarehouseSelect = (warehouseCode: string, isSource = false) => {
    if (isSource) {
      setSourceWarehouse(warehouseCode);
      // Update all items with source warehouse
      const updatedItems = items.map(item => ({
        ...item,
        warehouse: warehouseCode
      }));
      setItems(updatedItems);
    } else {
      setTargetWarehouse(warehouseCode);
    }
  };

  const saveDraft = async () => {
    // Validation
    if (items.length === 0) {
      toast({
        title: "No Items",
        description: "Please add at least one item to the material request.",
        variant: "destructive"
      });
      return;
    }

    const incompleteItems = items.filter(item => !item.itemCode || !item.itemName || item.qty <= 0);
    if (incompleteItems.length > 0) {
      toast({
        title: "Incomplete Items",
        description: "Please complete all item details and ensure quantities are greater than 0.",
        variant: "destructive"
      });
      return;
    }

    if (purpose === "Material Transfer") {
      if (!sourceWarehouse) {
        toast({
          title: "Source Warehouse Required",
          description: "Please select a source warehouse for material transfer.",
          variant: "destructive"
        });
        return;
      }
      if (!targetWarehouse) {
        toast({
          title: "Target Warehouse Required",
          description: "Please select a target warehouse for material transfer.",
          variant: "destructive"
        });
        return;
      }
      if (sourceWarehouse === targetWarehouse) {
        toast({
          title: "Invalid Warehouse Selection",
          description: "Source and target warehouses cannot be the same.",
          variant: "destructive"
        });
        return;
      }
    }

    setLoading(true);
    try {
      const erpnextAPI = await createERPNextAPI();
      if (!erpnextAPI) {
        throw new Error('ERPNext API not configured');
      }

      const requestData = {
        material_request_type: purpose,
        company: company,
        schedule_date: requiredBy,
        requested_by: requestedBy,
        cost_center: costCenter,
        project: project,
        remarks: remarks,
        ...(purpose === "Material Transfer" && sourceWarehouse && { set_from_warehouse: sourceWarehouse }),
        ...(targetWarehouse && { set_warehouse: targetWarehouse }),
        items: items.map(item => ({
          item_code: item.itemCode,
          qty: item.qty,
          uom: item.uom,
          warehouse: item.warehouse,
          schedule_date: item.requiredBy || requiredBy,
          description: item.description,
          rate: item.rate || 0,
          project: item.project,
          cost_center: item.costCenter
        }))
      };

      let response;
      if (draftRequest?.name) {
        // Update existing draft
        response = await erpnextAPI.updateMaterialRequest(draftRequest.name, requestData);
      } else {
        // Create new draft
        response = await erpnextAPI.createMaterialRequest(requestData);
      }

      if (response?.data) {
        onDraftCreated(response.data);
        toast({
          title: "Draft Saved",
          description: `Material request draft ${response.data.name} saved successfully.`,
        });
      }

    } catch (error) {
      console.error('Error saving draft:', error);
      toast({
        title: "Error",
        description: `Failed to save material request: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getTotalAmount = () => {
    return items.reduce((total, item) => total + (item.amount || 0), 0).toFixed(2);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h2 className="text-2xl font-bold">Material Request</h2>
            <Badge variant="outline" className="mt-1">
              {purpose}
            </Badge>
          </div>
        </div>
      </div>

      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Package className="w-5 h-5" />
            <span>Basic Information</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="company">Company *</Label>
              <Input
                id="company"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="Company name"
                required
              />
            </div>
            <div>
              <Label htmlFor="requiredBy">Required By *</Label>
              <Input
                id="requiredBy"
                type="date"
                value={requiredBy}
                onChange={(e) => setRequiredBy(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="requestedBy">Requested By</Label>
              <Input
                id="requestedBy"
                value={requestedBy}
                onChange={(e) => setRequestedBy(e.target.value)}
                placeholder="Person making request"
              />
            </div>
            <div>
              <Label htmlFor="costCenter">Cost Center</Label>
              <Input
                id="costCenter"
                value={costCenter}
                onChange={(e) => setCostCenter(e.target.value)}
                placeholder="Cost center code"
              />
            </div>
            <div>
              <Label htmlFor="project">Project</Label>
              <Input
                id="project"
                value={project}
                onChange={(e) => setProject(e.target.value)}
                placeholder="Project code"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="remarks">Remarks</Label>
            <Textarea
              id="remarks"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Additional remarks or notes about this material request"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Warehouse Selection for Material Transfer */}
      {purpose === "Material Transfer" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Package className="w-5 h-5" />
              <span>Transfer Details</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="sourceWarehouse">Source Warehouse *</Label>
                <WarehouseSelector
                  value={sourceWarehouse}
                  onValueChange={(value) => handleWarehouseSelect(value, true)}
                  placeholder="Select source warehouse"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Warehouse from which items will be transferred
                </p>
              </div>
              <div>
                <Label htmlFor="targetWarehouse">Target Warehouse *</Label>
                <WarehouseSelector
                  value={targetWarehouse}
                  onValueChange={setTargetWarehouse}
                  placeholder="Select target warehouse"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Warehouse to which items will be transferred
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Items */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Package className="w-5 h-5" />
              <span>Items</span>
              <Badge variant="secondary">{items.length} items</Badge>
            </CardTitle>
            <Button onClick={addItem} size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Add Item
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {items.map((item, index) => (
              <div key={index} className="border rounded-lg p-4 bg-muted/30">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline">#{index + 1}</Badge>
                    <h4 className="font-medium">
                      {item.itemName || "New Item"}
                    </h4>
                    {item.itemCode && (
                      <Badge variant="secondary" className="text-xs">
                        {item.itemCode}
                      </Badge>
                    )}
                  </div>
                  {items.length > 0 && (
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
                    <Label>Item *</Label>
                    <ItemSelector
                      onItemSelect={(selectedItem) => handleItemSelect(index, selectedItem)}
                      placeholder="Search and select item..."
                      selectedItem={item.itemCode ? {
                        name: item.itemCode,
                        item_code: item.itemCode,
                        item_name: item.itemName,
                        stock_uom: item.uom
                      } : null}
                    />
                  </div>

                  <div>
                    <Label htmlFor={`qty-${index}`}>Quantity *</Label>
                    <Input
                      id={`qty-${index}`}
                      type="number"
                      value={item.qty}
                      onChange={(e) => updateItem(index, 'qty', parseFloat(e.target.value) || 0)}
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <Label htmlFor={`uom-${index}`}>UOM</Label>
                    <UOMSelector
                      value={item.uom}
                      onValueChange={(value) => updateItem(index, 'uom', value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor={`warehouse-${index}`}>Warehouse</Label>
                    <WarehouseSelector
                      value={item.warehouse}
                      onValueChange={(value) => updateItem(index, 'warehouse', value)}
                      placeholder="Select warehouse"
                    />
                  </div>

                  <div>
                    <Label htmlFor={`required-${index}`}>Required By</Label>
                    <Input
                      id={`required-${index}`}
                      type="date"
                      value={item.requiredBy}
                      onChange={(e) => updateItem(index, 'requiredBy', e.target.value)}
                    />
                  </div>

                  {purpose === "Purchase" && (
                    <div>
                      <Label htmlFor={`rate-${index}`}>Expected Rate</Label>
                      <Input
                        id={`rate-${index}`}
                        type="number"
                        value={item.rate}
                        onChange={(e) => updateItem(index, 'rate', parseFloat(e.target.value) || 0)}
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                      />
                    </div>
                  )}

                  <div className="lg:col-span-2">
                    <Label htmlFor={`description-${index}`}>Description</Label>
                    <Textarea
                      id={`description-${index}`}
                      value={item.description}
                      onChange={(e) => updateItem(index, 'description', e.target.value)}
                      placeholder="Item description or notes"
                      rows={2}
                    />
                  </div>

                  {purpose === "Purchase" && item.rate > 0 && item.qty > 0 && (
                    <div className="flex items-center space-x-2">
                      <DollarSign className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Amount:</span>
                      <Badge variant="outline">${item.amount?.toFixed(2) || '0.00'}</Badge>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {items.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <Package className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg mb-2">No items added yet</p>
                <p className="text-sm mb-4">Add items to get started with your material request</p>
                <Button onClick={addItem}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add First Item
                </Button>
              </div>
            )}
          </div>

          {/* Summary */}
          {items.length > 0 && purpose === "Purchase" && (
            <>
              <Separator className="my-6" />
              <div className="flex justify-between items-center">
                <div className="text-sm text-muted-foreground">
                  Total Items: {items.length}
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium">Total Estimated Amount:</span>
                  <Badge variant="default" className="text-base">
                    ${getTotalAmount()}
                  </Badge>
                </div>
              </div>
            </>
          )}
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

export default MaterialRequestForm;
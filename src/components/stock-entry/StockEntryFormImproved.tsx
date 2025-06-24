
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save, Download, ArrowLeft } from "lucide-react";
import { StockEntryType } from "@/pages/StockEntry";
import WarehouseSelector from "../bin-enquiry/WarehouseSelector";
import DocumentSelector from "./DocumentSelector";
import MaterialRequestItemProcessor from "./MaterialRequestItemProcessor";
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
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fromWarehouse: draftEntry?.from_warehouse || "",
    toWarehouse: draftEntry?.to_warehouse || "",
    getItemsFrom: "",
    selectedDocument: null as any,
    processedItems: [] as any[]
  });
  
  // Material Request processing state
  const [showMRProcessor, setShowMRProcessor] = useState(false);
  const [mrItems, setMRItems] = useState<any[]>([]);
  
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
          console.log('Material Request items fetched:', itemsResult.data);
          setMRItems(itemsResult.data);
          setShowMRProcessor(true);
          
          toast({
            title: "Items Retrieved",
            description: `${itemsResult.data.length} items found. You can now process them step by step.`,
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

  const handleMRItemsProcessed = (processedItems: any[]) => {
    setFormData(prev => ({...prev, processedItems}));
    setShowMRProcessor(false);
    
    toast({
      title: "Items Added Successfully",
      description: `${processedItems.length} items processed for Stock Entry`,
    });
  };

  const handleBackFromProcessor = () => {
    setShowMRProcessor(false);
    setMRItems([]);
  };

  // Show Material Request processor if active
  if (showMRProcessor && mrItems.length > 0) {
    return (
      <MaterialRequestItemProcessor
        materialRequestName={formData.selectedDocument?.name || ""}
        materialRequestItems={mrItems}
        onItemsProcessed={handleMRItemsProcessed}
        onBack={handleBackFromProcessor}
      />
    );
  }

  const createOrUpdateDraft = async () => {
    if (formData.processedItems.length === 0) {
      toast({
        title: "Error",
        description: "Please process items from a document first",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);
      
      if (!draftEntry) {
        await createDraft();
      } else {
        await updateDraft();
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

  const createDraft = async () => {
    try {
      const erpnextAPI = await createERPNextAPI();
      if (!erpnextAPI) return;

      const company = await getUserDefaultCompany();
      
      const stockEntryData = {
        stock_entry_type: type,
        purpose: type,
        posting_date: new Date().toISOString().split('T')[0],
        posting_time: new Date().toTimeString().split(' ')[0].substring(0, 5),
        company: company,
        from_warehouse: formData.fromWarehouse || undefined,
        to_warehouse: formData.toWarehouse || undefined,
        docstatus: 0, // Draft status
        items: formData.processedItems.map(item => ({
          item_code: item.item_code,
          qty: item.qty,
          uom: item.uom,
          s_warehouse: item.warehouse || formData.fromWarehouse || undefined,
          t_warehouse: formData.toWarehouse || undefined,
          basic_rate: 0,
          batch_no: item.batch_no || undefined,
          serial_no: item.serial_no || undefined
        })),
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
          items: formData.processedItems,
          from_warehouse: formData.fromWarehouse,
          to_warehouse: formData.toWarehouse
        };
        
        onDraftCreated(draft);
        
        toast({
          title: "Draft Created",
          description: `Draft stock entry ${result.data.name} created successfully with ${formData.processedItems.length} item(s)!`,
        });
      }
    } catch (error) {
      console.error('Error creating draft:', error);
      throw error;
    }
  };

  const updateDraft = async () => {
    if (!draftEntry) return;
    
    try {
      const erpnextAPI = await createERPNextAPI();
      if (!erpnextAPI) return;

      const updateData = {
        items: formData.processedItems.map(item => ({
          item_code: item.item_code,
          qty: item.qty,
          uom: item.uom,
          s_warehouse: item.warehouse || formData.fromWarehouse || undefined,
          t_warehouse: formData.toWarehouse || undefined,
          basic_rate: 0,
          batch_no: item.batch_no || undefined,
          serial_no: item.serial_no || undefined
        }))
      };

      await erpnextAPI.updateStockEntry(draftEntry.name, updateData);
      
      const updatedDraft = {
        ...draftEntry,
        items: formData.processedItems
      };
      onDraftCreated(updatedDraft);
      
      toast({
        title: "Draft Updated",
        description: `Draft updated successfully with ${formData.processedItems.length} item(s)!`,
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

  const truncateText = (text: string, maxLength: number = 50) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
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

            {/* Document Selector */}
            {formData.getItemsFrom && (
              <div>
                <Label>Select {formData.getItemsFrom}</Label>
                <DocumentSelector
                  doctype={formData.getItemsFrom}
                  stockEntryType={type}
                  onDocumentSelected={handleDocumentSelected}
                  isLoading={loading}
                />
              </div>
            )}

            {formData.selectedDocument && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-700">
                  <strong>Selected:</strong> {formData.selectedDocument.name} - {truncateText(formData.selectedDocument.title || formData.selectedDocument.supplier || formData.selectedDocument.customer || formData.selectedDocument.item || "")}
                </p>
              </div>
            )}

            {/* Warehouse Selection */}
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

            {/* Processed Items Summary */}
            {formData.processedItems.length > 0 && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-700">
                  ✓ {formData.processedItems.length} item(s) processed and ready for review
                </p>
              </div>
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
              onClick={createOrUpdateDraft} 
              disabled={loading || formData.processedItems.length === 0} 
              className="w-full sm:w-auto"
            >
              <Save className="w-4 h-4 mr-2" />
              {loading ? 'Saving...' : draftEntry ? 'Update Draft' : 'Save Draft'}
            </Button>
            <Button 
              type="button" 
              onClick={handleReviewSubmit} 
              disabled={loading || formData.processedItems.length === 0}
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

export default StockEntryFormImproved;


import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Warehouse, Download, CheckCircle, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { createERPNextAPI } from "@/services/erpnextApi";
import StockCountForm from "@/components/stock-count/StockCountForm";
import WarehouseSelector from "@/components/bin-enquiry/WarehouseSelector";

export interface StockCountItem {
  itemCode: string;
  itemName: string;
  warehouse: string;
  currentQty: number;
  actualQty: number;
  uom: string;
  batch?: string;
  serial?: string;
  serialBatchBundle?: string;
  useTraditionalEntry?: boolean;
}

export interface StockCountEntry {
  itemCode: string;
  itemName: string;
  warehouse: string;
  currentQty: number;
  actualQty: number;
  uom: string;
  batch?: string;
  serial?: string;
  serialBatchBundle?: string;
  useTraditionalEntry?: boolean;
}

export interface StockCountSession {
  id: string;
  warehouse: string;
  date: string;
  status: 'in-progress' | 'completed';
  itemsCount: number;
}

const StockCount = () => {
  const [warehouse, setWarehouse] = useState<string | null>(null);
  const [stockCountItems, setStockCountItems] = useState<StockCountEntry[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentReconciliation, setCurrentReconciliation] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Load existing stock count data if available
    loadStockCountData();
  }, [warehouse]);

  const loadStockCountData = async () => {
    if (!warehouse) return;

    try {
      const api = await createERPNextAPI();
      if (!api) return;

      // Try to fetch existing Stock Reconciliation for the selected warehouse
      try {
        // Since getStockReconciliations doesn't exist, we'll skip this for now
        // and just reset the form
        setCurrentReconciliation(null);
        setStockCountItems([]);
      } catch (error) {
        console.log('No existing reconciliation found, starting fresh');
        setCurrentReconciliation(null);
        setStockCountItems([]);
      }
    } catch (error) {
      console.error('Error loading stock count data:', error);
      toast({
        title: "Error",
        description: "Failed to load existing stock count data",
        variant: "destructive"
      });
    }
  };

  const handleAddEntry = async (entry: StockCountEntry) => {
    setStockCountItems(prev => [...prev, entry]);
  };

  const removeStockCountItem = (index: number) => {
    setStockCountItems(prev => prev.filter((_, i) => i !== index));
  };

  const resetCount = () => {
    setStockCountItems([]);
    setCurrentReconciliation(null);
  };

  const handleSubmitCount = async (items: StockCountEntry[]) => {
    if (!warehouse) {
      toast({
        title: "No Warehouse Selected",
        description: "Please select a warehouse to start the stock count.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const api = await createERPNextAPI();
      if (!api) return;

      // Prepare data for Stock Reconciliation
      const reconciliationData = {
        warehouse: warehouse,
        company: 'Your Company', // Replace with actual company
        purpose: 'Stock Reconciliation',
        items: items.map(item => ({
          item_code: item.itemCode,
          item_name: item.itemName,
          warehouse: item.warehouse,
          current_qty: item.currentQty,
          actual_qty: item.actualQty,
          uom: item.uom,
          batch_no: item.batch,
          serial_no: item.serial,
          serial_batch_bundle: item.serialBatchBundle
        }))
      };

      // Create or update Stock Reconciliation
      let reconciliation;
      if (currentReconciliation) {
        // Update existing
        reconciliation = await api.updateStockReconciliation(currentReconciliation.name, reconciliationData);
        toast({
          title: "Stock Count Updated",
          description: "Stock count has been updated successfully.",
        });
      } else {
        // Create new
        reconciliation = await api.createStockReconciliation(reconciliationData);
        toast({
          title: "Stock Count Started",
          description: "New stock count has been started.",
        });
      }

      if (reconciliation?.data?.name) {
        setCurrentReconciliation(reconciliation.data);
      }
    } catch (error) {
      console.error('Error submitting stock count:', error);
      toast({
        title: "Error",
        description: "Failed to submit stock count.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const saveAsDraft = async () => {
    if (!currentReconciliation) {
      toast({
        title: "No Reconciliation",
        description: "No reconciliation to save as draft.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const api = await createERPNextAPI();
      if (!api) return;

      // Update docstatus to 0 (Draft)
      await api.updateStockReconciliation(currentReconciliation.name, { docstatus: 0 });
      toast({
        title: "Saved as Draft",
        description: "Stock count has been saved as draft.",
      });
    } catch (error) {
      console.error('Error saving as draft:', error);
      toast({
        title: "Error",
        description: "Failed to save as draft.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitFinalCount = async () => {
    if (!currentReconciliation) {
      toast({
        title: "No Reconciliation",
        description: "No reconciliation to submit.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const api = await createERPNextAPI();
      if (!api) return;

      // Submit the Stock Reconciliation
      await api.updateStockReconciliation(currentReconciliation.name, { docstatus: 1 });
      toast({
        title: "Stock Count Submitted",
        description: "Stock count has been submitted successfully.",
      });
    } catch (error) {
      console.error('Error submitting final count:', error);
      toast({
        title: "Error",
        description: "Failed to submit final count.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const downloadExcel = async () => {
    if (!stockCountItems.length) {
      toast({
        title: "No Data",
        description: "No stock count data to export",
        variant: "destructive"
      });
      return;
    }

    try {
      const api = await createERPNextAPI();
      if (!api) return;

      const excelUrl = `${api.getBaseURL}/api/method/frappe.desk.query_report.export_query`;
      
      const params = new URLSearchParams({
        report_name: 'Stock Reconciliation',
        file_format_type: 'Excel',
        filters: JSON.stringify({
          'Stock Reconciliation': currentReconciliation?.name || ''
        })
      });

      const response = await fetch(`${excelUrl}?${params}`, {
        headers: {
          'Authorization': `token ${api.getApiKey}:${api.getApiSecret}`
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `stock-count-${warehouse}-${new Date().toISOString().split('T')[0]}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        toast({
          title: "Excel Downloaded",
          description: "Stock count report has been downloaded",
        });
      }
    } catch (error) {
      console.error('Error generating Excel:', error);
      toast({
        title: "Error",
        description: "Failed to generate Excel file",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Stock Count</h1>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={downloadExcel}
            disabled={!stockCountItems.length}
          >
            <Download className="w-4 h-4 mr-2" />
            Download Excel
          </Button>
          <Button variant="outline" onClick={resetCount}>
            Reset Count
          </Button>
        </div>
      </div>

      {/* Warehouse Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Warehouse className="w-5 h-5" />
            <span>Select Warehouse</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <WarehouseSelector onWarehouseSelected={setWarehouse} />
          {warehouse && (
            <div className="mt-2 p-2 bg-blue-50 rounded">
              <span className="text-sm text-blue-700">Selected: {warehouse}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {warehouse && (
        <>
          {/* Stock Count Form */}
          <StockCountForm
            onSubmit={handleSubmitCount}
            isLoading={isSubmitting}
            warehouse={warehouse}
            onAddEntry={handleAddEntry}
          />

          {/* Current Count Items */}
          {stockCountItems.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5" />
                    <span>Current Count ({stockCountItems.length} items)</span>
                  </div>
                  <div className="flex space-x-2">
                    <Button onClick={saveAsDraft} disabled={isSubmitting}>
                      Save as Draft
                    </Button>
                    <Button onClick={submitFinalCount} disabled={isSubmitting}>
                      {isSubmitting ? "Submitting..." : "Submit Final Count"}
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stockCountItems.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h4 className="font-medium">{item.itemName}</h4>
                          <Badge variant="outline">{item.itemCode}</Badge>
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <span>Current: {item.currentQty}</span>
                          <span>Counted: {item.actualQty}</span>
                          <span className={`font-medium ${(item.actualQty - item.currentQty) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            Diff: {item.actualQty - item.currentQty > 0 ? '+' : ''}{item.actualQty - item.currentQty}
                          </span>
                        </div>
                        {(item.batch || item.serial || item.serialBatchBundle) && (
                          <div className="flex items-center space-x-2 mt-2">
                            {item.serialBatchBundle && (
                              <Badge variant="secondary">Bundle: {item.serialBatchBundle}</Badge>
                            )}
                            {item.batch && (
                              <Badge variant="secondary">Batch: {item.batch}</Badge>
                            )}
                            {item.serial && (
                              <Badge variant="secondary">Serial: {item.serial}</Badge>
                            )}
                          </div>
                        )}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeStockCountItem(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
};

export default StockCount;

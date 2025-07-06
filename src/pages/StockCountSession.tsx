import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, RotateCcw, Save } from "lucide-react";
import ItemSelector from "@/components/stock-count/ItemSelector";
import { StockCountEntry } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { createERPNextAPI } from "@/services/erpnextApi";

const StockCountSession = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const warehouse = searchParams.get('warehouse') || '';
  const purpose = searchParams.get('purpose') || 'Stock Reconciliation';
  const [entries, setEntries] = useState<StockCountEntry[]>([]);
  const [activeTab, setActiveTab] = useState("entry");
  const [stockReconciliationId, setStockReconciliationId] = useState<string | null>(null);
  const { toast } = useToast();

  const totalItems = entries.length;
  const matchedItems = entries.filter(entry => entry.status === 'matched').length;
  const varianceItems = entries.filter(entry => entry.status === 'variance').length;

  const handleEntryAdded = async (entry: StockCountEntry) => {
    // Create draft Stock Reconciliation if this is the first entry
    if (entries.length === 0 && !stockReconciliationId) {
      try {
        const erpnextAPI = await createERPNextAPI();
        if (!erpnextAPI) {
          throw new Error('ERPNext API not available');
        }

        // Get company from user profile
        const { getUserDefaultCompany } = await import('@/services/erpnextApi');
        const company = await getUserDefaultCompany();
        
        if (!company) {
          throw new Error('No default company found. Please set your default company in Profile settings.');
        }

        // Get current stock valuation for the item
        let currentQty = 0;
        let valuationRate = 0;
        
        try {
          const stockResponse = await erpnextAPI.stockAPI.getBinStockForCompany(entry.itemCode, company);
          if (stockResponse?.data) {
            const warehouseStock = stockResponse.data.find((stock: any) => stock.warehouse === entry.warehouse);
            if (warehouseStock) {
              currentQty = warehouseStock.actual_qty || 0;
            }
          }
          
          // Get valuation rate from stock ledger
          const stockLedgerResponse = await erpnextAPI.stockAPI.getStockLedgerEntries(entry.itemCode, [entry.warehouse]);
          if (stockLedgerResponse?.data && stockLedgerResponse.data.length > 0) {
            const latestEntry = stockLedgerResponse.data
              .filter((ledger: any) => ledger.warehouse === entry.warehouse)
              .sort((a: any, b: any) => {
                const dateA = new Date(a.posting_date + ' ' + (a.posting_time || '00:00:00'));
                const dateB = new Date(b.posting_date + ' ' + (b.posting_time || '00:00:00'));
                return dateB.getTime() - dateA.getTime();
              })[0];
            
            if (latestEntry) {
              valuationRate = latestEntry.valuation_rate || 0;
            }
          }
          
          // Fallback: get item details for standard rate
          if (!valuationRate) {
            const itemDetails = await erpnextAPI.getItemDetails(entry.itemCode);
            if (itemDetails?.data) {
              valuationRate = (itemDetails.data as any).standard_rate || (itemDetails.data as any).valuation_rate || 0;
            }
          }
        } catch (error) {
          console.warn('Could not fetch stock details for valuation:', error);
        }

        const stockReconciliationData = {
          doctype: 'Stock Reconciliation',
          company: company,
          purpose: purpose,
          posting_date: new Date().toISOString().split('T')[0],
          posting_time: new Date().toTimeString().split(' ')[0],
          set_posting_time: 1,
          expense_account: '', // Will be auto-set by ERPNext
          cost_center: '', // Will be auto-set by ERPNext
          items: [{
            item_code: entry.itemCode,
            warehouse: entry.warehouse,
            qty: entry.actualQty,
            valuation_rate: valuationRate || 0,
            current_qty: currentQty,
            current_valuation_rate: valuationRate || 0,
            ...(entry.batch && { batch_no: entry.batch }),
            ...(entry.serial && { serial_no: entry.serial }),
            ...(entry.serialBatchBundle && { serial_and_batch_bundle: entry.serialBatchBundle })
          }]
        };

        console.log('Creating Stock Reconciliation with data:', stockReconciliationData);
        const response = await erpnextAPI.callAPI('Stock Reconciliation', 'POST', stockReconciliationData);
        console.log('Stock Reconciliation response:', response);
        
        if (response?.data?.name) {
          setStockReconciliationId(response.data.name);
          toast({
            title: "Stock Reconciliation Created",
            description: `Draft Stock Reconciliation ${response.data.name} created successfully.`,
          });
        } else {
          throw new Error('No Stock Reconciliation ID returned from API');
        }
      } catch (error: any) {
        console.error('Failed to create stock reconciliation:', error);
        
        let errorMessage = 'Failed to create Stock Reconciliation in ERPNext.';
        
        if (error.message) {
          if (error.message.includes('ValidationError')) {
            errorMessage = 'Validation failed: Please check that all required fields are filled correctly.';
          } else if (error.message.includes('PermissionError')) {
            errorMessage = 'Permission denied: You may not have rights to create Stock Reconciliation.';
          } else if (error.message.includes('DuplicateEntryError')) {
            errorMessage = 'Duplicate entry: A similar stock reconciliation may already exist.';
          } else {
            errorMessage = error.message;
          }
        }
        
        toast({
          title: "Error Creating Stock Reconciliation",
          description: errorMessage,
          variant: "destructive"
        });
        return; // Don't add entry if stock reconciliation creation failed
      }
    }

    setEntries(prev => [...prev, entry]);
    toast({
      title: "Entry Added",
      description: `Stock count entry for ${entry.itemName} has been added.`,
    });
  };

  const handleReset = () => {
    setEntries([]);
    setActiveTab("entry");
    toast({
      title: "Session Reset",
      description: "All entries have been cleared.",
    });
  };

  const handleSubmitCount = () => {
    if (entries.length === 0) {
      toast({
        title: "No Entries",
        description: "Please add some stock count entries before submitting.",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Count Submitted",
      description: `Stock count with ${entries.length} entries has been submitted.`,
    });
    
    // Navigate back to stock count list
    navigate('/stock-count');
  };

  return (
    <div className="container mx-auto py-4 px-4 md:py-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 space-y-4 md:space-y-0">
        <div>
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold flex items-center space-x-2">
              <BarChart3 className="w-6 h-6" />
              <span>Stock Count</span>
            </h1>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigate('/stock-count')}
            >
              ← Back to Dashboard
            </Button>
          </div>
          <p className="text-gray-500">
            Warehouse: {warehouse}
            {stockReconciliationId && (
              <span className="ml-4 text-blue-600">
                Draft SR: {stockReconciliationId}
              </span>
            )}
          </p>
        </div>
        <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-2 w-full md:w-auto">
          <Button variant="outline" onClick={handleReset} className="w-full md:w-auto">
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset
          </Button>
          <Button onClick={handleSubmitCount} className="w-full md:w-auto">
            <Save className="w-4 h-4 mr-2" />
            Submit Count
          </Button>
        </div>
      </div>

      {/* Stock Count Session Summary */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Stock Count Session</span>
            <Badge variant="outline">{purpose}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 md:gap-6 text-center">
            <div>
              <div className="text-2xl md:text-3xl font-bold text-gray-600">{totalItems}</div>
              <div className="text-xs md:text-sm text-gray-500">Total Items</div>
            </div>
            <div>
              <div className="text-2xl md:text-3xl font-bold text-green-600">{matchedItems}</div>
              <div className="text-xs md:text-sm text-gray-500">Matched</div>
            </div>
            <div>
              <div className="text-2xl md:text-3xl font-bold text-red-600">{varianceItems}</div>
              <div className="text-xs md:text-sm text-gray-500">Variance</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs for Entry and Review */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="entry">Item Entry</TabsTrigger>
          <TabsTrigger value="review" className="relative">
            Review & Submit
            {entries.length > 0 && (
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="entry" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Scan Items</CardTitle>
            </CardHeader>
            <CardContent>
              <ItemSelector 
                warehouse={warehouse}
                onItemAdded={(item) => {
                  const entry: StockCountEntry = {
                    itemCode: item.itemCode,
                    itemName: item.itemName,
                    warehouse: item.warehouse,
                    currentQty: item.currentQty,
                    actualQty: item.actualQty,
                    difference: item.actualQty - item.currentQty,
                    status: item.actualQty === item.currentQty ? 'matched' : 'variance',
                    uom: item.uom,
                    batch: item.batch,
                    serial: item.serial,
                    serialBatchBundle: item.serialBatchBundle
                  };
                  handleEntryAdded(entry);
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="review" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Review Stock Count Entries</CardTitle>
            </CardHeader>
            <CardContent>
              {entries.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No entries added yet. Switch to Item Entry tab to start adding items.</p>
                </div>
              ) : (
                <>
                  {/* Desktop Table View */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-3 font-medium text-gray-700">Item Code</th>
                          <th className="text-left p-3 font-medium text-gray-700">Item Name</th>
                          <th className="text-left p-3 font-medium text-gray-700">Warehouse</th>
                          <th className="text-right p-3 font-medium text-gray-700">Current Qty</th>
                          <th className="text-right p-3 font-medium text-gray-700">Actual Qty</th>
                          <th className="text-right p-3 font-medium text-gray-700">Difference</th>
                          <th className="text-left p-3 font-medium text-gray-700">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {entries.map((entry, index) => (
                          <tr key={index} className="border-b hover:bg-gray-50">
                            <td className="p-3 font-medium">{entry.itemCode}</td>
                            <td className="p-3">{entry.itemName}</td>
                            <td className="p-3">{entry.warehouse}</td>
                            <td className="p-3 text-right">{entry.currentQty}</td>
                            <td className="p-3 text-right">{entry.actualQty}</td>
                            <td className="p-3 text-right">{entry.difference}</td>
                            <td className="p-3">
                              <Badge 
                                variant={entry.status === 'matched' ? 'default' : 'destructive'}
                              >
                                {entry.status}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Card View */}
                  <div className="md:hidden space-y-3">
                    {entries.map((entry, index) => (
                      <Card key={index} className="p-4">
                        <div className="space-y-2">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <p className="font-medium text-gray-900">{entry.itemCode}</p>
                              <p className="text-sm text-gray-600">{entry.itemName}</p>
                            </div>
                            <Badge 
                              variant={entry.status === 'matched' ? 'default' : 'destructive'}
                              className="ml-2"
                            >
                              {entry.status}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <span className="text-gray-600">Warehouse:</span>
                              <span className="ml-1 font-medium">{entry.warehouse}</span>
                            </div>
                            <div>
                              <span className="text-gray-600">UOM:</span>
                              <span className="ml-1 font-medium">{entry.uom}</span>
                            </div>
                            <div>
                              <span className="text-gray-600">Current:</span>
                              <span className="ml-1 font-medium">{entry.currentQty}</span>
                            </div>
                            <div>
                              <span className="text-gray-600">Actual:</span>
                              <span className="ml-1 font-medium">{entry.actualQty}</span>
                            </div>
                            <div className="col-span-2">
                              <span className="text-gray-600">Difference:</span>
                              <span className={`ml-1 font-medium ${entry.difference !== 0 ? 'text-red-600' : 'text-green-600'}`}>
                                {entry.difference > 0 ? '+' : ''}{entry.difference}
                              </span>
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default StockCountSession;
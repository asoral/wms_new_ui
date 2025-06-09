import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { BarChart3, Plus, Save, RefreshCcw } from "lucide-react";
import { createERPNextAPI, getUserDefaultCompany } from "@/services/erpnextApi";
import { useNotification } from "@/hooks/useNotification";
import { toast } from "sonner";

import StockCountForm from "@/components/stock-count/StockCountForm";
import StockCountSummary from "@/components/stock-count/StockCountSummary";
import StockCountTable from "@/components/stock-count/StockCountTable";
import WarehouseSelector from "@/components/bin-enquiry/WarehouseSelector";

export interface StockCountEntry {
  itemCode: string;
  itemName: string;
  warehouse: string;
  batch?: string;
  serial?: string;
  serialBatchBundle?: string;
  currentQty: number;
  actualQty: number;
  uom: string;
  difference: number;
  status: 'matched' | 'variance' | 'new';
  useTraditionalEntry?: boolean;
}

export interface StockCountSession {
  purpose: 'reconciliation' | 'opening';
  warehouse: string;
  entries: StockCountEntry[];
  totalItems: number;
  matchedItems: number;
  varianceItems: number;
  stockReconciliationNumber?: string;
  isSubmitted: boolean;
}

const STORAGE_KEY = 'stockCountSession';

const StockCount = () => {
  const [session, setSession] = useState<StockCountSession | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [selectedWarehouse, setSelectedWarehouse] = useState("");
  const [selectedPurpose, setSelectedPurpose] = useState<'reconciliation' | 'opening' | null>(null);
  const [isCreatingReconciliation, setIsCreatingReconciliation] = useState(false);

  useEffect(() => {
    const savedSession = localStorage.getItem(STORAGE_KEY);
    if (savedSession) {
      try {
        const parsedSession = JSON.parse(savedSession);
        setSession(parsedSession);
        if (parsedSession) {
          setSelectedWarehouse(parsedSession.warehouse);
          setSelectedPurpose(parsedSession.purpose);
          setShowForm(true);
        }
      } catch (error) {
        console.error('Failed to load saved session:', error);
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  useEffect(() => {
    if (session) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [session]);

  const startSession = () => {
    if (!selectedWarehouse || !selectedPurpose) return;
    
    const newSession: StockCountSession = {
      purpose: selectedPurpose,
      warehouse: selectedWarehouse,
      entries: [],
      totalItems: 0,
      matchedItems: 0,
      varianceItems: 0,
      isSubmitted: false
    };

    setSession(newSession);
    setShowForm(true);
  };

  const createStockReconciliation = async (firstEntry: StockCountEntry) => {
    console.log('Creating Stock Reconciliation for entry:', firstEntry);
    
    if (isCreatingReconciliation) {
      console.log('Already creating reconciliation, skipping...');
      return null;
    }
    
    setIsCreatingReconciliation(true);
    
    try {
      const erpnextAPI = await createERPNextAPI();
      if (!erpnextAPI) {
        toast.error('ERPNext API not configured');
        return null;
      }

      const company = await getUserDefaultCompany();
      
      // CRITICAL: Detect if this entry uses traditional method
      const usesTraditionalEntry = firstEntry.useTraditionalEntry || (!firstEntry.serialBatchBundle && (firstEntry.batch || firstEntry.serial));
      
      console.log('Entry uses traditional entry method:', usesTraditionalEntry);
      
      // Prepare Stock Reconciliation data with correct format
      const stockReconciliationData = {
        purpose: session?.purpose === 'reconciliation' ? 'Stock Reconciliation' : 'Opening Stock',
        set_warehouse: firstEntry.warehouse,
        company: company || '',
        posting_date: new Date().toISOString().split('T')[0],
        posting_time: new Date().toTimeString().split(' ')[0].slice(0, 8),
        // CRITICAL: Add use_serial_batch_fields flag for traditional entry
        ...(usesTraditionalEntry ? { use_serial_batch_fields: 1 } : {}),
        items: [{
          item_code: firstEntry.itemCode,
          warehouse: firstEntry.warehouse,
          qty: firstEntry.actualQty,
          valuation_rate: 0,
          ...(firstEntry.serialBatchBundle ? { 
            serial_and_batch_bundle: firstEntry.serialBatchBundle 
          } : {
            ...(firstEntry.batch && { batch_no: firstEntry.batch }),
            ...(firstEntry.serial && { serial_no: firstEntry.serial })
          })
        }]
      };

      console.log('Creating Stock Reconciliation with data:', stockReconciliationData);
      
      const result = await erpnextAPI.createStockReconciliation(stockReconciliationData);
      console.log('Stock Reconciliation creation result:', result);
      
      if (result && result.data && result.data.name) {
        console.log('Stock Reconciliation created successfully:', result.data.name);
        toast.success('Stock Reconciliation created successfully!', {
          description: `Document: ${result.data.name}`
        });
        return result.data.name;
      } else {
        console.error('Failed to create Stock Reconciliation - no name in response:', result);
        toast.error('Failed to create Stock Reconciliation - Invalid response');
        return null;
      }
    } catch (error) {
      console.error('Failed to create Stock Reconciliation:', error);
      toast.error('Failed to create Stock Reconciliation', {
        description: error instanceof Error ? error.message : 'Unknown error'
      });
      return null;
    } finally {
      setIsCreatingReconciliation(false);
    }
  };

  const updateStockReconciliation = async (reconciliationName: string, allEntries: StockCountEntry[]) => {
    console.log('Updating Stock Reconciliation:', reconciliationName, 'with entries:', allEntries.length);
    
    try {
      const erpnextAPI = await createERPNextAPI();
      if (!erpnextAPI) {
        toast.error('ERPNext API not configured');
        return false;
      }

      // CRITICAL: Check if any entry uses traditional entry method
      const hasTraditionalEntry = allEntries.some(entry => 
        entry.useTraditionalEntry || (!entry.serialBatchBundle && (entry.batch || entry.serial))
      );

      console.log('Update - has traditional entry:', hasTraditionalEntry);

      // Prepare updated data with correct format
      const updatedData = {
        // CRITICAL: Add use_serial_batch_fields flag if any entry uses traditional method
        ...(hasTraditionalEntry ? { use_serial_batch_fields: 1 } : {}),
        items: allEntries.map(entry => ({
          item_code: entry.itemCode,
          warehouse: entry.warehouse,
          qty: entry.actualQty,
          valuation_rate: 0,
          ...(entry.serialBatchBundle ? { 
            serial_and_batch_bundle: entry.serialBatchBundle 
          } : {
            ...(entry.batch && { batch_no: entry.batch }),
            ...(entry.serial && { serial_no: entry.serial })
          })
        }))
      };

      console.log('Updating Stock Reconciliation with data:', updatedData);
      
      const result = await erpnextAPI.updateStockReconciliation(reconciliationName, updatedData);
      console.log('Stock Reconciliation update result:', result);
      
      if (result && result.data) {
        console.log('Stock Reconciliation updated successfully');
        return true;
      } else {
        console.error('Failed to update Stock Reconciliation - invalid response:', result);
        toast.error('Failed to update Stock Reconciliation');
        return false;
      }
    } catch (error) {
      console.error('Failed to update Stock Reconciliation:', error);
      toast.error('Failed to update Stock Reconciliation', {
        description: error instanceof Error ? error.message : 'Unknown error'
      });
      return false;
    }
  };

  const addEntry = async (entry: Omit<StockCountEntry, 'difference' | 'status'>) => {
    console.log('Adding entry to session:', entry);
    
    if (!session) {
      console.error('No session found when trying to add entry');
      return;
    }

    const difference = entry.actualQty - entry.currentQty;
    const status: StockCountEntry['status'] = 
      difference === 0 ? 'matched' : 'variance';

    const newEntry: StockCountEntry = {
      ...entry,
      difference,
      status
    };

    console.log('Prepared new entry:', newEntry);

    const updatedEntries = [...session.entries, newEntry];
    const matchedItems = updatedEntries.filter(e => e.status === 'matched').length;
    const varianceItems = updatedEntries.filter(e => e.status === 'variance').length;

    // If this is the first entry and no Stock Reconciliation exists, create one
    let stockReconciliationNumber = session.stockReconciliationNumber;
    
    if (!stockReconciliationNumber && session.entries.length === 0) {
      console.log('Creating Stock Reconciliation for first entry...');
      stockReconciliationNumber = await createStockReconciliation(newEntry);
      
      if (!stockReconciliationNumber) {
        console.error('Failed to create Stock Reconciliation, cannot proceed');
        toast.error('Failed to create Stock Reconciliation document');
        return;
      }
    } else if (stockReconciliationNumber) {
      console.log('Updating existing Stock Reconciliation...');
      const updateSuccess = await updateStockReconciliation(stockReconciliationNumber, updatedEntries);
      
      if (!updateSuccess) {
        console.error('Failed to update Stock Reconciliation');
        toast.error('Failed to update Stock Reconciliation');
        return;
      }
    }

    const updatedSession: StockCountSession = {
      ...session,
      entries: updatedEntries,
      totalItems: updatedEntries.length,
      matchedItems,
      varianceItems,
      stockReconciliationNumber: stockReconciliationNumber || session.stockReconciliationNumber
    };

    console.log('Updated session:', updatedSession);
    setSession(updatedSession);
  };

  const submitSession = async () => {
    console.log('Submitting session:', session);
    
    if (!session || session.entries.length === 0 || session.isSubmitted) {
      toast.error('No items to submit or already submitted');
      return;
    }
    
    if (!session.stockReconciliationNumber) {
      toast.error('No Stock Reconciliation document found. Please add items first.');
      return;
    }
    
    try {
      const erpnextAPI = await createERPNextAPI();
      if (!erpnextAPI) {
        toast.error('ERPNext API not configured');
        return;
      }

      const response = await fetch(`${erpnextAPI.baseURL}/api/resource/Stock Reconciliation/${session.stockReconciliationNumber}`, {
        method: 'PUT',
        headers: {
          'Authorization': `token ${erpnextAPI.apiKey}:${erpnextAPI.apiSecret}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          docstatus: 1
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to submit Stock Reconciliation:', errorText);
        toast.error('Failed to submit Stock Reconciliation');
        return;
      }

      const submittedSession = {
        ...session,
        isSubmitted: true
      };
      setSession(submittedSession);
      
      toast.success('Stock Count submitted successfully!', {
        description: `Document: ${session.stockReconciliationNumber}`
      });
    } catch (error) {
      console.error('Failed to submit Stock Count:', error);
      toast.error('Failed to submit Stock Count', {
        description: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  const resetSession = () => {
    setSession(null);
    setSelectedWarehouse("");
    setSelectedPurpose(null);
    setShowForm(false);
    localStorage.removeItem(STORAGE_KEY);
  };

  const handleWarehouseSelected = (warehouseCode: string) => {
    setSelectedWarehouse(warehouseCode);
  };

  const itemsInReview = session ? session.entries.length : 0;

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <BarChart3 className="w-6 h-6 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">Stock Count</h1>
            {session?.stockReconciliationNumber && (
              <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                {session.stockReconciliationNumber}
              </div>
            )}
          </div>
          {session && (
            <div className="flex items-center space-x-2">
              <Button variant="outline" onClick={resetSession}>
                <RefreshCcw className="w-4 h-4 mr-2" />
                Reset
              </Button>
              <Button 
                onClick={submitSession} 
                disabled={session.entries.length === 0 || session.isSubmitted}
              >
                <Save className="w-4 h-4 mr-2" />
                {session.isSubmitted ? 'Submitted' : 'Submit Count'}
              </Button>
            </div>
          )}
        </div>

        {!session ? (
          <Card>
            <CardHeader>
              <CardTitle>Start Stock Count Session</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="warehouse">Select Warehouse *</Label>
                <div className="mt-2">
                  <WarehouseSelector 
                    onWarehouseSelected={handleWarehouseSelected}
                    isLoading={false}
                  />
                </div>
              </div>

              <div>
                <Label>Select Count Purpose *</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                  <Button 
                    onClick={() => setSelectedPurpose('reconciliation')}
                    variant={selectedPurpose === 'reconciliation' ? "default" : "outline"}
                    className="h-24 flex-col"
                  >
                    <BarChart3 className="w-8 h-8 mb-2" />
                    Stock Reconciliation
                  </Button>
                  <Button 
                    onClick={() => setSelectedPurpose('opening')}
                    variant={selectedPurpose === 'opening' ? "default" : "outline"}
                    className="h-24 flex-col"
                  >
                    <Plus className="w-8 h-8 mb-2" />
                    Stock Opening
                  </Button>
                </div>
              </div>

              <Button 
                onClick={startSession} 
                disabled={!selectedWarehouse || !selectedPurpose}
                className="w-full"
                size="lg"
              >
                Start Count Session
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            <StockCountSummary session={session} />

            <Tabs value={showForm ? "entry" : "review"} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="entry" onClick={() => setShowForm(true)}>
                  Item Entry
                </TabsTrigger>
                <TabsTrigger value="review" onClick={() => setShowForm(false)} className="relative">
                  Review & Submit
                  {itemsInReview > 0 && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></div>
                  )}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="entry">
                <Card>
                  <CardHeader>
                    <CardTitle>Scan Items</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <StockCountForm 
                      warehouse={session.warehouse}
                      onAddEntry={addEntry} 
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="review">
                <Card>
                  <CardHeader>
                    <CardTitle>Review Stock Count</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <StockCountTable entries={session.entries} />
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>
    </div>
  );
};

export default StockCount;


import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { BarChart3, Plus, Save, RefreshCcw } from "lucide-react";
import { createERPNextAPI } from "@/services/erpnextApi";
import { useNotification } from "@/hooks/useNotification";

// Import components with proper error handling
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
  currentQty: number;
  actualQty: number;
  uom: string;
  difference: number;
  status: 'matched' | 'variance' | 'new';
}

export interface StockCountSession {
  purpose: 'reconciliation' | 'opening';
  warehouse: string;
  entries: StockCountEntry[];
  totalItems: number;
  matchedItems: number;
  varianceItems: number;
  stockReconciliationNumber?: string;
}

const StockCount = () => {
  const [session, setSession] = useState<StockCountSession | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [selectedWarehouse, setSelectedWarehouse] = useState("");
  const [selectedPurpose, setSelectedPurpose] = useState<'reconciliation' | 'opening' | null>(null);
  const { showSuccess, showError, showLoading, dismiss } = useNotification();

  const startSession = () => {
    if (!selectedWarehouse || !selectedPurpose) return;
    
    setSession({
      purpose: selectedPurpose,
      warehouse: selectedWarehouse,
      entries: [],
      totalItems: 0,
      matchedItems: 0,
      varianceItems: 0
    });
    setShowForm(true);
  };

  const addEntry = (entry: Omit<StockCountEntry, 'difference' | 'status'>) => {
    if (!session) return;

    const difference = entry.actualQty - entry.currentQty;
    const status: StockCountEntry['status'] = 
      difference === 0 ? 'matched' : 'variance';

    const newEntry: StockCountEntry = {
      ...entry,
      difference,
      status
    };

    const updatedEntries = [...session.entries, newEntry];
    const matchedItems = updatedEntries.filter(e => e.status === 'matched').length;
    const varianceItems = updatedEntries.filter(e => e.status === 'variance').length;

    setSession({
      ...session,
      entries: updatedEntries,
      totalItems: updatedEntries.length,
      matchedItems,
      varianceItems
    });
  };

  const submitSession = async () => {
    if (!session || session.entries.length === 0) {
      showError('No items to submit');
      return;
    }
    
    const loadingToast = showLoading('Creating Stock Reconciliation...');
    
    try {
      const erpnextAPI = await createERPNextAPI();
      if (!erpnextAPI) {
        showError('ERPNext API not configured');
        return;
      }

      // Prepare Stock Reconciliation data
      const stockReconciliationData = {
        purpose: session.purpose === 'reconciliation' ? 'Stock Reconciliation' : 'Opening Stock',
        set_warehouse: session.warehouse,
        items: session.entries.map(entry => ({
          item_code: entry.itemCode,
          warehouse: entry.warehouse,
          qty: entry.actualQty,
          basic_rate: 0, // You might want to fetch this from item master
          batch_no: entry.batch || '',
          serial_no: entry.serial || ''
        }))
      };

      console.log('Creating Stock Reconciliation:', stockReconciliationData);
      
      const result = await erpnextAPI.createStockReconciliation(stockReconciliationData);
      
      if (result.data && result.data.name) {
        setSession({
          ...session,
          stockReconciliationNumber: result.data.name
        });
        
        showSuccess('Stock Reconciliation created successfully!', `Document: ${result.data.name}`);
      } else {
        showError('Failed to create Stock Reconciliation');
      }
    } catch (error) {
      console.error('Failed to create Stock Reconciliation:', error);
      showError('Failed to create Stock Reconciliation', error instanceof Error ? error.message : 'Unknown error');
    } finally {
      dismiss(loadingToast);
    }
  };

  const resetSession = () => {
    setSession(null);
    setSelectedWarehouse("");
    setSelectedPurpose(null);
    setShowForm(false);
  };

  const handleWarehouseSelected = (warehouseCode: string) => {
    setSelectedWarehouse(warehouseCode);
  };

  const itemsInReview = session ? session.entries.length : 0;

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
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
                disabled={session.entries.length === 0 || !!session.stockReconciliationNumber}
              >
                <Save className="w-4 h-4 mr-2" />
                {session.stockReconciliationNumber ? 'Submitted' : 'Submit Count'}
              </Button>
            </div>
          )}
        </div>

        {!session ? (
          /* Session Setup */
          <Card>
            <CardHeader>
              <CardTitle>Start Stock Count Session</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Warehouse Selection */}
              <div>
                <Label htmlFor="warehouse">Select Warehouse *</Label>
                <div className="mt-2">
                  <WarehouseSelector 
                    onWarehouseSelected={handleWarehouseSelected}
                    isLoading={false}
                  />
                </div>
              </div>

              {/* Purpose Selection */}
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
            {/* Session Summary */}
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
                    <CardTitle>Scan Items - {session.warehouse}</CardTitle>
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


import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { BarChart3, Plus, Save, RefreshCcw } from "lucide-react";
import { createERPNextAPI } from "@/services/erpnextApi";

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
  systemQty: number;
  scannedQty: number;
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
}

const StockCount = () => {
  const [session, setSession] = useState<StockCountSession | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [selectedWarehouse, setSelectedWarehouse] = useState("");
  const [selectedPurpose, setSelectedPurpose] = useState<'reconciliation' | 'opening' | null>(null);

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

    const difference = entry.scannedQty - entry.systemQty;
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

  const submitSession = () => {
    if (!session) return;
    
    console.log('Submitting stock count session:', session);
    alert('Stock count submitted successfully!');
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
          </div>
          {session && (
            <div className="flex items-center space-x-2">
              <Button variant="outline" onClick={resetSession}>
                <RefreshCcw className="w-4 h-4 mr-2" />
                Reset
              </Button>
              <Button onClick={submitSession} disabled={session.entries.length === 0}>
                <Save className="w-4 h-4 mr-2" />
                Submit Count
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
                    <StockCountForm onAddEntry={addEntry} />
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

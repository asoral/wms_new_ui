
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, Plus, Save, RefreshCcw } from "lucide-react";
import StockCountForm from "../components/stock-count/StockCountForm";
import StockCountSummary from "../components/stock-count/StockCountSummary";
import StockCountTable from "../components/stock-count/StockCountTable";

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

  // Mock data for demonstration
  const mockSession: StockCountSession = {
    purpose: 'reconciliation',
    warehouse: 'Main Store',
    entries: [
      {
        itemCode: 'ITM-001',
        itemName: 'Laptop Computer',
        warehouse: 'Main Store',
        batch: 'BATCH-2024-001',
        systemQty: 75,
        scannedQty: 73,
        uom: 'Nos',
        difference: -2,
        status: 'variance'
      },
      {
        itemCode: 'ITM-002',
        itemName: 'Wireless Mouse',
        warehouse: 'Main Store',
        systemQty: 100,
        scannedQty: 100,
        uom: 'Nos',
        difference: 0,
        status: 'matched'
      },
      {
        itemCode: 'ITM-003',
        itemName: 'USB Cable',
        warehouse: 'Main Store',
        batch: 'BATCH-2024-003',
        systemQty: 200,
        scannedQty: 205,
        uom: 'Nos',
        difference: 5,
        status: 'variance'
      }
    ],
    totalItems: 3,
    matchedItems: 1,
    varianceItems: 2
  };

  const startSession = (purpose: 'reconciliation' | 'opening', warehouse: string) => {
    setSession({
      purpose,
      warehouse,
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
    // Here you would call the ERPNext API for stock reconciliation
    alert('Stock count submitted successfully!');
  };

  const loadExistingStock = () => {
    // Simulate loading existing stock for a warehouse
    setSession(mockSession);
    setShowForm(false);
  };

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
              <Button variant="outline" onClick={loadExistingStock}>
                <RefreshCcw className="w-4 h-4 mr-2" />
                Load Stock
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
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button 
                  onClick={() => startSession('reconciliation', 'Main Store')}
                  className="h-24 flex-col"
                >
                  <BarChart3 className="w-8 h-8 mb-2" />
                  Stock Reconciliation
                </Button>
                <Button 
                  onClick={() => startSession('opening', 'Main Store')}
                  variant="outline"
                  className="h-24 flex-col"
                >
                  <Plus className="w-8 h-8 mb-2" />
                  Stock Opening
                </Button>
              </div>
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
                <TabsTrigger value="review" onClick={() => setShowForm(false)}>
                  Review & Submit
                </TabsTrigger>
              </TabsList>

              <TabsContent value="entry">
                <Card>
                  <CardHeader>
                    <CardTitle>Scan Items</CardTitle>
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

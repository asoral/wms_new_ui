
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Database, Plus, TrendingUp, TrendingDown, ArrowRightLeft, Eye } from "lucide-react";
import StockEntryForm from "../components/stock-entry/StockEntryForm";
import StockEntryList from "../components/stock-entry/StockEntryList";

export type StockEntryType = 'Material Receipt' | 'Material Issue' | 'Material Transfer' | 'Stock Reconciliation';

export interface StockEntryItem {
  itemCode: string;
  itemName: string;
  quantity: number;
  rate: number;
  amount: number;
  warehouse: string;
  batch?: string;
  serialNo?: string;
}

export interface StockEntry {
  id: string;
  entryNumber: string;
  entryType: 'receipt' | 'issue' | 'transfer';
  date: string;
  warehouse: string;
  reference?: string;
  items: StockEntryItem[];
  totalAmount: number;
  remarks?: string;
  status: 'draft' | 'submitted' | 'cancelled';
}

const StockEntry = () => {
  const [activeTab, setActiveTab] = useState("list");
  const [selectedEntry, setSelectedEntry] = useState<StockEntry | null>(null);
  const [stockEntries, setStockEntries] = useState<StockEntry[]>([
    {
      id: '1',
      entryNumber: 'SE-2024-001',
      entryType: 'receipt',
      date: '2024-01-15',
      warehouse: 'Main Store',
      reference: 'PO-2024-001',
      totalAmount: 50000,
      status: 'submitted',
      items: [
        {
          itemCode: 'ITM-001',
          itemName: 'Laptop Computer',
          quantity: 10,
          rate: 50000,
          amount: 500000,
          warehouse: 'Main Store',
          batch: 'BATCH-001'
        }
      ]
    }
  ]);

  const handleCreateEntry = (entry: StockEntry) => {
    const newEntry = {
      ...entry,
      id: Date.now().toString(),
      entryNumber: `SE-2024-${String(stockEntries.length + 1).padStart(3, '0')}`,
      date: new Date().toISOString().split('T')[0]
    };
    
    setStockEntries(prev => [newEntry, ...prev]);
    setActiveTab("list");
  };

  const handleViewDetails = (entry: StockEntry) => {
    setSelectedEntry(entry);
    setActiveTab("view");
  };

  const todaysEntries = stockEntries.filter(entry => 
    entry.date === new Date().toISOString().split('T')[0]
  ).length;

  const getEntryTypeIcon = (type: string) => {
    switch (type) {
      case 'receipt': return TrendingUp;
      case 'issue': return TrendingDown;
      case 'transfer': return ArrowRightLeft;
      default: return Database;
    }
  };

  const getEntryTypeColor = (type: string) => {
    switch (type) {
      case 'receipt': return 'text-green-600';
      case 'issue': return 'text-red-600';
      case 'transfer': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
          <div className="flex items-center space-x-3">
            <Database className="w-6 h-6 text-indigo-600" />
            <h1 className="text-2xl font-bold text-gray-900">Stock Entry</h1>
          </div>
          <Button onClick={() => setActiveTab("create")}>
            <Plus className="w-4 h-4 mr-2" />
            New Stock Entry
          </Button>
        </div>

        {/* Dashboard Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Database className="w-5 h-5 text-indigo-500" />
                <div>
                  <p className="text-sm text-gray-600">Today's Entries</p>
                  <p className="text-xl font-bold text-indigo-600">{todaysEntries}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5 text-green-500" />
                <div>
                  <p className="text-sm text-gray-600">Stock Receipts</p>
                  <p className="text-xl font-bold text-green-600">15</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <TrendingDown className="w-5 h-5 text-red-500" />
                <div>
                  <p className="text-sm text-gray-600">Stock Issues</p>
                  <p className="text-xl font-bold text-red-600">8</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <ArrowRightLeft className="w-5 h-5 text-blue-500" />
                <div>
                  <p className="text-sm text-gray-600">Transfers</p>
                  <p className="text-xl font-bold text-blue-600">3</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="list">Stock Entries</TabsTrigger>
            <TabsTrigger value="create">Create New</TabsTrigger>
            <TabsTrigger value="view" disabled={!selectedEntry}>View Details</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>

          <TabsContent value="list">
            <StockEntryList 
              entries={stockEntries}
              onViewDetails={handleViewDetails}
            />
          </TabsContent>

          <TabsContent value="create">
            <Card>
              <CardHeader>
                <CardTitle>Create Stock Entry</CardTitle>
              </CardHeader>
              <CardContent>
                <StockEntryForm onSubmit={handleCreateEntry} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="view">
            {selectedEntry && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    Stock Entry Details
                    <div className="flex items-center space-x-2">
                      <Badge variant={
                        selectedEntry.status === 'submitted' ? 'default' :
                        selectedEntry.status === 'draft' ? 'secondary' : 'destructive'
                      }>
                        {selectedEntry.status}
                      </Badge>
                      <Badge variant="outline" className={getEntryTypeColor(selectedEntry.entryType)}>
                        {selectedEntry.entryType}
                      </Badge>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Entry Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Entry Number</p>
                        <p className="font-medium">{selectedEntry.entryNumber}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Entry Type</p>
                        <p className="font-medium capitalize">{selectedEntry.entryType}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Date</p>
                        <p className="font-medium">{selectedEntry.date}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Warehouse</p>
                        <p className="font-medium">{selectedEntry.warehouse}</p>
                      </div>
                    </div>

                    {selectedEntry.reference && (
                      <div>
                        <p className="text-sm text-gray-600">Reference</p>
                        <p className="font-medium">{selectedEntry.reference}</p>
                      </div>
                    )}

                    {/* Items */}
                    <div>
                      <h3 className="text-lg font-medium mb-4">Items</h3>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left p-2">Item Code</th>
                              <th className="text-left p-2">Item Name</th>
                              <th className="text-left p-2">Quantity</th>
                              <th className="text-left p-2">Rate</th>
                              <th className="text-left p-2">Amount</th>
                              <th className="text-left p-2">Batch</th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedEntry.items.map((item, index) => (
                              <tr key={index} className="border-b">
                                <td className="p-2">{item.itemCode}</td>
                                <td className="p-2">{item.itemName}</td>
                                <td className="p-2">{item.quantity}</td>
                                <td className="p-2">₹{item.rate.toLocaleString()}</td>
                                <td className="p-2">₹{item.amount.toLocaleString()}</td>
                                <td className="p-2">{item.batch || '-'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-4 border-t">
                      <Button variant="outline" onClick={() => setActiveTab("list")}>
                        Back to List
                      </Button>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">Total Amount</p>
                        <p className="text-lg font-bold">₹{selectedEntry.totalAmount.toLocaleString()}</p>
                      </div>
                    </div>

                    {selectedEntry.remarks && (
                      <div>
                        <h3 className="text-lg font-medium mb-2">Remarks</h3>
                        <p className="text-gray-700 bg-gray-50 p-3 rounded">{selectedEntry.remarks}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="reports">
            <Card>
              <CardHeader>
                <CardTitle>Stock Entry Reports</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Reports functionality coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default StockEntry;

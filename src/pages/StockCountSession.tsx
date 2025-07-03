import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, RotateCcw, Save } from "lucide-react";
import StockCountForm from "@/components/stock-count/StockCountForm";
import { StockCountEntry } from "@/types";
import { useToast } from "@/hooks/use-toast";

const StockCountSession = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const warehouse = searchParams.get('warehouse') || '';
  const purpose = searchParams.get('purpose') || 'Stock Reconciliation';
  const [entries, setEntries] = useState<StockCountEntry[]>([]);
  const [activeTab, setActiveTab] = useState("entry");
  const { toast } = useToast();

  const totalItems = entries.length;
  const matchedItems = entries.filter(entry => entry.status === 'matched').length;
  const varianceItems = entries.filter(entry => entry.status === 'variance').length;

  const handleEntryAdded = (entry: StockCountEntry) => {
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
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center space-x-2">
            <BarChart3 className="w-6 h-6" />
            <span>Stock Count</span>
          </h1>
          <p className="text-gray-500">Warehouse: {warehouse}</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={handleReset}>
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset
          </Button>
          <Button onClick={handleSubmitCount}>
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
          <div className="grid grid-cols-3 gap-6 text-center">
            <div>
              <div className="text-3xl font-bold text-gray-600">{totalItems}</div>
              <div className="text-sm text-gray-500">Total Items</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-green-600">{matchedItems}</div>
              <div className="text-sm text-gray-500">Matched</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-red-600">{varianceItems}</div>
              <div className="text-sm text-gray-500">Variance</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs for Entry and Review */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="entry">Item Entry</TabsTrigger>
          <TabsTrigger value="review">Review & Submit</TabsTrigger>
        </TabsList>

        <TabsContent value="entry" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Scan Items</CardTitle>
            </CardHeader>
            <CardContent>
              <StockCountForm onEntryAdded={handleEntryAdded} />
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
                <div className="overflow-x-auto">
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
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default StockCountSession;

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, Loader2, Eye, Package, TrendingUp, Clock, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { MetricCard } from "@/components/ui/metric-card";
import { createERPNextAPI } from "@/services/erpnextApi";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";

interface DraftReceipt {
  id: string;
  supplier: string;
  date: string;
  items: number;
  amount: number;
}

interface DashboardMetrics {
  todaysReceipts: number;
  draftReceipts: number;
  itemsReceived: number;
  overdueReceipts: number;
}

interface ReceiveDashboardProps {
  onSelectPO: (poNumber: string) => void;
  onSelectDraftReceipt?: (receiptId: string) => void;
  shortcuts: Array<{
    label: string;
    icon: any;
    action: () => void;
  }>;
}

const ReceiveDashboard = ({ onSelectPO, onSelectDraftReceipt, shortcuts }: ReceiveDashboardProps) => {
  const [poNumber, setPONumber] = useState("");
  const [draftReceipts, setDraftReceipts] = useState<DraftReceipt[]>([]);
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    todaysReceipts: 0,
    draftReceipts: 0,
    itemsReceived: 0,
    overdueReceipts: 0
  });
  const [loading, setLoading] = useState(false);
  const [metricsLoading, setMetricsLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();
  const isMobile = useIsMobile();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    setMetricsLoading(true);
    try {
      const erpnextAPI = await createERPNextAPI();
      if (!erpnextAPI) {
        toast({
          title: "ERPNext Not Configured",
          description: "Please configure your ERPNext settings in the Profile page.",
          variant: "destructive"
        });
        return;
      }

      // Fetch draft purchase receipts
      const draftFilters = { docstatus: 0 }; // 0 for draft
      const receiptsResult = await erpnextAPI.purchase.getPurchaseReceipts(draftFilters);

      let transformedReceipts: DraftReceipt[] = [];
      
      if (receiptsResult.data) {
        transformedReceipts = receiptsResult.data.map((receipt: any) => ({
          id: receipt.name,
          supplier: receipt.supplier,
          date: receipt.posting_date,
          items: receipt.items ? receipt.items.length : 0,
          amount: receipt.grand_total || 0
        }));
        setDraftReceipts(transformedReceipts);
      }

      // Fetch today's submitted receipts
      const today = new Date().toISOString().split('T')[0];
      const todayFilters = { 
        docstatus: 1,
        posting_date: today
      };
      const todayReceiptsResult = await erpnextAPI.purchase.getPurchaseReceipts(todayFilters);

      // Fetch all submitted receipts for total items count
      const submittedFilters = { docstatus: 1 };
      const allReceiptsResult = await erpnextAPI.purchase.getPurchaseReceipts(submittedFilters, undefined, 1000);
      
      let totalItemsReceived = 0;
      if (allReceiptsResult.data) {
        totalItemsReceived = allReceiptsResult.data.reduce((total: number, receipt: any) => {
          return total + (receipt.items ? receipt.items.length : 0);
        }, 0);
      }

      // Calculate overdue receipts (POs past schedule date that are still pending)
      const overdueFilters = {
        docstatus: 1,
        status: ['To Receive', 'To Receive and Bill', 'Partially Received'],
        schedule_date: ['<', today]
      };
      const overduePOsResult = await erpnextAPI.purchase.getPurchaseOrders(overdueFilters);

      setMetrics({
        todaysReceipts: todayReceiptsResult.data ? todayReceiptsResult.data.length : 0,
        draftReceipts: transformedReceipts.length,
        itemsReceived: totalItemsReceived,
        overdueReceipts: overduePOsResult.data ? overduePOsResult.data.length : 0
      });

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch dashboard data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      setMetricsLoading(false);
    }
  };

  const handlePOSearch = () => {
    if (poNumber.trim()) {
      onSelectPO(poNumber.trim());
    }
  };

  const handleDraftReceiptView = (receiptId: string) => {
    if (onSelectDraftReceipt) {
      onSelectDraftReceipt(receiptId);
    }
  };

  const MobileDraftReceiptCard = ({ receipt }: { receipt: DraftReceipt }) => (
    <Card className="w-full">
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="flex justify-between items-start">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg text-blue-600 truncate">{receipt.id}</h3>
              <p className="text-sm text-gray-600 truncate">{receipt.supplier}</p>
            </div>
            <Badge variant="secondary">Draft</Badge>
          </div>
          
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-gray-500">Date</p>
              <p className="font-medium">{receipt.date}</p>
            </div>
            <div>
              <p className="text-gray-500">Items</p>
              <p className="font-medium">{receipt.items} items</p>
            </div>
          </div>
          
          <div className="flex justify-between items-center pt-2">
            <div>
              <p className="text-gray-500 text-sm">Amount</p>
              <p className="font-semibold">₹{receipt.amount.toLocaleString()}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleDraftReceiptView(receipt.id)}
            >
              <Eye className="w-4 h-4 mr-1" />
              View
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Dashboard Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metricsLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="flex items-center p-6">
                <div className="flex items-center space-x-4">
                  <div className="p-2 bg-gray-100 rounded-lg animate-pulse">
                    <div className="w-6 h-6 bg-gray-300 rounded"></div>
                  </div>
                  <div>
                    <div className="h-4 bg-gray-200 rounded w-20 mb-2 animate-pulse"></div>
                    <div className="h-6 bg-gray-200 rounded w-16 animate-pulse"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <>
            <MetricCard
              title="Today's Receipts"
              value={metrics.todaysReceipts.toString()}
              icon={Package}
            />
            <MetricCard
              title="Draft Receipts"
              value={metrics.draftReceipts.toString()}
              icon={Clock}
            />
            <MetricCard
              title="Items Received"
              value={metrics.itemsReceived.toString()}
              icon={TrendingUp}
            />
            <MetricCard
              title="Overdue Receipts"
              value={metrics.overdueReceipts.toString()}
              icon={AlertTriangle}
            />
          </>
        )}
      </div>

      {/* PO Search */}
      <Card>
        <CardHeader>
          <CardTitle>Receive Items from Purchase Order</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-2">
            <Input
              type="text"
              placeholder="Enter Purchase Order Number"
              value={poNumber}
              onChange={(e) => setPONumber(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handlePOSearch()}
              className="flex-1"
            />
            <Button onClick={handlePOSearch} className="w-full sm:w-auto">
              <Search className="w-4 h-4 mr-2" />
              Search
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Draft Purchase Receipts */}
      <Card>
        <CardHeader>
          <CardTitle>Draft Purchase Receipts</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              <span className="ml-2 text-gray-600">Loading draft receipts...</span>
            </div>
          ) : (
            <>
              {isMobile ? (
                <div className="space-y-4">
                  {draftReceipts.map((receipt) => (
                    <MobileDraftReceiptCard key={receipt.id} receipt={receipt} />
                  ))}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">Receipt ID</th>
                        <th className="text-left py-2">Supplier</th>
                        <th className="text-left py-2">Date</th>
                        <th className="text-left py-2">Items</th>
                        <th className="text-left py-2">Amount</th>
                        <th className="text-left py-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {draftReceipts.map((receipt) => (
                        <tr key={receipt.id} className="border-b hover:bg-gray-50">
                          <td className="py-3 font-medium text-blue-600">{receipt.id}</td>
                          <td className="py-3">{receipt.supplier}</td>
                          <td className="py-3">{receipt.date}</td>
                          <td className="py-3">{receipt.items} items</td>
                          <td className="py-3">₹{receipt.amount.toLocaleString()}</td>
                          <td className="py-3">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDraftReceiptView(receipt.id)}
                              className="flex items-center"
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              View
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {draftReceipts.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No draft purchase receipts found
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {shortcuts.map((shortcut, index) => (
              <Button 
                key={index} 
                onClick={shortcut.action} 
                variant="outline"
                className="h-16 flex flex-col items-center justify-center space-y-2 hover:bg-blue-50 hover:border-blue-200"
              >
                <shortcut.icon className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-medium">{shortcut.label}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReceiveDashboard;


import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Package, FileText, CheckCircle, AlertTriangle } from "lucide-react";
import { MetricCard } from "@/components/ui/metric-card";
import { createERPNextAPI, getUserDefaultCompany } from "@/services/erpnextApi";
import { useToast } from "@/hooks/use-toast";
import StatusBadge from "@/components/ui/status-badge";
import PurchaseOrderSelector from "./PurchaseOrderSelector";

interface ReceiveDashboardProps {
  onSelectPO: (purchaseOrder: any) => void;
  onSelectDraftReceipt: (receiptId: string) => void;
  shortcuts?: Array<{
    label: string;
    icon: any;
    action: () => void;
  }>;
}

interface DashboardAnalytics {
  totalPOs: number;
  pendingPOs: number;
  completedPOs: number;
  draftReceipts: number;
}

const ReceiveDashboard = ({ onSelectPO, onSelectDraftReceipt, shortcuts = [] }: ReceiveDashboardProps) => {
  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([]);
  const [draftReceipts, setDraftReceipts] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<DashboardAnalytics>({
    totalPOs: 0,
    pendingPOs: 0,
    completedPOs: 0,
    draftReceipts: 0
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
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

      const company = await getUserDefaultCompany();
      
      // Fetch purchase orders
      const poFilters = [
        ['docstatus', '=', 1], // Submitted orders only
        ['status', 'in', ['To Receive', 'To Receive and Bill', 'Partially Received']]
      ];

      const poResponse = await erpnextAPI.getPurchaseOrders(poFilters, company || undefined);
      
      if (poResponse?.data && Array.isArray(poResponse.data)) {
        setPurchaseOrders(poResponse.data);
      }

      // Fetch draft purchase receipts
      const receiptFilters = [
        ['docstatus', '=', 0] // Draft receipts only
      ];

      const receiptResponse = await erpnextAPI.getPurchaseReceipts(receiptFilters, company || undefined);
      
      if (receiptResponse?.data && Array.isArray(receiptResponse.data)) {
        setDraftReceipts(receiptResponse.data);
      }

      // Calculate analytics
      const totalPOs = poResponse?.data?.length || 0;
      const pendingPOs = poResponse?.data?.filter((po: any) => po.status === 'To Receive').length || 0;
      const completedPOs = poResponse?.data?.filter((po: any) => po.status === 'Completed').length || 0;
      const draftReceiptsCount = receiptResponse?.data?.length || 0;

      setAnalytics({
        totalPOs,
        pendingPOs,
        completedPOs,
        draftReceipts: draftReceiptsCount
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
    }
  };


  return (
    <div className="space-y-6">
      {/* Dashboard Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Purchase Orders"
          value={analytics.totalPOs.toString()}
          icon={FileText}
        />
        <MetricCard
          title="Pending to Receive"
          value={analytics.pendingPOs.toString()}
          icon={Package}
        />
        <MetricCard
          title="Completed"
          value={analytics.completedPOs.toString()}
          icon={CheckCircle}
        />
        <MetricCard
          title="Draft Receipts"
          value={analytics.draftReceipts.toString()}
          icon={AlertTriangle}
        />
      </div>

      {/* PO Selector */}
      <PurchaseOrderSelector 
        onSelectPO={onSelectPO}
        shortcuts={[]}
      />

      {/* Recent Purchase Orders */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Purchase Orders to Receive</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-4">Loading purchase orders...</div>
          ) : (
            <div className="space-y-4">
              {purchaseOrders.slice(0, 5).map((po) => (
                <div key={po.name} className="border rounded-lg p-4 flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">{po.name}</h3>
                    <p className="text-sm text-gray-600">
                      {po.supplier} - ₹{(po.grand_total || 0).toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-500">
                      Due: {new Date(po.schedule_date || po.transaction_date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <StatusBadge status={po.status} />
                    <Button size="sm" onClick={() => onSelectPO(po)}>
                      Receive
                    </Button>
                  </div>
                </div>
              ))}
              {purchaseOrders.length === 0 && (
                <div className="text-center py-4 text-gray-500">
                  No purchase orders to receive
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Draft Purchase Receipts */}
      {draftReceipts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Draft Purchase Receipts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {draftReceipts.map((receipt) => (
                <div key={receipt.name} className="border rounded-lg p-4 flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">{receipt.name}</h3>
                    <p className="text-sm text-gray-600">
                      {receipt.supplier} - ₹{(receipt.grand_total || 0).toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-500">
                      Created: {new Date(receipt.posting_date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <StatusBadge status="Draft" />
                    <Button size="sm" onClick={() => onSelectDraftReceipt(receipt.name)}>
                      Continue
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      {shortcuts.length > 0 && (
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
      )}
    </div>
  );
};

export default ReceiveDashboard;

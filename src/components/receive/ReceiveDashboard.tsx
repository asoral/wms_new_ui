
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { Search, FileText, Package, CheckCircle, Clock, LucideIcon } from "lucide-react";
import { createERPNextAPI, getUserDefaultCompany } from "@/services/erpnextApi";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import POSelector from "./POSelector";

interface DashboardData {
  pendingPOs: number;
  pendingPOsToday: number;
  receiptsThisWeek: number;
  draftReceipts: number;
  pendingQC: number;
}

interface Shortcut {
  label: string;
  icon: LucideIcon;
  action: () => void;
}

interface ReceiveDashboardProps {
  onSelectPO: (poNumber: string) => void;
  shortcuts: Shortcut[];
}

const ReceiveDashboard = ({ onSelectPO, shortcuts }: ReceiveDashboardProps) => {
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardData>({
    pendingPOs: 0,
    pendingPOsToday: 0,
    receiptsThisWeek: 0,
    draftReceipts: 0,
    pendingQC: 0
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const erpnextAPI = await createERPNextAPI();
      if (!erpnextAPI) {
        toast({
          title: "ERPNext Not Configured",
          description: "Please configure your ERPNext settings in the Profile page.",
          variant: "destructive"
        });
        return;
      }

      const defaultCompany = await getUserDefaultCompany();
      
      // Get today's date and week boundaries
      const today = new Date().toISOString().split('T')[0];
      const now = new Date();
      const dayOfWeek = now.getDay();
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - dayOfWeek);
      const endOfWeek = new Date(now);
      endOfWeek.setDate(now.getDate() + (6 - dayOfWeek));

      const [allPendingPOs, pendingPOsToday, receiptsThisWeek, draftPRResult, qcResult] = await Promise.allSettled([
        // All Pending POs (To Receive, To Receive and Bill)
        erpnextAPI.getPurchaseOrders([
          ['docstatus', '=', 1],
          ['status', 'in', ['To Receive', 'To Receive and Bill']]
        ], defaultCompany || undefined),
        
        // Pending POs with schedule_date = today
        erpnextAPI.getPurchaseOrders([
          ['docstatus', '=', 1],
          ['status', 'in', ['To Receive', 'To Receive and Bill']],
          ['schedule_date', '=', today]
        ], defaultCompany || undefined),
        
        // POs to be received this week (schedule_date in this week)
        erpnextAPI.getPurchaseOrders([
          ['docstatus', '=', 1],
          ['status', 'in', ['To Receive', 'To Receive and Bill']],
          ['schedule_date', 'between', [startOfWeek.toISOString().split('T')[0], endOfWeek.toISOString().split('T')[0]]]
        ], defaultCompany || undefined),
        
        // Draft Purchase Receipts
        erpnextAPI.getPurchaseReceipts([['docstatus', '=', 0]], defaultCompany || undefined),
        
        // Pending QC (Quality Inspections with type=incoming and docstatus=0)
        fetch(`${erpnextAPI.baseURL}/api/resource/Quality Inspection?filters=${JSON.stringify([
          ['inspection_type', '=', 'Incoming'],
          ['docstatus', '=', 0]
        ])}&limit_page_length=1000`, {
          headers: erpnextAPI.getHeaders()
        }).then(res => res.json())
      ]);

      const pendingPOs = allPendingPOs.status === 'fulfilled' && allPendingPOs.value?.data ? allPendingPOs.value.data.length : 0;
      const pendingPOsTodayCount = pendingPOsToday.status === 'fulfilled' && pendingPOsToday.value?.data ? pendingPOsToday.value.data.length : 0;
      const receiptsThisWeekCount = receiptsThisWeek.status === 'fulfilled' && receiptsThisWeek.value?.data ? receiptsThisWeek.value.data.length : 0;
      const draftReceipts = draftPRResult.status === 'fulfilled' && draftPRResult.value?.data ? draftPRResult.value.data.length : 0;
      const pendingQC = qcResult.status === 'fulfilled' && qcResult.value?.data ? qcResult.value.data.length : 0;

      setData({
        pendingPOs,
        pendingPOsToday: pendingPOsTodayCount,
        receiptsThisWeek: receiptsThisWeekCount,
        draftReceipts,
        pendingQC
      });

    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data from ERPNext",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCardClick = (type: string) => {
    switch (type) {
      case 'pendingPOs':
        toast({
          title: "Pending POs",
          description: `${data.pendingPOs} total pending POs (${data.pendingPOsToday} due today)`,
        });
        break;
      case 'receiptsThisWeek':
        toast({
          title: "Receipts This Week",
          description: `${data.receiptsThisWeek} purchase orders to be received this week`,
        });
        break;
      case 'draftReceipts':
        // Navigate to draft receipts list
        navigate('/receive/drafts');
        break;
      case 'pendingQC':
        navigate('/quality-check');
        break;
    }
  };

  const dashboardItems = [
    {
      title: "Pending POs",
      value: `${data.pendingPOs} (${data.pendingPOsToday})`,
      icon: Clock,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      type: "pendingPOs"
    },
    {
      title: "Receipts This Week",
      value: data.receiptsThisWeek,
      icon: Package,
      color: "text-green-600",
      bgColor: "bg-green-50",
      type: "receiptsThisWeek"
    },
    {
      title: "Draft Receipts",
      value: data.draftReceipts,
      icon: FileText,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      type: "draftReceipts"
    },
    {
      title: "Pending QC",
      value: data.pendingQC,
      icon: CheckCircle,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      type: "pendingQC"
    }
  ];

  return (
    <div className="space-y-6">
      {/* PO Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Search className="w-5 h-5" />
            <span>Select Purchase Order</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <POSelector onSelectPO={onSelectPO} loading={loading} />
        </CardContent>
      </Card>

      {/* Dashboard Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {dashboardItems.map((item, index) => {
          const Icon = item.icon;
          return (
            <Card 
              key={index} 
              className={`cursor-pointer hover:shadow-md transition-shadow ${item.bgColor}`}
              onClick={() => handleCardClick(item.type)}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">{item.title}</p>
                    <p className={`text-2xl font-bold ${item.color}`}>
                      {loading ? "..." : item.value}
                    </p>
                  </div>
                  <Icon className={`w-8 h-8 ${item.color}`} />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {shortcuts.map((shortcut, index) => {
              const Icon = shortcut.icon;
              return (
                <Button
                  key={index}
                  variant="outline"
                  onClick={shortcut.action}
                  className="h-16 flex-col"
                >
                  <Icon className="w-6 h-6 mb-2" />
                  {shortcut.label}
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReceiveDashboard;

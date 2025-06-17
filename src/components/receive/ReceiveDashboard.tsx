
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import { Search, FileText, Package, CheckCircle, Clock, LucideIcon } from "lucide-react";
import { createERPNextAPI, getUserDefaultCompany } from "@/services/erpnextApi";
import { useToast } from "@/hooks/use-toast";
import POSelector from "./POSelector";

interface DashboardData {
  pendingPOs: number;
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
  const [data, setData] = useState<DashboardData>({
    pendingPOs: 0,
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

      // Fetch dashboard data from ERPNext
      const [poResult, prResult] = await Promise.allSettled([
        erpnextAPI.getPurchaseOrders([['status', 'in', ['To Receive', 'To Receive and Bill']]], defaultCompany || undefined),
        erpnextAPI.getPurchaseReceipts([['docstatus', '=', 0]], defaultCompany || undefined)
      ]);

      const pendingPOs = poResult.status === 'fulfilled' && poResult.value?.data ? poResult.value.data.length : 0;
      const draftReceipts = prResult.status === 'fulfilled' && prResult.value?.data ? prResult.value.data.length : 0;

      setData({
        pendingPOs,
        receiptsThisWeek: 0, // Calculate this based on date filters
        draftReceipts,
        pendingQC: 0 // Calculate based on quality inspection status
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

  const dashboardItems = [
    {
      title: "Pending POs (Today)",
      value: data.pendingPOs,
      icon: Clock,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      clickable: true
    },
    {
      title: "Receipts This Week",
      value: data.receiptsThisWeek,
      icon: Package,
      color: "text-green-600",
      bgColor: "bg-green-50",
      clickable: true
    },
    {
      title: "Draft Receipts",
      value: data.draftReceipts,
      icon: FileText,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      clickable: true
    },
    {
      title: "Pending QC",
      value: data.pendingQC,
      icon: CheckCircle,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      clickable: true
    }
  ];

  return (
    <div className="space-y-6">
      {/* PO Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Search className="w-5 h-5" />
            <span>Select Purchase Order</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <POSelector onSelectPO={onSelectPO} />
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
              onClick={() => item.clickable && console.log(`Clicked ${item.title}`)}
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

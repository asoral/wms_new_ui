import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Package, 
  Search, 
  BarChart3, 
  ShoppingCart, 
  Truck, 
  FileText, 
  CheckCircle, 
  Printer,
  Database,
  Layers,
  ClipboardList,
  Package2,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  AlertTriangle,
  Calendar,
  Users
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createERPNextAPI, getUserDefaultCompany } from "@/services/erpnextApi";
import LoadingSpinner from "@/components/LoadingSpinner";

interface StockAgingData {
  range_0_30_percent: number;
  range_31_60_percent: number;
  range_61_90_percent: number;
  range_90_plus_percent: number;
  totalValue: number;
}

const Home = () => {
  const navigate = useNavigate();
  const [showAllActions, setShowAllActions] = useState(false);
  const [stockAgingData, setStockAgingData] = useState<StockAgingData | null>(null);
  const [loadingStockAging, setLoadingStockAging] = useState(true);

  const quickActions = [
    { icon: Package, label: "Item Enquiry", color: "bg-blue-500", path: "/item-enquiry" },
    { icon: ShoppingCart, label: "Receive", color: "bg-orange-500", path: "/receive" },
    { icon: Truck, label: "Deliver", color: "bg-red-500", path: "/deliver" },
    { icon: Search, label: "Bin Enquiry", color: "bg-green-500", path: "/bin-enquiry" },
    { icon: BarChart3, label: "Stock Count", color: "bg-purple-500", path: "/stock-count" },
    { icon: FileText, label: "Mat. Request", color: "bg-teal-500", path: "/material-request" },
    { icon: Database, label: "Stock Entry", color: "bg-indigo-500", path: "/stock-entry" },
    { icon: ClipboardList, label: "Pick List", color: "bg-pink-500", path: "/pick-list" },
    { icon: Package2, label: "Packing", color: "bg-cyan-500", path: "/packing" },
    { icon: Printer, label: "Print Label", color: "bg-gray-500", path: "/print-label" },
    { icon: CheckCircle, label: "Quality Check", color: "bg-emerald-500", path: "/quality-check" },
    { icon: Layers, label: "Pallet", color: "bg-yellow-500", path: "/pallet" }
  ];

  // Show only 4 actions by default in one row, rest can be expanded
  const visibleActions = showAllActions ? quickActions : quickActions.slice(0, 4);

  const recentActivities = [
    { action: "Stock received", item: "SKU-001", time: "2 min ago", status: "completed" },
    { action: "Pick list generated", item: "Order #1234", time: "5 min ago", status: "pending" },
    { action: "Quality check", item: "Batch #567", time: "15 min ago", status: "completed" },
    { action: "Delivery scheduled", item: "Order #1235", time: "30 min ago", status: "in-progress" }
  ];

  useEffect(() => {
    const fetchStockAgingData = async () => {
      try {
        setLoadingStockAging(true);
        const erpnextAPI = await createERPNextAPI();
        if (!erpnextAPI) {
          console.log('ERPNext API not configured');
          return;
        }

        const defaultCompany = await getUserDefaultCompany();
        const result = await erpnextAPI.getStockAgingReport([], defaultCompany || undefined);
        
        if (result.data) {
          setStockAgingData(result.data);
        }
      } catch (error) {
        console.error('Failed to fetch stock aging data:', error);
      } finally {
        setLoadingStockAging(false);
      }
    };

    fetchStockAgingData();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'in-progress': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20 overflow-y-auto">
      {/* Header - Remove for dashboard but keep for other pages */}
      <div className="bg-white border-b border-gray-200 px-4 py-6">
        <div className="max-w-6xl mx-auto">
          {/* Enhanced Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Package className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Items</p>
                    <p className="text-lg font-semibold">1,247</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Pending Orders</p>
                    <p className="text-lg font-semibold">23</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                    <Truck className="w-4 h-4 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">In Transit</p>
                    <p className="text-lg font-semibold">8</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                    <BarChart3 className="w-4 h-4 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Stock Level</p>
                    <p className="text-lg font-semibold">94%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Quick Actions */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Access your most used warehouse operations</CardDescription>
              </CardHeader>
              <CardContent>
                {/* Responsive grid - 4 columns on desktop, 2 on mobile, single row by default */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {visibleActions.map((action, index) => {
                    const Icon = action.icon;
                    return (
                      <Button
                        key={index}
                        variant="outline"
                        className="h-20 flex-col space-y-2 hover:shadow-md transition-all duration-200"
                        onClick={() => navigate(action.path)}
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${action.color}`}>
                          <Icon className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-sm font-medium">{action.label}</span>
                      </Button>
                    );
                  })}
                </div>
                
                {quickActions.length > 4 && (
                  <Button
                    variant="ghost"
                    className="w-full mt-4"
                    onClick={() => setShowAllActions(!showAllActions)}
                  >
                    {showAllActions ? (
                      <>
                        <ChevronUp className="w-4 h-4 mr-2" />
                        Show Less
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-4 h-4 mr-2" />
                        Show All Actions ({quickActions.length - 4} more)
                      </>
                    )}
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Recent Activities */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Recent Activities</CardTitle>
                <CardDescription>Latest warehouse operations</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {recentActivities.map((activity, index) => (
                  <div key={index} className="flex items-center space-x-3 p-3 rounded-lg bg-gray-50">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                      <p className="text-xs text-gray-600">{activity.item}</p>
                      <p className="text-xs text-gray-500">{activity.time}</p>
                    </div>
                    <Badge className={`text-xs ${getStatusColor(activity.status)}`}>
                      {activity.status}
                    </Badge>
                  </div>
                ))}
                <Button variant="outline" className="w-full">
                  View All Activities
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Enhanced Charts and Analytics */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
          {/* Stock Aging */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="w-5 h-5" />
                <span>Stock Aging</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingStockAging ? (
                <div className="flex justify-center py-8">
                  <LoadingSpinner size={32} />
                </div>
              ) : stockAgingData ? (
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">0-30 Days</span>
                    <span className="font-medium">{stockAgingData.range_0_30_percent}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">31-60 Days</span>
                    <span className="font-medium">{stockAgingData.range_31_60_percent}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">61-90 Days</span>
                    <span className="font-medium">{stockAgingData.range_61_90_percent}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-red-600">90+ Days</span>
                    <span className="font-medium text-red-600">{stockAgingData.range_90_plus_percent}%</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">0-30 Days</span>
                    <span className="font-medium">68%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">31-60 Days</span>
                    <span className="font-medium">22%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">61-90 Days</span>
                    <span className="font-medium">7%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-red-600">90+ Days</span>
                    <span className="font-medium text-red-600">3%</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quality Metrics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5" />
                <span>Quality Metrics</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Pass Rate</span>
                  <span className="font-medium text-green-600">96.5%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Pending QC</span>
                  <Badge variant="outline">8 items</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Failed QC</span>
                  <Badge variant="destructive">3 items</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Performance Trends */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5" />
                <span>Performance</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Pick Accuracy</span>
                  <span className="font-medium text-green-600">98.2%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">On-Time Delivery</span>
                  <span className="font-medium text-blue-600">94.8%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Cycle Count Accuracy</span>
                  <span className="font-medium text-purple-600">99.1%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Additional Features */}
        <div className="grid md:grid-cols-2 gap-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Critical Alerts</CardTitle>
              <CardDescription>Items requiring immediate attention</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm flex items-center">
                    <AlertTriangle className="w-4 h-4 text-red-500 mr-2" />
                    Expiring Batches
                  </span>
                  <Badge variant="destructive">5 items</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm flex items-center">
                    <AlertTriangle className="w-4 h-4 text-yellow-500 mr-2" />
                    Low Stock Items
                  </span>
                  <Badge variant="secondary">12 items</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm flex items-center">
                    <Users className="w-4 h-4 text-blue-500 mr-2" />
                    Pending Approvals
                  </span>
                  <Badge variant="outline">7 requests</Badge>
                </div>
                <Button variant="outline" className="w-full">
                  View All Alerts
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>System Status</CardTitle>
              <CardDescription>Warehouse operations overview</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Scanner Connectivity</span>
                  <Badge className="bg-green-100 text-green-800">Online</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Database Sync</span>
                  <Badge className="bg-green-100 text-green-800">Active</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Print Services</span>
                  <Badge className="bg-green-100 text-green-800">Ready</Badge>
                </div>
                <Button variant="outline" className="w-full">
                  System Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Home;

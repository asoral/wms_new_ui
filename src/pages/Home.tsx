
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Package2
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const Home = () => {
  const navigate = useNavigate();

  const quickActions = [
    { icon: Package, label: "Item Enquiry", color: "bg-blue-500", path: "/item-enquiry" },
    { icon: Search, label: "Bin Enquiry", color: "bg-green-500", path: "/bin-enquiry" },
    { icon: BarChart3, label: "Stock Count", color: "bg-purple-500", path: "/stock-count" },
    { icon: ShoppingCart, label: "Receive", color: "bg-orange-500", path: "/receive" },
    { icon: Truck, label: "Deliver", color: "bg-red-500", path: "/deliver" },
    { icon: FileText, label: "Mat. Request", color: "bg-teal-500", path: "/mat-request" },
    { icon: Database, label: "Stock Entry", color: "bg-indigo-500", path: "/stock-entry" },
    { icon: ClipboardList, label: "Pick List", color: "bg-pink-500", path: "/pick-list" },
    { icon: Package2, label: "Packing", color: "bg-cyan-500", path: "/packing" },
    { icon: Printer, label: "Print Label", color: "bg-gray-500", path: "/print-label" },
    { icon: CheckCircle, label: "Quality Check", color: "bg-emerald-500", path: "/quality-check" },
    { icon: Layers, label: "Pallet", color: "bg-yellow-500", path: "/pallet" }
  ];

  const recentActivities = [
    { action: "Stock received", item: "SKU-001", time: "2 min ago", status: "completed" },
    { action: "Pick list generated", item: "Order #1234", time: "5 min ago", status: "pending" },
    { action: "Quality check", item: "Batch #567", time: "15 min ago", status: "completed" },
    { action: "Delivery scheduled", item: "Order #1235", time: "30 min ago", status: "in-progress" }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'in-progress': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">WMS Dashboard</h1>
              <p className="text-gray-600">Warehouse Management System</p>
            </div>
            <div className="flex items-center space-x-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input 
                  placeholder="Search items, orders..." 
                  className="pl-10 w-64"
                />
              </div>
            </div>
          </div>
          
          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {quickActions.map((action, index) => {
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

        {/* Additional Features */}
        <div className="grid md:grid-cols-2 gap-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Inventory Insights</CardTitle>
              <CardDescription>Real-time warehouse analytics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Low Stock Items</span>
                  <Badge variant="destructive">5 items</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Overstock Items</span>
                  <Badge variant="secondary">12 items</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Quality Issues</span>
                  <Badge variant="outline">2 items</Badge>
                </div>
                <Button variant="outline" className="w-full">
                  View Full Report
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

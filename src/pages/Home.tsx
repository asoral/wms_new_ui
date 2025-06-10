
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MetricCard } from "@/components/ui/metric-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  CalendarRange, 
  CreditCard, 
  PackageOpen, 
  ShoppingCart, 
  Users, 
  AlertTriangle, 
  TrendingUp, 
  Clock,
  Warehouse,
  Package,
  FileText,
  Truck,
  BarChart3,
  Search,
  Plus,
  ChevronRight
} from "lucide-react";
import { createERPNextAPI } from '@/services/erpnextApi';
import { useERPNextDashboard } from '@/hooks/useERPNextDashboard';
import { useNavigate } from 'react-router-dom';

interface StockAgingData {
  total_value: number;
  items_count: number;
  aged_30_days: number;
  aged_60_days: number;
  aged_90_days: number;
}

interface RecentActivity {
  id: string;
  type: 'receipt' | 'delivery' | 'stock_entry' | 'material_request';
  title: string;
  subtitle: string;
  time: string;
  status: 'completed' | 'pending' | 'cancelled';
}

const Home = () => {
  const navigate = useNavigate();
  const { stats, isLoading: isDashboardLoading, error } = useERPNextDashboard();
  const [stockAgingData, setStockAgingData] = useState<StockAgingData>({
    total_value: 0,
    items_count: 0,
    aged_30_days: 0,
    aged_60_days: 0,
    aged_90_days: 0
  });
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [isLoadingActivities, setIsLoadingActivities] = useState(false);

  useEffect(() => {
    fetchStockAgingData();
    fetchRecentActivities();
  }, []);

  const fetchStockAgingData = async () => {
    try {
      const erpnextAPI = await createERPNextAPI();
      if (!erpnextAPI) {
        return;
      }

      const result = await erpnextAPI.getStockAgingReport();
      
      if (result && result.data && Array.isArray(result.data)) {
        const processedData: StockAgingData = {
          total_value: result.data.reduce((sum: number, item: any) => sum + (item.value || 0), 0),
          items_count: result.data.length,
          aged_30_days: result.data.filter((item: any) => item.age > 30).length,
          aged_60_days: result.data.filter((item: any) => item.age > 60).length,
          aged_90_days: result.data.filter((item: any) => item.age > 90).length
        };
        setStockAgingData(processedData);
      }
    } catch (error) {
      console.error('Error fetching stock aging data:', error);
    }
  };

  const fetchRecentActivities = async () => {
    setIsLoadingActivities(true);
    try {
      const erpnextAPI = await createERPNextAPI();
      if (!erpnextAPI) {
        // Mock data for demonstration
        setRecentActivities([
          {
            id: '1',
            type: 'receipt',
            title: 'Purchase Receipt PR-2024-001',
            subtitle: '15 items received from Supplier ABC',
            time: '2 hours ago',
            status: 'completed'
          },
          {
            id: '2',
            type: 'delivery',
            title: 'Delivery Note DN-2024-005',
            subtitle: '8 items delivered to Customer XYZ',
            time: '4 hours ago',
            status: 'completed'
          },
          {
            id: '3',
            type: 'material_request',
            title: 'Material Request MR-2024-012',
            subtitle: 'Request for 25 items pending approval',
            time: '6 hours ago',
            status: 'pending'
          }
        ]);
        setIsLoadingActivities(false);
        return;
      }

      // Fetch real recent activities
      // This would need to be implemented in the ERPNext API
      setRecentActivities([]);
    } catch (error) {
      console.error('Error fetching recent activities:', error);
      setRecentActivities([]);
    } finally {
      setIsLoadingActivities(false);
    }
  };

  const quickActions = [
    { icon: Package, label: 'Receive Items', action: () => navigate('/receive'), color: 'bg-blue-100 text-blue-600' },
    { icon: Truck, label: 'Deliver Items', action: () => navigate('/deliver'), color: 'bg-green-100 text-green-600' },
    { icon: Search, label: 'Bin Enquiry', action: () => navigate('/bin-enquiry'), color: 'bg-purple-100 text-purple-600' },
    { icon: FileText, label: 'Stock Count', action: () => navigate('/stock-count'), color: 'bg-orange-100 text-orange-600' },
    { icon: Plus, label: 'Material Request', action: () => navigate('/material-request'), color: 'bg-indigo-100 text-indigo-600' },
    { icon: BarChart3, label: 'Reports', action: () => navigate('/reports'), color: 'bg-pink-100 text-pink-600' }
  ];

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'receipt': return Package;
      case 'delivery': return Truck;
      case 'stock_entry': return Warehouse;
      case 'material_request': return FileText;
      default: return Package;
    }
  };

  const getActivityColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600';
      case 'pending': return 'text-yellow-600';
      case 'cancelled': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <Button onClick={() => window.location.reload()} variant="outline">
          <TrendingUp className="w-4 h-4 mr-2" />
          Refresh Data
        </Button>
      </div>

      {/* Main Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Items"
          value={isDashboardLoading ? "..." : stats.totalItems.toString()}
          icon={PackageOpen}
        />
        <MetricCard
          title="Low Stock Items"
          value={isDashboardLoading ? "..." : stats.lowStockItems.toString()}
          icon={AlertTriangle}
        />
        <MetricCard
          title="Pending Orders"
          value={isDashboardLoading ? "..." : stats.pendingOrders.toString()}
          icon={ShoppingCart}
        />
        <MetricCard
          title="Total Warehouses"
          value={isDashboardLoading ? "..." : stats.totalWarehouses.toString()}
          icon={Warehouse}
        />
      </div>

      {/* Stock Aging Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Stock Value"
          value={`$${stockAgingData.total_value.toFixed(2)}`}
          icon={CreditCard}
        />
        <MetricCard
          title="Items in Stock"
          value={stockAgingData.items_count.toString()}
          icon={Package}
        />
        <MetricCard
          title="Items Aged > 30 Days"
          value={stockAgingData.aged_30_days.toString()}
          icon={CalendarRange}
        />
        <MetricCard
          title="Items Aged > 90 Days"
          value={stockAgingData.aged_90_days.toString()}
          icon={Clock}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Quick Actions */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Plus className="w-5 h-5 mr-2" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {quickActions.map((action, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  className="w-full justify-start h-auto p-3"
                  onClick={action.action}
                >
                  <div className={`p-2 rounded-lg mr-3 ${action.color}`}>
                    <action.icon className="w-4 h-4" />
                  </div>
                  <span className="flex-1 text-left">{action.label}</span>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Recent Activities */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <Clock className="w-5 h-5 mr-2" />
                  Recent Activities
                </div>
                <Button variant="ghost" size="sm" onClick={() => navigate('/reports')}>
                  View All
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingActivities ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : recentActivities.length > 0 ? (
                <div className="space-y-4">
                  {recentActivities.map((activity) => {
                    const ActivityIcon = getActivityIcon(activity.type);
                    return (
                      <div key={activity.id} className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                        <div className="p-2 bg-gray-100 rounded-lg">
                          <ActivityIcon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{activity.title}</p>
                          <p className="text-xs text-gray-500 truncate">{activity.subtitle}</p>
                        </div>
                        <div className="text-right">
                          <Badge variant={activity.status === 'completed' ? 'default' : activity.status === 'pending' ? 'secondary' : 'destructive'} className="text-xs">
                            {activity.status}
                          </Badge>
                          <p className="text-xs text-gray-400 mt-1">{activity.time}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Clock className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No recent activities found</p>
                  <p className="text-sm">Start using the system to see activities here</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Stock Aging Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart3 className="w-5 h-5 mr-2" />
            Stock Aging Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <h4 className="font-medium text-green-600">Fresh Stock (0-30 days)</h4>
              <p className="text-2xl font-bold">{stockAgingData.items_count - stockAgingData.aged_30_days}</p>
              <p className="text-sm text-gray-600">Items in good condition</p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-yellow-600">Aging Stock (30-90 days)</h4>
              <p className="text-2xl font-bold">{stockAgingData.aged_30_days - stockAgingData.aged_90_days}</p>
              <p className="text-sm text-gray-600">Monitor for movement</p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-red-600">Old Stock (90+ days)</h4>
              <p className="text-2xl font-bold">{stockAgingData.aged_90_days}</p>
              <p className="text-sm text-gray-600">Requires immediate attention</p>
            </div>
          </div>
          {stockAgingData.aged_90_days > 0 && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center">
                <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
                <p className="text-red-800 font-medium">
                  Action Required: {stockAgingData.aged_90_days} items have been in stock for over 90 days
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Error State */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center text-red-800">
              <AlertTriangle className="w-5 h-5 mr-2" />
              <p>Error loading dashboard data: {error}</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Home;

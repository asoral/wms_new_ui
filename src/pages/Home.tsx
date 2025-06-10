
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MetricCard } from "@/components/ui/metric-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
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
  ChevronRight,
  Target,
  Timer,
  Percent,
  DollarSign,
  Activity,
  PieChart,
  RefreshCw,
  Filter
} from "lucide-react";
import { useNavigate } from 'react-router-dom';
import { useEnhancedDashboard } from '@/hooks/useEnhancedDashboard';

const Home = () => {
  const navigate = useNavigate();
  const [timeRange, setTimeRange] = useState('week');
  const [refreshing, setRefreshing] = useState(false);
  
  const {
    stats,
    recentActivities,
    operationalMetrics,
    financialMetrics,
    stockAgingData,
    isLoading,
    isLoadingActivities,
    error,
    refreshData
  } = useEnhancedDashboard();

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshData();
    setRefreshing(false);
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

  const formatValue = (value: number, type: 'currency' | 'percentage' | 'number' = 'number') => {
    if (type === 'currency') {
      return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
    } else if (type === 'percentage') {
      return `${value.toFixed(1)}%`;
    } else {
      return value.toLocaleString();
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <div className="flex items-center space-x-3">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="quarter">This Quarter</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleRefresh} variant="outline" disabled={refreshing}>
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh Data
          </Button>
        </div>
      </div>

      {/* Main Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {isLoading ? (
          // Loading skeletons
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-16 w-full" />
              </CardContent>
            </Card>
          ))
        ) : (
          <>
            <MetricCard
              title="Total Items"
              value={stats.totalItems.toString()}
              icon={PackageOpen}
            />
            <MetricCard
              title="Low Stock Items"
              value={stats.lowStockItems.toString()}
              icon={AlertTriangle}
            />
            <MetricCard
              title="Pending Orders"
              value={stats.pendingOrders.toString()}
              icon={ShoppingCart}
            />
            <MetricCard
              title="Total Warehouses"
              value={stats.totalWarehouses.toString()}
              icon={Warehouse}
            />
          </>
        )}
      </div>

      {/* Enhanced Financial Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-16 w-full" />
              </CardContent>
            </Card>
          ))
        ) : (
          <>
            <MetricCard
              title="Total Stock Value"
              value={formatValue(stats.totalStockValue, 'currency')}
              icon={CreditCard}
            />
            <MetricCard
              title="Stock Turnover Ratio"
              value={financialMetrics.stockTurnoverRatio.toString()}
              icon={TrendingUp}
            />
            <MetricCard
              title="Dead Stock Value"
              value={formatValue(financialMetrics.deadStockValue, 'currency')}
              icon={AlertTriangle}
            />
            <MetricCard
              title="Carrying Cost"
              value={formatValue(financialMetrics.carryingCostPercentage, 'percentage')}
              icon={Percent}
            />
          </>
        )}
      </div>

      {/* Operational Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Activity className="w-5 h-5 mr-2" />
            Operational Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Target className="w-4 h-4 text-green-600" />
                  <h4 className="font-medium text-green-600">Pick Accuracy</h4>
                </div>
                <p className="text-2xl font-bold">{formatValue(operationalMetrics.pickAccuracy, 'percentage')}</p>
                <p className="text-sm text-gray-600">Target: 95%</p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Timer className="w-4 h-4 text-blue-600" />
                  <h4 className="font-medium text-blue-600">Putaway Speed</h4>
                </div>
                <p className="text-2xl font-bold">{formatValue(operationalMetrics.putawaySpeed, 'percentage')}</p>
                <p className="text-sm text-gray-600">Items per hour efficiency</p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Package className="w-4 h-4 text-purple-600" />
                  <h4 className="font-medium text-purple-600">Cycle Count Accuracy</h4>
                </div>
                <p className="text-2xl font-bold">{formatValue(operationalMetrics.cycleCountAccuracy, 'percentage')}</p>
                <p className="text-sm text-gray-600">Inventory accuracy</p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <ShoppingCart className="w-4 h-4 text-orange-600" />
                  <h4 className="font-medium text-orange-600">Order Fulfillment</h4>
                </div>
                <p className="text-2xl font-bold">{formatValue(operationalMetrics.orderFulfillmentRate, 'percentage')}</p>
                <p className="text-sm text-gray-600">On-time delivery</p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Warehouse className="w-4 h-4 text-indigo-600" />
                  <h4 className="font-medium text-indigo-600">Warehouse Utilization</h4>
                </div>
                <p className="text-2xl font-bold">{formatValue(operationalMetrics.warehouseUtilization, 'percentage')}</p>
                <p className="text-sm text-gray-600">Space efficiency</p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-red-600" />
                  <h4 className="font-medium text-red-600">Avg Processing Time</h4>
                </div>
                <p className="text-2xl font-bold">{operationalMetrics.averageProcessingTime}h</p>
                <p className="text-sm text-gray-600">Per order processing</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

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
                      <Skeleton className="w-10 h-10 rounded-lg" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
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
                          <Badge 
                            variant={activity.status === 'completed' ? 'default' : 
                                   activity.status === 'pending' ? 'secondary' : 'destructive'} 
                            className="text-xs"
                          >
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

      {/* Enhanced Stock Aging Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart3 className="w-5 h-5 mr-2" />
            Stock Aging Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
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

              {/* ABC Analysis */}
              <div className="border-t pt-6">
                <h4 className="font-medium mb-4 flex items-center">
                  <PieChart className="w-4 h-4 mr-2" />
                  ABC Analysis Distribution
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Class A Items</span>
                      <span className="text-sm text-gray-600">{financialMetrics.abcAnalysis.classA}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-green-600 h-2 rounded-full" style={{ width: `${financialMetrics.abcAnalysis.classA}%` }}></div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Class B Items</span>
                      <span className="text-sm text-gray-600">{financialMetrics.abcAnalysis.classB}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-yellow-600 h-2 rounded-full" style={{ width: `${financialMetrics.abcAnalysis.classB}%` }}></div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Class C Items</span>
                      <span className="text-sm text-gray-600">{financialMetrics.abcAnalysis.classC}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-red-600 h-2 rounded-full" style={{ width: `${financialMetrics.abcAnalysis.classC}%` }}></div>
                    </div>
                  </div>
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
            </>
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

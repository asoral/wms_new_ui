import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MetricCard } from "@/components/ui/metric-card";
import SubscriptionPlans from "@/components/subscription/SubscriptionPlans";
import { useSubscription } from "@/components/subscription/SubscriptionContext";
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
  const { hasAccess } = useSubscription();
  
  const {
    dashboardStats,
    recentActivities = [],
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
    { icon: Package, label: 'Receive Items', action: () => navigate('/app/receive'), color: 'bg-blue-100 text-blue-600' },
    { icon: Truck, label: 'Deliver Items', action: () => navigate('/app/deliver'), color: 'bg-green-100 text-green-600' },
    { icon: Search, label: 'Bin Enquiry', action: () => navigate('/app/bin-enquiry'), color: 'bg-purple-100 text-purple-600' },
    { icon: FileText, label: 'Stock Count', action: () => navigate('/app/stock-count'), color: 'bg-orange-100 text-orange-600' },
    { icon: Plus, label: 'Material Request', action: () => navigate('/app/material-request'), color: 'bg-indigo-100 text-indigo-600' },
    { icon: BarChart3, label: 'Reports', action: () => navigate('/app/reports'), color: 'bg-pink-100 text-pink-600' }
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

  const formatValue = (value: number | undefined, type: 'currency' | 'percentage' | 'number' = 'number') => {
    if (value === undefined || value === null) return '0';
    if (type === 'currency') {
      return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
    } else if (type === 'percentage') {
      return `${value.toFixed(1)}%`;
    } else {
      return value.toLocaleString();
    }
  };

  // Safe property access with defaults
  const safeStats = {
    totalItems: dashboardStats?.totalItems || 0,
    lowStockItems: dashboardStats?.lowStockItems || 0,
    pendingOrders: dashboardStats?.pendingOrders || 0,
    totalWarehouses: dashboardStats?.totalWarehouses || 0,
    totalStockValue: dashboardStats?.totalStockValue || 0,
  };

  const safeOperationalMetrics = {
    completedPickLists: operationalMetrics?.completedPickLists || 0,
    totalPickLists: operationalMetrics?.totalPickLists || 0,
    completedDeliveries: operationalMetrics?.completedDeliveries || 0,
    totalDeliveryNotes: operationalMetrics?.totalDeliveryNotes || 0,
    fullyDeliveredOrders: operationalMetrics?.fullyDeliveredOrders || 0,
    totalSalesOrders: operationalMetrics?.totalSalesOrders || 0,
    warehouseUtilization: operationalMetrics?.warehouseUtilization || 0,
    avgDeliveryTime: operationalMetrics?.avgDeliveryTime || 0,
    openPurchases: operationalMetrics?.openPurchases || 0,
  };

  const safeFinancialMetrics = {
    stockTurnoverRatio: financialMetrics?.stockTurnoverRatio || 0,
    deadStockValue: financialMetrics?.deadStockValue || 0,
    carryingCostPercentage: financialMetrics?.carryingCostPercentage || 0,
    abcAnalysis: financialMetrics?.abcAnalysis || { classA: 0, classB: 0, classC: 0 },
  };

  const safeStockAgingData = {
    items_count: stockAgingData?.items_count || 0,
    aged_30_days: stockAgingData?.aged_30_days || 0,
    aged_90_days: stockAgingData?.aged_90_days || 0,
  };

  // Show subscription plans if user doesn't have access
  if (!hasAccess) {
    return <SubscriptionPlans />;
  }

  return (
    <div className="w-full max-w-7xl mx-auto py-4 md:py-6 space-y-6 md:space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl md:text-3xl font-bold">Dashboard</h1>
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
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
                    value={safeStats.totalItems.toString()}
                    icon={PackageOpen}
                    info="Count of all enabled items in your ERPNext system"
                  />
                  <MetricCard
                    title="Low Stock Items"
                    value={safeStats.lowStockItems.toString()}
                    icon={AlertTriangle}
                    info="Items with negative projected quantity in warehouse bins"
                  />
                  <MetricCard
                    title="Pending Orders"
                    value={safeStats.pendingOrders.toString()}
                    icon={ShoppingCart}
                    info="Purchase Orders with status 'To Receive' or 'To Receive and Bill'"
                  />
                  <MetricCard
                    title="Total Warehouses"
                    value={safeStats.totalWarehouses.toString()}
                    icon={Warehouse}
                    info="Count of group warehouses under your company"
                  />
                </>
              )}
            </div>

            {/* Enhanced Financial Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
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
                    value={formatValue(safeStats.totalStockValue, 'currency')}
                    icon={CreditCard}
                    info="Sum of stock values from all warehouse bins for your company"
                  />
                  <MetricCard
                    title="Stock Turnover Ratio"
                    value={safeFinancialMetrics.stockTurnoverRatio.toString()}
                    icon={TrendingUp}
                    info="Calculated from stock ledger transactions over the past year"
                  />
                  <MetricCard
                    title="Dead Stock Value"
                    value={formatValue(safeFinancialMetrics.deadStockValue, 'currency')}
                    icon={AlertTriangle}
                    info="Value of expired stock based on batch expiry dates"
                  />
                  <MetricCard
                    title="Carrying Cost"
                    value={formatValue(safeFinancialMetrics.carryingCostPercentage, 'percentage')}
                    icon={Percent}
                    info="Estimated carrying cost as percentage of total stock value (15% standard)"
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <Skeleton key={i} className="h-20 w-full" />
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Target className="w-4 h-4 text-green-600" />
                        <h4 className="font-medium text-green-600">Pick Lists Completed</h4>
                      </div>
                      <p className="text-2xl font-bold">{safeOperationalMetrics.completedPickLists} / {safeOperationalMetrics.totalPickLists}</p>
                      <p className="text-sm text-gray-600">Last 90 days</p>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Timer className="w-4 h-4 text-blue-600" />
                        <h4 className="font-medium text-blue-600">Delivery Notes</h4>
                      </div>
                      <p className="text-2xl font-bold">{safeOperationalMetrics.completedDeliveries} / {safeOperationalMetrics.totalDeliveryNotes}</p>
                      <p className="text-sm text-gray-600">Submitted deliveries</p>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Package className="w-4 h-4 text-purple-600" />
                        <h4 className="font-medium text-purple-600">Order Fulfillment</h4>
                      </div>
                      <p className="text-2xl font-bold">{safeOperationalMetrics.fullyDeliveredOrders} / {safeOperationalMetrics.totalSalesOrders}</p>
                      <p className="text-sm text-gray-600">Fully delivered SOs</p>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <ShoppingCart className="w-4 h-4 text-orange-600" />
                        <h4 className="font-medium text-orange-600">Warehouse Utilization</h4>
                      </div>
                      <p className="text-2xl font-bold">{formatValue(safeOperationalMetrics.warehouseUtilization, 'percentage')}</p>
                      <p className="text-sm text-gray-600">Bins with stock</p>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Warehouse className="w-4 h-4 text-indigo-600" />
                        <h4 className="font-medium text-indigo-600">Avg Delivery Time</h4>
                      </div>
                      <p className="text-2xl font-bold">{safeOperationalMetrics.avgDeliveryTime.toFixed(1)} days</p>
                      <p className="text-sm text-gray-600">SO to DN time</p>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4 text-red-600" />
                        <h4 className="font-medium text-red-600">Pending POs</h4>
                      </div>
                      <p className="text-2xl font-bold">{safeOperationalMetrics.openPurchases}</p>
                      <p className="text-sm text-gray-600">To receive</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
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
                      <Button variant="ghost" size="sm" onClick={() => navigate('/app/reports')}>
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <Skeleton key={i} className="h-20 w-full" />
                    ))}
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-6">
                      <div className="space-y-2">
                        <h4 className="font-medium text-green-600">Fresh Stock (0-30 days)</h4>
                        <p className="text-2xl font-bold">{safeStockAgingData.items_count - safeStockAgingData.aged_30_days}</p>
                        <p className="text-sm text-gray-600">Items in good condition</p>
                      </div>
                      <div className="space-y-2">
                        <h4 className="font-medium text-yellow-600">Aging Stock (30-90 days)</h4>
                        <p className="text-2xl font-bold">{safeStockAgingData.aged_30_days - safeStockAgingData.aged_90_days}</p>
                        <p className="text-sm text-gray-600">Monitor for movement</p>
                      </div>
                      <div className="space-y-2">
                        <h4 className="font-medium text-red-600">Old Stock (90+ days)</h4>
                        <p className="text-2xl font-bold">{safeStockAgingData.aged_90_days}</p>
                        <p className="text-sm text-gray-600">Requires immediate attention</p>
                      </div>
                    </div>

                    {/* ABC Analysis */}
                    <div className="border-t pt-6">
                      <h4 className="font-medium mb-4 flex items-center">
                        <PieChart className="w-4 h-4 mr-2" />
                        ABC Analysis Distribution
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Class A Items</span>
                            <span className="text-sm text-gray-600">{safeFinancialMetrics.abcAnalysis.classA}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div className="bg-green-600 h-2 rounded-full" style={{ width: `${safeFinancialMetrics.abcAnalysis.classA}%` }}></div>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Class B Items</span>
                            <span className="text-sm text-gray-600">{safeFinancialMetrics.abcAnalysis.classB}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div className="bg-yellow-600 h-2 rounded-full" style={{ width: `${safeFinancialMetrics.abcAnalysis.classB}%` }}></div>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Class C Items</span>
                            <span className="text-sm text-gray-600">{safeFinancialMetrics.abcAnalysis.classC}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div className="bg-red-600 h-2 rounded-full" style={{ width: `${safeFinancialMetrics.abcAnalysis.classC}%` }}></div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {safeStockAgingData.aged_90_days > 0 && (
                      <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex items-center">
                          <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
                          <p className="text-red-800 font-medium">
                            Action Required: {safeStockAgingData.aged_90_days} items have been in stock for over 90 days
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

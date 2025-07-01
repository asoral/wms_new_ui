
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Truck, Package, TrendingUp, Clock, AlertTriangle, Loader2 } from "lucide-react";
import { MetricCard } from "@/components/ui/metric-card";
import { createERPNextAPI, getUserDefaultCompany } from "@/services/erpnextApi";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { SalesOrderOption, DashboardData } from "../../pages/Deliver";
import MobileDeliveryCard from "./MobileDeliveryCard";

interface DeliverDashboardProps {
  onSelectSalesOrder: (salesOrder: SalesOrderOption) => void;
  onViewSalesOrders: () => void;
  dashboardData: DashboardData;
  isLoading: boolean;
}

const DeliverDashboard = ({ onSelectSalesOrder, onViewSalesOrders, dashboardData, isLoading }: DeliverDashboardProps) => {
  const [salesOrders, setSalesOrders] = useState<SalesOrderOption[]>([]);
  const [salesOrdersLoading, setSalesOrdersLoading] = useState(true);
  const { toast } = useToast();
  const isMobile = useIsMobile();

  useEffect(() => {
    fetchSalesOrders();
  }, []);

  const fetchSalesOrders = async () => {
    setSalesOrdersLoading(true);
    try {
      const erpnextAPI = await createERPNextAPI();
      if (!erpnextAPI) {
        toast({
          title: "ERPNext Not Configured",
          description: "Please configure your ERPNext settings.",
          variant: "destructive"
        });
        return;
      }

      const company = await getUserDefaultCompany();
      
      // Fetch pending sales orders
      const pendingSalesOrders = await erpnextAPI.getSalesOrders(
        [
          ['docstatus', '=', 1],
          ['status', 'in', ['To Deliver', 'To Deliver and Bill', 'Partially Delivered']]
        ],
        company || undefined,
        50
      );

      // Transform to SalesOrderOption format
      const transformedOrders: SalesOrderOption[] = pendingSalesOrders.data?.map((so: any) => ({
        value: so.name,
        label: so.name,
        customer: so.customer,
        customer_name: so.customer_name || so.customer,
        delivery_date: so.delivery_date,
        grand_total: so.grand_total || 0,
        status: so.status,
        isDraft: false
      })) || [];

      // Add draft delivery notes as options
      const draftDeliveryNotes = dashboardData.draftDeliveryNotes.map(dn => ({
        value: dn.salesOrder || dn.name,
        label: `${dn.salesOrder || dn.name} (Draft DN: ${dn.name})`,
        customer: dn.customer,
        customer_name: dn.customerName,
        delivery_date: dn.postingDate,
        grand_total: dn.grandTotal,
        status: 'Draft',
        isDraft: true,
        draftName: dn.name
      }));

      setSalesOrders([...draftDeliveryNotes, ...transformedOrders]);

    } catch (error) {
      console.error('Error fetching sales orders:', error);
      toast({
        title: "Error",
        description: "Failed to fetch sales orders",
        variant: "destructive"
      });
    } finally {
      setSalesOrdersLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { variant: any }> = {
      'To Deliver': { variant: 'default' },
      'To Deliver and Bill': { variant: 'default' },
      'Partially Delivered': { variant: 'outline' },
      'Draft': { variant: 'secondary' }
    };

    const statusInfo = statusMap[status] || { variant: 'outline' };
    return <Badge variant={statusInfo.variant}>{status}</Badge>;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      {/* Dashboard Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="flex items-center p-6">
                <div className="flex items-center space-x-4">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <div className="w-6 h-6 bg-gray-300 rounded"></div>
                  </div>
                  <div>
                    <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
                    <div className="h-6 bg-gray-200 rounded w-16"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <>
            <MetricCard
              title="Today's Deliveries"
              value={dashboardData.todaysDelivery.toString()}
              icon={Truck}
            />
            <MetricCard
              title="Total Deliveries"
              value={dashboardData.totalDeliveries.toString()}
              icon={Package}
            />
            <MetricCard
              title="Pending Orders"
              value={dashboardData.pendingOrders.toString()}
              icon={Clock}
            />
            <MetricCard
              title="Draft Delivery Notes"
              value={dashboardData.draftDeliveryNotes.length.toString()}
              icon={AlertTriangle}
            />
          </>
        )}
      </div>

      {/* Sales Orders to Deliver */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Sales Orders to Deliver</span>
            <Button onClick={fetchSalesOrders} variant="outline" size="sm">
              Refresh
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {salesOrdersLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              <span className="ml-2 text-gray-600">Loading sales orders...</span>
            </div>
          ) : (
            <>
              {isMobile ? (
                <div className="space-y-4">
                  {salesOrders.slice(0, 10).map((so, index) => (
                    <MobileDeliveryCard
                      key={index}
                      salesOrder={so}
                      onSelect={onSelectSalesOrder}
                    />
                  ))}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">Sales Order</th>
                        <th className="text-left py-2">Customer</th>
                        <th className="text-left py-2">Delivery Date</th>
                        <th className="text-left py-2">Amount</th>
                        <th className="text-left py-2">Status</th>
                        <th className="text-left py-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {salesOrders.slice(0, 10).map((so, index) => (
                        <tr key={index} className="border-b hover:bg-gray-50">
                          <td className="py-3 font-medium text-blue-600">{so.value}</td>
                          <td className="py-3">{so.customer_name}</td>
                          <td className="py-3">{formatDate(so.delivery_date)}</td>
                          <td className="py-3">₹{so.grand_total.toLocaleString()}</td>
                          <td className="py-3">{getStatusBadge(so.status)}</td>
                          <td className="py-3">
                            <Button
                              size="sm"
                              onClick={() => onSelectSalesOrder(so)}
                            >
                              {so.isDraft ? 'Continue' : 'Start Delivery'}
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {salesOrders.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No sales orders to deliver
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button 
              onClick={onViewSalesOrders} 
              variant="outline"
              className="h-16 flex flex-col items-center justify-center space-y-2 hover:bg-blue-50 hover:border-blue-200"
            >
              <Package className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-medium">View All Sales Orders</span>
            </Button>
            <Button 
              onClick={() => {/* Navigate to draft delivery notes */}} 
              variant="outline"
              className="h-16 flex flex-col items-center justify-center space-y-2 hover:bg-blue-50 hover:border-blue-200"
            >
              <AlertTriangle className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-medium">Draft Delivery Notes</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DeliverDashboard;

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Truck, FileText, CheckCircle, AlertTriangle, Search } from "lucide-react";
import { MetricCard } from "@/components/ui/metric-card";
import { createERPNextAPI, getUserDefaultCompany } from "@/services/erpnextApi";
import { useToast } from "@/hooks/use-toast";
import StatusBadge from "@/components/ui/status-badge";
import SalesOrderSelector from "./SalesOrderSelector";

interface DeliverDashboardProps {
  onSelectSalesOrder: (salesOrder: any) => void;
  onSelectDraftDelivery?: (deliveryId: string, salesOrderNumber?: string) => void;
  shortcuts?: Array<{
    label: string;
    icon: any;
    action: () => void;
  }>;
}

interface DashboardAnalytics {
  totalSOs: number;
  pendingSOs: number;
  completedSOs: number;
  draftDeliveries: number;
}

const DeliverDashboard = ({ onSelectSalesOrder, onSelectDraftDelivery, shortcuts = [] }: DeliverDashboardProps) => {
  const [salesOrders, setSalesOrders] = useState<any[]>([]);
  const [filteredSOs, setFilteredSOs] = useState<any[]>([]);
  const [draftDeliveries, setDraftDeliveries] = useState<any[]>([]);
  const [filteredDrafts, setFilteredDrafts] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<DashboardAnalytics>({
    totalSOs: 0,
    pendingSOs: 0,
    completedSOs: 0,
    draftDeliveries: 0
  });
  const [loading, setLoading] = useState(false);
  const [soSearchTerm, setSOSearchTerm] = useState("");
  const [draftSearchTerm, setDraftSearchTerm] = useState("");
  const { toast } = useToast();

  // Helper function to safely format dates
  const formatDate = (dateString: string | null | undefined): string => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'N/A';
      return date.toLocaleDateString();
    } catch (error) {
      return 'N/A';
    }
  };

  // Helper function to count items safely (from items array or total_qty)
  const getItemCount = (obj: any): string => {
    // Try to get items array length first
    if (obj.items && Array.isArray(obj.items)) {
      return obj.items.length.toString();
    }
    // Fallback to total_qty if items array not available
    if (obj.total_qty && typeof obj.total_qty === 'number') {
      return obj.total_qty.toString();
    }
    return '0';
  };

  // Helper function to get customer name (from ERPNext customer_name field)
  const getCustomerName = (obj: any): string => {
    return obj.customer_name || obj.customer || 'Unknown Customer';
  };

  // Helper function to get total value (from ERPNext grand_total field)
  const getTotalValue = (obj: any): number => {
    const total = obj.grand_total || 0;
    return (typeof total === 'number') ? total : 0;
  };

  // Helper function to get SO delivery date (from delivery_date)
  const getSODeliveryDate = (so: any): string => {
    return formatDate(so.delivery_date);
  };

  // Helper function to get delivery created date (from posting_date)
  const getDeliveryCreatedDate = (delivery: any): string => {
    return formatDate(delivery.posting_date);
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Filter SOs based on search term
  useEffect(() => {
    const filtered = salesOrders.filter(so =>
      so.name.toLowerCase().includes(soSearchTerm.toLowerCase()) ||
      (so.customer || '').toLowerCase().includes(soSearchTerm.toLowerCase()) ||
      (so.customer_name || '').toLowerCase().includes(soSearchTerm.toLowerCase())
    );
    setFilteredSOs(filtered);
  }, [salesOrders, soSearchTerm]);

  // Filter draft deliveries based on search term
  useEffect(() => {
    const filtered = draftDeliveries.filter(draft =>
      draft.name.toLowerCase().includes(draftSearchTerm.toLowerCase()) ||
      (draft.customer || '').toLowerCase().includes(draftSearchTerm.toLowerCase()) ||
      (draft.customer_name || '').toLowerCase().includes(draftSearchTerm.toLowerCase())
    );
    setFilteredDrafts(filtered);
  }, [draftDeliveries, draftSearchTerm]);

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
      
      // Fetch sales orders
      const soFilters = [
        ['docstatus', '=', 1], // Submitted orders only
        ['status', 'in', ['To Deliver', 'To Deliver and Bill', 'Partially Delivered']]
      ];

      const soResponse = await erpnextAPI.getSalesOrders(soFilters, company || undefined);
      
      if (soResponse?.data && Array.isArray(soResponse.data)) {
        setSalesOrders(soResponse.data);
      } else {
        setSalesOrders([]);
      }

      // Fetch draft delivery notes
      const deliveryFilters = [
        ['docstatus', '=', 0] // Draft deliveries only
      ];

      const deliveryResponse = await erpnextAPI.getDeliveryNotes(deliveryFilters, company || undefined);
      
      if (deliveryResponse?.data && Array.isArray(deliveryResponse.data)) {
        setDraftDeliveries(deliveryResponse.data);
      } else {
        setDraftDeliveries([]);
      }

      // Calculate analytics
      const totalSOs = soResponse?.data?.length || 0;
      const pendingSOs = soResponse?.data?.filter((so: any) => so.status === 'To Deliver').length || 0;
      const completedSOs = soResponse?.data?.filter((so: any) => so.status === 'Completed').length || 0;
      const draftDeliveriesCount = deliveryResponse?.data?.length || 0;

      setAnalytics({
        totalSOs,
        pendingSOs,
        completedSOs,
        draftDeliveries: draftDeliveriesCount
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
          title="Total Sales Orders"
          value={analytics.totalSOs.toString()}
          icon={FileText}
        />
        <MetricCard
          title="Pending to Deliver"
          value={analytics.pendingSOs.toString()}
          icon={Truck}
        />
        <MetricCard
          title="Completed"
          value={analytics.completedSOs.toString()}
          icon={CheckCircle}
        />
        <MetricCard
          title="Draft Deliveries"
          value={analytics.draftDeliveries.toString()}
          icon={AlertTriangle}
        />
      </div>

      {/* SO Selector */}
      <SalesOrderSelector 
        onSelectSO={onSelectSalesOrder}
        shortcuts={shortcuts}
      />


      {/* Recent Sales Orders */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <CardTitle>Recent Sales Orders to Deliver</CardTitle>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search sales orders..."
                value={soSearchTerm}
                onChange={(e) => setSOSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-4">Loading sales orders...</div>
          ) : (
            <div className="space-y-4">
              {filteredSOs.slice(0, 5).map((so) => (
                <div key={so.name} className="border rounded-lg p-4">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-lg truncate">{so.name}</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 mt-2">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Customer</p>
                          <p className="text-sm truncate">{getCustomerName(so)}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Total Items</p>
                          <p className="text-sm">{getItemCount(so)} items</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Delivery Date</p>
                          <p className="text-sm">{getSODeliveryDate(so)}</p>
                        </div>
                      </div>
                      <div className="mt-2">
                        <p className="text-sm text-muted-foreground">
                          Total Value: <span className="font-medium">₹{getTotalValue(so).toLocaleString()}</span>
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-row sm:flex-col items-center sm:items-end gap-2">
                      <StatusBadge status={so.status || 'Unknown'} />
                      <Button size="sm" onClick={() => onSelectSalesOrder(so)} className="whitespace-nowrap">
                        Deliver
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              {filteredSOs.length === 0 && soSearchTerm && (
                <div className="text-center py-4 text-gray-500">
                  No sales orders found matching "{soSearchTerm}"
                </div>
              )}
              {salesOrders.length === 0 && !soSearchTerm && (
                <div className="text-center py-4 text-gray-500">
                  No sales orders to deliver
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Draft Delivery Notes */}
      {draftDeliveries.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <CardTitle>Draft Delivery Notes</CardTitle>
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search draft deliveries..."
                  value={draftSearchTerm}
                  onChange={(e) => setDraftSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredDrafts.slice(0, 5).map((delivery) => (
                <div key={delivery.name} className="border rounded-lg p-4">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-lg truncate">{delivery.name}</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 mt-2">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Customer</p>
                          <p className="text-sm truncate">{getCustomerName(delivery)}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Total Items</p>
                          <p className="text-sm">{getItemCount(delivery)} items</p>
                        </div>
                         <div>
                           <p className="text-sm font-medium text-muted-foreground">Created On</p>
                           <p className="text-sm">{getDeliveryCreatedDate(delivery)}</p>
                         </div>
                      </div>
                      <div className="mt-2">
                        <p className="text-sm text-muted-foreground">
                          Total Value: <span className="font-medium">₹{getTotalValue(delivery).toLocaleString()}</span>
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-row sm:flex-col items-center sm:items-end gap-2">
                      <StatusBadge status={delivery.status || 'Draft'} />
                      <Button size="sm" onClick={() => onSelectDraftDelivery?.(delivery.name, delivery.against_sales_order)} className="whitespace-nowrap">
                        Continue
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              {filteredDrafts.length === 0 && draftSearchTerm && (
                <div className="text-center py-4 text-gray-500">
                  No draft deliveries found matching "{draftSearchTerm}"
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DeliverDashboard;

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Printer,
  Package,
  Warehouse,
  Search,
  TrendingUp,
  AlertTriangle,
  Calendar,
  DollarSign,
  CheckCircle,
  ArrowRightLeft,
  RefreshCw,
  FileText,
  User
} from "lucide-react";
import { createERPNextAPI, getUserDefaultCompany } from "@/services/erpnextApi";
import { useToast } from "@/hooks/use-toast";
import DraftDeliveryNotes from "./DraftDeliveryNotes";

interface DeliverDashboardProps {
  onSelectSalesOrder: (salesOrder: any) => void;
  onViewSalesOrders: () => void;
  dashboardData: {
    todaysDelivery: number;
    totalDeliveries: number;
  };
  isLoading: boolean;
}

interface SalesOrder {
  name: string;
  customer: string;
  customer_name: string;
  delivery_date: string;
  grand_total: number;
  status: string;
  per_delivered: number;
  total_qty: number;
}

const DeliverDashboard = ({ onSelectSalesOrder, onViewSalesOrders, dashboardData, isLoading }: DeliverDashboardProps) => {
  const [salesOrders, setSalesOrders] = useState<SalesOrder[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<SalesOrder[]>([]);
  const [selectedSalesOrder, setSelectedSalesOrder] = useState<SalesOrder | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchSalesOrders();
  }, []);

  useEffect(() => {
    filterOrders();
  }, [searchQuery, salesOrders]);

  const fetchSalesOrders = async () => {
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

      // Enhanced filters for sales orders ready for delivery
      const filters = [
        ['docstatus', '=', 1], // Submitted orders only
        ['status', 'in', ['To Deliver', 'To Deliver and Bill', 'Partially Delivered']] // Orders that need delivery
      ];

      const salesOrdersResult = await erpnextAPI.getSalesOrders(filters, company || undefined, 100);

      if (salesOrdersResult.data) {
        // Transform the ERPNext data to match our local interface
        const transformedOrders: SalesOrder[] = salesOrdersResult.data.map((order: any) => ({
          name: order.name || '',
          customer: order.customer || '',
          customer_name: order.customer_name || order.customer || '',
          delivery_date: order.delivery_date || '',
          grand_total: order.grand_total || 0,
          status: order.status || '',
          per_delivered: order.per_delivered || 0,
          total_qty: order.total_qty || 0
        }));
        
        setSalesOrders(transformedOrders);
      }
    } catch (error) {
      console.error('Error fetching sales orders:', error);
      toast({
        title: "Error",
        description: "Failed to fetch sales orders",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filterOrders = () => {
    if (!searchQuery.trim()) {
      setFilteredOrders(salesOrders);
      return;
    }

    const filtered = salesOrders.filter(order => {
      const searchTerm = searchQuery.toLowerCase();
      return (
        (order.name || '').toLowerCase().includes(searchTerm) ||
        (order.customer || '').toLowerCase().includes(searchTerm) ||
        (order.customer_name || '').toLowerCase().includes(searchTerm)
      );
    });
    setFilteredOrders(filtered);
  };

  const handleSalesOrderSelect = (order: SalesOrder) => {
    setSelectedSalesOrder(order);
    const transformedOrder = {
      value: order.name,
      label: `${order.name} - ${order.customer_name}`,
      customer: order.customer,
      customer_name: order.customer_name,
      delivery_date: order.delivery_date,
      grand_total: order.grand_total || 0,
      status: order.status
    };
    onSelectSalesOrder(transformedOrder);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "To Deliver": return "bg-yellow-100 text-yellow-800";
      case "To Deliver and Bill": return "bg-blue-100 text-blue-800";
      case "Partially Delivered": return "bg-orange-100 text-orange-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const handleDraftSelect = (draftName: string, salesOrderNumber?: string) => {
    // Handle draft delivery note selection
    toast({
      title: "Draft Selected",
      description: `Selected draft delivery note: ${draftName}`,
    });
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5" />
            <span>Delivery Summary</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-600 mb-1">Today's Deliveries</p>
                    <p className="text-2xl font-bold text-blue-600">{dashboardData.todaysDelivery}</p>
                  </div>
                  <Calendar className="w-8 h-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-green-50 border-green-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-green-600 mb-1">Total Deliveries</p>
                    <p className="text-2xl font-bold text-green-600">{dashboardData.totalDeliveries}</p>
                  </div>
                  <Package className="w-8 h-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Sales Order Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Warehouse className="w-5 h-5" />
              <span>Select Sales Order</span>
            </div>
            <Button variant="outline" onClick={fetchSalesOrders} disabled={loading}>
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search by SO number, customer..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Sales Orders List */}
            <div className="max-h-96 overflow-y-auto space-y-2">
              {loading ? (
                <div className="text-center py-4">
                  <RefreshCw className="w-4 h-4 animate-spin mx-auto mb-2" />
                  <span className="text-sm text-gray-500">Loading sales orders...</span>
                </div>
              ) : filteredOrders.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">
                    {searchQuery ? 'No sales orders found matching your search' : 'No sales orders ready for delivery'}
                  </p>
                </div>
              ) : (
                filteredOrders.map((order) => (
                  <Card 
                    key={order.name} 
                    className={`cursor-pointer hover:shadow-md transition-shadow ${
                      selectedSalesOrder?.name === order.name ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                    }`}
                    onClick={() => handleSalesOrderSelect(order)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <FileText className="w-5 h-5 text-blue-600" />
                          <div>
                            <h3 className="font-medium">{order.name}</h3>
                            <p className="text-sm text-gray-500">{order.customer_name}</p>
                          </div>
                        </div>
                        <Badge className={getStatusColor(order.status)}>
                          {order.status}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Customer Code:</span>
                          <p className="font-medium">{order.customer}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Delivery Date:</span>
                          <p className="font-medium">{new Date(order.delivery_date).toLocaleDateString()}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Total Value:</span>
                          <p className="font-medium">₹{(order.grand_total || 0).toLocaleString()}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Items/Delivered:</span>
                          <p className="font-medium">{order.total_qty || 0} / {order.per_delivered || 0}%</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Button variant="outline" className="h-20 flex-col space-y-2">
              <Printer className="w-6 h-6" />
              <span>Print Label</span>
            </Button>
            
            <Button variant="outline" className="h-20 flex-col space-y-2">
              <CheckCircle className="w-6 h-6" />
              <span>Quality Check</span>
            </Button>
            
            <Button variant="outline" className="h-20 flex-col space-y-2">
              <ArrowRightLeft className="w-6 h-6" />
              <span>Stock Transfer</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Draft Delivery Notes */}
      <DraftDeliveryNotes onSelectDraft={handleDraftSelect} />
    </div>
  );
};

export default DeliverDashboard;

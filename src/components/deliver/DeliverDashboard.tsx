
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  ArrowRightLeft
} from "lucide-react";
import { createERPNextAPI, getUserDefaultCompany } from "@/services/erpnextApi";
import { useToast } from "@/hooks/use-toast";

interface DeliverDashboardProps {
  onSelectSalesOrder: (salesOrder: any) => void;
  onViewSalesOrders: () => void;
  dashboardData: {
    todaysDelivery: number;
    totalDeliveries: number;
  };
  isLoading: boolean;
}

const DeliverDashboard = ({ onSelectSalesOrder, onViewSalesOrders, dashboardData, isLoading }: DeliverDashboardProps) => {
  const [salesOrders, setSalesOrders] = useState<{ value: string; label: string; customer: string; customer_name: string; delivery_date: string; grand_total: number; status: string; }[]>([]);
  const [selectedSalesOrder, setSelectedSalesOrder] = useState<{ value: string; label: string; customer: string; customer_name: string; delivery_date: string; grand_total: number; status: string; } | undefined>(undefined);
  const { toast } = useToast();

  useEffect(() => {
    const fetchSalesOrders = async () => {
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
          // Transform the data to match the Select component's expected format
          const transformedSalesOrders = salesOrdersResult.data.map(so => ({
            value: so.name,
            label: `${so.name} - ${so.customer_name}`,
            customer: so.customer,
            customer_name: so.customer_name,
            delivery_date: so.delivery_date,
            grand_total: so.grand_total || 0,
            status: so.status
          }));
          setSalesOrders(transformedSalesOrders);
        }
      } catch (error) {
        console.error('Error fetching sales orders:', error);
        toast({
          title: "Error",
          description: "Failed to fetch sales orders",
          variant: "destructive"
        });
      }
    };

    fetchSalesOrders();
  }, []);

  const handleSalesOrderSelect = (value: string) => {
    const selectedOrder = salesOrders.find(so => so.value === value);
    setSelectedSalesOrder(selectedOrder);
    if (selectedOrder) {
      onSelectSalesOrder(selectedOrder);
    }
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
          <CardTitle className="flex items-center space-x-2">
            <Warehouse className="w-5 h-5" />
            <span>Select Sales Order</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Select onValueChange={handleSalesOrderSelect}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a sales order to deliver" />
              </SelectTrigger>
              <SelectContent>
                {salesOrders.map((so) => (
                  <SelectItem key={so.value} value={so.value}>
                    {so.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {selectedSalesOrder && (
              <div className="border rounded-md p-4 bg-gray-50">
                <h3 className="text-lg font-semibold">{selectedSalesOrder.label}</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-gray-500">Customer:</span>
                    <p className="font-medium">{selectedSalesOrder.customer_name}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Delivery Date:</span>
                    <p className="font-medium">{new Date(selectedSalesOrder.delivery_date).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Amount:</span>
                    <p className="font-medium">₹{(selectedSalesOrder.grand_total || 0).toLocaleString()}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Status:</span>
                    <Badge className={`text-xs font-medium ${
                      selectedSalesOrder.status === 'To Deliver' ? 'bg-yellow-100 text-yellow-800' :
                      selectedSalesOrder.status === 'To Deliver and Bill' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {selectedSalesOrder.status}
                    </Badge>
                  </div>
                </div>
              </div>
            )}
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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5" />
            <span>Draft Delivery Notes</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">No draft delivery notes found.</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default DeliverDashboard;

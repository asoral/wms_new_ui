
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Calendar, User, Package, DollarSign } from "lucide-react";
import { SalesOrder } from "../../pages/Deliver";
import { createERPNextAPI, getUserDefaultCompany } from "@/services/erpnextApi";
import { useToast } from "@/hooks/use-toast";

interface SalesOrderListProps {
  onSelectOrder: (order: SalesOrder) => void;
}

const SalesOrderList = ({ onSelectOrder }: SalesOrderListProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [salesOrders, setSalesOrders] = useState<SalesOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<string[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const { toast } = useToast();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      const api = await createERPNextAPI();
      if (!api) return;

      // This would load customers from ERPNext - for now using mock data
      setCustomers(['ABC Electronics Ltd', 'XYZ Corporation', 'Tech Solutions Inc']);
    } catch (error) {
      console.error('Error loading customers:', error);
    }
  };

  const searchSalesOrders = async () => {
    if (!searchTerm.trim() && !selectedCustomer && !selectedStatus) {
      toast({
        title: "Search Required",
        description: "Please enter search criteria or select filters.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const api = await createERPNextAPI();
      if (!api) {
        toast({
          title: "ERPNext Not Configured",
          description: "Please configure your ERPNext settings in the Profile page.",
          variant: "destructive"
        });
        return;
      }

      const company = await getUserDefaultCompany();
      
      // Build filters
      const filters: any[] = [
        ['status', 'in', ['To Deliver', 'To Deliver and Bill', 'Partially Delivered']]
      ];

      if (searchTerm.trim()) {
        filters.push('|');
        filters.push(['name', 'like', `%${searchTerm}%`]);
        filters.push(['customer', 'like', `%${searchTerm}%`]);
      }

      if (selectedCustomer) {
        filters.push(['customer', '=', selectedCustomer]);
      }

      if (selectedStatus) {
        filters.push(['status', '=', selectedStatus]);
      }

      const salesOrdersResult = await api.sales.getSalesOrders(
        filters,
        company || undefined,
        20
      );
      
      if (salesOrdersResult.data) {
        const transformedOrders: SalesOrder[] = salesOrdersResult.data.map((so: any) => ({
          number: so.name,
          customer: so.customer_name || so.customer,
          status: so.status,
          deliveryDate: so.delivery_date || so.transaction_date,
          totalItems: so.items ? so.items.length : 0,
          totalValue: so.grand_total || 0,
          items: so.items ? so.items.map((item: any) => ({
            itemCode: item.item_code,
            itemName: item.item_name,
            orderedQty: item.qty || 0,
            deliveredQty: item.delivered_qty || 0,
            pendingQty: (item.qty || 0) - (item.delivered_qty || 0),
            rate: item.rate || 0,
            uom: item.stock_uom || item.uom,
            warehouse: item.warehouse || 'Main Store',
            qtyToDeliver: (item.qty || 0) - (item.delivered_qty || 0)
          })) : []
        }));
        
        setSalesOrders(transformedOrders);
      }
      
    } catch (error) {
      console.error('Error searching sales orders:', error);
      toast({
        title: "Error",
        description: "Failed to search sales orders from ERPNext",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "To Deliver":
        return "bg-blue-100 text-blue-800";
      case "To Deliver and Bill":
        return "bg-green-100 text-green-800";
      case "Partially Delivered":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getDeliveryProgressColor = (percent: number) => {
    if (percent === 0) return "bg-red-100 text-red-800";
    if (percent < 100) return "bg-yellow-100 text-yellow-800";
    return "bg-green-100 text-green-800";
  };

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Search className="w-5 h-5" />
            <span>Search Sales Orders</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div>
              <Label htmlFor="searchOrder">Sales Order / Customer</Label>
              <Input
                id="searchOrder"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Enter SO number or customer..."
              />
            </div>
            
            <div>
              <Label htmlFor="customerFilter">Customer</Label>
              <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
                <SelectTrigger>
                  <SelectValue placeholder="Select customer" />
                </SelectTrigger>
                <SelectContent className="bg-white border border-gray-200 shadow-lg z-[100]">
                  <SelectItem value="">All Customers</SelectItem>
                  {customers.map((customer) => (
                    <SelectItem key={customer} value={customer}>
                      {customer}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="statusFilter">Status</Label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent className="bg-white border border-gray-200 shadow-lg z-[100]">
                  <SelectItem value="">All Status</SelectItem>
                  <SelectItem value="To Deliver">To Deliver</SelectItem>
                  <SelectItem value="To Deliver and Bill">To Deliver and Bill</SelectItem>
                  <SelectItem value="Partially Delivered">Partially Delivered</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button onClick={searchSalesOrders} disabled={loading} className="w-full">
                {loading ? 'Searching...' : 'Search'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Orders List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {salesOrders.map((order) => (
          <Card key={order.id || order.number} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{order.number}</CardTitle>
                <Badge className={getStatusColor(order.status)}>
                  {order.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center space-x-2">
                  <User className="w-4 h-4 text-gray-500" />
                  <span className="font-medium">{order.customer}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <span>{new Date(order.expectedDelivery || order.deliveryDate).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Package className="w-4 h-4 text-gray-500" />
                  <span>{order.totalItems} items</span>
                </div>
                <div className="flex items-center space-x-2">
                  <DollarSign className="w-4 h-4 text-gray-500" />
                  <span>{formatCurrency(order.totalValue)}</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">Delivered:</span>
                  <Badge className={getDeliveryProgressColor(order.percentDelivered || 0)}>
                    {order.percentDelivered || 0}%
                  </Badge>
                </div>
                <Button onClick={() => onSelectOrder(order)}>
                  Create Delivery
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {salesOrders.length === 0 && !loading && (
        <div className="text-center py-8 text-gray-500">
          No sales orders found. Use the search filters above to find orders.
        </div>
      )}
    </div>
  );
};

export default SalesOrderList;

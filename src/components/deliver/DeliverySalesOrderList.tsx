
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, RefreshCw, FileText } from "lucide-react";
import { createERPNextAPI, getUserDefaultCompany } from "@/services/erpnextApi";
import { useToast } from "@/hooks/use-toast";

interface SalesOrder {
  name: string;
  customer: string;
  customer_name: string;
  delivery_date: string;
  transaction_date: string;
  grand_total: number;
  status: string;
  per_delivered: number;
  company: string;
}

interface DeliverySalesOrderListProps {
  onSelectSalesOrder: (salesOrder: any) => void;
}

const DeliverySalesOrderList = ({ onSelectSalesOrder }: DeliverySalesOrderListProps) => {
  const [salesOrders, setSalesOrders] = useState<SalesOrder[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<SalesOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
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
      
      // Fetch sales orders ready for delivery
      const filters = [
        ['docstatus', '=', 1], // Submitted orders only
        ['status', 'in', ['To Deliver', 'To Deliver and Bill', 'Partially Delivered']]
      ];

      const result = await erpnextAPI.getSalesOrders(filters, company || undefined, 100);
      
      if (result.data) {
        setSalesOrders(result.data);
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

    const filtered = salesOrders.filter(order =>
      order.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer_name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredOrders(filtered);
  };

  const handleSelectOrder = (order: SalesOrder) => {
    onSelectSalesOrder({
      value: order.name,
      label: `${order.name} - ${order.customer_name}`,
      customer: order.customer,
      customer_name: order.customer_name,
      delivery_date: order.delivery_date,
      grand_total: order.grand_total,
      status: order.status
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "To Deliver": return "bg-yellow-100 text-yellow-800";
      case "To Deliver and Bill": return "bg-blue-100 text-blue-800";
      case "Partially Delivered": return "bg-orange-100 text-orange-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="flex space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search by SO number, customer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline" onClick={fetchSalesOrders} disabled={loading}>
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Sales Orders List */}
      <div className="grid gap-4">
        {loading ? (
          <Card>
            <CardContent className="py-8 text-center">
              <div className="flex items-center justify-center space-x-2">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Loading sales orders...</span>
              </div>
            </CardContent>
          </Card>
        ) : filteredOrders.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">
                {searchQuery ? 'No sales orders found matching your search' : 'No sales orders ready for delivery'}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredOrders.map((order) => (
            <Card key={order.name} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <FileText className="w-5 h-5 text-blue-600" />
                    <div>
                      <h3 className="font-medium">{order.name}</h3>
                      <p className="text-sm text-gray-500">{order.customer_name}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className={getStatusColor(order.status)}>
                      {order.status}
                    </Badge>
                    <Button 
                      size="sm" 
                      onClick={() => handleSelectOrder(order)}
                    >
                      Select
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Customer:</span>
                    <p className="font-medium">{order.customer}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Delivery Date:</span>
                    <p className="font-medium">{new Date(order.delivery_date).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Amount:</span>
                    <p className="font-medium">₹{order.grand_total.toLocaleString()}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Delivered:</span>
                    <p className="font-medium">{order.per_delivered}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default DeliverySalesOrderList;

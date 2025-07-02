
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, RefreshCw, FileText } from "lucide-react";
import { createERPNextAPI, getUserDefaultCompany } from "@/services/erpnextApi";
import { useToast } from "@/hooks/use-toast";
import { SalesOrder } from "@/types";

interface SalesOrderSearchProps {
  onSelectSO: (salesOrder: SalesOrder) => void;
  shortcuts?: Array<{
    label: string;
    icon: any;
    action: () => void;
  }>;
}

const SalesOrderSearch = ({ onSelectSO, shortcuts = [] }: SalesOrderSearchProps) => {
  const [salesOrders, setSalesOrders] = useState<any[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<any[]>([]);
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
      const filters = [
        ['docstatus', '=', 1],
        ['status', 'in', ['To Deliver', 'To Deliver and Bill', 'Partially Delivered']]
      ];

      const result = await erpnextAPI.getSalesOrders(filters, company || undefined);
      
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
      (order.customer_name && order.customer_name.toLowerCase().includes(searchQuery.toLowerCase()))
    );
    setFilteredOrders(filtered);
  };

  const handleSelectOrder = (order: any) => {
    // Transform to match SalesOrder interface
    const transformedOrder: SalesOrder = {
      name: order.name,
      id: order.name,
      number: order.name,
      customer: order.customer,
      customer_name: order.customer_name || order.customer,
      status: order.status,
      delivery_date: order.delivery_date,
      deliveryDate: order.delivery_date,
      expectedDelivery: order.delivery_date,
      grand_total: order.grand_total || 0,
      totalValue: order.grand_total || 0,
      totalItems: 0,
      percentDelivered: order.per_delivered || 0,
      per_delivered: order.per_delivered || 0,
      items: []
    };
    
    onSelectSO(transformedOrder);
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
    <Card>
      <CardHeader>
        <CardTitle>Select Sales Order</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
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
        <div className="space-y-3 max-h-60 overflow-y-auto">
          {loading ? (
            <div className="text-center py-4">
              <RefreshCw className="w-4 h-4 animate-spin mx-auto mb-2" />
              <span>Loading sales orders...</span>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-4">
              <FileText className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500">
                {searchQuery ? 'No sales orders found matching your search' : 'No sales orders ready for delivery'}
              </p>
            </div>
          ) : (
            filteredOrders.map((order) => (
              <div key={order.name} className="border rounded-lg p-3 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <FileText className="w-4 h-4 text-blue-600" />
                    <div>
                      <h4 className="font-medium">{order.name}</h4>
                      <p className="text-sm text-gray-500">{order.customer_name || order.customer}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className={getStatusColor(order.status)}>
                      {order.status}
                    </Badge>
                    <Button size="sm" onClick={() => handleSelectOrder(order)}>
                      Select
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-gray-500">Delivery:</span>
                    <p className="font-medium">{new Date(order.delivery_date).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Amount:</span>
                    <p className="font-medium">₹{(order.grand_total || 0).toLocaleString()}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Shortcuts */}
        {shortcuts.length > 0 && (
          <div className="border-t pt-4">
            <h4 className="text-sm font-medium mb-2">Quick Actions</h4>
            <div className="flex flex-wrap gap-2">
              {shortcuts.map((shortcut, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={shortcut.action}
                  className="flex items-center space-x-1"
                >
                  <shortcut.icon className="w-3 h-3" />
                  <span>{shortcut.label}</span>
                </Button>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SalesOrderSearch;

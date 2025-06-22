
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Search, Package, Calendar, User } from "lucide-react";
import { createERPNextAPI, getUserDefaultCompany } from "@/services/erpnextApi";

interface SalesOrder {
  name: string;
  customer: string;
  status: string;
  transaction_date: string;
  grand_total: number;
  currency: string;
  items?: any[];
}

interface DeliverySalesOrderListProps {
  onSalesOrderSelect: (salesOrder: SalesOrder) => void;
  onItemsSelect: (selectedItems: string[]) => void;
}

const DeliverySalesOrderList = ({ onSalesOrderSelect, onItemsSelect }: DeliverySalesOrderListProps) => {
  const [salesOrders, setSalesOrders] = useState<SalesOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);

  useEffect(() => {
    fetchSalesOrders();
  }, []);

  const fetchSalesOrders = async () => {
    try {
      setLoading(true);
      const erpnextAPI = await createERPNextAPI();
      if (!erpnextAPI) return;

      const company = await getUserDefaultCompany();
      const filters = [
        ['docstatus', '=', 1], // Only submitted orders
        ['status', '!=', 'Completed'], // Exclude completed orders
        ['status', '!=', 'Cancelled'] // Exclude cancelled orders
      ];

      if (company) {
        filters.push(['company', '=', company]);
      }

      const result = await erpnextAPI.getSalesOrders(filters, [
        'name', 'customer', 'status', 'transaction_date',
        'grand_total', 'currency', 'company'
      ], 50);

      if (result.data) {
        setSalesOrders(result.data);
      }
    } catch (error) {
      console.error('Error fetching sales orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = salesOrders.filter(order =>
    order.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.customer.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOrderSelect = (order: SalesOrder) => {
    onSalesOrderSelect(order);
    onItemsSelect([]);
  };

  const handleBulkSelect = (orderIds: string[]) => {
    setSelectedOrders(orderIds);
    onItemsSelect(orderIds);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search by Sales Order or Customer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button onClick={fetchSalesOrders} variant="outline">
          Refresh
        </Button>
      </div>

      {/* Bulk Actions */}
      {selectedOrders.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">
                {selectedOrders.length} order(s) selected
              </span>
              <div className="space-x-2">
                <Button size="sm" onClick={() => handleBulkSelect([])}>
                  Clear Selection
                </Button>
                <Button size="sm">
                  Bulk Process
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sales Orders List */}
      <div className="space-y-3">
        {filteredOrders.map((order) => (
          <Card key={order.name} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <Checkbox
                    checked={selectedOrders.includes(order.name)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedOrders([...selectedOrders, order.name]);
                      } else {
                        setSelectedOrders(selectedOrders.filter(id => id !== order.name));
                      }
                    }}
                  />
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="font-semibold text-lg">{order.name}</h3>
                      <Badge 
                        variant={order.status === 'To Deliver and Bill' ? 'default' : 'secondary'}
                      >
                        {order.status}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-gray-600">
                      <div className="flex items-center space-x-1">
                        <User className="w-4 h-4" />
                        <span>{order.customer}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-4 h-4" />
                        <span>{new Date(order.transaction_date).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Package className="w-4 h-4" />
                        <span>{order.currency} {order.grand_total?.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <Button 
                  onClick={() => handleOrderSelect(order)}
                  size="sm"
                >
                  Select & Process
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredOrders.length === 0 && !loading && (
        <Card>
          <CardContent className="p-8 text-center">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Sales Orders Found</h3>
            <p className="text-gray-600">
              {searchTerm 
                ? "No sales orders match your search criteria." 
                : "No pending sales orders available for delivery."
              }
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DeliverySalesOrderList;

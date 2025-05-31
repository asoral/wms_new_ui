
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, Calendar, User, Package, DollarSign } from "lucide-react";
import { SalesOrder } from "../../pages/Deliver";

interface SalesOrderListProps {
  onSelectOrder: (order: SalesOrder) => void;
}

const SalesOrderList = ({ onSelectOrder }: SalesOrderListProps) => {
  const [searchTerm, setSearchTerm] = useState("");

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const mockOrders: SalesOrder[] = [
    {
      id: "1",
      number: "SO-2024-001",
      customer: "ABC Electronics Ltd",
      totalItems: 15,
      totalValue: 125000,
      expectedDelivery: "2024-01-15",
      status: "To Deliver",
      percentDelivered: 0,
      items: [
        {
          itemCode: "ITM-001",
          itemName: "Laptop Dell Inspiron",
          warehouse: "Main Store",
          qtyToDeliver: 5,
          deliveredQty: 0,
          rate: 25000,
          uom: "Nos"
        }
      ]
    },
    {
      id: "2",
      number: "SO-2024-002",
      customer: "XYZ Corporation",
      totalItems: 8,
      totalValue: 89000,
      expectedDelivery: "2024-01-16",
      status: "To Deliver and Bill",
      percentDelivered: 25,
      items: []
    },
    {
      id: "3",
      number: "SO-2024-003",
      customer: "Tech Solutions Inc",
      totalItems: 22,
      totalValue: 156000,
      expectedDelivery: "2024-01-17",
      status: "To Deliver",
      percentDelivered: 50,
      items: []
    }
  ];

  const filteredOrders = mockOrders.filter(order =>
    order.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.customer.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "To Deliver":
        return "bg-blue-100 text-blue-800";
      case "To Deliver and Bill":
        return "bg-green-100 text-green-800";
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
      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Search className="w-5 h-5" />
            <span>Search Sales Orders</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-2">
            <div className="flex-1">
              <Label htmlFor="searchOrder">Sales Order Number or Customer</Label>
              <Input
                id="searchOrder"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Enter sales order number or customer name..."
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Orders List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredOrders.map((order) => (
          <Card key={order.id} className="hover:shadow-md transition-shadow">
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
                  <span>{new Date(order.expectedDelivery).toLocaleDateString()}</span>
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
                  <Badge className={getDeliveryProgressColor(order.percentDelivered)}>
                    {order.percentDelivered}%
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

      {filteredOrders.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No sales orders found matching your search criteria.
        </div>
      )}
    </div>
  );
};

export default SalesOrderList;

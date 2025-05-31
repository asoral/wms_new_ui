
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Truck, Package, FileText, Clock, LucideIcon, DollarSign, Calendar } from "lucide-react";

interface DashboardData {
  todaysDelivery: number;
  totalDeliveries: number;
  fgStockValue: number;
  averageAge: number;
}

interface Shortcut {
  label: string;
  icon: LucideIcon;
  action: () => void;
}

interface DeliverDashboardProps {
  data: DashboardData;
  shortcuts: Shortcut[];
  onViewOrders: () => void;
}

const DeliverDashboard = ({ data, shortcuts, onViewOrders }: DeliverDashboardProps) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const dashboardItems = [
    {
      title: "Today's Delivery",
      value: data.todaysDelivery,
      icon: Calendar,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      clickable: true,
      onClick: onViewOrders
    },
    {
      title: "Total Deliveries",
      value: data.totalDeliveries,
      icon: Truck,
      color: "text-green-600",
      bgColor: "bg-green-50",
      clickable: true,
      onClick: onViewOrders
    },
    {
      title: "FG Stock Value",
      value: formatCurrency(data.fgStockValue),
      icon: DollarSign,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      clickable: false
    },
    {
      title: "Average Age",
      value: `${data.averageAge} days`,
      icon: Clock,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      clickable: false
    }
  ];

  return (
    <div className="space-y-6">
      {/* Dashboard Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {dashboardItems.map((item, index) => {
          const Icon = item.icon;
          return (
            <Card 
              key={index} 
              className={`${item.clickable ? 'cursor-pointer hover:shadow-md transition-shadow' : ''} ${item.bgColor}`}
              onClick={() => item.clickable && item.onClick && item.onClick()}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">{item.title}</p>
                    <p className={`text-2xl font-bold ${item.color}`}>{item.value}</p>
                  </div>
                  <Icon className={`w-8 h-8 ${item.color}`} />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {shortcuts.map((shortcut, index) => {
              const Icon = shortcut.icon;
              return (
                <Button
                  key={index}
                  variant="outline"
                  onClick={shortcut.action}
                  className="h-16 flex-col"
                >
                  <Icon className="w-6 h-6 mb-2" />
                  {shortcut.label}
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Action Button */}
      <div className="flex justify-center">
        <Button onClick={onViewOrders} size="lg" className="px-8">
          <Truck className="w-5 h-5 mr-2" />
          View Sales Orders
        </Button>
      </div>
    </div>
  );
};

export default DeliverDashboard;

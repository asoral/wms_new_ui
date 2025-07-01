
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarDays, User, Package, Building, Truck } from "lucide-react";
import { SalesOrderOption } from "../../pages/Deliver";

interface MobileDeliveryCardProps {
  salesOrder: SalesOrderOption;
  onSelect: (salesOrder: SalesOrderOption) => void;
}

const MobileDeliveryCard = ({ salesOrder, onSelect }: MobileDeliveryCardProps) => {
  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { variant: any, color: string }> = {
      'Draft': { variant: 'secondary', color: 'gray' },
      'To Deliver': { variant: 'default', color: 'blue' },
      'To Deliver and Bill': { variant: 'default', color: 'blue' },
      'Partially Delivered': { variant: 'outline', color: 'orange' },
      'Delivered': { variant: 'default', color: 'green' },
      'Completed': { variant: 'default', color: 'green' },
      'Cancelled': { variant: 'destructive', color: 'red' }
    };

    const statusInfo = statusMap[status] || { variant: 'outline', color: 'gray' };
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
    <Card className="w-full">
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Header */}
          <div className="flex justify-between items-start">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg truncate">{salesOrder.value}</h3>
              <p className="text-sm text-gray-600 truncate">{salesOrder.customer_name}</p>
            </div>
            <div className="flex flex-col items-end space-y-1">
              {getStatusBadge(salesOrder.status)}
              {salesOrder.isDraft && (
                <Badge variant="outline" className="text-xs">Draft DN</Badge>
              )}
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center space-x-2">
              <CalendarDays className="w-4 h-4 text-gray-500 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-gray-500">Delivery Date</p>
                <p className="font-medium truncate">{formatDate(salesOrder.delivery_date)}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Package className="w-4 h-4 text-gray-500 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-gray-500">Items</p>
                <p className="font-medium">{salesOrder.items?.length || 0} items</p>
              </div>
            </div>
          </div>

          {/* Amount */}
          <div className="flex justify-between items-center pt-2 border-t">
            <div>
              <p className="text-gray-500 text-sm">Total Amount</p>
              <p className="font-semibold text-lg">₹{salesOrder.grand_total.toLocaleString('en-IN')}</p>
            </div>
            <Button 
              onClick={() => onSelect(salesOrder)} 
              size="sm"
              className="flex items-center"
            >
              <Truck className="w-4 h-4 mr-1" />
              {salesOrder.isDraft ? 'Continue' : 'Start Delivery'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MobileDeliveryCard;

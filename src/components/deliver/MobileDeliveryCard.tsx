
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SalesOrderOption } from "@/types";

interface MobileDeliveryCardProps {
  salesOrder: SalesOrderOption;
  onSelect: (salesOrder: SalesOrderOption) => void;
}

const MobileDeliveryCard = ({ salesOrder, onSelect }: MobileDeliveryCardProps) => {
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'No date';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, any> = {
      'To Deliver': 'default',
      'To Deliver and Bill': 'default',
      'Partially Delivered': 'outline'
    };
    return <Badge variant={statusMap[status] || 'outline'}>{status}</Badge>;
  };

  return (
    <Card className="mb-4">
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-semibold text-blue-600">{salesOrder.number}</h3>
              <p className="text-sm text-gray-600">{salesOrder.customer}</p>
            </div>
            {getStatusBadge(salesOrder.status)}
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Delivery Date:</span>
              <p className="font-medium">{formatDate(salesOrder.delivery_date)}</p>
            </div>
            <div>
              <span className="text-gray-500">Amount:</span>
              <p className="font-medium">₹{salesOrder.totalValue.toLocaleString()}</p>
            </div>
          </div>

          <Button 
            onClick={() => onSelect(salesOrder)}
            className="w-full"
            size="sm"
          >
            Start Delivery
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default MobileDeliveryCard;

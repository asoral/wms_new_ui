
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarDays, User, Package, Building } from "lucide-react";

interface MaterialRequest {
  name: string;
  transaction_date: string;
  status: string;
  material_request_type: string;
  company: string;
  owner: string;
  total_qty?: number;
}

interface MobileMaterialRequestCardProps {
  request: MaterialRequest;
  onView?: (request: MaterialRequest) => void;
  onEdit?: (request: MaterialRequest) => void;
}

const MobileMaterialRequestCard = ({ request, onView, onEdit }: MobileMaterialRequestCardProps) => {
  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { variant: any, color: string }> = {
      'Draft': { variant: 'secondary', color: 'gray' },
      'Submitted': { variant: 'default', color: 'blue' },
      'Stopped': { variant: 'destructive', color: 'red' },
      'Cancelled': { variant: 'destructive', color: 'red' },
      'Pending': { variant: 'outline', color: 'orange' },
      'Partially Ordered': { variant: 'outline', color: 'yellow' },
      'Ordered': { variant: 'default', color: 'green' },
      'Issued': { variant: 'default', color: 'green' },
      'Transferred': { variant: 'default', color: 'green' },
      'Received': { variant: 'default', color: 'green' }
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
            <div>
              <h3 className="font-semibold text-lg">{request.name}</h3>
              <p className="text-sm text-gray-600">{request.material_request_type}</p>
            </div>
            {getStatusBadge(request.status)}
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center space-x-2">
              <CalendarDays className="w-4 h-4 text-gray-500" />
              <div>
                <p className="text-gray-500">Date</p>
                <p className="font-medium">{formatDate(request.transaction_date)}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Building className="w-4 h-4 text-gray-500" />
              <div>
                <p className="text-gray-500">Company</p>
                <p className="font-medium truncate">{request.company}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <User className="w-4 h-4 text-gray-500" />
              <div>
                <p className="text-gray-500">Created By</p>
                <p className="font-medium truncate">{request.owner}</p>
              </div>
            </div>
            {request.total_qty && (
              <div className="flex items-center space-x-2">
                <Package className="w-4 h-4 text-gray-500" />
                <div>
                  <p className="text-gray-500">Total Qty</p>
                  <p className="font-medium">{request.total_qty}</p>
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex space-x-2 pt-2">
            {onView && (
              <Button variant="outline" size="sm" onClick={() => onView(request)} className="flex-1">
                View
              </Button>
            )}
            {onEdit && request.status === 'Draft' && (
              <Button variant="default" size="sm" onClick={() => onEdit(request)} className="flex-1">
                Edit
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MobileMaterialRequestCard;

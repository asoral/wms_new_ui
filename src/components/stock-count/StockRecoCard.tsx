import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, CheckCircle, FileText, Edit, Eye } from "lucide-react";
import { format } from "date-fns";
import { StockCountSession } from "@/types";

interface StockRecoCardProps {
  session: StockCountSession;
  onEdit?: (sessionId: string) => void;
  onView?: (sessionId: string) => void;
}

export const StockRecoCard = ({ session, onEdit, onView }: StockRecoCardProps) => {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Draft':
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-300">
            <FileText className="w-3 h-3 mr-1" />
            Draft
          </Badge>
        );
      case 'Submitted':
        return (
          <Badge variant="default" className="bg-green-100 text-green-800 border-green-300">
            <CheckCircle className="w-3 h-3 mr-1" />
            Submitted
          </Badge>
        );
      case 'Cancelled':
        return (
          <Badge variant="destructive" className="bg-red-100 text-red-800 border-red-300">
            <AlertTriangle className="w-3 h-3 mr-1" />
            Cancelled
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            <AlertTriangle className="w-3 h-3 mr-1" />
            {status}
          </Badge>
        );
    }
  };

  const formatDateTime = (date: Date, time?: string) => {
    if (!date || isNaN(date.getTime())) {
      return 'Invalid Date';
    }
    const dateStr = format(date, 'dd MMM yyyy');
    return time ? `${dateStr}, ${time}` : dateStr;
  };

  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer">
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Header */}
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-semibold text-lg text-foreground">{session.id}</h3>
              <p className="text-sm text-muted-foreground mt-1">{session.purpose}</p>
            </div>
            {getStatusBadge(session.status)}
          </div>

          {/* Details */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-muted-foreground">Started:</span>
              <p className="font-medium">{formatDateTime(session.startedAt, session.postingTime)}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Total Items:</span>
              <p className="font-medium text-blue-600">{session.totalItems}</p>
            </div>
            {session.differenceAmount !== undefined && (
              <div className="col-span-2">
                <span className="text-muted-foreground">Difference Amount:</span>
                <p className="font-medium text-red-600">₹ {session.differenceAmount?.toLocaleString() || 0}</p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-3 border-t">
            {session.status === 'Draft' && onEdit && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => onEdit(session.id)}
                className="flex-1"
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Button>
            )}
            {onView && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => onView(session.id)}
                className="flex-1"
              >
                <Eye className="w-4 h-4 mr-2" />
                View
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
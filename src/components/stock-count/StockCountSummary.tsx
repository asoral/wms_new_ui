
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, AlertTriangle, Clock } from "lucide-react";
import { StockCountSession } from "@/types";

interface StockCountSummaryProps {
  session: StockCountSession;
}

const StockCountSummary = ({ session }: StockCountSummaryProps) => {
  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { variant: "default" | "destructive" | "outline" | "secondary", icon: any }> = {
      'Draft': { variant: 'secondary', icon: Clock },
      'In Progress': { variant: 'default', icon: Clock },
      'Completed': { variant: 'outline', icon: CheckCircle },
      'Submitted': { variant: 'default', icon: CheckCircle }
    };
    
    const statusInfo = statusMap[status] || { variant: 'secondary', icon: AlertTriangle };
    const IconComponent = statusInfo.icon;
    
    return (
      <Badge variant={statusInfo.variant} className="flex items-center space-x-1">
        <IconComponent className="w-3 h-3" />
        <span>{status}</span>
      </Badge>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Stock Count Summary</span>
          {getStatusBadge(session.status)}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{session.totalItems}</div>
            <div className="text-sm text-gray-600">Total Items</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{session.matchedItems}</div>
            <div className="text-sm text-gray-600">Matched</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{session.varianceItems}</div>
            <div className="text-sm text-gray-600">Variance</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-600">{session.totalItems - session.matchedItems - session.varianceItems}</div>
            <div className="text-sm text-gray-600">Pending</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StockCountSummary;

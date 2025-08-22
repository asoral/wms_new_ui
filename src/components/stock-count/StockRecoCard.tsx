import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, CheckCircle, FileText, Edit, Eye, User } from "lucide-react";
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
    // Only return date, no time
    return format(date, 'dd MMM yyyy');
  };

  const getCreatedByDisplay = (owner?: string) => {
    if (!owner) return 'Unknown';
    return owner.includes('@') ? owner.split('@')[0] : owner;
  };

  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer">
      <CardContent className="p-4">
        {/* Compact single row layout with fixed column widths */}
        <div className="flex items-center gap-4">
          {/* Left Section - Primary Info (Fixed width) */}
          <div className="w-64 min-w-0 flex-shrink-0">
            <div className="flex items-center gap-3 mb-1">
              <h3 className="font-semibold text-base text-foreground truncate">{session.id}</h3>
              {getStatusBadge(session.status)}
            </div>
            <p className="text-sm text-muted-foreground truncate">{session.purpose}</p>
          </div>

          {/* Middle Section - Details in fixed columns */}
          <div className="hidden md:flex flex-1 justify-between items-center">
            {/* Column 1: Date (Fixed width) */}
            <div className="w-32 flex-shrink-0">
              <span className="text-muted-foreground text-xs block">Started:</span>
              <p className="font-medium text-sm">{formatDateTime(session.startedAt)}</p>
            </div>

            {/* Column 2: Creator (Fixed width) */}
            <div className="w-40 flex-shrink-0">
              {session.owner && (
                <>
                  <span className="text-muted-foreground text-xs flex items-center gap-1">
                    <User className="w-3 h-3" />
                    Created by:
                  </span>
                  <span className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium dark:bg-blue-900/20 dark:text-blue-300">
                    {getCreatedByDisplay(session.owner)}
                  </span>
                </>
              )}
            </div>

            {/* Column 3: Items (Fixed width) */}
            <div className="w-20 flex-shrink-0 text-center">
              <span className="text-muted-foreground text-xs block">Total Items:</span>
              <p className="font-bold text-blue-600 text-lg">{session.totalItems}</p>
            </div>

            {/* Column 4: Difference (Fixed width) */}
            <div className="w-32 flex-shrink-0 text-right">
              {session.differenceAmount !== undefined && (
                <>
                  <span className="text-muted-foreground text-xs block">Difference:</span>
                  <p className="font-medium text-red-600">₹ {session.differenceAmount?.toLocaleString() || 0}</p>
                </>
              )}
            </div>
          </div>

          {/* Right Section - Actions (Fixed width) */}
          <div className="flex gap-2 flex-shrink-0 w-32 justify-end">
            {session.status === 'Draft' && onEdit && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => onEdit(session.id)}
                className="px-2"
              >
                <Edit className="w-4 h-4 mr-1" />
                Edit
              </Button>
            )}
            {onView && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => onView(session.id)}
                className="px-2"
              >
                <Eye className="w-4 h-4 mr-1" />
                View
              </Button>
            )}
          </div>
        </div>

        {/* Mobile-only details - shown below on smaller screens */}
        <div className="md:hidden mt-3 pt-3 border-t">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-muted-foreground text-xs">Started:</span>
              <p className="font-medium">{formatDateTime(session.startedAt)}</p>
            </div>
            <div>
              <span className="text-muted-foreground text-xs">Total Items:</span>
              <p className="font-medium text-blue-600">{session.totalItems}</p>
            </div>
            {session.owner && (
              <div>
                <span className="text-muted-foreground text-xs flex items-center gap-1">
                  <User className="w-3 h-3" />
                  Created by:
                </span>
                <p className="font-medium text-blue-600">{getCreatedByDisplay(session.owner)}</p>
              </div>
            )}
            {session.differenceAmount !== undefined && (
              <div>
                <span className="text-muted-foreground text-xs">Difference:</span>
                <p className="font-medium text-red-600">₹ {session.differenceAmount?.toLocaleString() || 0}</p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
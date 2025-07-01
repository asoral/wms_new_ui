
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarDays, User, Package, DollarSign } from "lucide-react";

interface StockEntry {
  name: string;
  stock_entry_type: string;
  docstatus: number;
  creation: string;
  owner: string;
  total_outgoing_value?: number;
  total_incoming_value?: number;
}

interface MobileStockEntryCardProps {
  entry: StockEntry;
  onView?: (entry: StockEntry) => void;
  onEdit?: (entry: StockEntry) => void;
}

const MobileStockEntryCard = ({ entry, onView, onEdit }: MobileStockEntryCardProps) => {
  const getStatusBadge = (docstatus: number) => {
    switch (docstatus) {
      case 0:
        return <Badge variant="secondary">Draft</Badge>;
      case 1:
        return <Badge variant="default">Submitted</Badge>;
      case 2:
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount);
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
              <h3 className="font-semibold text-lg">{entry.name}</h3>
              <p className="text-sm text-gray-600">{entry.stock_entry_type}</p>
            </div>
            {getStatusBadge(entry.docstatus)}
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center space-x-2">
              <CalendarDays className="w-4 h-4 text-gray-500" />
              <div>
                <p className="text-gray-500">Date</p>
                <p className="font-medium">{formatDate(entry.creation)}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <User className="w-4 h-4 text-gray-500" />
              <div>
                <p className="text-gray-500">Created By</p>
                <p className="font-medium truncate">{entry.owner}</p>
              </div>
            </div>
          </div>

          {/* Value Information */}
          {(entry.total_outgoing_value || entry.total_incoming_value) && (
            <div className="grid grid-cols-1 gap-2 text-sm">
              {entry.total_outgoing_value && (
                <div className="flex items-center justify-between bg-red-50 p-2 rounded">
                  <span className="flex items-center text-red-700">
                    <DollarSign className="w-4 h-4 mr-1" />
                    Outgoing Value
                  </span>
                  <span className="font-medium text-red-700">
                    {formatCurrency(entry.total_outgoing_value)}
                  </span>
                </div>
              )}
              {entry.total_incoming_value && (
                <div className="flex items-center justify-between bg-green-50 p-2 rounded">
                  <span className="flex items-center text-green-700">
                    <DollarSign className="w-4 h-4 mr-1" />
                    Incoming Value
                  </span>
                  <span className="font-medium text-green-700">
                    {formatCurrency(entry.total_incoming_value)}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex space-x-2 pt-2">
            {onView && (
              <Button variant="outline" size="sm" onClick={() => onView(entry)} className="flex-1">
                View
              </Button>
            )}
            {onEdit && entry.docstatus === 0 && (
              <Button variant="default" size="sm" onClick={() => onEdit(entry)} className="flex-1">
                Edit
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MobileStockEntryCard;

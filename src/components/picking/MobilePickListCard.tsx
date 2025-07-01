
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarDays, User, Package, Building, MapPin } from "lucide-react";

interface PickList {
  name: string;
  purpose: string;
  company: string;
  docstatus: number;
  creation: string;
  owner: string;
  locations?: any[];
}

interface MobilePickListCardProps {
  pickList: PickList;
  onSelect?: (pickList: PickList) => void;
  onView?: (pickList: PickList) => void;
}

const MobilePickListCard = ({ pickList, onSelect, onView }: MobilePickListCardProps) => {
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const itemCount = pickList.locations?.length || 0;

  return (
    <Card className="w-full">
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Header */}
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-semibold text-lg">{pickList.name}</h3>
              <p className="text-sm text-gray-600">{pickList.purpose}</p>
            </div>
            {getStatusBadge(pickList.docstatus)}
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center space-x-2">
              <CalendarDays className="w-4 h-4 text-gray-500" />
              <div>
                <p className="text-gray-500">Date</p>
                <p className="font-medium">{formatDate(pickList.creation)}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Building className="w-4 h-4 text-gray-500" />
              <div>
                <p className="text-gray-500">Company</p>
                <p className="font-medium truncate">{pickList.company}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <User className="w-4 h-4 text-gray-500" />
              <div>
                <p className="text-gray-500">Created By</p>
                <p className="font-medium truncate">{pickList.owner}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Package className="w-4 h-4 text-gray-500" />
              <div>
                <p className="text-gray-500">Items</p>
                <p className="font-medium">{itemCount} items</p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex space-x-2 pt-2">
            {onView && (
              <Button variant="outline" size="sm" onClick={() => onView(pickList)} className="flex-1">
                View Details
              </Button>
            )}
            {onSelect && pickList.docstatus === 0 && (
              <Button variant="default" size="sm" onClick={() => onSelect(pickList)} className="flex-1">
                Start Picking
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MobilePickListCard;

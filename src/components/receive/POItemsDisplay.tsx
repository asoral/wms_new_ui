
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { POItem } from "../../pages/Receive";

interface POItemsDisplayProps {
  items: POItem[];
}

const POItemsDisplay = ({ items }: POItemsDisplayProps) => {
  if (items.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-32">
          <div className="text-center text-muted-foreground">
            <p>No purchase order items found</p>
            <p className="text-sm">Select a purchase order to view items</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {items.map((item, index) => (
        <Card key={index} className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="space-y-4">
              {/* Header with Item Code and Name */}
              <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-2">
                <div className="flex-1">
                  <h4 className="font-semibold text-lg text-primary">{item.itemCode}</h4>
                  <p className="text-muted-foreground">{item.itemName}</p>
                </div>
                <div className="flex gap-2">
                  <Badge variant="outline" className="font-medium">
                    {item.uom}
                  </Badge>
                </div>
              </div>

              {/* Quantities Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                  <p className="text-sm font-medium text-blue-700">Ordered</p>
                  <p className="text-xl font-bold text-blue-900">{item.orderedQty}</p>
                </div>
                <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                  <p className="text-sm font-medium text-green-700">Received</p>
                  <p className="text-xl font-bold text-green-900">{item.receivedQty}</p>
                </div>
                <div className="bg-orange-50 rounded-lg p-3 border border-orange-200">
                  <p className="text-sm font-medium text-orange-700">Pending</p>
                  <p className="text-xl font-bold text-orange-900">{item.pendingQty}</p>
                </div>
              </div>

              {/* Additional Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Rate</p>
                  <p className="font-semibold">₹{((item.rate && typeof item.rate === 'number') ? item.rate : 0).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Target Warehouse</p>
                  <p className="font-semibold">{item.warehouse}</p>
                </div>
              </div>

              {/* Tracking Information */}
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Tracking Requirements</p>
                <div className="flex gap-2">
                  {item.has_batch_no && (
                    <Badge variant="default" className="bg-purple-100 text-purple-800 border-purple-200">
                      Batch Tracking
                    </Badge>
                  )}
                  {item.has_serial_no && (
                    <Badge variant="default" className="bg-indigo-100 text-indigo-800 border-indigo-200">
                      Serial Tracking
                    </Badge>
                  )}
                  {!item.has_batch_no && !item.has_serial_no && (
                    <Badge variant="secondary" className="bg-muted text-muted-foreground">
                      No Tracking Required
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default POItemsDisplay;

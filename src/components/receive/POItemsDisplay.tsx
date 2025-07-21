
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
    <div className="space-y-3">
      {items.map((item, index) => (
        <Card key={index} className="hover:shadow-md transition-shadow">
          <CardContent className="p-3">
            <div className="space-y-3">
              {/* Header - Mobile Optimized */}
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-base text-primary truncate">{item.itemCode}</h4>
                    <p className="text-muted-foreground text-sm leading-tight">{item.itemName}</p>
                  </div>
                  <Badge variant="outline" className="text-xs whitespace-nowrap">
                    {item.uom}
                  </Badge>
                </div>
              </div>

              {/* Quantities Grid - Improved Mobile Layout */}
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-blue-50 rounded-md p-2 border border-blue-200 text-center">
                  <p className="text-xs font-medium text-blue-700 mb-1">Ordered</p>
                  <p className="text-lg font-bold text-blue-900 leading-none">{item.orderedQty}</p>
                </div>
                <div className="bg-green-50 rounded-md p-2 border border-green-200 text-center">
                  <p className="text-xs font-medium text-green-700 mb-1">Received</p>
                  <p className="text-lg font-bold text-green-900 leading-none">{item.receivedQty}</p>
                </div>
                <div className="bg-orange-50 rounded-md p-2 border border-orange-200 text-center">
                  <p className="text-xs font-medium text-orange-700 mb-1">Pending</p>
                  <p className="text-lg font-bold text-orange-900 leading-none">{item.pendingQty}</p>
                </div>
              </div>

              {/* Rate and Warehouse - Stack on Mobile */}
              <div className="space-y-2 pt-2 border-t">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-medium text-muted-foreground">Rate:</span>
                  <span className="font-semibold text-sm">₹{((item.rate && typeof item.rate === 'number') ? item.rate : 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-start">
                  <span className="text-xs font-medium text-muted-foreground">Warehouse:</span>
                  <span className="font-semibold text-xs text-right leading-tight max-w-[60%]">{item.warehouse}</span>
                </div>
              </div>

              {/* Tracking Information - Compact */}
              <div className="flex flex-wrap gap-1">
                {item.has_batch_no && (
                  <Badge variant="default" className="bg-purple-100 text-purple-800 border-purple-200 text-xs px-2 py-0.5">
                    Batch
                  </Badge>
                )}
                {item.has_serial_no && (
                  <Badge variant="default" className="bg-indigo-100 text-indigo-800 border-indigo-200 text-xs px-2 py-0.5">
                    Serial
                  </Badge>
                )}
                {!item.has_batch_no && !item.has_serial_no && (
                  <Badge variant="secondary" className="bg-muted text-muted-foreground text-xs px-2 py-0.5">
                    No Tracking
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default POItemsDisplay;

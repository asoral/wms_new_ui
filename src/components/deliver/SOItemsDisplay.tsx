import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package } from "lucide-react";
import { SalesOrderItem } from "@/types";

interface SOItemsDisplayProps {
  items: SalesOrderItem[];
  salesOrderNumber: string;
}

const SOItemsDisplay = ({ items, salesOrderNumber }: SOItemsDisplayProps) => {
  if (!items || items.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Items in {salesOrderNumber}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            No items found in this sales order
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Items in {salesOrderNumber}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {items.map((item, index) => (
            <Card key={index} className="border-l-4 border-l-blue-500">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3 flex-1">
                    <Package className="w-8 h-8 text-blue-600 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm text-gray-900 truncate">
                        {item.itemCode}
                      </h3>
                      <p className="text-sm text-gray-600 truncate mt-1">
                        {item.itemName}
                      </p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="ml-2">
                    Pending
                  </Badge>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <p className="text-xs font-medium text-gray-500">Ordered</p>
                    <p className="text-sm font-semibold">{item.orderedQty} {item.uom}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500">Delivered</p>
                    <p className="text-sm font-semibold">{item.deliveredQty} {item.uom}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500">Pending</p>
                    <p className="text-sm font-semibold text-orange-600">{item.pendingQty} {item.uom}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500">Rate</p>
                    <p className="text-sm font-semibold">₹{item.rate}</p>
                  </div>
                </div>
                
                {item.warehouse && (
                  <div className="mt-3 pt-3 border-t">
                    <p className="text-xs font-medium text-gray-500">Warehouse</p>
                    <p className="text-sm">{item.warehouse}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default SOItemsDisplay;
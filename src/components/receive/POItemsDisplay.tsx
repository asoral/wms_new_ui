
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { POItem } from "../../pages/Receive";
import { useIsMobile } from "@/hooks/use-mobile";

interface POItemsDisplayProps {
  items: POItem[];
}

const POItemsDisplay = ({ items }: POItemsDisplayProps) => {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <div className="space-y-4">
        {items.map((item, index) => (
          <Card key={index} className="p-4">
            <div className="space-y-2">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium text-gray-900">{item.itemCode}</p>
                  <p className="text-sm text-gray-600">{item.itemName}</p>
                </div>
                <Badge variant="outline">{item.uom}</Badge>
              </div>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Ordered</p>
                  <p className="font-medium">{item.orderedQty}</p>
                </div>
                <div>
                  <p className="text-gray-500">Received</p>
                  <p className="font-medium text-green-600">{item.receivedQty}</p>
                </div>
                <div>
                  <p className="text-gray-500">Pending</p>
                  <p className="font-medium text-orange-600">{item.pendingQty}</p>
                </div>
              </div>
              <div className="text-xs text-gray-500">
                Rate: ₹{item.rate.toLocaleString()} | Warehouse: {item.warehouse}
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b">
            <th className="text-left p-2">Item Code</th>
            <th className="text-left p-2">Item Name</th>
            <th className="text-left p-2">Ordered</th>
            <th className="text-left p-2">Received</th>
            <th className="text-left p-2">Pending</th>
            <th className="text-left p-2">UOM</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => (
            <tr key={index} className="border-b">
              <td className="p-2">{item.itemCode}</td>
              <td className="p-2">{item.itemName}</td>
              <td className="p-2">{item.orderedQty}</td>
              <td className="p-2">{item.receivedQty}</td>
              <td className="p-2">{item.pendingQty}</td>
              <td className="p-2">{item.uom}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default POItemsDisplay;

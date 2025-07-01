
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SOItem } from "@/types";

interface SOItemsDisplayProps {
  items: SOItem[];
  title?: string;
}

const SOItemsDisplay = ({ items, title = "Sales Order Items" }: SOItemsDisplayProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left p-3 border">Item Code</th>
                <th className="text-left p-3 border">Item Name</th>
                <th className="text-left p-3 border">Ordered</th>
                <th className="text-left p-3 border">Delivered</th>
                <th className="text-left p-3 border">Pending</th>
                <th className="text-left p-3 border">Rate</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr key={index} className="border-b">
                  <td className="p-3 border">
                    <Badge variant="outline">{item.itemCode}</Badge>
                  </td>
                  <td className="p-3 border">{item.itemName}</td>
                  <td className="p-3 border">{item.orderedQty} {item.uom}</td>
                  <td className="p-3 border">{item.deliveredQty} {item.uom}</td>
                  <td className="p-3 border">{item.pendingQty} {item.uom}</td>
                  <td className="p-3 border">₹{item.rate.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};

export default SOItemsDisplay;

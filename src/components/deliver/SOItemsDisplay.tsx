
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useIsMobile } from "@/hooks/use-mobile";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { SOItem } from "../../pages/Deliver";

interface SOItemsDisplayProps {
  items: SOItem[];
  title?: string;
}

const SOItemsDisplay = ({ items, title = "Sales Order Items" }: SOItemsDisplayProps) => {
  const isMobile = useIsMobile();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (items.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-gray-500">No items found</p>
        </CardContent>
      </Card>
    );
  }

  if (isMobile) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {items.map((item, index) => (
            <Card key={index} className="border">
              <CardContent className="p-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-sm">{item.itemCode}</h3>
                    <Badge variant={item.pendingQty > 0 ? "default" : "secondary"}>
                      {item.pendingQty > 0 ? "Pending" : "Delivered"}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-600 line-clamp-2">{item.itemName}</p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-gray-500">Ordered:</span>
                      <p className="font-medium">{item.orderedQty} {item.uom}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Delivered:</span>
                      <p className="font-medium">{item.deliveredQty} {item.uom}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Pending:</span>
                      <p className="font-medium text-orange-600">{item.pendingQty} {item.uom}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Rate:</span>
                      <p className="font-medium">{formatCurrency(item.rate)}</p>
                    </div>
                  </div>
                  <div className="text-xs">
                    <span className="text-gray-500">Warehouse:</span>
                    <p className="font-medium">{item.warehouse}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item Code</TableHead>
                <TableHead>Item Name</TableHead>
                <TableHead>Ordered</TableHead>
                <TableHead>Delivered</TableHead>
                <TableHead>Pending</TableHead>
                <TableHead>Rate</TableHead>
                <TableHead>Warehouse</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{item.itemCode}</TableCell>
                  <TableCell className="max-w-xs truncate">{item.itemName}</TableCell>
                  <TableCell>{item.orderedQty} {item.uom}</TableCell>
                  <TableCell>{item.deliveredQty} {item.uom}</TableCell>
                  <TableCell className="text-orange-600 font-medium">{item.pendingQty} {item.uom}</TableCell>
                  <TableCell>{formatCurrency(item.rate)}</TableCell>
                  <TableCell>{item.warehouse}</TableCell>
                  <TableCell>
                    <Badge variant={item.pendingQty > 0 ? "default" : "secondary"}>
                      {item.pendingQty > 0 ? "Pending" : "Delivered"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default SOItemsDisplay;

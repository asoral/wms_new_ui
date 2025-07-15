import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useIsMobile } from "@/hooks/use-mobile";
import { BinItem } from "../../pages/BinEnquiry";

interface BinItemsTableProps {
  items: BinItem[];
}

const BinItemsTable = ({ items }: BinItemsTableProps) => {
  const isMobile = useIsMobile();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getAgeColor = (age: number) => {
    if (age <= 30) return "bg-green-100 text-green-800";
    if (age <= 60) return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  };

  if (isMobile) {
    return (
      <div className="space-y-4">
        {items.map((item, index) => (
          <Card key={index} className="border-l-4 border-l-green-500">
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-lg">{item.itemCode}</h3>
                    <p className="text-muted-foreground text-sm">{item.itemName}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-green-600">{item.qty}</p>
                    <p className="text-sm text-muted-foreground">{item.uom}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Age:</span>
                    <div className="mt-1">
                      <Badge className={getAgeColor(item.age)}>
                        {item.age} days
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Valuation:</span>
                    <p className="font-semibold mt-1">{formatCurrency(item.valuation)}</p>
                  </div>
                </div>

                {(item.batch || item.serial) && (
                  <div className="flex flex-wrap gap-2">
                    {item.batch && (
                      <Badge variant="outline">
                        Batch: {item.batch}
                      </Badge>
                    )}
                    {item.serial && (
                      <Badge variant="outline">
                        Serial: {item.serial}
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}

        {items.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">No items found in this bin.</p>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  // Desktop table view - keep existing code
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Item Code</TableHead>
            <TableHead>Item Name</TableHead>
            <TableHead className="text-right">Quantity</TableHead>
            <TableHead>UOM</TableHead>
            {/* <TableHead>Batch/Serial</TableHead> */}
            <TableHead className="text-right">Age (Days)</TableHead>
            <TableHead className="text-right">Valuation</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item, index) => (
            <TableRow key={index}>
              <TableCell className="font-medium">{item.itemCode}</TableCell>
              <TableCell>{item.itemName}</TableCell>
              <TableCell className="text-right font-semibold">{item.qty}</TableCell>
              <TableCell>{item.uom}</TableCell>
              {/* <TableCell>
                {item.batch && (
                  <Badge variant="outline" className="mr-1">
                    Batch: {item.batch}
                  </Badge>
                )}
                {item.serial && (
                  <Badge variant="outline">
                    Serial: {item.serial}
                  </Badge>
                )}
                {!item.batch && !item.serial && (
                  <span className="text-muted-foreground">-</span>
                )}
              </TableCell> */}
              <TableCell className="text-right">
                <Badge className={getAgeColor(item.age)}>
                  {item.age} days
                </Badge>
              </TableCell>
              <TableCell className="text-right font-semibold">
                {formatCurrency(item.valuation)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default BinItemsTable;

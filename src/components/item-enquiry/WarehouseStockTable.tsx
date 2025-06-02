
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useIsMobile } from "@/hooks/use-mobile";
import { StockInfo } from "../../pages/ItemEnquiry";

interface WarehouseStockTableProps {
  stockInfo: StockInfo[];
}

const WarehouseStockTable = ({ stockInfo }: WarehouseStockTableProps) => {
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
        {stockInfo.map((stock, index) => (
          <Card key={index} className="border-l-4 border-l-blue-500">
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-lg">{stock.warehouse}</h3>
                    <p className="text-sm text-gray-600">UOM: {stock.uom}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-blue-600">{stock.qty}</p>
                    <p className="text-sm text-gray-600">{stock.uom}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Age:</span>
                    <div className="mt-1">
                      <Badge className={getAgeColor(stock.age)}>
                        {stock.age} days
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-600">Valuation:</span>
                    <p className="font-semibold mt-1">{formatCurrency(stock.valuation)}</p>
                  </div>
                </div>

                {(stock.batch || stock.serial) && (
                  <div className="flex flex-wrap gap-2">
                    {stock.batch && (
                      <Badge variant="outline">
                        Batch: {stock.batch}
                      </Badge>
                    )}
                    {stock.serial && (
                      <Badge variant="outline">
                        Serial: {stock.serial}
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}

        {stockInfo.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-gray-500">No stock information available for this item.</p>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  // Desktop table view
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Warehouse</TableHead>
            <TableHead className="text-right">Quantity</TableHead>
            <TableHead>UOM</TableHead>
            <TableHead>Batch/Serial</TableHead>
            <TableHead className="text-right">Age (Days)</TableHead>
            <TableHead className="text-right">Valuation</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {stockInfo.map((stock, index) => (
            <TableRow key={index}>
              <TableCell className="font-medium">{stock.warehouse}</TableCell>
              <TableCell className="text-right font-semibold">{stock.qty}</TableCell>
              <TableCell>{stock.uom}</TableCell>
              <TableCell>
                {stock.batch && (
                  <Badge variant="outline" className="mr-1">
                    Batch: {stock.batch}
                  </Badge>
                )}
                {stock.serial && (
                  <Badge variant="outline">
                    Serial: {stock.serial}
                  </Badge>
                )}
                {!stock.batch && !stock.serial && (
                  <span className="text-gray-400">-</span>
                )}
              </TableCell>
              <TableCell className="text-right">
                <Badge className={getAgeColor(stock.age)}>
                  {stock.age} days
                </Badge>
              </TableCell>
              <TableCell className="text-right font-semibold">
                {formatCurrency(stock.valuation)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default WarehouseStockTable;

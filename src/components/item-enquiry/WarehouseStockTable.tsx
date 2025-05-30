
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { StockInfo } from "../../pages/ItemEnquiry";

interface WarehouseStockTableProps {
  stockInfo: StockInfo[];
}

const WarehouseStockTable = ({ stockInfo }: WarehouseStockTableProps) => {
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

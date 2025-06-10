
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Warehouse, Package2 } from "lucide-react";
import { StockInfo } from "../../pages/ItemEnquiry";

interface WarehouseStockTableProps {
  warehouseStock: StockInfo[];
}

const WarehouseStockTable = ({ warehouseStock }: WarehouseStockTableProps) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  if (!warehouseStock || warehouseStock.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center space-x-2">
            <Warehouse className="w-5 h-5" />
            <span>Warehouse Stock</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center p-8">
            <Package2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No stock found in any warehouse</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center space-x-2">
          <Warehouse className="w-5 h-5" />
          <span>Warehouse Stock ({warehouseStock.length} warehouses)</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Warehouse</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
                <TableHead className="text-right">Valuation</TableHead>
                <TableHead className="text-right">Age (Days)</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {warehouseStock.map((stock, index) => (
                <TableRow key={`${stock.warehouse}-${index}`}>
                  <TableCell className="font-medium">
                    <div>
                      <div className="font-semibold">{stock.warehouse}</div>
                      {stock.batch && (
                        <div className="text-xs text-gray-500">Batch: {stock.batch}</div>
                      )}
                      {stock.serial && (
                        <div className="text-xs text-gray-500">Serial: {stock.serial}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="font-semibold">
                      {stock.qty.toFixed(2)} {stock.uom}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="font-semibold">
                      {formatCurrency(stock.valuation)}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant={stock.age > 90 ? "destructive" : stock.age > 60 ? "secondary" : "default"}>
                      {stock.age}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={stock.qty > 0 ? "default" : "secondary"}>
                      {stock.qty > 0 ? "In Stock" : "Out of Stock"}
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

export default WarehouseStockTable;


import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Warehouse, Package2 } from "lucide-react";
import { StockInfo } from "../../pages/ItemEnquiry";
import { useIsMobile } from "../../hooks/use-mobile";

interface WarehouseStockTableProps {
  warehouseStock: StockInfo[];
}

const WarehouseStockTable = ({ warehouseStock }: WarehouseStockTableProps) => {
  const isMobile = useIsMobile();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const getAgeBadgeVariant = (age: number) => {
    if (age <= 30) return "default"; // green
    if (age <= 60) return "secondary"; // orange
    if (age <= 90) return "destructive"; // amber/red
    return "destructive"; // red for 90+
  };

  const getAgeBadgeColor = (age: number) => {
    if (age <= 30) return "bg-green-500 text-white hover:bg-green-600";
    if (age <= 60) return "bg-orange-500 text-white hover:bg-orange-600";
    if (age <= 90) return "bg-amber-500 text-white hover:bg-amber-600";
    return "bg-red-500 text-white hover:bg-red-600";
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
        {isMobile ? (
          // Mobile Card View
          <div className="space-y-4">
            {warehouseStock.map((stock, index) => (
              <Card key={`${stock.warehouse}-${index}`} className="border border-gray-200">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-semibold text-base">{stock.warehouse}</div>
                        {stock.batch && (
                          <div className="text-xs text-gray-500">Batch: {stock.batch}</div>
                        )}
                        {stock.serial && (
                          <div className="text-xs text-gray-500">Serial: {stock.serial}</div>
                        )}
                      </div>
                      <Badge className={getAgeBadgeColor(stock.age)}>
                        {stock.age} days
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="text-gray-500 text-xs">Quantity</div>
                        <div className="font-semibold">
                          {stock.qty.toFixed(2)} {stock.uom}
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-500 text-xs">Valuation</div>
                        <div className="font-semibold">
                          {formatCurrency(stock.valuation)}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          // Desktop Table View
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Warehouse</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                  <TableHead className="text-right">Valuation</TableHead>
                  <TableHead className="text-right">Age (Days)</TableHead>
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
                      <Badge className={getAgeBadgeColor(stock.age)}>
                        {stock.age}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default WarehouseStockTable;

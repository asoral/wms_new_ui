
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Warehouse, Package, DollarSign, Calendar } from "lucide-react";

export interface StockInfo {
  warehouse: string;
  qty: number;
  valuation: number;
  age: number;
  uom: string;
  batch?: string;
  serial?: string;
  actualQty: number;
  reservedQty: number;
  availableQty: number;
  valuationRate: number;
}

interface WarehouseStockTableProps {
  warehouseStock: StockInfo[];
}

const WarehouseStockTable = ({ warehouseStock }: WarehouseStockTableProps) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getStockStatus = (qty: number) => {
    if (qty === 0) return { color: "bg-red-100 text-red-800", label: "Out of Stock" };
    if (qty < 10) return { color: "bg-yellow-100 text-yellow-800", label: "Low Stock" };
    return { color: "bg-green-100 text-green-800", label: "In Stock" };
  };

  if (warehouseStock.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Warehouse className="w-5 h-5" />
            <span>Warehouse Stock Details</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            No stock information available.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Warehouse className="w-5 h-5" />
          <span>Warehouse Stock Details</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Desktop View */}
          <div className="hidden md:block">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-medium text-gray-700">Warehouse</th>
                    <th className="text-right p-3 font-medium text-gray-700">Quantity</th>
                    <th className="text-right p-3 font-medium text-gray-700">Valuation</th>
                    <th className="text-center p-3 font-medium text-gray-700">Batch</th>
                    <th className="text-center p-3 font-medium text-gray-700">Serial</th>
                    <th className="text-center p-3 font-medium text-gray-700">Age (Days)</th>
                    <th className="text-center p-3 font-medium text-gray-700">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {warehouseStock.map((stock, index) => {
                    const status = getStockStatus(stock.actualQty);
                    return (
                      <tr key={index} className="border-b hover:bg-gray-50">
                        <td className="p-3">
                          <div className="font-medium">{stock.warehouse}</div>
                        </td>
                        <td className="p-3 text-right">
                          <div className="font-medium">{stock.qty} {stock.uom}</div>
                          <div className="text-xs text-gray-500">
                            Available: {stock.availableQty} | Reserved: {stock.reservedQty}
                          </div>
                        </td>
                        <td className="p-3 text-right">
                          <div className="font-medium">{formatCurrency(stock.valuation)}</div>
                          <div className="text-xs text-gray-500">
                            Rate: {formatCurrency(stock.valuationRate)}
                          </div>
                        </td>
                        <td className="p-3 text-center">
                          {stock.batch ? (
                            <Badge variant="outline">{stock.batch}</Badge>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="p-3 text-center">
                          {stock.serial ? (
                            <Badge variant="outline">{stock.serial}</Badge>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="p-3 text-center">
                          <Badge variant="secondary">{stock.age}</Badge>
                        </td>
                        <td className="p-3 text-center">
                          <Badge className={status.color}>{status.label}</Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile View */}
          <div className="md:hidden space-y-4">
            {warehouseStock.map((stock, index) => {
              const status = getStockStatus(stock.actualQty);
              return (
                <div key={index} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Warehouse className="w-4 h-4 text-gray-500" />
                      <span className="font-medium">{stock.warehouse}</span>
                    </div>
                    <Badge className={status.color}>{status.label}</Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center space-x-2">
                      <Package className="w-4 h-4 text-gray-500" />
                      <span>{stock.qty} {stock.uom}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <DollarSign className="w-4 h-4 text-gray-500" />
                      <span>{formatCurrency(stock.valuation)}</span>
                    </div>
                  </div>

                  <div className="text-xs text-gray-600 space-y-1">
                    <div>Available: {stock.availableQty} | Reserved: {stock.reservedQty}</div>
                    <div>Rate: {formatCurrency(stock.valuationRate)}</div>
                  </div>

                  {(stock.batch || stock.serial) && (
                    <div className="flex space-x-2">
                      {stock.batch && (
                        <Badge variant="outline">Batch: {stock.batch}</Badge>
                      )}
                      {stock.serial && (
                        <Badge variant="outline">Serial: {stock.serial}</Badge>
                      )}
                    </div>
                  )}

                  <div className="flex items-center space-x-2 text-xs text-gray-600">
                    <Calendar className="w-3 h-3" />
                    <span>Age: {stock.age} days</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default WarehouseStockTable;

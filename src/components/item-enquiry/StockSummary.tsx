
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, Warehouse, TrendingUp, AlertTriangle } from "lucide-react";
import { StockData } from "../../pages/ItemEnquiry";

interface StockSummaryProps {
  stockData: StockData;
  isLoading: boolean;
}

const StockSummary = ({ stockData, isLoading }: StockSummaryProps) => {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading stock summary...</div>
        </CardContent>
      </Card>
    );
  }

  if (!stockData) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-gray-500">No stock data available</div>
        </CardContent>
      </Card>
    );
  }

  const totalWarehouses = Array.isArray(stockData.warehouses) ? stockData.warehouses.length : 0;
  const totalStock = stockData.totalStock || 0;
  const reservedStock = stockData.reservedStock || 0;
  const availableStock = stockData.availableStock || 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Package className="w-5 h-5" />
          <span>Stock Summary</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{totalStock}</div>
            <div className="text-sm text-gray-600">Total Stock</div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{availableStock}</div>
            <div className="text-sm text-gray-600">Available</div>
          </div>
          <div className="text-center p-3 bg-yellow-50 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600">{reservedStock}</div>
            <div className="text-sm text-gray-600">Reserved</div>
          </div>
          <div className="text-center p-3 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">{totalWarehouses}</div>
            <div className="text-sm text-gray-600">Warehouses</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StockSummary;

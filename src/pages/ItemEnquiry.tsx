import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Package, RefreshCcw, Warehouse } from "lucide-react";
import ItemScanner from "../components/item-enquiry/ItemScanner";
import StockSummary from "../components/item-enquiry/StockSummary";
import WarehouseStockTable from "../components/item-enquiry/WarehouseStockTable";
import { createERPNextAPI } from "@/services/erpnextApi";

export interface StockInfo {
  warehouse: string;
  qty: number;
  uom: string;
  batch?: string;
  serial?: string;
  age: number;
  valuation: number;
}

export interface ItemStockData {
  itemCode: string;
  itemName: string;
  totalStock: number;
  uom: string;
  averageAge: number;
  totalValuation: number;
  warehouseStock: StockInfo[];
}

const ItemEnquiry = () => {
  const [currentItem, setCurrentItem] = useState<string>("");
  const [stockData, setStockData] = useState<ItemStockData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleItemSearch = async (itemCode: string) => {
    setIsLoading(true);
    setCurrentItem(itemCode);
    setError(null);
    
    try {
      const erpnextAPI = await createERPNextAPI();
      if (!erpnextAPI) {
        throw new Error('ERPNext API not configured. Please check your connection settings.');
      }

      // Get item details
      const itemResult = await erpnextAPI.getItem(itemCode);
      if (!itemResult.data) {
        throw new Error(`Item ${itemCode} not found`);
      }

      // Get stock balance for this item using corrected filter format
      const stockResult = await erpnextAPI.getStockBalance([['item_code', '=', itemCode]]);

      if (!stockResult.data || stockResult.data.length === 0) {
        setStockData({
          itemCode,
          itemName: itemResult.data.item_name || itemCode,
          totalStock: 0,
          uom: itemResult.data.stock_uom || 'Nos',
          averageAge: 0,
          totalValuation: 0,
          warehouseStock: []
        });
        setIsLoading(false);
        return;
      }

      // Process stock data
      const warehouseStock: StockInfo[] = stockResult.data.map((stock: any) => ({
        warehouse: stock.warehouse || 'Unknown',
        qty: stock.actual_qty || 0,
        uom: stock.stock_uom || itemResult.data.stock_uom || 'Nos',
        batch: stock.batch_no || undefined,
        serial: stock.serial_no || undefined,
        age: Math.floor(Math.random() * 90), // ERPNext doesn't provide age directly
        valuation: stock.stock_value || 0
      }));

      const totalStock = warehouseStock.reduce((sum, stock) => sum + stock.qty, 0);
      const totalValuation = warehouseStock.reduce((sum, stock) => sum + stock.valuation, 0);
      const averageAge = warehouseStock.length > 0 
        ? Math.round(warehouseStock.reduce((sum, stock) => sum + stock.age, 0) / warehouseStock.length)
        : 0;

      setStockData({
        itemCode,
        itemName: itemResult.data.item_name || itemCode,
        totalStock,
        uom: itemResult.data.stock_uom || 'Nos',
        averageAge,
        totalValuation,
        warehouseStock
      });

    } catch (err) {
      console.error('Error fetching item data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch item data');
      setStockData(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = () => {
    if (currentItem) {
      handleItemSearch(currentItem);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Package className="w-6 h-6 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">Item Enquiry</h1>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="icon" onClick={handleRefresh} disabled={isLoading}>
              <RefreshCcw className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Item Scanner/Search */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Search className="w-5 h-5" />
              <span>Search Item</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ItemScanner onItemScanned={handleItemSearch} isLoading={isLoading} />
          </CardContent>
        </Card>

        {/* Error Display */}
        {error && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="py-4">
              <div className="text-red-800">{error}</div>
            </CardContent>
          </Card>
        )}

        {/* Stock Information */}
        {stockData && (
          <div className="space-y-6">
            {/* Summary */}
            <StockSummary stockData={stockData} />

            {/* Detailed Stock by Warehouse */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Warehouse className="w-5 h-5" />
                  <span>Stock by Warehouse</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <WarehouseStockTable stockInfo={stockData.warehouseStock} />
              </CardContent>
            </Card>
          </div>
        )}

        {/* No Data State */}
        {!stockData && !isLoading && !error && (
          <Card>
            <CardContent className="py-12">
              <div className="text-center text-gray-500">
                <Package className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium mb-2">No Item Selected</p>
                <p>Scan or enter an item code to view stock information</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ItemEnquiry;

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Package, RefreshCcw, Warehouse } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import ItemScanner from "../components/item-enquiry/ItemScanner";
import StockSummary from "../components/item-enquiry/StockSummary";
import WarehouseStockTable from "../components/item-enquiry/WarehouseStockTable";
import { createERPNextAPI, getUserDefaultCompany } from "@/services/erpnextApi";
import { offlineStorage } from "@/services/offlineStorage";

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
  const [isOffline, setIsOffline] = useState(false);
  const { toast } = useToast();

  const handleItemSearch = async (itemCode: string) => {
    setIsLoading(true);
    setCurrentItem(itemCode);
    setError(null);
    setIsOffline(false);
    
    try {
      const erpnextAPI = await createERPNextAPI();
      if (!erpnextAPI) {
        throw new Error('ERPNext API not configured. Please check your connection settings.');
      }

      // Get the user's default company
      const defaultCompany = await getUserDefaultCompany();

      // First, verify the item exists
      let itemResult;
      try {
        itemResult = await erpnextAPI.getItem(itemCode);
      } catch (err) {
        // If item is not found, try searching
        const searchResult = await erpnextAPI.searchItems(itemCode, defaultCompany || undefined, 10);
        
        if (!searchResult.data || searchResult.data.length === 0) {
          // Try searching by barcode
          const barcodeSearchResult = await erpnextAPI.getItemByBarcode(itemCode, defaultCompany || undefined);
          
          if (!barcodeSearchResult.data || barcodeSearchResult.data.length === 0) {
            setError(`Item code "${itemCode}" not found. Please select an item from the list or enter the correct item code.`);
            setStockData(null);
            setIsLoading(false);
            return;
          } else {
            itemResult = { data: barcodeSearchResult.data[0] };
          }
        } else {
          itemResult = { data: searchResult.data[0] };
        }
      }

      if (!itemResult.data) {
        setError(`Item code "${itemCode}" not found. Please select an item from the list or enter the correct item code.`);
        setStockData(null);
        setIsLoading(false);
        return;
      }

      // Get stock balance (will try Stock Balance Report first, then fallback to Bin)
      const stockResult = await erpnextAPI.getStockBalance([
        ['item_code', '=', itemResult.data.item_code || itemCode]
      ], defaultCompany || undefined);

      console.log('Stock Balance Result:', stockResult);

      if (!stockResult.data || stockResult.data.length === 0) {
        const emptyStockData = {
          itemCode: itemResult.data.item_code || itemCode,
          itemName: itemResult.data.item_name || itemCode,
          totalStock: 0,
          uom: itemResult.data.stock_uom || 'Nos',
          averageAge: 0,
          totalValuation: 0,
          warehouseStock: []
        };
        setStockData(emptyStockData);
        
        // Cache the result
        await offlineStorage.cacheData(`stock_${itemCode}`, emptyStockData);
        setIsLoading(false);
        return;
      }

      // Process stock data
      const warehouseStockMap: { [key: string]: StockInfo } = {};

      stockResult.data.forEach((stockEntry: any) => {
        const warehouse = stockEntry.warehouse;
        const qty = parseFloat(stockEntry.actual_qty) || 0;
        const valuation = parseFloat(stockEntry.stock_value) || 0;

        if (qty > 0 && warehouse) { // Only include warehouses with positive stock
          if (warehouseStockMap[warehouse]) {
            warehouseStockMap[warehouse].qty += qty;
            warehouseStockMap[warehouse].valuation += valuation;
          } else {
            warehouseStockMap[warehouse] = {
              warehouse,
              qty,
              uom: stockEntry.stock_uom || itemResult.data.stock_uom || 'Nos',
              valuation,
              age: Math.floor(Math.random() * 90), // TODO: Calculate actual age from stock ageing
              batch: undefined,
              serial: undefined
            };
          }
        }
      });

      const warehouseStock = Object.values(warehouseStockMap);
      const totalStock = warehouseStock.reduce((sum, stock) => sum + stock.qty, 0);
      const totalValuation = warehouseStock.reduce((sum, stock) => sum + stock.valuation, 0);
      const averageAge = warehouseStock.length > 0 
        ? Math.round(warehouseStock.reduce((sum, stock) => sum + stock.age, 0) / warehouseStock.length)
        : 0;

      // Get precision for stock UOM from ERPNext (default to 2 decimal places)
      const stockPrecision = 2; // TODO: Get from UOM master in ERPNext

      const finalStockData = {
        itemCode: itemResult.data.item_code || itemCode,
        itemName: itemResult.data.item_name || itemCode,
        totalStock: parseFloat(totalStock.toFixed(stockPrecision)),
        uom: itemResult.data.stock_uom || 'Nos',
        averageAge,
        totalValuation: parseFloat(totalValuation.toFixed(2)),
        warehouseStock
      };

      setStockData(finalStockData);
      
      // Cache the result for offline access
      await offlineStorage.cacheData(`stock_${itemCode}`, finalStockData);

    } catch (err) {
      console.error('Error fetching item data:', err);
      
      // Try to load from cache if network error
      try {
        const cachedData = await offlineStorage.getCachedData(`stock_${itemCode}`);
        if (cachedData) {
          setStockData(cachedData);
          setIsOffline(true);
          toast({
            title: "Offline Mode",
            description: "Showing cached data. Check your internet connection for latest updates.",
            variant: "default"
          });
        } else {
          throw err; // Re-throw if no cached data available
        }
      } catch (cacheErr) {
        if (err instanceof Error) {
          if (err.message.includes('404') || err.message.includes('not found')) {
            setError(`Item code "${itemCode}" not found. Please select an item from the list or enter the correct item code.`);
          } else {
            setError(err.message);
          }
        } else {
          setError('Failed to fetch item data. Please check your connection and try again.');
        }
        setStockData(null);
      }
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
            {isOffline && (
              <span className="text-sm bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                Offline Mode
              </span>
            )}
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

        {/* Error Display - Mobile Friendly */}
        {error && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="py-4">
              <div className="text-red-800 break-words">{error}</div>
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

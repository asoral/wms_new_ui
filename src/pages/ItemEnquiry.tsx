
import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Package, ArrowLeft, WifiOff } from "lucide-react";
import { createERPNextAPI, getUserDefaultCompany } from '@/services/erpnextApi';
import { offlineStorage } from '@/services/offlineStorage';
import { useToast } from "@/hooks/use-toast";
import ItemScanner from '../components/item-enquiry/ItemScanner';
import StockSummary from '../components/item-enquiry/StockSummary';
import WarehouseStockTable from '../components/item-enquiry/WarehouseStockTable';

export interface StockInfo {
  warehouse: string;
  qty: number;
  uom: string;
  valuation: number;
  age: number;
  batch?: string;
  serial?: string;
}

export interface StockData {
  itemCode: string;
  itemName: string;
  totalStock: number;
  uom: string;
  averageAge: number;
  totalValuation: number;
  warehouseStock: StockInfo[];
}

const ItemEnquiry = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentItem, setCurrentItem] = useState<string>(searchParams.get('item') || '');
  const [stockData, setStockData] = useState<StockData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const itemParam = searchParams.get('item');
    if (itemParam && itemParam !== currentItem) {
      handleItemSearch(itemParam);
    }
  }, [searchParams]);

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

      const defaultCompany = await getUserDefaultCompany();

      // First, try to find item by direct lookup
      let itemResult;
      try {
        console.log('Searching for item:', itemCode);
        itemResult = await erpnextAPI.getItemDetails(itemCode);
        console.log('Item details result:', itemResult);
      } catch (err) {
        console.log('Direct item lookup failed, trying barcode search:', err);
        // If direct lookup fails, try barcode search
        try {
          const barcodeSearchResult = await erpnextAPI.getItemByBarcode(itemCode);
          
          if (barcodeSearchResult.data && barcodeSearchResult.data.length > 0) {
            itemResult = { data: barcodeSearchResult.data[0] };
          } else {
            // If barcode search also fails, try general search without company filter
            const searchResult = await erpnextAPI.searchItems(itemCode, undefined, 10);
            
            if (!searchResult.data || searchResult.data.length === 0) {
              setError(`Item "${itemCode}" not found. Please check the barcode or item code.`);
              setStockData(null);
              setIsLoading(false);
              return;
            } else {
              itemResult = { data: searchResult.data[0] };
            }
          }
        } catch (fallbackErr) {
          setError(`Item "${itemCode}" not found. Please check the barcode or item code.`);
          setStockData(null);
          setIsLoading(false);
          return;
        }
      }

      if (!itemResult.data) {
        setError(`Item "${itemCode}" not found. Please check the barcode or item code.`);
        setStockData(null);
        setIsLoading(false);
        return;
      }

      console.log('Final item result:', itemResult);

      // Get stock data using proper company filtering through warehouses
      const stockFilters = [
        ['item_code', '=', itemResult.data.item_code || itemCode]
      ];

      // Get warehouses for the company first, then filter Bin by those warehouses
      let binResult;
      if (defaultCompany) {
        try {
          // First get warehouses for the company
          const warehouseResult = await erpnextAPI.getWarehouses([['company', '=', defaultCompany]]);
          
          if (warehouseResult.data && warehouseResult.data.length > 0) {
            const warehouseNames = warehouseResult.data.map((w: any) => w.name);
            stockFilters.push(['warehouse', 'in', warehouseNames]);
          }
        } catch (warehouseErr) {
          console.warn('Failed to get warehouses for company, fetching all stock:', warehouseErr);
        }
      }

      binResult = await erpnextAPI.getBinStock(stockFilters);

      console.log('Bin Stock Result:', binResult);

      if (!binResult.data || binResult.data.length === 0) {
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

      // Process stock data from Bin doctype
      const warehouseStockMap: { [key: string]: StockInfo } = {};

      binResult.data.forEach((binEntry: any) => {
        const warehouse = binEntry.warehouse;
        const qty = parseFloat(binEntry.actual_qty) || 0;
        const valuation = parseFloat(binEntry.stock_value) || 0;

        if (qty > 0 && warehouse) {
          if (warehouseStockMap[warehouse]) {
            warehouseStockMap[warehouse].qty += qty;
            warehouseStockMap[warehouse].valuation += valuation;
          } else {
            warehouseStockMap[warehouse] = {
              warehouse,
              qty,
              uom: binEntry.stock_uom || itemResult.data.stock_uom || 'Nos',
              valuation,
              age: Math.floor(Math.random() * 90),
              batch: binEntry.batch_no || undefined,
              serial: binEntry.serial_no || undefined
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

      const stockPrecision = 2;

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
          throw err;
        }
      } catch (cacheErr) {
        if (err instanceof Error) {
          if (err.message.includes('404') || err.message.includes('not found')) {
            setError(`Item "${itemCode}" not found. Please check the barcode or item code.`);
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
              <Badge variant="destructive" className="flex items-center space-x-1">
                <WifiOff className="w-3 h-3" />
                <span>Offline</span>
              </Badge>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={() => navigate('/')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isLoading}>
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Item Scanner */}
          <div className="lg:col-span-1">
            <ItemScanner 
              onItemSelect={(itemCode) => {
                setSearchParams({ item: itemCode });
                handleItemSearch(itemCode);
              }}
            />
          </div>

          {/* Stock Information */}
          <div className="lg:col-span-2 space-y-6">
            {error && (
              <Card className="border-red-200 bg-red-50">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <Package className="w-12 h-12 text-red-400 mx-auto mb-4" />
                    <p className="text-red-600 font-medium">{error}</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {isLoading && (
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-center p-8">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                      <p className="text-sm text-gray-500 mt-2">Loading stock information...</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {stockData && !isLoading && (
              <>
                <StockSummary data={stockData} />
                <WarehouseStockTable warehouseStock={stockData.warehouseStock} />
              </>
            )}

            {!stockData && !isLoading && !error && (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center p-8">
                    <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Select an Item</h3>
                    <p className="text-gray-500">
                      Search or scan an item code to view stock information
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ItemEnquiry;

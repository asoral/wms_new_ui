
import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Warehouse, RefreshCw, ArrowLeft, WifiOff } from "lucide-react";
import BinScanner from "../components/bin-enquiry/BinScanner";
import BinItemsTable from "../components/bin-enquiry/BinItemsTable";
import { createERPNextAPI } from "@/services/erpnextApi";
import { offlineStorage } from "@/services/offlineStorage";
import { useToast } from "@/hooks/use-toast";

export interface BinItem {
  itemCode: string;
  itemName: string;
  qty: number;
  uom: string;
  batch?: string;
  serial?: string;
  age: number;
  valuation: number;
}

export interface BinData {
  binCode: string;
  warehouseName: string;
  isParentWarehouse: boolean;
  totalItems: number;
  totalValuation: number;
  items: BinItem[];
}

const BinEnquiry = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentBin, setCurrentBin] = useState<string>("");
  const [binData, setBinData] = useState<BinData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(false);
  const [abortController, setAbortController] = useState<AbortController | null>(null);

  // Handle search parameter from global search
  useEffect(() => {
    const searchQuery = searchParams.get('search');
    if (searchQuery) {
      handleBinSearch(searchQuery);
    }
  }, [searchParams]);

  const handleBinSearch = async (binCode: string) => {
    // Cancel any ongoing request
    if (abortController) {
      abortController.abort();
    }

    const newAbortController = new AbortController();
    setAbortController(newAbortController);
    setIsLoading(true);
    setCurrentBin(binCode);
    setError(null);
    setIsOffline(false);
    
    try {
      // First try to get from cache
      const cacheKey = `warehouse_stock_${binCode}`;
      const cachedData = await offlineStorage.getCachedData(cacheKey);
      
      if (cachedData) {
        console.log('Loading warehouse stock from cache:', binCode);
        setBinData(cachedData);
        setIsLoading(false);
        setAbortController(null);
        return;
      }

      console.log('Fetching warehouse stock from API:', binCode);
      const erpnextAPI = await createERPNextAPI();
      if (!erpnextAPI) {
        throw new Error('ERPNext API not configured. Please check your connection settings.');
      }

      // Check if request was aborted
      if (newAbortController.signal.aborted) {
        return;
      }

      // First check if it's a warehouse
      let warehouseResult;
      try {
        warehouseResult = await erpnextAPI.getWarehouses([['name', '=', binCode]]);
      } catch (err) {
        if (newAbortController.signal.aborted) return;
        warehouseResult = { data: [] };
      }

      // Check if request was aborted
      if (newAbortController.signal.aborted) {
        return;
      }

      // If not found by exact match, try partial match
      if (!warehouseResult.data || warehouseResult.data.length === 0) {
        try {
          warehouseResult = await erpnextAPI.getWarehouses([['name', 'like', `%${binCode}%`]]);
        } catch (err) {
          if (newAbortController.signal.aborted) return;
          warehouseResult = { data: [] };
        }
      }

      let targetWarehouse = binCode;
      let warehouseInfo = { name: binCode, is_group: 0, warehouse_name: binCode };

      if (warehouseResult.data && warehouseResult.data.length > 0) {
        warehouseInfo = warehouseResult.data[0];
        targetWarehouse = warehouseInfo.name;
      }

      // Check if request was aborted
      if (newAbortController.signal.aborted) {
        return;
      }

      // Build filters for warehouse-specific stock query using Bin doctype
      let stockFilters: any[] = [['warehouse', '=', targetWarehouse]];
      
      // If it's a parent warehouse, also get stock from child warehouses
      if (warehouseInfo.is_group === 1) {
        try {
          const childWarehouses = await erpnextAPI.getWarehouses([['parent_warehouse', '=', targetWarehouse]]);
          if (childWarehouses.data && childWarehouses.data.length > 0) {
            stockFilters = [
              ['warehouse', 'in', [targetWarehouse, ...childWarehouses.data.map((w: any) => w.name)]]
            ];
          }
        } catch (err) {
          if (newAbortController.signal.aborted) return;
          console.log('Could not fetch child warehouses, proceeding with parent only');
        }
      }

      // Check if request was aborted
      if (newAbortController.signal.aborted) {
        return;
      }

      // Get stock data from Bin doctype with warehouse filter
      const stockResult = await erpnextAPI.getBinStock(stockFilters);

      // Check if request was aborted
      if (newAbortController.signal.aborted) {
        return;
      }
      console.log("target warehoydigdidfgyudfuydfyudfa=======",stockResult.data.length)
      let processedData;
      if (!stockResult.data || stockResult.data.length === 0) {
        console.log("gfuguyfyufyuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuueueueueueuu------------------------",targetWarehouse, warehouseInfo, stockResult.data, newAbortController)
        processedData = {
          binCode: targetWarehouse,
          warehouseName: warehouseInfo.warehouse_name || targetWarehouse,
          isParentWarehouse: warehouseInfo.is_group === 1,
          totalItems: 0,
          totalValuation: 0,
          items: []
        };
      } else {
        console.log("99999999999999999999999999999999999999999999999999999",targetWarehouse, warehouseInfo, stockResult.data, newAbortController)
        processedData = await processBinData(targetWarehouse, warehouseInfo, stockResult.data, newAbortController);
      }

      // Check if request was aborted after processing
      if (newAbortController.signal.aborted) {
        return;
      }

      setBinData(processedData);
      
      // Cache the result for 10 minutes
      await offlineStorage.cacheData(cacheKey, processedData, 600000);

    } catch (err) {
      if (newAbortController.signal.aborted) {
        console.log('Request was cancelled');
        return;
      }
      
      console.error('Error fetching bin data:', err);
      
      // Try to load from cache on error
      try {
        const cacheKey = `warehouse_stock_${binCode}`;
        const cachedData = await offlineStorage.getCachedData(cacheKey);
        if (cachedData) {
          console.log('Loading warehouse stock from cache after error:', binCode);
          setBinData(cachedData);
          setIsOffline(true);
          setError(null);
          toast({
            title: "Offline Mode",
            description: "Showing cached data. Check your internet connection for latest updates.",
            variant: "default"
          });
        } else {
          throw err;
        }
      } catch (cacheError) {
        console.error('Failed to load cached warehouse stock:', cacheError);
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('Failed to fetch bin data. Please check your connection and try again.');
        }
        setBinData(null);
      }
    } finally {
      setIsLoading(false);
      setAbortController(null);
    }
  };

  const handleCancelSearch = () => {
    if (abortController) {
      abortController.abort();
      setAbortController(null);
    }
    setIsLoading(false);
    setError(null);
  };

  const processBinData = async (
    binCode: string, 
    warehouseInfo: any, 
    stockData: any[], 
    abortController: AbortController
  ): Promise<BinData> => {
    const items: BinItem[] = [];
    const itemsProcessed = new Set<string>();
    console.log("vchjcvjgvcjdjdjsjddjsdjgjfhjfhjjjjjgf7777777777777777777777",binCode)

    for (const stock of stockData) {
      console.log("stock hjbhsfvbjfdsvkfdh yuuuuuuuuuuuuuuuuuuuuuuyuy",stock.name)
      // Check if request was aborted
      if (abortController.signal.aborted) {
        throw new Error('Request cancelled');
      }

      if ((stock.actual_qty || 0) > 0 && !itemsProcessed.has(stock.item_code)) {
        itemsProcessed.add(stock.item_code);
        
        
        // Use item name from Bin doctype directly
        items.push({
          itemCode: stock.item_code,
          itemName: stock.item_name || stock.item_code,
          qty: stock.actual_qty || 0,
          uom: stock.stock_uom || 'Nos',
          batch: stock.batch_no || undefined,
          serial: stock.serial_no || undefined,
          age: Math.floor(Math.random() * 90),
          valuation: stock.stock_value || 0
        });
      }
    }
  

    const totalValuation = items.reduce((sum, item) => sum + item.valuation, 0);

    return {
      binCode,
      warehouseName: warehouseInfo.warehouse_name || warehouseInfo.name || binCode,
      isParentWarehouse: warehouseInfo.is_group === 1,
      totalItems: items.length,
      totalValuation,
      items
    };
  };

  const handleRefresh = () => {
    if (currentBin) {
      handleBinSearch(currentBin);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Warehouse className="w-6 h-6 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">Bin Enquiry</h1>
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
          {/* Bin Scanner */}
          <div className="lg:col-span-1">
            <BinScanner onBinScanned={handleBinSearch} isLoading={isLoading} />
          </div>

          {/* Bin Information */}
          <div className="lg:col-span-2 space-y-6">
            {error && (
              <Card className="border-red-200 bg-red-50">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <Warehouse className="w-12 h-12 text-red-400 mx-auto mb-4" />
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
                      <p className="text-sm text-gray-500 mt-2">Loading warehouse data...</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {binData && !isLoading && (
              <>
                {/* Bin Summary */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Warehouse Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">{binData.binCode}</div>
                        <div className="text-sm text-gray-600">Warehouse Code</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">{binData.totalItems}</div>
                        <div className="text-sm text-gray-600">Total Items</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">
                          ₹{binData.totalValuation.toLocaleString()}
                        </div>
                        <div className="text-sm text-gray-600">Total Valuation</div>
                      </div>
                      <div className="text-center">
                        <Badge variant={binData.isParentWarehouse ? "default" : "secondary"}>
                          {binData.isParentWarehouse ? "Parent" : "Child"}
                        </Badge>
                        <div className="text-sm text-gray-600 mt-1">{binData.warehouseName}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Items Table */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center space-x-2">
                      <Warehouse className="w-5 h-5" />
                      <span>Items in Warehouse ({binData.items.length})</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <BinItemsTable items={binData.items} />
                  </CardContent>
                </Card>
              </>
            )}

            {!binData && !isLoading && !error && (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center p-8">
                    <Warehouse className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Warehouse</h3>
                    <p className="text-gray-500">
                      Search or scan a warehouse code to view items
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

export default BinEnquiry;

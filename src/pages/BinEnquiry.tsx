
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Warehouse, RefreshCcw } from "lucide-react";
import BinScanner from "../components/bin-enquiry/BinScanner";
import BinItemsTable from "../components/bin-enquiry/BinItemsTable";
import { createERPNextAPI } from "@/services/erpnextApi";

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
  const [currentBin, setCurrentBin] = useState<string>("");
  const [binData, setBinData] = useState<BinData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Handle search parameter from global search
  useEffect(() => {
    const searchQuery = searchParams.get('search');
    if (searchQuery) {
      handleBinSearch(searchQuery);
    }
  }, [searchParams]);

  const handleBinSearch = async (binCode: string) => {
    setIsLoading(true);
    setCurrentBin(binCode);
    setError(null);
    
    try {
      const erpnextAPI = await createERPNextAPI();
      if (!erpnextAPI) {
        throw new Error('ERPNext API not configured. Please check your connection settings.');
      }

      // First check if it's a warehouse
      let warehouseResult;
      try {
        warehouseResult = await erpnextAPI.getWarehouses([['name', '=', binCode]]);
      } catch (err) {
        warehouseResult = { data: [] };
      }

      // If not found by exact match, try partial match
      if (!warehouseResult.data || warehouseResult.data.length === 0) {
        try {
          warehouseResult = await erpnextAPI.getWarehouses([['name', 'like', `%${binCode}%`]]);
        } catch (err) {
          warehouseResult = { data: [] };
        }
      }

      let targetWarehouse = binCode;
      let warehouseInfo = { name: binCode, is_group: 0, warehouse_name: binCode };

      if (warehouseResult.data && warehouseResult.data.length > 0) {
        warehouseInfo = warehouseResult.data[0];
        targetWarehouse = warehouseInfo.name;
      }

      // Get all items in this warehouse (including child warehouses if it's a parent)
      let stockFilters = [['warehouse', '=', targetWarehouse]];
      
      // If it's a parent warehouse, also get stock from child warehouses
      if (warehouseInfo.is_group === 1) {
        try {
          const childWarehouses = await erpnextAPI.getWarehouses([['parent_warehouse', '=', targetWarehouse]]);
          if (childWarehouses.data && childWarehouses.data.length > 0) {
            stockFilters = [
              ['warehouse', 'in', [targetWarehouse, ...childWarehouses.data.map(w => w.name)]]
            ];
          }
        } catch (err) {
          console.log('Could not fetch child warehouses, proceeding with parent only');
        }
      }

      const stockResult = await erpnextAPI.getStockBalance(stockFilters);

      if (!stockResult.data || stockResult.data.length === 0) {
        setBinData({
          binCode: targetWarehouse,
          warehouseName: warehouseInfo.warehouse_name || targetWarehouse,
          isParentWarehouse: warehouseInfo.is_group === 1,
          totalItems: 0,
          totalValuation: 0,
          items: []
        });
        setIsLoading(false);
        return;
      }

      setBinData(await processBinData(targetWarehouse, warehouseInfo, stockResult.data));

    } catch (err) {
      console.error('Error fetching bin data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch bin data');
      setBinData(null);
    } finally {
      setIsLoading(false);
    }
  };

  const processBinData = async (binCode: string, warehouseInfo: any, stockData: any[]): Promise<BinData> => {
    const erpnextAPI = await createERPNextAPI();
    const items: BinItem[] = [];
    const itemsProcessed = new Set<string>();

    for (const stock of stockData) {
      if ((stock.actual_qty || 0) > 0 && !itemsProcessed.has(stock.item_code)) {
        itemsProcessed.add(stock.item_code);
        
        try {
          const itemResult = await erpnextAPI!.getItem(stock.item_code);
          items.push({
            itemCode: stock.item_code,
            itemName: itemResult.data?.item_name || stock.item_code,
            qty: stock.actual_qty || 0,
            uom: stock.stock_uom || 'Nos',
            batch: stock.batch_no || undefined,
            serial: stock.serial_no || undefined,
            age: Math.floor(Math.random() * 90),
            valuation: stock.stock_value || 0
          });
        } catch (err) {
          items.push({
            itemCode: stock.item_code,
            itemName: stock.item_code,
            qty: stock.actual_qty || 0,
            uom: stock.stock_uom || 'Nos',
            batch: stock.batch_no || undefined,
            serial: stock.serial_no || undefined,
            age: Math.floor(Math.random() * 90),
            valuation: stock.stock_value || 0
          });
        }
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
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="icon" onClick={handleRefresh} disabled={isLoading}>
              <RefreshCcw className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Bin Scanner/Search */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Search className="w-5 h-5" />
              <span>Search Bin/Warehouse</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <BinScanner onBinScanned={handleBinSearch} isLoading={isLoading} />
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

        {/* Bin Information */}
        {binData && (
          <div className="space-y-6">
            {/* Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Bin Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{binData.binCode}</div>
                    <div className="text-sm text-gray-600">Bin Code</div>
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
                      {binData.isParentWarehouse ? "Parent Warehouse" : "Child Warehouse"}
                    </Badge>
                    <div className="text-sm text-gray-600 mt-1">{binData.warehouseName}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Items in Bin */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Warehouse className="w-5 h-5" />
                  <span>Items in Bin</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <BinItemsTable items={binData.items} />
              </CardContent>
            </Card>
          </div>
        )}

        {/* No Data State */}
        {!binData && !isLoading && !error && (
          <Card>
            <CardContent className="py-12">
              <div className="text-center text-gray-500">
                <Warehouse className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium mb-2">No Bin Selected</p>
                <p>Scan or enter a bin/warehouse code to view items</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default BinEnquiry;

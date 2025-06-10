
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, TrendingUp, DollarSign, Loader2, Search } from "lucide-react";
import { createERPNextAPI, getUserDefaultCompany } from "@/services/erpnextApi";
import { toast } from "sonner";
import SearchCard from "@/components/shared/SearchCard";

export interface ItemData {
  item_code: string;
  item_name: string;
  stock_uom: string;
  has_batch_no?: boolean;
  has_serial_no?: boolean;
  total_stock_value?: number;
  turnover_ratio?: number;
  total_qty?: number;
  warehouses?: Array<{
    warehouse: string;
    actual_qty: number;
    stock_value: number;
  }>;
}

export interface StockData {
  itemCode: string;
  itemName: string;
  uom: string;
  totalStock: number;
  totalValuation: number;
  averageAge: number;
  warehouseStock: StockInfo[];
}

export interface StockInfo {
  warehouse: string;
  qty: number;
  valuation: number;
  age: number;
  uom: string;
  batch?: string;
  serial?: string;
}

const ItemEnquiry = () => {
  const [selectedItem, setSelectedItem] = useState<ItemData | null>(null);
  const [isLoadingStock, setIsLoadingStock] = useState(false);
  const [currentItemCode, setCurrentItemCode] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const handleItemSearch = async (itemCode: string) => {
    setIsLoadingStock(true);
    setCurrentItemCode(itemCode);
    setError(null);
    
    try {
      const erpnextAPI = await createERPNextAPI();
      if (!erpnextAPI) {
        throw new Error('ERPNext API not configured. Please check your connection settings.');
      }

      console.log('Fetching bin data for:', itemCode);
      
      // Get item details first
      const itemDetails = await erpnextAPI.items.getItemDetails(itemCode);
      
      // Get user's default company to filter warehouses
      const defaultCompany = await getUserDefaultCompany();
      let companyWarehouses: string[] = [];
      
      if (defaultCompany) {
        // Get all warehouses for the company
        const warehousesResult = await erpnextAPI.warehouse.getWarehouses([['company', '=', defaultCompany]]);
        if (warehousesResult.data) {
          companyWarehouses = warehousesResult.data.map(w => w.name);
        }
      }
      
      // Get bin data filtered by company warehouses
      const binResponse = await erpnextAPI.bin.getBinByItem(itemCode, companyWarehouses.length > 0 ? companyWarehouses : undefined);
      
      let totalStockValue = 0;
      let totalQty = 0;
      const warehouses: Array<{ warehouse: string; actual_qty: number; stock_value: number }> = [];

      if (binResponse.data && Array.isArray(binResponse.data)) {
        binResponse.data.forEach((bin: any) => {
          if (bin.actual_qty > 0) { // Only include warehouses with stock
            totalQty += bin.actual_qty || 0;
            const stockValue = (bin.actual_qty || 0) * (bin.valuation_rate || 0);
            totalStockValue += stockValue;
            warehouses.push({
              warehouse: bin.warehouse || '',
              actual_qty: bin.actual_qty || 0,
              stock_value: stockValue
            });
          }
        });
      }

      const enrichedItem: ItemData = {
        item_code: itemCode,
        item_name: itemDetails.data?.item_name || itemCode,
        stock_uom: itemDetails.data?.stock_uom || 'Nos',
        has_batch_no: Boolean(itemDetails.data?.has_batch_no),
        has_serial_no: Boolean(itemDetails.data?.has_serial_no),
        total_stock_value: totalStockValue,
        total_qty: totalQty,
        turnover_ratio: totalStockValue > 0 ? (totalQty / totalStockValue) * 100 : 0,
        warehouses
      };

      setSelectedItem(enrichedItem);
      console.log('Item details loaded from BIN:', enrichedItem);
      
    } catch (err) {
      console.error('Error fetching item bin data:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch item stock details';
      setError(errorMessage);
      toast.error(errorMessage);
      setSelectedItem(null);
    } finally {
      setIsLoadingStock(false);
    }
  };

  const handleRefresh = () => {
    if (currentItemCode) {
      handleItemSearch(currentItemCode);
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
        </div>

        {/* Item Search */}
        <div className="mb-6">
          <SearchCard
            title="Search Items"
            placeholder="Enter item code or name..."
            onSearch={handleItemSearch}
            isLoading={isLoadingStock}
            icon={<Search className="w-5 h-5" />}
          />
        </div>

        {/* Loading State */}
        {isLoadingStock && (
          <Card className="mb-6 border-blue-200 bg-blue-50">
            <CardContent className="py-6">
              <div className="flex items-center space-x-3">
                <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                <div>
                  <div className="font-medium text-blue-800">Loading item data...</div>
                  <div className="text-sm text-blue-600">
                    Fetching stock information for {currentItemCode}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error Display */}
        {error && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="py-4">
              <div className="text-red-800">{error}</div>
            </CardContent>
          </Card>
        )}

        {/* Selected Item Details */}
        {selectedItem && !isLoadingStock && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Item Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Item Code</p>
                    <p className="font-medium">{selectedItem.item_code}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Item Name</p>
                    <p className="font-medium">{selectedItem.item_name}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Stock UOM</p>
                    <p className="font-medium">{selectedItem.stock_uom || 'Nos'}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Item Features</p>
                    <div className="flex space-x-1">
                      {selectedItem.has_batch_no && <Badge variant="secondary" className="text-xs">Batch</Badge>}
                      {selectedItem.has_serial_no && <Badge variant="secondary" className="text-xs">Serial</Badge>}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Stock Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3">
                    <Package className="w-8 h-8 text-blue-500" />
                    <div>
                      <p className="text-sm text-gray-600">Total Quantity</p>
                      <p className="text-2xl font-bold">{selectedItem.total_qty || 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3">
                    <DollarSign className="w-8 h-8 text-green-500" />
                    <div>
                      <p className="text-sm text-gray-600">Stock Value</p>
                      <p className="text-2xl font-bold">₹{(selectedItem.total_stock_value || 0).toLocaleString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3">
                    <TrendingUp className="w-8 h-8 text-orange-500" />
                    <div>
                      <p className="text-sm text-gray-600">Turnover Ratio</p>
                      <p className="text-2xl font-bold">{(selectedItem.turnover_ratio || 0).toFixed(2)}%</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Warehouse Stock */}
            {selectedItem.warehouses && selectedItem.warehouses.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Warehouse-wise Stock</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2">Warehouse</th>
                          <th className="text-right p-2">Quantity</th>
                          <th className="text-right p-2">Value</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedItem.warehouses.map((warehouse, index) => (
                          <tr key={index} className="border-b">
                            <td className="p-2">{warehouse.warehouse}</td>
                            <td className="p-2 text-right">{warehouse.actual_qty}</td>
                            <td className="p-2 text-right">₹{warehouse.stock_value.toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* No Data State */}
        {!selectedItem && !isLoadingStock && !error && (
          <Card>
            <CardContent className="py-12">
              <div className="text-center text-gray-500">
                <Package className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium mb-2">No Item Selected</p>
                <p>Search for an item by code or name, or scan a barcode to view stock details</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ItemEnquiry;

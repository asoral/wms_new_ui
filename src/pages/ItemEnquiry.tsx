
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, TrendingUp, DollarSign, Calendar, Loader2 } from "lucide-react";
import { createERPNextAPI } from "@/services/erpnextApi";
import { toast } from "sonner";
import SearchCard from "@/components/shared/SearchCard";
import { Item } from "@/services/erp/erpnext/types";

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
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingStock, setIsLoadingStock] = useState(false);
  const [searchResults, setSearchResults] = useState<ItemData[]>([]);

  const handleSearch = async (query: string) => {
    setIsSearching(true);
    try {
      const erpnextAPI = await createERPNextAPI();
      if (!erpnextAPI) {
        toast.error('ERPNext API not configured');
        return;
      }

      console.log('Searching for items:', query);
      const response = await erpnextAPI.searchItems(query);
      
      if (response.data && response.data.length > 0) {
        // Convert Item[] to ItemData[] by mapping the type differences
        const convertedResults: ItemData[] = response.data.map((item: Item) => ({
          item_code: item.item_code,
          item_name: item.item_name,
          stock_uom: item.stock_uom,
          has_batch_no: Boolean(item.has_batch_no),
          has_serial_no: Boolean(item.has_serial_no),
        }));
        
        setSearchResults(convertedResults);
        // Auto-select first result if exact match
        const exactMatch = convertedResults.find(item => 
          item.item_code.toLowerCase() === query.toLowerCase()
        );
        if (exactMatch) {
          handleItemSelect(exactMatch);
        }
      } else {
        setSearchResults([]);
        toast.info('No items found matching your search');
      }
    } catch (error) {
      console.error('Error searching items:', error);
      toast.error('Failed to search items');
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleItemSelect = async (item: ItemData) => {
    setSelectedItem(item);
    setIsLoadingStock(true);
    
    try {
      const erpnextAPI = await createERPNextAPI();
      if (!erpnextAPI) {
        toast.error('ERPNext API not configured');
        return;
      }

      console.log('Fetching stock balance for:', item.item_code);
      
      // Get detailed item info
      const itemDetails = await erpnextAPI.getItemDetails(item.item_code);
      
      // Get stock balance
      const stockResponse = await erpnextAPI.getStockBalance({ item_code: item.item_code });
      
      let totalStockValue = 0;
      let totalQty = 0;
      const warehouses: Array<{ warehouse: string; actual_qty: number; stock_value: number }> = [];

      if (stockResponse.data && Array.isArray(stockResponse.data)) {
        stockResponse.data.forEach((stock: any) => {
          totalQty += stock.actual_qty || 0;
          totalStockValue += stock.stock_value || 0;
          warehouses.push({
            warehouse: stock.warehouse || '',
            actual_qty: stock.actual_qty || 0,
            stock_value: stock.stock_value || 0
          });
        });
      }

      const enrichedItem: ItemData = {
        ...item,
        ...(itemDetails.data || {}),
        has_batch_no: Boolean(itemDetails.data?.has_batch_no),
        has_serial_no: Boolean(itemDetails.data?.has_serial_no),
        total_stock_value: totalStockValue,
        total_qty: totalQty,
        turnover_ratio: totalStockValue > 0 ? (totalQty / totalStockValue) * 100 : 0,
        warehouses
      };

      setSelectedItem(enrichedItem);
      console.log('Item details loaded:', enrichedItem);
      
    } catch (error) {
      console.error('Error fetching item stock:', error);
      toast.error('Failed to fetch item stock details');
    } finally {
      setIsLoadingStock(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center space-x-3 mb-6">
          <Package className="w-6 h-6 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900">Item Enquiry</h1>
        </div>

        <div className="space-y-6">
          <SearchCard
            title="Search Items"
            placeholder="Enter item code, name, or scan barcode"
            onSearch={handleSearch}
            isLoading={isSearching}
            icon={<Package className="w-5 h-5" />}
          />

          {/* Search Results */}
          {searchResults.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Search Results</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {searchResults.map((item, index) => (
                    <div
                      key={index}
                      className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer flex justify-between items-center"
                      onClick={() => handleItemSelect(item)}
                    >
                      <div>
                        <p className="font-medium">{item.item_code}</p>
                        <p className="text-sm text-gray-600">{item.item_name}</p>
                      </div>
                      <Badge variant="outline">{item.stock_uom || 'Nos'}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Selected Item Details */}
          {selectedItem && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    Item Details
                    {isLoadingStock && <Loader2 className="w-5 h-5 animate-spin" />}
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
        </div>
      </div>
    </div>
  );
};

export default ItemEnquiry;

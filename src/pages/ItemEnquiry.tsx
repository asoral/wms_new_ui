import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Package, Warehouse, TrendingUp, AlertTriangle, Search, Camera, QrCode, Calendar, DollarSign, Clock } from "lucide-react";
import { createERPNextAPI } from "@/services/erpnextApi";
import { useToast } from "@/hooks/use-toast";
import ItemSelector from "../components/item-enquiry/ItemSelector";
import ItemScanner from "../components/item-enquiry/ItemScanner";
import CameraScanner from "../components/item-enquiry/CameraScanner";

export interface ItemDetails {
  itemCode: string;
  itemName: string;
  itemGroup: string;
  stockUom: string;
  description?: string;
}

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

const ItemEnquiry = () => {
  const [itemDetails, setItemDetails] = useState<ItemDetails | null>(null);
  const [stockInfo, setStockInfo] = useState<StockInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("selector");
  const [showCamera, setShowCamera] = useState(false);
  const { toast } = useToast();

  const loadItemDetails = async (itemCode: string) => {
    try {
      setLoading(true);
      const erpnextAPI = await createERPNextAPI();
      if (!erpnextAPI) {
        toast({
          title: "ERPNext Not Configured",
          description: "Please configure your ERPNext settings in the Profile page.",
          variant: "destructive"
        });
        return;
      }

      // Get item details
      const itemResult = await erpnextAPI.stock.getItems({
        item_code: itemCode
      });

      if (itemResult.data && itemResult.data.length > 0) {
        const item = itemResult.data[0];
        setItemDetails({
          itemCode: item.item_code || item.name,
          itemName: item.item_name,
          itemGroup: item.item_group || 'Default',
          stockUom: item.stock_uom || 'Nos',
          description: item.description || ''
        });

        // Get stock balance for this item
        const stockResult = await erpnextAPI.stock.getStockBalance(itemCode);
        if (stockResult.data) {
          const stockData: StockInfo[] = stockResult.data.map((stock: any) => ({
            warehouse: stock.warehouse,
            qty: stock.actual_qty || 0,
            valuation: (stock.actual_qty || 0) * (stock.valuation_rate || 0),
            age: Math.floor(Math.random() * 120), // Placeholder
            uom: item.stock_uom || 'Nos',
            actualQty: stock.actual_qty || 0,
            reservedQty: stock.reserved_qty || 0,
            availableQty: (stock.actual_qty || 0) - (stock.reserved_qty || 0),
            valuationRate: stock.valuation_rate || 0
          }));
          setStockInfo(stockData);
        }
      } else {
        toast({
          title: "Item Not Found",
          description: `Item ${itemCode} could not be found in ERPNext.`,
          variant: "destructive"
        });
        setItemDetails(null);
        setStockInfo([]);
      }

    } catch (error) {
      console.error('Failed to load item details:', error);
      toast({
        title: "Error",
        description: "Failed to load item details from ERPNext",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBarcodeScanned = async (barcode: string) => {
    try {
      const erpnextAPI = await createERPNextAPI();
      if (!erpnextAPI) return;

      // Try to find item by barcode first
      const barcodeResult = await erpnextAPI.stock.searchItemsByBarcode(barcode);
      if (barcodeResult.data && barcodeResult.data.length > 0) {
        const item = barcodeResult.data[0];
        await loadItemDetails(item.item_code || item.name);
      } else {
        // If not found by barcode, try direct search
        await loadItemDetails(barcode);
      }
    } catch (error) {
      console.error('Error searching by barcode:', error);
      await loadItemDetails(barcode);
    }
  };

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

  const getAgeColor = (age: number) => {
    if (age <= 30) return "bg-green-100 text-green-800";
    if (age <= 60) return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  };

  const totalStock = stockInfo.reduce((sum, stock) => sum + stock.actualQty, 0);
  const totalValuation = stockInfo.reduce((sum, stock) => sum + stock.valuation, 0);
  const totalWarehouses = stockInfo.length;
  const availableStock = stockInfo.reduce((sum, stock) => sum + stock.availableQty, 0);

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center space-x-2">
          <Package className="w-6 h-6" />
          <span>Item Enquiry</span>
        </h1>
        <p className="text-gray-500">Search for item details and stock information.</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="selector" className="flex items-center space-x-2">
            <Search className="w-4 h-4" />
            <span>Search</span>
          </TabsTrigger>
          <TabsTrigger value="barcode" className="flex items-center space-x-2">
            <QrCode className="w-4 h-4" />
            <span>Barcode</span>
          </TabsTrigger>
          <TabsTrigger value="camera" className="flex items-center space-x-2">
            <Camera className="w-4 h-4" />
            <span>Camera</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="selector">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Search className="w-5 h-5" />
                <span>Select Item</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ItemSelector 
                onItemSelected={loadItemDetails}
                isLoading={loading}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="barcode">
          <ItemScanner 
            onBarcodeScanned={handleBarcodeScanned}
            isLoading={loading}
          />
        </TabsContent>

        <TabsContent value="camera">
          {showCamera ? (
            <CameraScanner 
              onBarcodeScanned={handleBarcodeScanned}
              onClose={() => setShowCamera(false)}
            />
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <button 
                  onClick={() => setShowCamera(true)}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 mx-auto"
                >
                  <Camera className="w-4 h-4" />
                  <span>Open Camera Scanner</span>
                </button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Item Details and Stock Summary */}
      {itemDetails && (
        <div className="mt-6 space-y-6">
          {/* Item Details Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Package className="w-5 h-5" />
                <span>Item Details</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Item Code</label>
                  <p className="text-lg font-semibold">{itemDetails.itemCode}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Item Name</label>
                  <p className="text-lg font-semibold">{itemDetails.itemName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Item Group</label>
                  <p className="text-lg font-semibold">{itemDetails.itemGroup}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">UOM</label>
                  <p className="text-lg font-semibold">{itemDetails.stockUom}</p>
                </div>
              </div>
              {itemDetails.description && (
                <div className="mt-4">
                  <label className="text-sm font-medium text-gray-500">Description</label>
                  <p className="text-gray-700">{itemDetails.description}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Stock Summary - Colorful Cards like Deliver Screen */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5" />
                <span>Stock Summary</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-blue-600 mb-1">Total Stock</p>
                        <p className="text-2xl font-bold text-blue-600">{totalStock}</p>
                      </div>
                      <Calendar className="w-8 h-8 text-blue-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-green-50 border-green-200">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-green-600 mb-1">Available</p>
                        <p className="text-2xl font-bold text-green-600">{availableStock}</p>
                      </div>
                      <Package className="w-8 h-8 text-green-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-purple-50 border-purple-200">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-purple-600 mb-1">Warehouses</p>
                        <p className="text-2xl font-bold text-purple-600">{totalWarehouses}</p>
                      </div>
                      <Warehouse className="w-8 h-8 text-purple-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-yellow-50 border-yellow-200">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-yellow-600 mb-1">Total Value</p>
                        <p className="text-2xl font-bold text-yellow-600">{formatCurrency(totalValuation)}</p>
                      </div>
                      <DollarSign className="w-8 h-8 text-yellow-600" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>

          {/* Warehouse Stock Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Warehouse className="w-5 h-5" />
                <span>Warehouse Stock Details</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {stockInfo.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p>No stock information available.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Mobile View */}
                  <div className="md:hidden space-y-4">
                    {stockInfo.map((stock, index) => {
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
                            <div>
                              <span className="text-gray-600">Quantity:</span>
                              <p className="font-semibold">{stock.qty} {stock.uom}</p>
                            </div>
                            <div>
                              <span className="text-gray-600">Valuation:</span>
                              <p className="font-semibold">{formatCurrency(stock.valuation)}</p>
                            </div>
                          </div>

                          <div className="text-xs text-gray-600 space-y-1">
                            <div>Available: {stock.availableQty} | Reserved: {stock.reservedQty}</div>
                            <div>Rate: {formatCurrency(stock.valuationRate)}</div>
                            <div className="flex items-center space-x-2">
                              <span>Age:</span>
                              <Badge className={getAgeColor(stock.age)} variant="secondary">
                                {stock.age} days
                              </Badge>
                            </div>
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
                        </div>
                      );
                    })}
                  </div>

                  {/* Desktop View */}
                  <div className="hidden md:block">
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left p-3 font-medium text-gray-700">Warehouse</th>
                            <th className="text-right p-3 font-medium text-gray-700">Quantity</th>
                            <th className="text-right p-3 font-medium text-gray-700">Valuation</th>
                            <th className="text-center p-3 font-medium text-gray-700">Age</th>
                            <th className="text-center p-3 font-medium text-gray-700">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {stockInfo.map((stock, index) => {
                            const status = getStockStatus(stock.actualQty);
                            return (
                              <tr key={index} className="border-b hover:bg-gray-50">
                                <td className="p-3">
                                  <div className="flex items-center space-x-2">
                                    <Warehouse className="w-4 h-4 text-gray-500" />
                                    <div>
                                      <div className="font-medium">{stock.warehouse}</div>
                                      <div className="text-xs text-gray-500">
                                        Available: {stock.availableQty} | Reserved: {stock.reservedQty}
                                      </div>
                                    </div>
                                  </div>
                                </td>
                                <td className="p-3 text-right">
                                  <div className="font-medium">{stock.qty} {stock.uom}</div>
                                  <div className="text-xs text-gray-500">
                                    Rate: {formatCurrency(stock.valuationRate)}
                                  </div>
                                </td>
                                <td className="p-3 text-right">
                                  <div className="font-medium">{formatCurrency(stock.valuation)}</div>
                                </td>
                                <td className="p-3 text-center">
                                  <Badge className={getAgeColor(stock.age)} variant="secondary">
                                    {stock.age} days
                                  </Badge>
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
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {!loading && !itemDetails && (
        <Card className="mt-6">
          <CardContent className="text-center py-8">
            <Package className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-500">Select an item to view its stock details.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ItemEnquiry;

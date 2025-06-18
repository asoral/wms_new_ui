import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, X, Package, Camera } from "lucide-react";
import { createERPNextAPI } from "@/services/erpnextApi";
import { useToast } from "@/hooks/use-toast";
import ItemScanner from "../components/item-enquiry/ItemScanner";
import CameraScanner from "../components/item-enquiry/CameraScanner";
import StockSummary from "../components/item-enquiry/StockSummary";
import WarehouseStockTable from "../components/item-enquiry/WarehouseStockTable";

export interface ItemDetails {
  itemCode: string;
  itemName: string;
  itemGroup: string;
  stockUom: string;
  description?: string;
}

export interface ItemStock {
  warehouse: string;
  actualQty: number;
  reservedQty: number;
  availableQty: number;
  valuationRate: number;
}

export interface StockData {
  totalStock: number;
  availableStock: number;
  reservedStock: number;
  warehouses: ItemStock[];
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
  const [itemCode, setItemCode] = useState("");
  const [itemDetails, setItemDetails] = useState<ItemDetails | null>(null);
  const [stockInfo, setStockInfo] = useState<ItemStock[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("search");
  const [showCamera, setShowCamera] = useState(false);
  const { toast } = useToast();

  const loadItemDetails = async (code: string) => {
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

      // Get item details using the stock API
      const itemResult = await erpnextAPI.stock.getItems([
        ['item_code', '=', code]
      ], undefined, 1);

      if (itemResult.data && itemResult.data.length > 0) {
        const item = itemResult.data[0];
        setItemDetails({
          itemCode: item.item_code || item.item_name,
          itemName: item.item_name,
          itemGroup: item.item_group || 'Default',
          stockUom: item.stock_uom || 'Nos',
          description: item.description || ''
        });

        // Get stock balance for this item
        const stockResult = await erpnextAPI.stock.getStockBalance(code);
        if (stockResult.data) {
          const stockData: ItemStock[] = stockResult.data.map((stock: any) => ({
            warehouse: stock.warehouse,
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
          description: `Item ${code} could not be found in ERPNext.`,
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
      const barcodeResult = await erpnextAPI.stock.searchItems(barcode);
      if (barcodeResult.data && barcodeResult.data.length > 0) {
        const item = barcodeResult.data[0];
        setItemCode(item.item_code || item.item_name);
        await loadItemDetails(item.item_code || item.item_name);
      } else {
        // If not found by barcode, try direct search
        await loadItemDetails(barcode);
      }
    } catch (error) {
      console.error('Error searching by barcode:', error);
      await loadItemDetails(barcode);
    }
  };

  const handleSearch = () => {
    if (itemCode.trim()) {
      loadItemDetails(itemCode.trim());
    } else {
      toast({
        title: "Validation Error",
        description: "Please enter an item code to search.",
        variant: "destructive"
      });
    }
  };

  const handleClear = () => {
    setItemCode("");
    setItemDetails(null);
    setStockInfo([]);
  };

  // Create stock data for summary
  const stockData: StockData = {
    totalStock: stockInfo.reduce((sum, stock) => sum + stock.actualQty, 0),
    availableStock: stockInfo.reduce((sum, stock) => sum + stock.availableQty, 0),
    reservedStock: stockInfo.reduce((sum, stock) => sum + stock.reservedQty, 0),
    warehouses: stockInfo
  };

  // Transform stockInfo to warehouseStock format for the table
  const warehouseStock: StockInfo[] = stockInfo.map(stock => ({
    warehouse: stock.warehouse,
    qty: stock.actualQty,
    valuation: stock.actualQty * stock.valuationRate,
    age: Math.floor(Math.random() * 120), // Placeholder - would need actual age calculation
    uom: itemDetails?.stockUom || 'Nos',
    actualQty: stock.actualQty,
    reservedQty: stock.reservedQty,
    availableQty: stock.availableQty,
    valuationRate: stock.valuationRate
  }));

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Item Enquiry</h1>
        <p className="text-gray-500">Search for item details and stock information.</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="search">Search</TabsTrigger>
          <TabsTrigger value="barcode">Barcode</TabsTrigger>
          <TabsTrigger value="camera">Camera</TabsTrigger>
        </TabsList>

        <TabsContent value="search">
          <Card>
            <CardHeader>
              <CardTitle>Search by Item Code</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="itemCode" className="text-right">
                    Item Code
                  </Label>
                  <Input
                    type="text"
                    id="itemCode"
                    value={itemCode}
                    onChange={(e) => setItemCode(e.target.value)}
                    className="col-span-3"
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="secondary"
                    className="gap-2"
                    onClick={handleClear}
                  >
                    <X className="h-4 w-4" />
                    Clear
                  </Button>
                  <Button
                    type="submit"
                    className="gap-2"
                    onClick={handleSearch}
                    disabled={loading}
                  >
                    <Search className="h-4 w-4" />
                    {loading ? "Loading..." : "Search"}
                  </Button>
                </div>
              </div>
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
                <Button onClick={() => setShowCamera(true)}>
                  <Camera className="w-4 h-4 mr-2" />
                  Open Camera Scanner
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Display Results */}
      {itemDetails && (
        <div className="mt-6 space-y-6">
          <StockSummary 
            stockData={stockData}
            isLoading={loading}
          />

          <WarehouseStockTable 
            warehouseStock={warehouseStock}
          />
        </div>
      )}

      {!loading && itemCode && !itemDetails && (
        <Card className="mt-6">
          <CardContent className="text-center py-8">
            <p className="text-gray-500">No item found with code "{itemCode}".</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ItemEnquiry;

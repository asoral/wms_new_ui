import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { createERPNextAPI } from "@/services/erpnextApi";
import { useToast } from "@/hooks/use-toast";

export interface StockData {
  totalStock: number;
  uom: string;
  totalValuation: number;
  averageAge: number;
  warehouseStock: number;
  itemName: string;
  itemCode: string;
}

export interface StockInfo {
  warehouse: string;
  actual_qty: number;
  valuation_rate: number;
  batch?: string;
  serial?: string;
  age?: number;
  qty?: number;
  uom?: string;
  valuation?: number;
}

const ItemEnquiry = () => {
  const [itemCode, setItemCode] = useState("");
  const [stockData, setStockData] = useState<StockData | null>(null);
  const [stockInfo, setStockInfo] = useState<StockInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Optional: Load item details if an item code is already present
    if (itemCode) {
      loadItemDetails(itemCode);
    }
  }, []);

  const loadItemDetails = async (item: string) => {
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

      // Fetch item details
      const itemDetails = await erpnextAPI.stock.getItemDetails(item);
      console.log('Item details response:', itemDetails);

      if (itemDetails?.data) {
        // Fetch stock balance for all warehouses
        const stockBalance = await erpnextAPI.stock.getStockBalance(item);
        console.log('Stock balance response:', stockBalance);

        // Transform the data to match our StockData and StockInfo interfaces
        const totalStock = stockBalance?.data?.reduce((sum, item) => sum + (item.actual_qty || 0), 0) || 0;
        const totalValuation = stockBalance?.data?.reduce((sum, item) => sum + ((item.actual_qty || 0) * (item.valuation_rate || 0)), 0) || 0;

        setStockData({
          totalStock: totalStock,
          uom: itemDetails.data.stock_uom || itemDetails.data.uom,
          totalValuation: totalValuation,
          averageAge: 30, // Mock data
          warehouseStock: stockBalance?.data?.length || 0,
          itemName: itemDetails.data.item_name,
          itemCode: itemDetails.data.item_code
        });

        // Transform stock balance data to StockInfo
        const transformedStockInfo: StockInfo[] = stockBalance?.data?.map((item: any) => ({
          warehouse: item.warehouse,
          actual_qty: item.actual_qty,
          valuation_rate: item.valuation_rate,
          batch: item.batch_no,
          serial: item.serial_no,
          age: 30, // Mock data
          qty: item.actual_qty,
          uom: itemDetails.data.stock_uom || itemDetails.data.uom,
          valuation: item.valuation_rate * item.actual_qty
        })) || [];
        setStockInfo(transformedStockInfo);
      } else {
        setStockData(null);
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

  const handleSearch = () => {
    if (itemCode) {
      loadItemDetails(itemCode);
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
    setStockData(null);
    setStockInfo([]);
  };

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Item Enquiry</h1>
        <p className="text-gray-500">Check the stock details of a specific item.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Enter Item Code</CardTitle>
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
                onClick={handleClear}
              >
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

      {stockData && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Item Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Item Name</Label>
                <p className="font-semibold">{stockData.itemName}</p>
              </div>
              <div>
                <Label>Item Code</Label>
                <p className="font-semibold">{stockData.itemCode}</p>
              </div>
              <div>
                <Label>Total Stock</Label>
                <p className="font-semibold">{stockData.totalStock} {stockData.uom}</p>
              </div>
              <div>
                <Label>Total Valuation</Label>
                <p className="font-semibold">{stockData.totalValuation}</p>
              </div>
              <div>
                <Label>Average Age</Label>
                <p className="font-semibold">{stockData.averageAge} days</p>
              </div>
              <div>
                <Label>Warehouse Stock</Label>
                <p className="font-semibold">{stockData.warehouseStock} warehouses</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {stockInfo.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Stock Information by Warehouse</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="py-3 px-4 text-left font-semibold text-sm text-gray-600">Warehouse</th>
                    <th className="py-3 px-4 text-left font-semibold text-sm text-gray-600">Quantity</th>
                    <th className="py-3 px-4 text-left font-semibold text-sm text-gray-600">Valuation Rate</th>
                    <th className="py-3 px-4 text-left font-semibold text-sm text-gray-600">Batch</th>
                    <th className="py-3 px-4 text-left font-semibold text-sm text-gray-600">Serial</th>
                  </tr>
                </thead>
                <tbody>
                  {stockInfo.map((item) => (
                    <tr key={item.warehouse} className="border-b hover:bg-gray-50">
                      <td className="py-4 px-4">{item.warehouse}</td>
                      <td className="py-4 px-4">{item.actual_qty} {stockData?.uom}</td>
                      <td className="py-4 px-4">{item.valuation_rate}</td>
                      <td className="py-4 px-4">{item.batch || '-'}</td>
                      <td className="py-4 px-4">{item.serial || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {!loading && itemCode && !stockData && (
        <Card className="mt-6">
          <CardContent className="text-center py-8">
            <p className="text-gray-500">No stock information found for item "{itemCode}".</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ItemEnquiry;

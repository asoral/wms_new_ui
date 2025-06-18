import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";
import { createERPNextAPI } from "@/services/erpnextApi";
import { useToast } from "@/hooks/use-toast";

export interface BinItem {
  item_code: string;
  item_name: string;
  actual_qty: number;
  valuation_rate: number;
  warehouse: string;
  bin: string;
  itemCode?: string;
  itemName?: string;
  qty?: number;
  uom?: string;
  age?: number;
  valuation?: number;
  batch?: string;
  serial?: string;
}

const BinEnquiry = () => {
  const [binCode, setBinCode] = useState("");
  const [binItems, setBinItems] = useState<BinItem[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Optional: Load bin items if a bin code is already present
    if (binCode) {
      loadBinItems(binCode);
    }
  }, []);

  const loadBinItems = async (bin: string) => {
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

      // Fetch bin stock details
      const response = await erpnextAPI.stock.getBinStock(undefined, bin);
      console.log('Bin stock response:', response);

      if (response?.data) {
        // Transform the data to match our BinItem interface
        const transformedItems: BinItem[] = response.data.map((item: any) => ({
          item_code: item.item_code,
          item_name: item.item_name,
          actual_qty: item.actual_qty,
          valuation_rate: item.valuation_rate,
          warehouse: item.warehouse,
          bin: item.warehouse
        }));
        setBinItems(transformedItems);
      } else {
        setBinItems([]);
      }

    } catch (error) {
      console.error('Failed to load bin items:', error);
      toast({
        title: "Error",
        description: "Failed to load bin items from ERPNext",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    if (binCode) {
      loadBinItems(binCode);
    } else {
      toast({
        title: "Validation Error",
        description: "Please enter a bin code to search.",
        variant: "destructive"
      });
    }
  };

  const handleClear = () => {
    setBinCode("");
    setBinItems([]);
  };

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Bin Enquiry</h1>
        <p className="text-gray-500">Check the items in a specific bin.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Enter Bin Code</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="binCode" className="text-right">
                Bin Code
              </Label>
              <Input
                type="text"
                id="binCode"
                value={binCode}
                onChange={(e) => setBinCode(e.target.value)}
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

      {binItems.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Bin Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="py-3 px-4 text-left font-semibold text-sm text-gray-600">Item Code</th>
                    <th className="py-3 px-4 text-left font-semibold text-sm text-gray-600">Item Name</th>
                    <th className="py-3 px-4 text-left font-semibold text-sm text-gray-600">Quantity</th>
                    <th className="py-3 px-4 text-left font-semibold text-sm text-gray-600">Valuation Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {binItems.map((item) => (
                    <tr key={item.item_code} className="border-b hover:bg-gray-50">
                      <td className="py-4 px-4">{item.item_code}</td>
                      <td className="py-4 px-4">{item.item_name}</td>
                      <td className="py-4 px-4">{item.actual_qty}</td>
                      <td className="py-4 px-4">{item.valuation_rate}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {!loading && binCode && binItems.length === 0 && (
        <Card className="mt-6">
          <CardContent className="text-center py-8">
            <p className="text-gray-500">No items found in bin "{binCode}".</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default BinEnquiry;

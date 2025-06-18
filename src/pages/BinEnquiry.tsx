
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createERPNextAPI } from "@/services/erpnextApi";
import { useToast } from "@/hooks/use-toast";
import BinScanner from "../components/bin-enquiry/BinScanner";
import BinItemsTable from "../components/bin-enquiry/BinItemsTable";

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
  const [binItems, setBinItems] = useState<BinItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedBin, setSelectedBin] = useState<string>("");
  const { toast } = useToast();

  const loadBinItems = async (binCode: string) => {
    try {
      setLoading(true);
      setSelectedBin(binCode);
      
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
      const response = await erpnextAPI.stock.getBinStock(undefined, binCode);
      console.log('Bin stock response:', response);

      if (response?.data) {
        // Transform the data to match our BinItem interface
        const transformedItems: BinItem[] = response.data.map((item: any) => ({
          item_code: item.item_code,
          item_name: item.item_name,
          actual_qty: item.actual_qty,
          valuation_rate: item.valuation_rate,
          warehouse: item.warehouse,
          bin: item.warehouse,
          itemCode: item.item_code,
          itemName: item.item_name,
          qty: item.actual_qty,
          uom: 'Nos',
          age: Math.floor(Math.random() * 120), // Placeholder
          valuation: item.actual_qty * item.valuation_rate
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

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Bin Enquiry</h1>
        <p className="text-gray-500">Check the items in a specific bin or warehouse.</p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Select Bin/Warehouse</CardTitle>
        </CardHeader>
        <CardContent>
          <BinScanner 
            onBinScanned={loadBinItems}
            isLoading={loading}
          />
        </CardContent>
      </Card>

      {selectedBin && (
        <Card>
          <CardHeader>
            <CardTitle>Items in {selectedBin}</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <p>Loading bin items...</p>
              </div>
            ) : (
              <BinItemsTable items={binItems} />
            )}
          </CardContent>
        </Card>
      )}

      {!loading && !selectedBin && (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-gray-500">Select a bin or warehouse to view its items.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default BinEnquiry;

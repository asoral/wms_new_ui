import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { createERPNextAPI, getUserDefaultCompany } from "@/services/erpnextApi";
import { useToast } from "@/hooks/use-toast";
import { Plus, CheckCircle, AlertTriangle, Loader2, Package } from "lucide-react";
import ItemScanner from "@/components/item-enquiry/ItemScanner";
import { StockCountEntry, StockCountItem } from "@/types";
import { Item } from "@/types";

interface StockCountFormProps {
  onEntryAdded: (entry: StockCountEntry) => void;
}

const StockCountForm = ({ onEntryAdded }: StockCountFormProps) => {
  const [currentItemCode, setCurrentItemCode] = useState<string>("");
  const [currentItemName, setCurrentItemName] = useState<string>("");
  const [warehouse, setWarehouse] = useState<string>("");
  const [currentQty, setCurrentQty] = useState<number>(0);
  const [actualQty, setActualQty] = useState<number>(0);
  const [batch, setBatch] = useState<string>("");
  const [serial, setSerial] = useState<string>("");
  const [stockItems, setStockItems] = useState<StockCountItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [includeZeroQty, setIncludeZeroQty] = useState<boolean>(false);
  const { toast } = useToast();

  useEffect(() => {
    if (currentItemCode) {
      loadItemStock(currentItemCode);
    }
  }, [currentItemCode, includeZeroQty]);

  const loadItemStock = async (itemCode: string) => {
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

      const company = await getUserDefaultCompany();
      if (!company) {
        toast({
          title: "No Default Company",
          description: "Please set a default company in your profile settings.",
          variant: "destructive"
        });
        return;
      }

      const filters = [['item_code', '=', itemCode]];
      const response = await erpnextAPI.getStockBalance(filters);

      if (response?.data) {
        let transformedItems: StockCountItem[] = response.data.map((item: any) => ({
          itemCode: item.item_code,
          itemName: item.item_name || item.item_code,
          warehouse: item.warehouse,
          currentQty: item.actual_qty || 0,
          actualQty: 0,
          uom: item.stock_uom || 'Nos',
          batch: item.batch_no,
          serial: item.serial_no
        }));

        if (!includeZeroQty) {
          transformedItems = transformedItems.filter(item => item.currentQty > 0);
        }

        setStockItems(transformedItems);

        if (transformedItems.length === 0) {
          toast({
            title: "No Stock Found",
            description: `No stock found for item: ${itemCode}`,
            variant: "destructive"
          });
        }
      } else {
        setStockItems([]);
        toast({
          title: "No Data",
          description: `No stock data available for item: ${itemCode}`,
          variant: "destructive"
        });
      }

    } catch (error) {
      console.error('Failed to load item stock:', error);
      toast({
        title: "Error",
        description: `Failed to load item stock: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (item: StockCountItem) => {
    if (!item) {
      toast({
        title: "Invalid Item",
        description: "Please select a valid item",
        variant: "destructive"
      });
      return;
    }

    if (!item.warehouse) {
      toast({
        title: "Invalid Warehouse",
        description: "Please select a valid warehouse",
        variant: "destructive"
      });
      return;
    }

    if (isNaN(item.actualQty)) {
      toast({
        title: "Invalid Quantity",
        description: "Please enter a valid quantity",
        variant: "destructive"
      });
      return;
    }

    const difference = item.actualQty - item.currentQty;
    const status = difference === 0 ? 'matched' : 'variance';

    const entry: StockCountEntry = {
      itemCode: item.itemCode,
      itemName: item.itemName,
      warehouse: item.warehouse,
      currentQty: item.currentQty,
      actualQty: item.actualQty,
      difference: difference,
      status: status,
      batch: item.batch,
      serial: item.serial,
      uom: item.uom
    };

    onEntryAdded(entry);
  };

  const handleItemScanned = async (item: Item) => {
    const itemCode = item.item_code;
    
    if (!itemCode) {
      toast({
        title: "Invalid Item",
        description: "Please scan a valid item code",
        variant: "destructive"
      });
      return;
    }

    setCurrentItemCode(itemCode);
    setCurrentItemName(item.item_name);
    
    // Load item stock details
    await loadItemStock(itemCode);
  };

  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Package className="w-5 h-5" />
            <span>Add Stock Count Entry</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ItemScanner
            onItemScanned={handleItemScanned}
            isLoading={loading}
          />

          <div className="flex items-center space-x-2">
            <Checkbox
              id="includeZeroQty"
              checked={includeZeroQty}
              onCheckedChange={(checked) => setIncludeZeroQty(!!checked)}
            />
            <Label htmlFor="includeZeroQty" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed">
              Include Zero Quantity Items
            </Label>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <Loader2 className="w-6 h-6 mx-auto animate-spin text-gray-500 mb-2" />
              <p className="text-gray-500">Loading item stock...</p>
            </div>
          ) : stockItems.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item Code</TableHead>
                    <TableHead>Item Name</TableHead>
                    <TableHead>Warehouse</TableHead>
                    <TableHead>Current Qty</TableHead>
                    <TableHead>Actual Qty</TableHead>
                    <TableHead>UOM</TableHead>
                    <TableHead>Batch</TableHead>
                    <TableHead>Serial</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stockItems.map((item) => (
                    <TableRow key={item.itemCode + item.warehouse}>
                      <TableCell>{item.itemCode}</TableCell>
                      <TableCell>{item.itemName}</TableCell>
                      <TableCell>{item.warehouse}</TableCell>
                      <TableCell>{item.currentQty}</TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={item.actualQty}
                          onChange={(e) => {
                            const newQty = parseInt(e.target.value);
                            setStockItems(prevItems =>
                              prevItems.map(prevItem =>
                                prevItem.itemCode === item.itemCode && prevItem.warehouse === item.warehouse
                                  ? { ...prevItem, actualQty: newQty }
                                  : prevItem
                              )
                            );
                          }}
                        />
                      </TableCell>
                      <TableCell>{item.uom}</TableCell>
                      <TableCell>{item.batch}</TableCell>
                      <TableCell>{item.serial}</TableCell>
                      <TableCell className="text-right">
                        <Button onClick={() => handleSubmit(item)}>
                          Add Entry
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8">
              <AlertTriangle className="w-6 h-6 mx-auto text-gray-500 mb-2" />
              <p className="text-gray-500">No stock found for the selected item.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default StockCountForm;

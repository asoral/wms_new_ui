import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
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
import { Plus, CheckCircle, AlertTriangle, Loader2, Package, Search, ScanBarcode } from "lucide-react";
import ItemScanner from "@/components/item-enquiry/ItemScanner";
import { StockCountEntry, StockCountItem } from "@/types";
import { Item } from "@/types";

interface StockCountFormProps {
  onEntryAdded: (entry: StockCountEntry) => void;
}

const StockCountForm = ({ onEntryAdded }: StockCountFormProps) => {
  const [searchParams] = useSearchParams();
  const warehouse = searchParams.get('warehouse') || '';
  const [stockItems, setStockItems] = useState<StockCountItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [includeZeroQty, setIncludeZeroQty] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [showScanner, setShowScanner] = useState<boolean>(false);
  const { toast } = useToast();

  useEffect(() => {
    if (warehouse) {
      loadWarehouseStock();
    }
  }, [warehouse, includeZeroQty]);


  const loadWarehouseStock = async () => {
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

      // Get all items in the selected warehouse
      const filters = [['warehouse', '=', warehouse]];
      if (!includeZeroQty) {
        filters.push(['actual_qty', '>', '0']);
      }

      const response = await erpnextAPI.getBinStock('', warehouse);

      if (response?.data) {
        const transformedItems: StockCountItem[] = response.data.map((item: any) => ({
          itemCode: item.item_code,
          itemName: item.item_name || item.item_code,
          warehouse: item.warehouse,
          currentQty: item.actual_qty || 0,
          actualQty: item.actual_qty || 0,
          uom: 'Nos',
          batch: item.batch_no,
          serial: item.serial_no
        }));

        let filteredItems = transformedItems;
        if (!includeZeroQty) {
          filteredItems = transformedItems.filter(item => item.currentQty > 0);
        }

        setStockItems(filteredItems);

        if (filteredItems.length === 0) {
          toast({
            title: "No Stock Found",
            description: `No stock found in warehouse: ${warehouse}`,
            variant: "destructive"
          });
        }
      } else {
        setStockItems([]);
        toast({
          title: "No Data",
          description: `No stock data available for warehouse: ${warehouse}`,
          variant: "destructive"
        });
      }

    } catch (error) {
      console.error('Failed to load warehouse stock:', error);
      toast({
        title: "Error",
        description: `Failed to load warehouse stock: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

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

      // Get company-filtered bin stock for the item
      const response = await erpnextAPI.stockAPI.getBinStockForCompany(itemCode, company);

      if (response?.data) {
        let transformedItems: StockCountItem[] = response.data.map((item: any) => ({
          itemCode: item.item_code,
          itemName: item.item_name || item.item_code,
          warehouse: item.warehouse,
          currentQty: item.actual_qty || 0,
          actualQty: 0,
          uom: 'Nos',
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
    
    // Load item stock details
    await loadItemStock(itemCode);
  };

  const filteredItems = stockItems.filter(item =>
    item.itemCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.itemName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Manual Entry / Scan Barcode Toggle */}
      <div className="grid grid-cols-2 gap-4">
        <Button
          variant={!showScanner ? "default" : "outline"}
          onClick={() => setShowScanner(false)}
          className="flex items-center justify-center space-x-2"
        >
          <Search className="w-4 h-4" />
          <span>Manual Entry</span>
        </Button>
        <Button
          variant={showScanner ? "default" : "outline"}
          onClick={() => setShowScanner(true)}
          className="flex items-center justify-center space-x-2"
        >
          <ScanBarcode className="w-4 h-4" />
          <span>Scan Barcode</span>
        </Button>
      </div>

      {/* Scanner or Search Input */}
      {showScanner ? (
        <ItemScanner
          onItemScanned={handleItemScanned}
          isLoading={loading}
        />
      ) : (
        <div className="space-y-4">
          <Input
            placeholder="Search items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
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
        </div>
      )}

      {loading ? (
        <div className="text-center py-8">
          <Loader2 className="w-6 h-6 mx-auto animate-spin text-muted-foreground mb-2" />
          <p className="text-muted-foreground">Loading warehouse stock...</p>
        </div>
      ) : filteredItems.length > 0 ? (
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
              {filteredItems.map((item, index) => (
                <TableRow key={`${item.itemCode}-${item.warehouse}-${index}`}>
                  <TableCell className="font-medium">{item.itemCode}</TableCell>
                  <TableCell>{item.itemName}</TableCell>
                  <TableCell>{item.warehouse}</TableCell>
                  <TableCell className="text-center">{item.currentQty}</TableCell>
                  <TableCell className="w-32">
                    <Input
                      type="number"
                      value={item.actualQty || 0}
                      onChange={(e) => {
                        const newQty = parseFloat(e.target.value) || 0;
                        setStockItems(prevItems =>
                          prevItems.map(prevItem =>
                            prevItem.itemCode === item.itemCode && prevItem.warehouse === item.warehouse
                              ? { ...prevItem, actualQty: newQty }
                              : prevItem
                          )
                        );
                      }}
                      className="text-center"
                      step="0.01"
                    />
                  </TableCell>
                  <TableCell>{item.uom}</TableCell>
                  <TableCell>{item.batch || '-'}</TableCell>
                  <TableCell>{item.serial || '-'}</TableCell>
                  <TableCell className="text-right">
                    <Button 
                      onClick={() => handleSubmit(item)}
                      size="sm"
                    >
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
          {stockItems.length === 0 ? (
            <>
              <Package className="w-10 h-10 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Loading warehouse stock...</p>
            </>
          ) : (
            <>
              <Search className="w-10 h-10 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No items found matching your search.</p>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default StockCountForm;

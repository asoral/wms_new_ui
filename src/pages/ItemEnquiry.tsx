
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Package, Search, QrCode, Scan } from "lucide-react";
import { createERPNextAPI } from "@/services/erpnextApi";
import { useToast } from "@/hooks/use-toast";
import ItemScanner from "../components/item-enquiry/ItemScanner";
import CameraScanner from "../components/item-enquiry/CameraScanner";
import ItemSelector from "../components/item-enquiry/ItemSelector";
import StockSummary from "../components/item-enquiry/StockSummary";
import WarehouseStockTable from "../components/item-enquiry/WarehouseStockTable";

export interface ItemStock {
  warehouse: string;
  actualQty: number;
  reservedQty: number;
  projectedQty: number;
  valuation: number;
}

export interface ItemDetails {
  itemCode: string;
  itemName: string;
  description?: string;
  itemGroup?: string;
  uom: string;
  imageUrl?: string;
  hasSerialNo: boolean;
  hasBatchNo: boolean;
  barcode?: string;
}

const ItemEnquiry = () => {
  const [activeTab, setActiveTab] = useState("search");
  const [selectedItem, setSelectedItem] = useState<ItemDetails | null>(null);
  const [stockInfo, setStockInfo] = useState<ItemStock[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleItemSelected = async (itemCode: string) => {
    setLoading(true);
    try {
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
      const itemDetails = await erpnextAPI.stock.getItemDetails(itemCode);
      if (!itemDetails || !itemDetails.data) {
        toast({
          title: "Item Not Found",
          description: `Item ${itemCode} could not be found in the system.`,
          variant: "destructive"
        });
        return;
      }

      // Transform item data
      const item = itemDetails.data;
      setSelectedItem({
        itemCode: item.item_code,
        itemName: item.item_name,
        description: item.description,
        itemGroup: item.item_group,
        uom: item.stock_uom,
        imageUrl: item.image,
        hasSerialNo: item.has_serial_no === 1,
        hasBatchNo: item.has_batch_no === 1,
        barcode: item.barcode
      });

      await fetchStockInfo(itemCode);
    } catch (error) {
      console.error('Error fetching item details:', error);
      toast({
        title: "Error",
        description: "Failed to fetch item details from ERPNext",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBarcodeScanned = async (barcode: string) => {
    setLoading(true);
    try {
      const erpnextAPI = await createERPNextAPI();
      if (!erpnextAPI) return;

      // Search for item by barcode
      const itemByBarcode = await erpnextAPI.stock.searchItemsByBarcode(barcode);
      
      if (itemByBarcode?.data?.length > 0) {
        handleItemSelected(itemByBarcode.data[0].item_code);
      } else {
        // Try to search by item code directly
        const itemsByName = await erpnextAPI.stock.searchItems(barcode, undefined, 1);
        
        if (itemsByName?.data?.length > 0) {
          handleItemSelected(itemsByName.data[0].item_code);
        } else {
          toast({
            title: "Item Not Found",
            description: `No item found with barcode or item code: ${barcode}`,
            variant: "destructive"
          });
        }
      }
    } catch (error) {
      console.error('Error handling barcode scan:', error);
      toast({
        title: "Error",
        description: "Failed to process barcode scan",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchStockInfo = async (itemCode: string) => {
    try {
      const erpnextAPI = await createERPNextAPI();
      if (!erpnextAPI) return;

      // Get all warehouses
      const warehousesResult = await erpnextAPI.warehouse.getWarehouses();
      const warehouses = warehousesResult?.data || [];

      // Fetch bin stock information for the item
      const binStockData = await erpnextAPI.stock.getBinStock(itemCode);
      
      // Transform the data
      const stockByWarehouse = new Map<string, ItemStock>();
      
      if (binStockData?.data) {
        binStockData.data.forEach((bin: any) => {
          const warehouseCode = bin.warehouse;
          
          if (!stockByWarehouse.has(warehouseCode)) {
            stockByWarehouse.set(warehouseCode, {
              warehouse: warehouseCode,
              actualQty: 0,
              reservedQty: 0,
              projectedQty: 0,
              valuation: 0
            });
          }
          
          const stock = stockByWarehouse.get(warehouseCode)!;
          stock.actualQty += Number(bin.actual_qty || 0);
          stock.reservedQty += Number(bin.reserved_qty || 0);
          stock.projectedQty += Number(bin.projected_qty || 0);
          stock.valuation += Number(bin.stock_value || 0);
        });
      }
      
      // Add empty entries for warehouses with no stock
      warehouses.forEach((wh: any) => {
        if (!stockByWarehouse.has(wh.name)) {
          stockByWarehouse.set(wh.name, {
            warehouse: wh.name,
            actualQty: 0,
            reservedQty: 0,
            projectedQty: 0,
            valuation: 0
          });
        }
      });
      
      setStockInfo(Array.from(stockByWarehouse.values()));
      
    } catch (error) {
      console.error('Error fetching stock information:', error);
      toast({
        title: "Error",
        description: "Failed to fetch stock information",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center mb-6">
        <Package className="w-6 h-6 mr-2 text-blue-600" />
        <h1 className="text-2xl font-bold">Item Enquiry</h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-3 mb-6">
          <TabsTrigger value="search">
            <Search className="w-4 h-4 mr-2" />
            <span>Search</span>
          </TabsTrigger>
          <TabsTrigger value="scan">
            <QrCode className="w-4 h-4 mr-2" />
            <span>QR Code</span>
          </TabsTrigger>
          <TabsTrigger value="camera">
            <Scan className="w-4 h-4 mr-2" />
            <span>Camera</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="search">
          <Card>
            <CardHeader>
              <CardTitle>Search Item</CardTitle>
            </CardHeader>
            <CardContent>
              <ItemSelector onItemSelected={handleItemSelected} isLoading={loading} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="scan">
          <Card>
            <CardHeader>
              <CardTitle>Scan Item Barcode</CardTitle>
            </CardHeader>
            <CardContent>
              <ItemScanner onBarcodeScanned={handleBarcodeScanned} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="camera">
          <Card>
            <CardHeader>
              <CardTitle>Camera Scan</CardTitle>
            </CardHeader>
            <CardContent>
              <CameraScanner onBarcodeScanned={handleBarcodeScanned} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {selectedItem && (
        <div className="mt-6 space-y-6">
          <StockSummary item={selectedItem} stockInfo={stockInfo} isLoading={loading} />
          
          <Card>
            <CardHeader>
              <CardTitle>Warehouse Stock</CardTitle>
            </CardHeader>
            <CardContent>
              <WarehouseStockTable stockInfo={stockInfo} isLoading={loading} />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default ItemEnquiry;

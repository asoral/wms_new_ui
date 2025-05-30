
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Package, Scan, RefreshCcw, Warehouse } from "lucide-react";
import ItemScanner from "../components/item-enquiry/ItemScanner";
import StockSummary from "../components/item-enquiry/StockSummary";
import WarehouseStockTable from "../components/item-enquiry/WarehouseStockTable";

export interface StockInfo {
  warehouse: string;
  qty: number;
  uom: string;
  batch?: string;
  serial?: string;
  age: number;
  valuation: number;
}

export interface ItemStockData {
  itemCode: string;
  itemName: string;
  totalStock: number;
  uom: string;
  averageAge: number;
  totalValuation: number;
  warehouseStock: StockInfo[];
}

const ItemEnquiry = () => {
  const [currentItem, setCurrentItem] = useState<string>("");
  const [stockData, setStockData] = useState<ItemStockData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Mock data for demonstration
  const mockStockData: ItemStockData = {
    itemCode: "ITM-001",
    itemName: "Laptop Computer",
    totalStock: 150,
    uom: "Nos",
    averageAge: 45,
    totalValuation: 750000,
    warehouseStock: [
      {
        warehouse: "Main Store",
        qty: 75,
        uom: "Nos",
        batch: "BATCH-2024-001",
        age: 30,
        valuation: 375000
      },
      {
        warehouse: "Secondary Store",
        qty: 50,
        uom: "Nos",
        batch: "BATCH-2024-002",
        age: 60,
        valuation: 250000
      },
      {
        warehouse: "Regional Store",
        qty: 25,
        uom: "Nos",
        serial: "SER-001-025",
        age: 45,
        valuation: 125000
      }
    ]
  };

  const handleItemSearch = async (itemCode: string) => {
    setIsLoading(true);
    setCurrentItem(itemCode);
    
    // Simulate API call
    setTimeout(() => {
      if (itemCode) {
        setStockData(mockStockData);
      } else {
        setStockData(null);
      }
      setIsLoading(false);
    }, 1000);
  };

  const handleRefresh = () => {
    if (currentItem) {
      handleItemSearch(currentItem);
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
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="icon" onClick={handleRefresh}>
              <RefreshCcw className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Item Scanner/Search */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Search className="w-5 h-5" />
              <span>Search Item</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ItemScanner onItemScanned={handleItemSearch} isLoading={isLoading} />
          </CardContent>
        </Card>

        {/* Stock Information */}
        {stockData && (
          <div className="space-y-6">
            {/* Summary */}
            <StockSummary stockData={stockData} />

            {/* Detailed Stock by Warehouse */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Warehouse className="w-5 h-5" />
                  <span>Stock by Warehouse</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <WarehouseStockTable stockInfo={stockData.warehouseStock} />
              </CardContent>
            </Card>
          </div>
        )}

        {/* No Data State */}
        {!stockData && !isLoading && (
          <Card>
            <CardContent className="py-12">
              <div className="text-center text-gray-500">
                <Package className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium mb-2">No Item Selected</p>
                <p>Scan or enter an item code to view stock information</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ItemEnquiry;

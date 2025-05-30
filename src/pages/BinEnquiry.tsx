
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Warehouse, RefreshCcw } from "lucide-react";
import BinScanner from "../components/bin-enquiry/BinScanner";
import BinItemsTable from "../components/bin-enquiry/BinItemsTable";

export interface BinItem {
  itemCode: string;
  itemName: string;
  qty: number;
  uom: string;
  batch?: string;
  serial?: string;
  age: number;
  valuation: number;
}

export interface BinData {
  binCode: string;
  warehouseName: string;
  isParentWarehouse: boolean;
  totalItems: number;
  totalValuation: number;
  items: BinItem[];
}

const BinEnquiry = () => {
  const [currentBin, setCurrentBin] = useState<string>("");
  const [binData, setBinData] = useState<BinData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Mock data for demonstration
  const mockBinData: BinData = {
    binCode: "WH-001-A1",
    warehouseName: "Main Store - Section A",
    isParentWarehouse: true,
    totalItems: 5,
    totalValuation: 125000,
    items: [
      {
        itemCode: "ITM-001",
        itemName: "Laptop Computer",
        qty: 25,
        uom: "Nos",
        batch: "BATCH-2024-001",
        age: 30,
        valuation: 50000
      },
      {
        itemCode: "ITM-002",
        itemName: "Wireless Mouse",
        qty: 100,
        uom: "Nos",
        serial: "SER-MOUSE-001",
        age: 15,
        valuation: 15000
      },
      {
        itemCode: "ITM-003",
        itemName: "USB Cable",
        qty: 200,
        uom: "Nos",
        batch: "BATCH-2024-003",
        age: 45,
        valuation: 20000
      },
      {
        itemCode: "ITM-004",
        itemName: "Monitor",
        qty: 15,
        uom: "Nos",
        age: 20,
        valuation: 30000
      },
      {
        itemCode: "ITM-005",
        itemName: "Keyboard",
        qty: 50,
        uom: "Nos",
        batch: "BATCH-2024-005",
        age: 25,
        valuation: 10000
      }
    ]
  };

  const handleBinSearch = async (binCode: string) => {
    setIsLoading(true);
    setCurrentBin(binCode);
    
    // Simulate API call
    setTimeout(() => {
      if (binCode) {
        setBinData(mockBinData);
      } else {
        setBinData(null);
      }
      setIsLoading(false);
    }, 1000);
  };

  const handleRefresh = () => {
    if (currentBin) {
      handleBinSearch(currentBin);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Warehouse className="w-6 h-6 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">Bin Enquiry</h1>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="icon" onClick={handleRefresh}>
              <RefreshCcw className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Bin Scanner/Search */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Search className="w-5 h-5" />
              <span>Search Bin/Warehouse</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <BinScanner onBinScanned={handleBinSearch} isLoading={isLoading} />
          </CardContent>
        </Card>

        {/* Bin Information */}
        {binData && (
          <div className="space-y-6">
            {/* Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Bin Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{binData.binCode}</div>
                    <div className="text-sm text-gray-600">Bin Code</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{binData.totalItems}</div>
                    <div className="text-sm text-gray-600">Total Items</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      ₹{binData.totalValuation.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-600">Total Valuation</div>
                  </div>
                  <div className="text-center">
                    <Badge variant={binData.isParentWarehouse ? "default" : "secondary"}>
                      {binData.isParentWarehouse ? "Parent Warehouse" : "Child Warehouse"}
                    </Badge>
                    <div className="text-sm text-gray-600 mt-1">{binData.warehouseName}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Items in Bin */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Warehouse className="w-5 h-5" />
                  <span>Items in Bin</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <BinItemsTable items={binData.items} />
              </CardContent>
            </Card>
          </div>
        )}

        {/* No Data State */}
        {!binData && !isLoading && (
          <Card>
            <CardContent className="py-12">
              <div className="text-center text-gray-500">
                <Warehouse className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium mb-2">No Bin Selected</p>
                <p>Scan or enter a bin/warehouse code to view items</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default BinEnquiry;

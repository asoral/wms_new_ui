
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Package, Scan, Plus, Minus, ArrowRight, Printer } from "lucide-react";
import PalletScanner from "../components/pallet/PalletScanner";
import PalletCreator from "../components/pallet/PalletCreator";
import PalletMover from "../components/pallet/PalletMover";
import PalletDepalletizer from "../components/pallet/PalletDepalletizer";

export interface PalletItem {
  itemCode: string;
  itemName: string;
  qty: number;
  uom: string;
  batch?: string;
  serial?: string;
  warehouse: string;
}

export interface Pallet {
  id: string;
  barcode: string;
  location: string;
  createdDate: string;
  items: PalletItem[];
  status: "Active" | "Moved" | "Depalletized";
}

const PalletPage = () => {
  const [scannedPallet, setScannedPallet] = useState<Pallet | null>(null);
  const [activeTab, setActiveTab] = useState("scan");

  // Mock pallet data
  const mockPallet: Pallet = {
    id: "PLT-001",
    barcode: "PLT-2025-00001",
    location: "Main Store - A1",
    createdDate: "2025-01-15",
    status: "Active",
    items: [
      {
        itemCode: "ITM-001",
        itemName: "Laptop Dell Inspiron",
        qty: 10,
        uom: "Nos",
        batch: "BATCH-001",
        warehouse: "Main Store"
      },
      {
        itemCode: "ITM-002",
        itemName: "Wireless Mouse",
        qty: 25,
        uom: "Nos",
        serial: "SRL-001,SRL-002,SRL-003",
        warehouse: "Main Store"
      },
      {
        itemCode: "ITM-003",
        itemName: "USB Cable Type-C",
        qty: 50,
        uom: "Nos",
        batch: "BATCH-002",
        warehouse: "Main Store"
      }
    ]
  };

  const handlePalletScanned = (palletCode: string) => {
    // In real app, fetch pallet data from API
    console.log("Scanning pallet:", palletCode);
    setScannedPallet(mockPallet);
  };

  const handlePrintLabel = () => {
    console.log("Printing pallet label for:", scannedPallet?.barcode);
  };

  const handleMovePallet = () => {
    setActiveTab("move");
  };

  const handleDepalletize = () => {
    setActiveTab("depalletize");
  };

  const getTotalItems = () => {
    return scannedPallet?.items.reduce((total, item) => total + item.qty, 0) || 0;
  };

  return (
    <div className="w-full max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Package className="w-6 h-6 text-purple-600" />
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">Pallet Management</h1>
        </div>
      </div>

      {/* Pallet Scanner */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Scan className="w-5 h-5" />
            <span>Scan Pallet</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <PalletScanner onPalletScanned={handlePalletScanned} />
        </CardContent>
      </Card>

      {/* Pallet Details */}
      {scannedPallet && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span>Pallet Details</span>
              <div className="flex flex-wrap gap-2">
                <Badge className="bg-purple-100 text-purple-800">{scannedPallet.status}</Badge>
                <Button size="sm" onClick={handlePrintLabel} className="flex items-center space-x-1">
                  <Printer className="w-3 h-3" />
                  <span>Print Label</span>
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div>
                <Label className="text-sm text-gray-600">Pallet ID</Label>
                <p className="font-medium">{scannedPallet.barcode}</p>
              </div>
              <div>
                <Label className="text-sm text-gray-600">Location</Label>
                <p className="font-medium">{scannedPallet.location}</p>
              </div>
              <div>
                <Label className="text-sm text-gray-600">Created</Label>
                <p className="font-medium">{scannedPallet.createdDate}</p>
              </div>
              <div>
                <Label className="text-sm text-gray-600">Total Items</Label>
                <p className="font-medium">{getTotalItems()} items</p>
              </div>
            </div>

            {/* Items in Pallet */}
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900">Items in Pallet</h4>
              <div className="space-y-2">
                {scannedPallet.items.map((item, index) => (
                  <div key={index} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex-1">
                        <h5 className="font-medium">{item.itemCode}</h5>
                        <p className="text-sm text-gray-600">{item.itemName}</p>
                        <div className="flex flex-wrap gap-2 mt-1">
                          <span className="text-sm font-medium">{item.qty} {item.uom}</span>
                          {item.batch && (
                            <Badge variant="outline" className="text-xs">Batch: {item.batch}</Badge>
                          )}
                          {item.serial && (
                            <Badge variant="outline" className="text-xs">Serial: {item.serial}</Badge>
                          )}
                        </div>
                      </div>
                      <div className="text-sm text-gray-600 shrink-0">
                        {item.warehouse}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-col sm:flex-row gap-3 mt-6">
              <Button onClick={handleMovePallet} className="flex items-center space-x-2">
                <ArrowRight className="w-4 h-4" />
                <span>Move Pallet</span>
              </Button>
              <Button onClick={handleDepalletize} variant="outline" className="flex items-center space-x-2">
                <Minus className="w-4 h-4" />
                <span>De-palletize</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pallet Operations */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-2 sm:grid-cols-4 w-full max-w-2xl mx-auto">
          <TabsTrigger value="scan">Scan</TabsTrigger>
          <TabsTrigger value="create">Create</TabsTrigger>
          <TabsTrigger value="move" disabled={!scannedPallet}>Move</TabsTrigger>
          <TabsTrigger value="depalletize" disabled={!scannedPallet}>De-palletize</TabsTrigger>
        </TabsList>

        <TabsContent value="scan" className="mt-6">
          <Card>
            <CardContent className="p-6 text-center">
              <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">Scan a pallet barcode above to view its contents and manage it.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="create" className="mt-6">
          <PalletCreator />
        </TabsContent>

        <TabsContent value="move" className="mt-6">
          {scannedPallet && <PalletMover pallet={scannedPallet} />}
        </TabsContent>

        <TabsContent value="depalletize" className="mt-6">
          {scannedPallet && <PalletDepalletizer pallet={scannedPallet} />}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PalletPage;

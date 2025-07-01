
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Package, Truck, ScanLine } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { createERPNextAPI } from "@/services/erpnextApi";
import { POItem, ReceiveEntry } from "../../pages/Receive";

interface ReceiveFormProps {
  poItems: POItem[];
  onAddEntry: (entry: ReceiveEntry) => void;
  defaultWarehouse?: string;
}

const ReceiveForm = ({ poItems, onAddEntry, defaultWarehouse }: ReceiveFormProps) => {
  const [selectedItem, setSelectedItem] = useState<POItem | null>(null);
  const [receivedQty, setReceivedQty] = useState<number>(0);
  const [warehouse, setWarehouse] = useState<string>(defaultWarehouse || "");
  const [batch, setBatch] = useState<string>("");
  const [serial, setSerial] = useState<string>("");
  const [scannedCode, setScannedCode] = useState<string>("");
  const [activeTab, setActiveTab] = useState<string>("manual");
  const [warehouses, setWarehouses] = useState<string[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    if (defaultWarehouse) {
      setWarehouse(defaultWarehouse);
    }
    loadWarehouses();
  }, [defaultWarehouse]);

  useEffect(() => {
    if (poItems.length > 0 && !selectedItem) {
      setSelectedItem(poItems[0]);
    }
  }, [poItems]);

  const loadWarehouses = async () => {
    try {
      const erpnextAPI = await createERPNextAPI();
      if (!erpnextAPI) return;

      const response = await erpnextAPI.getWarehouses();
      if (response?.data) {
        const warehouseNames = response.data.map((w: any) => w.warehouse_name || w.name);
        setWarehouses(warehouseNames);
      }
    } catch (error) {
      console.error('Error loading warehouses:', error);
    }
  };

  const handleAddEntry = async () => {
    if (!selectedItem) {
      toast({
        title: "No Item Selected",
        description: "Please select an item to receive.",
        variant: "destructive"
      });
      return;
    }

    if (!receivedQty || receivedQty <= 0) {
      toast({
        title: "Invalid Quantity",
        description: "Please enter a valid received quantity.",
        variant: "destructive"
      });
      return;
    }

    if (receivedQty > selectedItem.pendingQty) {
      toast({
        title: "Quantity Exceeded",
        description: `Cannot receive more than pending quantity (${selectedItem.pendingQty}).`,
        variant: "destructive"
      });
      return;
    }

    if (!warehouse) {
      toast({
        title: "No Warehouse Selected",
        description: "Please select a warehouse for receiving.",
        variant: "destructive"
      });
      return;
    }

    const entry: ReceiveEntry = {
      itemCode: selectedItem.itemCode,
      itemName: selectedItem.itemName,
      receivedQty: receivedQty,
      warehouse: warehouse,
      batch: batch || undefined,
      serial: serial || undefined,
      uom: selectedItem.uom,
      rate: selectedItem.rate,
      purchaseOrderItem: selectedItem.name
    };

    try {
      await onAddEntry(entry);
      
      // Reset form
      setReceivedQty(0);
      setBatch("");
      setSerial("");
      setScannedCode("");
      
      toast({
        title: "Item Added",
        description: `${selectedItem.itemName} added to receipt successfully.`,
      });
    } catch (error) {
      // Error handling is done in the parent component
    }
  };

  const handleScanProcess = () => {
    if (!scannedCode) {
      toast({
        title: "No Code Scanned",
        description: "Please scan or enter an item code.",
        variant: "destructive"
      });
      return;
    }

    // Find matching item by code
    const matchingItem = poItems.find(item => 
      item.itemCode === scannedCode || 
      item.itemName.toLowerCase().includes(scannedCode.toLowerCase())
    );

    if (matchingItem) {
      setSelectedItem(matchingItem);
      setReceivedQty(matchingItem.pendingQty);
      setActiveTab("manual");
      toast({
        title: "Item Found",
        description: `${matchingItem.itemName} selected for receiving.`,
      });
    } else {
      toast({
        title: "Item Not Found",
        description: "The scanned code doesn't match any items in this PO.",
        variant: "destructive"
      });
    }
  };

  const pendingItems = poItems.filter(item => item.pendingQty > 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Package className="w-5 h-5 text-blue-600" />
          <span>Receive Items</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="manual">Manual Entry</TabsTrigger>
            <TabsTrigger value="scan">Scan Mode</TabsTrigger>
          </TabsList>

          <TabsContent value="manual" className="space-y-4 mt-6">
            {/* Item Selection */}
            <div className="space-y-2">
              <Label htmlFor="item-select">Select Item</Label>
              <Select
                value={selectedItem?.itemCode || ""}
                onValueChange={(value) => {
                  const item = poItems.find(i => i.itemCode === value);
                  setSelectedItem(item || null);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select an item to receive" />
                </SelectTrigger>
                <SelectContent>
                  {pendingItems.map((item) => (
                    <SelectItem key={item.itemCode} value={item.itemCode}>
                      <div className="flex items-center justify-between w-full">
                        <span>{item.itemName}</span>
                        <Badge variant="outline" className="ml-2">
                          Pending: {item.pendingQty}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Selected Item Details */}
            {selectedItem && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="font-medium text-gray-600">Item Code</p>
                    <p className="text-gray-900">{selectedItem.itemCode}</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-600">Ordered Qty</p>
                    <p className="text-gray-900">{selectedItem.orderedQty}</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-600">Received Qty</p>
                    <p className="text-gray-900">{selectedItem.receivedQty}</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-600">Pending Qty</p>
                    <p className="text-gray-900 font-semibold text-orange-600">{selectedItem.pendingQty}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Receiving Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="received-qty">Received Quantity</Label>
                <Input
                  id="received-qty"
                  type="number"
                  placeholder="Enter received quantity"
                  value={receivedQty || ""}
                  onChange={(e) => setReceivedQty(Number(e.target.value))}
                  max={selectedItem?.pendingQty || 0}
                  min="1"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="warehouse-select">Warehouse</Label>
                <Select value={warehouse} onValueChange={setWarehouse}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select warehouse" />
                  </SelectTrigger>
                  <SelectContent>
                    {warehouses.map((wh) => (
                      <SelectItem key={wh} value={wh}>
                        {wh}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="batch">Batch Number (Optional)</Label>
                <Input
                  id="batch"
                  placeholder="Enter batch number"
                  value={batch}
                  onChange={(e) => setBatch(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="serial">Serial Number (Optional)</Label>
                <Input
                  id="serial"
                  placeholder="Enter serial number"
                  value={serial}
                  onChange={(e) => setSerial(e.target.value)}
                />
              </div>
            </div>

            <Button 
              onClick={handleAddEntry} 
              className="w-full" 
              disabled={!selectedItem || !receivedQty || !warehouse}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add to Receipt
            </Button>
          </TabsContent>

          <TabsContent value="scan" className="space-y-4 mt-6">
            <div className="text-center p-8 border-2 border-dashed border-gray-300 rounded-lg">
              <ScanLine className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Scan Item Code</h3>
              <p className="text-gray-600 mb-4">Use a barcode scanner or enter the item code manually</p>
              
              <div className="max-w-md mx-auto space-y-4">
                <Input
                  placeholder="Scan or enter item code"
                  value={scannedCode}
                  onChange={(e) => setScannedCode(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleScanProcess()}
                  className="text-center text-lg"
                />
                <Button onClick={handleScanProcess} disabled={!scannedCode}>
                  <ScanLine className="w-4 h-4 mr-2" />
                  Process Scan
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default ReceiveForm;


import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Scan, Package, AlertCircle, CheckCircle } from "lucide-react";
import { DeliveryEntry, SOItem } from "../../pages/Deliver";
import { createERPNextAPI } from "@/services/erpnextApi";
import { useToast } from "@/hooks/use-toast";

interface EnhancedDeliveryItemScannerProps {
  soItems: SOItem[];
  onAddEntry: (entry: DeliveryEntry) => void;
}

const EnhancedDeliveryItemScanner = ({ soItems, onAddEntry }: EnhancedDeliveryItemScannerProps) => {
  const [selectedItemCode, setSelectedItemCode] = useState("");
  const [scannedCode, setScannedCode] = useState("");
  const [warehouse, setWarehouse] = useState("");
  const [warehouses, setWarehouses] = useState<string[]>([]);
  const [batchNumber, setBatchNumber] = useState("");
  const [serialNumber, setSerialNumber] = useState("");
  const [quantity, setQuantity] = useState("");
  const [batchInputMethod, setBatchInputMethod] = useState<'traditional' | 'bundle'>('traditional');
  const [availableBatches, setAvailableBatches] = useState<string[]>([]);
  const [stockInfo, setStockInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const selectedItem = soItems.find(item => item.itemCode === selectedItemCode);

  useEffect(() => {
    fetchWarehouses();
  }, []);

  useEffect(() => {
    if (selectedItem && warehouse) {
      fetchStockInfo();
      checkBatchTracking();
    }
  }, [selectedItem, warehouse]);

  const fetchWarehouses = async () => {
    try {
      const erpnextAPI = await createERPNextAPI();
      if (!erpnextAPI) return;

      const result = await erpnextAPI.warehouse.getWarehouses();
      if (result.data) {
        const warehouseNames = result.data.map((wh: any) => wh.name || wh.warehouse_name);
        setWarehouses(warehouseNames);
      }
    } catch (error) {
      console.error('Error fetching warehouses:', error);
    }
  };

  const fetchStockInfo = async () => {
    if (!selectedItem) return;
    
    try {
      setLoading(true);
      const erpnextAPI = await createERPNextAPI();
      if (!erpnextAPI) return;

      const stockResult = await erpnextAPI.stock.getCurrentStock(
        selectedItem.itemCode,
        warehouse
      );
      
      setStockInfo(stockResult.data);
    } catch (error) {
      console.error('Error fetching stock info:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkBatchTracking = async () => {
    if (!selectedItem) return;
    
    try {
      const erpnextAPI = await createERPNextAPI();
      if (!erpnextAPI) return;

      // Check if item has batch tracking
      const itemResult = await erpnextAPI.items.getItem(selectedItem.itemCode);
      if (itemResult.data?.has_batch_no) {
        // Fetch available batches for the item in the warehouse
        const batchResult = await erpnextAPI.stock.getBatches(selectedItem.itemCode, warehouse);
        if (batchResult.data) {
          setAvailableBatches(batchResult.data.map((batch: any) => batch.batch_id || batch.name));
        }
      }
    } catch (error) {
      console.error('Error checking batch tracking:', error);
    }
  };

  const handleScanItem = () => {
    const foundItem = soItems.find(item => 
      item.itemCode.toLowerCase().includes(scannedCode.toLowerCase()) ||
      item.itemName.toLowerCase().includes(scannedCode.toLowerCase())
    );
    
    if (foundItem) {
      setSelectedItemCode(foundItem.itemCode);
      setScannedCode("");
    } else {
      toast({
        title: "Item Not Found",
        description: "No matching item found in the sales order",
        variant: "destructive"
      });
    }
  };

  const handleAddItem = () => {
    if (!selectedItem || !warehouse || !quantity) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    const qty = parseInt(quantity);
    if (qty <= 0 || qty > selectedItem.pendingQty) {
      toast({
        title: "Invalid Quantity",
        description: `Quantity must be between 1 and ${selectedItem.pendingQty}`,
        variant: "destructive"
      });
      return;
    }

    const entry: DeliveryEntry = {
      itemCode: selectedItem.itemCode,
      itemName: selectedItem.itemName,
      warehouse: warehouse,
      batch: batchNumber || undefined,
      serial: serialNumber || undefined,
      qtyToDeliver: qty,
      actualQty: qty,
      rate: selectedItem.rate,
      uom: selectedItem.uom
    };

    onAddEntry(entry);

    // Reset form
    setSelectedItemCode("");
    setWarehouse("");
    setBatchNumber("");
    setSerialNumber("");
    setQuantity("");
    setStockInfo(null);
    setAvailableBatches([]);

    toast({
      title: "Item Added",
      description: `${qty} ${selectedItem.uom} of ${selectedItem.itemCode} added to delivery`,
    });
  };

  const getStockStatus = () => {
    if (!stockInfo || !selectedItem) return null;
    
    const availableQty = stockInfo.actual_qty || 0;
    const requiredQty = selectedItem.pendingQty;
    
    if (availableQty >= requiredQty) {
      return { status: 'sufficient', message: `${availableQty} ${selectedItem.uom} available`, color: 'green' };
    } else if (availableQty > 0) {
      return { status: 'partial', message: `Only ${availableQty} ${selectedItem.uom} available`, color: 'orange' };
    } else {
      return { status: 'insufficient', message: 'Out of stock', color: 'red' };
    }
  };

  const stockStatus = getStockStatus();
  const isBatchTracked = availableBatches.length > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Scan Items</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs defaultValue="manual" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="manual">Manual Entry</TabsTrigger>
            <TabsTrigger value="scan">Scan Item</TabsTrigger>
          </TabsList>

          <TabsContent value="scan" className="space-y-4">
            <div className="flex space-x-2">
              <Input
                placeholder="Scan item code or barcode"
                value={scannedCode}
                onChange={(e) => setScannedCode(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleScanItem()}
              />
              <Button onClick={handleScanItem} disabled={!scannedCode}>
                <Scan className="w-4 h-4" />
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="manual" className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Item Code / Name</label>
              <Select value={selectedItemCode} onValueChange={setSelectedItemCode}>
                <SelectTrigger>
                  <SelectValue placeholder="Select an item to deliver..." />
                </SelectTrigger>
                <SelectContent className="bg-white border border-gray-200 rounded-md shadow-lg z-50">
                  {soItems.filter(item => item.pendingQty > 0).map((item) => (
                    <SelectItem key={item.itemCode} value={item.itemCode}>
                      <div className="flex flex-col">
                        <span className="font-medium">{item.itemCode}</span>
                        <span className="text-xs text-gray-500">{item.itemName}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </TabsContent>
        </Tabs>

        {selectedItem && (
          <div className="space-y-4">
            {/* Item Details Card */}
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium">Item Details</h4>
                {stockStatus && (
                  <div className="flex items-center space-x-2">
                    {stockStatus.status === 'sufficient' ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-orange-600" />
                    )}
                    <span className={`text-sm font-medium text-${stockStatus.color}-600`}>
                      {stockStatus.message}
                    </span>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                <div>
                  <span className="text-gray-600">Item Name:</span>
                  <div className="font-medium">{selectedItem.itemName}</div>
                </div>
                <div>
                  <span className="text-gray-600">Pending Qty:</span>
                  <div className="font-medium">{selectedItem.pendingQty} {selectedItem.uom}</div>
                </div>
                <div>
                  <span className="text-gray-600">Rate:</span>
                  <div className="font-medium">₹{selectedItem.rate.toLocaleString()}</div>
                </div>
                <div>
                  <span className="text-gray-600">Warehouse:</span>
                  <div className="font-medium">{selectedItem.warehouse}</div>
                </div>
                {isBatchTracked && (
                  <div className="col-span-2 md:col-span-4">
                    <Badge variant="outline" className="text-xs">
                      Batch Tracked
                    </Badge>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Warehouse */}
              <div>
                <label className="text-sm font-medium mb-1 block">Warehouse *</label>
                <Select value={warehouse} onValueChange={setWarehouse}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select warehouse..." />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-gray-200 rounded-md shadow-lg z-50">
                    {warehouses.map((wh) => (
                      <SelectItem key={wh} value={wh}>
                        {wh}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Quantity */}
              <div>
                <label className="text-sm font-medium mb-1 block">Quantity to Deliver *</label>
                <Input
                  type="number"
                  placeholder="Enter quantity"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  min="1"
                  max={selectedItem.pendingQty}
                />
              </div>
            </div>

            {/* Batch/Serial Input Method */}
            {isBatchTracked && (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Serial/Batch Input Method</label>
                  <Tabs value={batchInputMethod} onValueChange={(value) => setBatchInputMethod(value as 'traditional' | 'bundle')}>
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="traditional">Traditional Entry</TabsTrigger>
                      <TabsTrigger value="bundle">Bundle Entry</TabsTrigger>
                    </TabsList>

                    <TabsContent value="traditional" className="space-y-4 mt-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium mb-1 block">Batch Number {isBatchTracked ? '*' : ''}</label>
                          <Select value={batchNumber} onValueChange={setBatchNumber}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select batch..." />
                            </SelectTrigger>
                            <SelectContent className="bg-white border border-gray-200 rounded-md shadow-lg z-50">
                              {availableBatches.map((batch) => (
                                <SelectItem key={batch} value={batch}>
                                  {batch}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <label className="text-sm font-medium mb-1 block">Actual Quantity *</label>
                          <Input
                            type="number"
                            placeholder="0"
                            value={quantity}
                            onChange={(e) => setQuantity(e.target.value)}
                            min="1"
                          />
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="bundle" className="space-y-4 mt-4">
                      <div className="p-4 bg-gray-50 rounded-lg text-center text-gray-500">
                        Bundle entry method coming soon...
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>
              </div>
            )}

            {/* Serial Number for non-batch items */}
            {!isBatchTracked && (
              <div>
                <label className="text-sm font-medium mb-1 block">Serial Number</label>
                <Input
                  placeholder="Enter serial number"
                  value={serialNumber}
                  onChange={(e) => setSerialNumber(e.target.value)}
                />
              </div>
            )}

            <Button 
              onClick={handleAddItem} 
              className="w-full"
              disabled={!warehouse || !quantity || loading || (stockStatus && stockStatus.status === 'insufficient')}
            >
              {loading ? 'Checking Stock...' : '+ Add to Delivery'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default EnhancedDeliveryItemScanner;

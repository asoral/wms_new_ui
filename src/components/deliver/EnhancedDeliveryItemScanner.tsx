
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
import BatchSelector from "./BatchSelector";

interface EnhancedDeliveryItemScannerProps {
  soItems: SOItem[];
  onAddEntry: (entry: DeliveryEntry) => void;
}

interface BatchInfo {
  batch_no: string;
  qty: number;
  available_qty?: number;
}

const EnhancedDeliveryItemScanner = ({ soItems, onAddEntry }: EnhancedDeliveryItemScannerProps) => {
  const [selectedItemCode, setSelectedItemCode] = useState("");
  const [scannedCode, setScannedCode] = useState("");
  const [warehouse, setWarehouse] = useState("");
  const [warehouses, setWarehouses] = useState<string[]>([]);
  const [quantity, setQuantity] = useState("");
  const [availableSerials, setAvailableSerials] = useState<string[]>([]);
  const [stockInfo, setStockInfo] = useState<any>(null);
  const [itemDetails, setItemDetails] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [selectedBatches, setSelectedBatches] = useState<BatchInfo[]>([]);
  const [showBatchSelector, setShowBatchSelector] = useState(false);
  const { toast } = useToast();

  const selectedItem = soItems.find(item => item.itemCode === selectedItemCode);

  useEffect(() => {
    fetchWarehouses();
  }, []);

  useEffect(() => {
    if (selectedItem) {
      fetchItemDetails();
    }
  }, [selectedItem]);

  useEffect(() => {
    if (selectedItem && warehouse) {
      fetchStockInfo();
      if (itemDetails?.has_serial_no) {
        fetchSerials();
      }
    }
  }, [selectedItem, warehouse, itemDetails]);

  const fetchWarehouses = async () => {
    try {
      const erpnextAPI = await createERPNextAPI();
      if (!erpnextAPI) return;

      const result = await erpnextAPI.getWarehouses();
      if (result.data) {
        const warehouseNames = result.data.map((wh: any) => wh.name || wh.warehouse_name);
        setWarehouses(warehouseNames);
      }
    } catch (error) {
      console.error('Error fetching warehouses:', error);
    }
  };

  const fetchItemDetails = async () => {
    if (!selectedItem) return;
    
    try {
      const erpnextAPI = await createERPNextAPI();
      if (!erpnextAPI) return;

      const result = await erpnextAPI.getItemDetails(selectedItem.itemCode);
      console.log('Item details:', result.data);
      setItemDetails(result.data);
    } catch (error) {
      console.error('Error fetching item details:', error);
    }
  };

  const fetchStockInfo = async () => {
    if (!selectedItem) return;
    
    try {
      setLoading(true);
      const erpnextAPI = await createERPNextAPI();
      if (!erpnextAPI) return;

      console.log('Fetching stock for item:', selectedItem.itemCode, 'warehouse:', warehouse);

      // For batch-tracked items, we need to check batch-wise stock
      if (itemDetails?.has_batch_no) {
        // Get batch-wise stock using Stock Ledger Entries
        const stockLedgerResult = await erpnextAPI.stock.getStockLedgerEntries(
          selectedItem.itemCode,
          warehouse
        );
        
        if (stockLedgerResult.data && stockLedgerResult.data.length > 0) {
          // Calculate total available stock from all batches
          const batchGroups = stockLedgerResult.data.reduce((acc: any, entry: any) => {
            if (entry.batch_no) {
              if (!acc[entry.batch_no]) {
                acc[entry.batch_no] = 0;
              }
              acc[entry.batch_no] += entry.actual_qty || 0;
            }
            return acc;
          }, {});

          // Sum all positive batch quantities
          const totalAvailableQty = Object.values(batchGroups).reduce(
            (sum: number, qty: any) => sum + Math.max(0, qty), 0
          );

          console.log('Batch-wise stock calculation:', batchGroups);
          console.log('Total available qty for batch item:', totalAvailableQty);

          setStockInfo({ actual_qty: totalAvailableQty });
        } else {
          console.log('No stock ledger entries found for batch item');
          setStockInfo({ actual_qty: 0 });
        }
      } else {
        // For non-batch items, use regular stock balance
        const stockResult = await erpnextAPI.stock.getStockBalance(
          selectedItem.itemCode,
          undefined,
          warehouse
        );
        
        if (stockResult.data && stockResult.data.length > 0) {
          const warehouseStock = stockResult.data.find((stock: any) => 
            stock.warehouse === warehouse
          );
          console.log('Regular stock balance:', warehouseStock);
          setStockInfo(warehouseStock || { actual_qty: 0 });
        } else {
          console.log('No stock balance found');
          setStockInfo({ actual_qty: 0 });
        }
      }
    } catch (error) {
      console.error('Error fetching stock info:', error);
      setStockInfo({ actual_qty: 0 });
    } finally {
      setLoading(false);
    }
  };

  const fetchSerials = async () => {
    if (!selectedItem) return;
    
    try {
      const erpnextAPI = await createERPNextAPI();
      if (!erpnextAPI) return;

      const serialResult = await erpnextAPI.stock.getSerialNumbers(selectedItem.itemCode, warehouse);
      if (serialResult.data) {
        setAvailableSerials(serialResult.data.map((serial: any) => serial.serial_no || serial.name));
      }
    } catch (error) {
      console.error('Error fetching serials:', error);
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

  const handleBatchSelection = () => {
    if (!selectedItem || !warehouse || !quantity) {
      toast({
        title: "Missing Information",
        description: "Please select item, warehouse and quantity first",
        variant: "destructive"
      });
      return;
    }
    setShowBatchSelector(true);
  };

  const handleBatchesSelected = (batches: BatchInfo[]) => {
    setSelectedBatches(batches);
    setShowBatchSelector(false);
    
    const totalBatchQty = batches.reduce((sum, batch) => sum + batch.qty, 0);
    setQuantity(totalBatchQty.toString());
    
    toast({
      title: "Batches Selected",
      description: `Selected ${batches.length} batches with total quantity ${totalBatchQty}`,
    });
  };

  const handleAddItem = async () => {
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

    // Validate batch requirements for batch tracked items
    if (itemDetails?.has_batch_no && selectedBatches.length === 0) {
      toast({
        title: "Batch Required",
        description: "Please select batches for this batch-tracked item",
        variant: "destructive"
      });
      return;
    }

    try {
      let serialBatchBundle = null;
      
      // Create Serial and Batch Bundle if needed
      if (itemDetails?.has_batch_no && selectedBatches.length > 0) {
        const erpnextAPI = await createERPNextAPI();
        if (!erpnextAPI) return;
        
        const bundleData = {
          item_code: selectedItem.itemCode,
          warehouse: warehouse,
          type_of_transaction: "Outward",
          voucher_type: "Delivery Note",
          entries: selectedBatches.map(batch => ({
            batch_no: batch.batch_no,
            qty: batch.qty
          }))
        };
        
        console.log('Creating serial batch bundle:', bundleData);
        const bundleResult = await erpnextAPI.stock.createSerialBatchBundle(bundleData);
        serialBatchBundle = bundleResult.data?.name;
        console.log('Serial batch bundle created:', serialBatchBundle);
      }

      const entry: DeliveryEntry = {
        itemCode: selectedItem.itemCode,
        itemName: selectedItem.itemName,
        warehouse: warehouse,
        qtyToDeliver: qty,
        actualQty: qty,
        rate: selectedItem.rate,
        uom: selectedItem.uom,
        ...(serialBatchBundle && { serial_batch_bundle: serialBatchBundle })
      };

      onAddEntry(entry);

      // Reset form
      setSelectedItemCode("");
      setWarehouse("");
      setQuantity("");
      setSelectedBatches([]);
      setStockInfo(null);
      setAvailableSerials([]);
      setItemDetails(null);

      toast({
        title: "Item Added",
        description: `${qty} ${selectedItem.uom} of ${selectedItem.itemCode} added to delivery`,
      });
    } catch (error) {
      console.error('Error creating serial batch bundle:', error);
      toast({
        title: "Error",
        description: "Failed to create batch/serial bundle",
        variant: "destructive"
      });
    }
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
  const isBatchTracked = itemDetails?.has_batch_no;
  const isSerialTracked = itemDetails?.has_serial_no;

  return (
    <>
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
                  <div className="flex items-center space-x-2">
                    {stockStatus && (
                      <>
                        {stockStatus.status === 'sufficient' ? (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-orange-600" />
                        )}
                        <span className={`text-sm font-medium text-${stockStatus.color}-600`}>
                          {stockStatus.message}
                        </span>
                      </>
                    )}
                  </div>
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
                    <span className="text-gray-600">SO Warehouse:</span>
                    <div className="font-medium">{selectedItem.warehouse}</div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {isBatchTracked && (
                    <Badge variant="outline" className="text-xs">
                      Batch Tracked
                    </Badge>
                  )}
                  {isSerialTracked && (
                    <Badge variant="outline" className="text-xs">
                      Serial Tracked
                    </Badge>
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

              {/* Batch Selection */}
              {isBatchTracked && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Batch Selection</label>
                    {selectedBatches.length > 0 && (
                      <Badge variant="secondary">
                        {selectedBatches.length} batches selected
                      </Badge>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    onClick={handleBatchSelection}
                    className="w-full"
                    disabled={!warehouse || !quantity}
                  >
                    <Package className="w-4 h-4 mr-2" />
                    {selectedBatches.length > 0 ? 'Modify Batch Selection' : 'Select Batches'}
                  </Button>
                  
                  {selectedBatches.length > 0 && (
                    <div className="bg-gray-50 rounded p-3">
                      <div className="text-sm font-medium mb-2">Selected Batches:</div>
                      <div className="space-y-1">
                        {selectedBatches.map((batch, index) => (
                          <div key={index} className="flex justify-between text-sm">
                            <span>{batch.batch_no}</span>
                            <span>{batch.qty}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
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

      {/* Batch Selector Dialog */}
      {selectedItem && (
        <BatchSelector
          isOpen={showBatchSelector}
          onClose={() => setShowBatchSelector(false)}
          itemCode={selectedItem.itemCode}
          warehouse={warehouse}
          requiredQty={parseInt(quantity) || 0}
          onBatchesSelected={handleBatchesSelected}
        />
      )}
    </>
  );
};

export default EnhancedDeliveryItemScanner;

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Scan, Package, AlertCircle, CheckCircle, Plus, Minus } from "lucide-react";
import { DeliveryEntry, SOItem } from "../../pages/Deliver";
import { createERPNextAPI } from "@/services/erpnextApi";
import { useToast } from "@/hooks/use-toast";

interface EnhancedDeliveryItemScannerProps {
  soItems: SOItem[];
  onAddEntry: (entry: DeliveryEntry) => void;
}

interface BatchSerial {
  batch?: string;
  serial?: string;
  qty: number;
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
  const [bundleText, setBundleText] = useState("");
  const [batchSerialEntries, setBatchSerialEntries] = useState<BatchSerial[]>([]);
  const [availableBatches, setAvailableBatches] = useState<string[]>([]);
  const [availableSerials, setAvailableSerials] = useState<string[]>([]);
  const [stockInfo, setStockInfo] = useState<any>(null);
  const [itemDetails, setItemDetails] = useState<any>(null);
  const [loading, setLoading] = useState(false);
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
      if (itemDetails?.has_batch_no) {
        fetchBatches();
      }
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

      const stockResult = await erpnextAPI.getCurrentStock(
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

  const fetchBatches = async () => {
    if (!selectedItem) return;
    
    try {
      const erpnextAPI = await createERPNextAPI();
      if (!erpnextAPI) return;

      const batchResult = await erpnextAPI.stock.getBatches(selectedItem.itemCode, warehouse);
      if (batchResult.data) {
        setAvailableBatches(batchResult.data.map((batch: any) => batch.batch_id || batch.name));
      }
    } catch (error) {
      console.error('Error fetching batches:', error);
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

  const parseBundleText = (text: string): BatchSerial[] => {
    const entries: BatchSerial[] = [];
    const lines = text.split('\n').filter(line => line.trim());
    
    for (const line of lines) {
      const parts = line.trim().split(/\s+/);
      if (parts.length >= 1) {
        const [identifier, ...qtyParts] = parts;
        const qty = qtyParts.length > 0 ? parseInt(qtyParts[qtyParts.length - 1]) || 1 : 1;
        
        if (itemDetails?.has_batch_no && !itemDetails?.has_serial_no) {
          entries.push({ batch: identifier, qty });
        } else if (itemDetails?.has_serial_no && !itemDetails?.has_batch_no) {
          entries.push({ serial: identifier, qty: 1 }); // Serial numbers are always qty 1
        } else if (itemDetails?.has_batch_no && itemDetails?.has_serial_no) {
          // For items with both, format should be "BATCH:SERIAL QTY"
          if (identifier.includes(':')) {
            const [batch, serial] = identifier.split(':');
            entries.push({ batch, serial, qty: 1 });
          }
        }
      }
    }
    
    return entries;
  };

  const addBatchSerialEntry = () => {
    if (batchInputMethod === 'bundle') {
      const parsedEntries = parseBundleText(bundleText);
      setBatchSerialEntries([...batchSerialEntries, ...parsedEntries]);
      setBundleText("");
    } else {
      if (itemDetails?.has_batch_no && !batchNumber) {
        toast({
          title: "Batch Required",
          description: "Please select a batch number",
          variant: "destructive"
        });
        return;
      }
      
      if (itemDetails?.has_serial_no && !serialNumber) {
        toast({
          title: "Serial Required",
          description: "Please select a serial number",
          variant: "destructive"
        });
        return;
      }
      
      const newEntry: BatchSerial = {
        qty: itemDetails?.has_serial_no ? 1 : parseInt(quantity) || 1
      };
      
      if (itemDetails?.has_batch_no) {
        newEntry.batch = batchNumber;
      }
      
      if (itemDetails?.has_serial_no) {
        newEntry.serial = serialNumber;
        newEntry.qty = 1; // Serial numbers are always qty 1
      }
      
      setBatchSerialEntries([...batchSerialEntries, newEntry]);
      setBatchNumber("");
      setSerialNumber("");
    }
  };

  const removeBatchSerialEntry = (index: number) => {
    setBatchSerialEntries(batchSerialEntries.filter((_, i) => i !== index));
  };

  const getTotalBundleQty = () => {
    return batchSerialEntries.reduce((sum, entry) => sum + entry.qty, 0);
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

    // Validate batch/serial requirements
    if (itemDetails?.has_batch_no || itemDetails?.has_serial_no) {
      if (batchSerialEntries.length === 0) {
        toast({
          title: "Batch/Serial Required",
          description: "Please add batch/serial entries for this tracked item",
          variant: "destructive"
        });
        return;
      }
      
      const bundleQty = getTotalBundleQty();
      if (bundleQty !== qty) {
        toast({
          title: "Quantity Mismatch",
          description: `Bundle quantity (${bundleQty}) must match delivery quantity (${qty})`,
          variant: "destructive"
        });
        return;
      }
    }

    try {
      let serialBatchBundle = null;
      
      // Create Serial and Batch Bundle if needed
      if ((itemDetails?.has_batch_no || itemDetails?.has_serial_no) && batchSerialEntries.length > 0) {
        const erpnextAPI = await createERPNextAPI();
        if (!erpnextAPI) return;
        
        const bundleData = {
          item_code: selectedItem.itemCode,
          warehouse: warehouse,
          type_of_transaction: "Outward",
          voucher_type: "Delivery Note",
          entries: batchSerialEntries.map(entry => ({
            ...(entry.batch && { batch_no: entry.batch }),
            ...(entry.serial && { serial_no: entry.serial }),
            qty: entry.qty
          }))
        };
        
        const bundleResult = await erpnextAPI.stock.createSerialBatchBundle(bundleData);
        serialBatchBundle = bundleResult.data?.name;
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
        uom: selectedItem.uom,
        ...(serialBatchBundle && { serial_batch_bundle: serialBatchBundle })
      };

      onAddEntry(entry);

      // Reset form
      setSelectedItemCode("");
      setWarehouse("");
      setBatchNumber("");
      setSerialNumber("");
      setQuantity("");
      setBatchSerialEntries([]);
      setBundleText("");
      setStockInfo(null);
      setAvailableBatches([]);
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

            {/* Serial/Batch Input Method for tracked items */}
            {(isBatchTracked || isSerialTracked) && (
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
                        {isBatchTracked && (
                          <div>
                            <label className="text-sm font-medium mb-1 block">Batch Number *</label>
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
                        )}
                        {isSerialTracked && (
                          <div>
                            <label className="text-sm font-medium mb-1 block">Serial Number *</label>
                            <Select value={serialNumber} onValueChange={setSerialNumber}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select serial..." />
                              </SelectTrigger>
                              <SelectContent className="bg-white border border-gray-200 rounded-md shadow-lg z-50">
                                {availableSerials.map((serial) => (
                                  <SelectItem key={serial} value={serial}>
                                    {serial}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                      </div>
                      <Button onClick={addBatchSerialEntry} size="sm" className="w-full">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Entry
                      </Button>
                    </TabsContent>

                    <TabsContent value="bundle" className="space-y-4 mt-4">
                      <div>
                        <label className="text-sm font-medium mb-1 block">
                          {isBatchTracked && isSerialTracked ? 'Batch:Serial Entries (one per line)' :
                           isBatchTracked ? 'Batch Numbers (one per line)' :
                           'Serial Numbers (one per line)'}
                        </label>
                        <Textarea
                          placeholder={
                            isBatchTracked && isSerialTracked ? 'BATCH001:SN001\nBATCH002:SN002' :
                            isBatchTracked ? 'BATCH001 5\nBATCH002 3' :
                            'SN001\nSN002\nSN003'
                          }
                          value={bundleText}
                          onChange={(e) => setBundleText(e.target.value)}
                          rows={4}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          {isBatchTracked && isSerialTracked ? 'Format: BATCH:SERIAL (one per line)' :
                           isBatchTracked ? 'Format: BATCH_NUMBER QUANTITY (one per line)' :
                           'Format: SERIAL_NUMBER (one per line)'}
                        </p>
                      </div>
                      <Button onClick={addBatchSerialEntry} size="sm" className="w-full">
                        <Plus className="w-4 h-4 mr-2" />
                        Parse & Add Entries
                      </Button>
                    </TabsContent>
                  </Tabs>
                </div>

                {/* Show current batch/serial entries */}
                {batchSerialEntries.length > 0 && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="font-medium">Batch/Serial Entries</h5>
                      <Badge variant="secondary">Total: {getTotalBundleQty()}</Badge>
                    </div>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {batchSerialEntries.map((entry, index) => (
                        <div key={index} className="flex items-center justify-between bg-white p-2 rounded border">
                          <span className="text-sm">
                            {entry.batch && `Batch: ${entry.batch}`}
                            {entry.batch && entry.serial && ', '}
                            {entry.serial && `Serial: ${entry.serial}`}
                            {' '}(Qty: {entry.qty})
                          </span>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => removeBatchSerialEntry(index)}
                            className="h-6 w-6 p-0"
                          >
                            <Minus className="w-3 h-3" />
                          </Button>
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
              {loading ? 'Checking Stock...' : '+ Add to Count'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default EnhancedDeliveryItemScanner;

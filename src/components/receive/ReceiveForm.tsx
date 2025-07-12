
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
  const [batchEntryMethod, setBatchEntryMethod] = useState<string>("traditional");
  const [batchEntries, setBatchEntries] = useState<Array<{batchNumber: string, quantity: number}>>([]);
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

    if (batchEntryMethod === "traditional") {
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

      // Only require batch if item is batch tracked
      if (selectedItem.has_batch_no && !batch) {
        toast({
          title: "Batch Number Required",
          description: "Please enter a batch number for this batch-tracked item.",
          variant: "destructive"
        });
        return;
      }

      const entry: ReceiveEntry = {
        itemCode: selectedItem.itemCode,
        itemName: selectedItem.itemName,
        receivedQty: receivedQty,
        warehouse: warehouse || selectedItem.warehouse,
        batch: batch,
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
    }
  };

  const addBatchRow = () => {
    setBatchEntries(prev => [...prev, { batchNumber: "", quantity: 0 }]);
  };

  const removeBatchRow = (index: number) => {
    setBatchEntries(prev => prev.filter((_, i) => i !== index));
  };

  const updateBatchEntry = (index: number, field: 'batchNumber' | 'quantity', value: string | number) => {
    setBatchEntries(prev => prev.map((entry, i) => 
      i === index ? { ...entry, [field]: value } : entry
    ));
  };

  const getTotalBatchQuantity = () => {
    return batchEntries.reduce((total, entry) => total + (entry.quantity || 0), 0);
  };

  const handleBundleSubmit = async () => {
    if (!selectedItem) {
      toast({
        title: "No Item Selected",
        description: "Please select an item to receive.",
        variant: "destructive"
      });
      return;
    }

    if (batchEntries.length === 0) {
      toast({
        title: "No Batch Entries",
        description: "Please add at least one batch entry.",
        variant: "destructive"
      });
      return;
    }

    const totalQty = getTotalBatchQuantity();
    if (totalQty > selectedItem.pendingQty) {
      toast({
        title: "Quantity Exceeded",
        description: `Total quantity (${totalQty}) exceeds pending quantity (${selectedItem.pendingQty}).`,
        variant: "destructive"
      });
      return;
    }

    // Submit each batch as a separate entry
    for (const batchEntry of batchEntries) {
      if (batchEntry.batchNumber && batchEntry.quantity > 0) {
        const entry: ReceiveEntry = {
          itemCode: selectedItem.itemCode,
          itemName: selectedItem.itemName,
          receivedQty: batchEntry.quantity,
          warehouse: warehouse || selectedItem.warehouse,
          batch: batchEntry.batchNumber,
          uom: selectedItem.uom,
          rate: selectedItem.rate,
          purchaseOrderItem: selectedItem.name
        };

        try {
          await onAddEntry(entry);
        } catch (error) {
          console.error('Error adding batch entry:', error);
          return;
        }
      }
    }

    // Reset bundle entries
    setBatchEntries([]);
    toast({
      title: "Bundle Added",
      description: `${batchEntries.length} batch entries added to receipt successfully.`,
    });
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
            {/* Item Code/Name Input */}
            <div className="space-y-2">
              <Label htmlFor="item-input">Item Code / Name</Label>
              <Select
                value={selectedItem?.itemCode || ""}
                onValueChange={(value) => {
                  const item = poItems.find(i => i.itemCode === value);
                  setSelectedItem(item || null);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Search item by code, name or barcode..." />
                </SelectTrigger>
                <SelectContent>
                  {pendingItems.map((item) => (
                    <SelectItem key={item.itemCode} value={item.itemCode}>
                      <div className="w-full">
                        <div className="flex justify-between">
                          <span className="font-medium">{item.itemName}</span>
                        </div>
                        <div className="text-xs text-gray-500">{item.itemCode}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Selected Item Details */}
            {selectedItem && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Item Name</p>
                    <p className="font-medium">{selectedItem.itemName}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Pending Qty</p>
                    <p className="font-medium text-orange-600">{selectedItem.pendingQty} {selectedItem.uom}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Rate</p>
                    <p className="font-medium">₹{selectedItem.rate}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Warehouse</p>
                    <p className="font-medium">{selectedItem.warehouse}</p>
                  </div>
                </div>
                {/* Item Tracking indicators */}
                <div className="mt-2 flex gap-2">
                  {selectedItem.has_batch_no && (
                    <Badge variant="outline">Batch Tracked</Badge>
                  )}
                  {selectedItem.has_serial_no && (
                    <Badge variant="outline">Serial Tracked</Badge>
                  )}
                  {!selectedItem.has_batch_no && !selectedItem.has_serial_no && (
                    <Badge variant="secondary">No Tracking</Badge>
                  )}
                </div>
              </div>
            )}

            {/* For non-tracked items, show simple quantity input */}
            {selectedItem && !selectedItem.has_batch_no && !selectedItem.has_serial_no && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="received-qty-simple">Received Quantity *</Label>
                  <Input
                    id="received-qty-simple"
                    type="number"
                    placeholder="0"
                    value={receivedQty || ""}
                    onChange={(e) => setReceivedQty(Number(e.target.value))}
                    max={selectedItem?.pendingQty || 0}
                    min="1"
                  />
                </div>
                <Button 
                  onClick={handleAddEntry} 
                  className="w-full bg-gray-600 hover:bg-gray-700" 
                  disabled={!selectedItem || !receivedQty}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add to Receipt
                </Button>
              </div>
            )}

            {/* Serial/Batch Input Method - only show when item selected and is tracked */}
            {selectedItem && (selectedItem.has_batch_no || selectedItem.has_serial_no) && (
              <div className="space-y-4">
                <div>
                  <Label className="text-base font-medium">Serial/Batch Input Method</Label>
                  <Tabs value={batchEntryMethod} onValueChange={setBatchEntryMethod} className="w-full mt-2">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="traditional">Traditional Entry</TabsTrigger>
                      <TabsTrigger value="bundle">Bundle Entry</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="traditional" className="space-y-4 mt-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Only show batch input if item is batch tracked */}
                        {selectedItem.has_batch_no && (
                          <div className="space-y-2">
                            <Label htmlFor="batch">Batch Number *</Label>
                            <Input
                              id="batch"
                              placeholder="Enter batch number..."
                              value={batch}
                              onChange={(e) => setBatch(e.target.value)}
                            />
                          </div>
                        )}
                        {/* Only show serial input if item is serial tracked */}
                        {selectedItem.has_serial_no && (
                          <div className="space-y-2">
                            <Label htmlFor="serial">Serial Number</Label>
                            <Input
                              id="serial"
                              placeholder="Enter serial number..."
                              value={serial}
                              onChange={(e) => setSerial(e.target.value)}
                            />
                          </div>
                        )}
                        <div className="space-y-2">
                          <Label htmlFor="received-qty">Actual Quantity *</Label>
                          <Input
                            id="received-qty"
                            type="number"
                            placeholder="0"
                            value={receivedQty || ""}
                            onChange={(e) => setReceivedQty(Number(e.target.value))}
                            max={selectedItem?.pendingQty || 0}
                            min="1"
                          />
                        </div>
                      </div>
                      <Button 
                        onClick={handleAddEntry} 
                        className="w-full bg-gray-600 hover:bg-gray-700" 
                        disabled={!selectedItem || !receivedQty || (selectedItem.has_batch_no && !batch)}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add to Count
                      </Button>
                    </TabsContent>

                    <TabsContent value="bundle" className="space-y-4 mt-4">
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <Label className="text-base font-medium">Batch Entries</Label>
                          <div className="text-sm text-gray-600">
                            Total: {getTotalBatchQuantity()} / {selectedItem.pendingQty} {selectedItem.uom}
                          </div>
                        </div>
                        
                        {batchEntries.length > 0 && (
                          <div className="space-y-2">
                            <div className="grid grid-cols-3 gap-4 text-sm font-medium text-gray-600 pb-2 border-b">
                              <div>Batch Number</div>
                              <div>Quantity</div>
                              <div>Action</div>
                            </div>
                            {batchEntries.map((entry, index) => (
                              <div key={index} className="grid grid-cols-3 gap-4 items-center">
                                <Input
                                  placeholder="Enter batch number"
                                  value={entry.batchNumber}
                                  onChange={(e) => updateBatchEntry(index, 'batchNumber', e.target.value)}
                                />
                                <Input
                                  type="number"
                                  placeholder="Quantity"
                                  value={entry.quantity || ""}
                                  onChange={(e) => updateBatchEntry(index, 'quantity', Number(e.target.value))}
                                  min="1"
                                />
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => removeBatchRow(index)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  Remove
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                        
                        <Button
                          variant="outline"
                          onClick={addBatchRow}
                          className="w-full"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add Batch Row
                        </Button>
                        
                        {batchEntries.length > 0 && (
                          <Button 
                            onClick={handleBundleSubmit}
                            className="w-full bg-slate-800 hover:bg-slate-900" 
                            disabled={batchEntries.some(entry => !entry.batchNumber || entry.quantity <= 0)}
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Add Bundle to Count ({batchEntries.length} batches)
                          </Button>
                        )}
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>
              </div>
            )}
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

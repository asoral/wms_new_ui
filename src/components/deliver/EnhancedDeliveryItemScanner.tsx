
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Scan, Package } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DeliveryEntry, SOItem } from "../../pages/Deliver";
import { useToast } from "@/hooks/use-toast";
import BatchSelector from "./BatchSelector";
import SerialBatchBundleSelector from "../stock-count/SerialBatchBundleSelector";

interface BatchInfo {
  batch_no: string;
  qty: number;
  available_qty?: number;
  expiry_date?: string;
  serial_and_batch_bundle?: string;
}

interface EnhancedDeliveryItemScannerProps {
  soItems: SOItem[];
  onAddEntry: (entry: DeliveryEntry) => void;
  company?: string;
}

const EnhancedDeliveryItemScanner = ({ soItems, onAddEntry, company }: EnhancedDeliveryItemScannerProps) => {
  const [selectedItemCode, setSelectedItemCode] = useState("");
  const [scannedCode, setScannedCode] = useState("");
  const [warehouse, setWarehouse] = useState("");
  const [batchNumber, setBatchNumber] = useState("");
  const [serialNumber, setSerialNumber] = useState("");
  const [quantity, setQuantity] = useState("");
  const [showBatchSelector, setShowBatchSelector] = useState(false);
  const [selectedBatches, setSelectedBatches] = useState<BatchInfo[]>([]);
  const [useTraditionalEntry, setUseTraditionalEntry] = useState(true);
  const [selectedBundle, setSelectedBundle] = useState("");
  const { toast } = useToast();

  const selectedItem = soItems.find(item => item.itemCode === selectedItemCode);

  const handleScanItem = () => {
    // Find item by scanned code
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

  const handleOpenBatchSelector = () => {
    if (!selectedItem || !warehouse || !quantity) {
      toast({
        title: "Missing Information",
        description: "Please select item, warehouse, and quantity first",
        variant: "destructive"
      });
      return;
    }
    setShowBatchSelector(true);
  };

  const handleBatchesSelected = (batches: BatchInfo[]) => {
    setSelectedBatches(batches);
    setShowBatchSelector(false);
    
    // Add entries for each selected batch
    batches.forEach(batch => {
      if (selectedItem) {
        const entry: DeliveryEntry = {
          itemCode: selectedItem.itemCode,
          itemName: selectedItem.itemName,
          warehouse: warehouse,
          batch: batch.batch_no,
          qtyToDeliver: batch.qty,
          actualQty: batch.qty,
          rate: selectedItem.rate,
          uom: selectedItem.uom,
          serial_batch_bundle: batch.serial_and_batch_bundle
        };
        onAddEntry(entry);
      }
    });

    // Reset form
    setSelectedItemCode("");
    setWarehouse("");
    setBatchNumber("");
    setSerialNumber("");
    setQuantity("");
    setSelectedBatches([]);

    toast({
      title: "Batches Added",
      description: `${batches.length} batch entries added to delivery`,
    });
  };

  const handleBundleCreated = (bundleName: string, totalQty: number) => {
    setSelectedBundle(bundleName);
    setQuantity(totalQty.toString());
    toast({
      title: "Bundle Created",
      description: `Serial and Batch Bundle created: ${bundleName}`,
    });
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
      batch: useTraditionalEntry ? batchNumber || undefined : undefined,
      serial: useTraditionalEntry ? serialNumber || undefined : undefined,
      qtyToDeliver: qty,
      actualQty: qty,
      rate: selectedItem.rate,
      uom: selectedItem.uom,
      serial_batch_bundle: selectedBundle || undefined
    };

    onAddEntry(entry);

    // Reset form
    setSelectedItemCode("");
    setWarehouse("");
    setBatchNumber("");
    setSerialNumber("");
    setQuantity("");
    setSelectedBundle("");

    toast({
      title: "Item Added",
      description: `${qty} ${selectedItem.uom} of ${selectedItem.itemCode} added to delivery`,
    });
  };

  // Check if item has batch or serial tracking (simplified check)
  const hasSerialBatchTracking = selectedItem && (
    selectedItem.itemCode.toLowerCase().includes('batch') || 
    selectedItem.itemCode.toLowerCase().includes('serial') ||
    selectedItem.itemName.toLowerCase().includes('batch') ||
    selectedItem.itemName.toLowerCase().includes('serial')
  );

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Item</CardTitle>
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
                  <SelectContent>
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
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Warehouse *</label>
                  <Input
                    placeholder="Scan or enter warehouse"
                    value={warehouse}
                    onChange={(e) => setWarehouse(e.target.value)}
                  />
                </div>
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

              {/* Serial/Batch Entry Method Section - only show if item has tracking */}
              {hasSerialBatchTracking && selectedItem && warehouse && (
                <div className="space-y-4">
                  <label className="text-sm font-medium mb-1 block">Serial/Batch Entry Method</label>
                  <Tabs 
                    value={useTraditionalEntry ? "manual" : "bundle"} 
                    onValueChange={(value) => setUseTraditionalEntry(value === "manual")}
                    className="w-full"
                  >
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="manual">Manual Entry</TabsTrigger>
                      <TabsTrigger value="bundle">Use Bundle</TabsTrigger>
                    </TabsList>

                    <TabsContent value="manual" className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium mb-1 block">Batch Number</label>
                          <div className="flex space-x-2">
                            <Input
                              placeholder="Enter batch number"
                              value={batchNumber}
                              onChange={(e) => setBatchNumber(e.target.value)}
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleOpenBatchSelector}
                              disabled={!selectedItem || !warehouse || !quantity}
                            >
                              <Package className="w-4 h-4 mr-1" />
                              Select
                            </Button>
                          </div>
                        </div>
                        <div>
                          <label className="text-sm font-medium mb-1 block">Serial Number</label>
                          <Input
                            placeholder="Enter serial number"
                            value={serialNumber}
                            onChange={(e) => setSerialNumber(e.target.value)}
                          />
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="bundle" className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium mb-1 block">Create Serial and Batch Bundle</label>
                        <SerialBatchBundleSelector
                          itemCode={selectedItem.itemCode}
                          itemName={selectedItem.itemName}
                          itemGroup="All Item Groups"
                          hasSerial={selectedItem.itemCode.toLowerCase().includes('serial')}
                          hasBatch={selectedItem.itemCode.toLowerCase().includes('batch')}
                          warehouse={warehouse}
                          transactionType="Outward"
                          onBundleCreated={handleBundleCreated}
                          initialQuantity={parseInt(quantity) || 1}
                        />
                        {selectedBundle && (
                          <p className="text-sm text-muted-foreground">
                            Selected Bundle: {selectedBundle}
                          </p>
                        )}
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>
              )}

              {/* Regular batch/serial fields for non-tracked items or when using manual entry */}
              {(!hasSerialBatchTracking || useTraditionalEntry) && !hasSerialBatchTracking && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Batch Number</label>
                    <div className="flex space-x-2">
                      <Input
                        placeholder="Enter batch number"
                        value={batchNumber}
                        onChange={(e) => setBatchNumber(e.target.value)}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleOpenBatchSelector}
                        disabled={!selectedItem || !warehouse || !quantity}
                      >
                        <Package className="w-4 h-4 mr-1" />
                        Select
                      </Button>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Serial Number</label>
                    <Input
                      placeholder="Enter serial number"
                      value={serialNumber}
                      onChange={(e) => setSerialNumber(e.target.value)}
                    />
                  </div>
                </div>
              )}

              {/* Item Details */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium mb-2">Item Details</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                  <div>
                    <span className="text-gray-600">Name:</span>
                    <div className="font-medium">{selectedItem.itemName}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Pending:</span>
                    <div className="font-medium">{selectedItem.pendingQty} {selectedItem.uom}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Rate:</span>
                    <div className="font-medium">₹{selectedItem.rate.toLocaleString()}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">UOM:</span>
                    <div className="font-medium">{selectedItem.uom}</div>
                  </div>
                </div>
                {hasSerialBatchTracking && (
                  <div className="flex gap-2 mt-2">
                    {selectedItem.itemCode.toLowerCase().includes('serial') && (
                      <Badge variant="outline">Serial Tracking</Badge>
                    )}
                    {selectedItem.itemCode.toLowerCase().includes('batch') && (
                      <Badge variant="outline">Batch Tracking</Badge>
                    )}
                  </div>
                )}
              </div>

              <Button 
                onClick={handleAddItem} 
                className="w-full"
                disabled={!warehouse || !quantity}
              >
                Add Item to Delivery
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Batch Selector Modal */}
      {showBatchSelector && selectedItem && (
        <BatchSelector
          isOpen={showBatchSelector}
          onClose={() => setShowBatchSelector(false)}
          itemCode={selectedItem.itemCode}
          itemName={selectedItem.itemName}
          warehouse={warehouse}
          requiredQty={parseInt(quantity)}
          onBatchesSelected={handleBatchesSelected}
          company={company}
        />
      )}
    </>
  );
};

export default EnhancedDeliveryItemScanner;

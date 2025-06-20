
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Scan, Package, ScanLine, Search } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
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

  const handleItemSelected = (itemCode: string) => {
    setSelectedItemCode(itemCode);
    setScannedCode(itemCode);
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

  // Available warehouses - you can expand this list
  const availableWarehouses = [
    "Main Store",
    "Secondary Store", 
    "Raw Material Store",
    "Finished Goods Store"
  ];

  return (
    <>
      <div className="space-y-6">
        {/* Scan Items Section */}
        <Tabs defaultValue="scan" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="scan" className="flex items-center space-x-2">
              <ScanLine className="w-4 h-4" />
              <span>Scan Item</span>
            </TabsTrigger>
            <TabsTrigger value="search" className="flex items-center space-x-2">
              <Search className="w-4 h-4" />
              <span>Search Item</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="scan" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <ScanLine className="w-5 h-5" />
                  <span>Scan Item Barcode</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="barcode">Barcode</Label>
                  <Input
                    id="barcode"
                    value={scannedCode}
                    onChange={(e) => setScannedCode(e.target.value)}
                    placeholder="Scan or enter barcode"
                    className="text-lg"
                    onKeyPress={(e) => e.key === 'Enter' && handleScanItem()}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="search" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Search className="w-5 h-5" />
                  <span>Search Item</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="itemSelect">Item Code / Name</Label>
                  <Select value={selectedItemCode} onValueChange={handleItemSelected}>
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
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Item Details Form */}
        {selectedItem && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Package className="w-5 h-5" />
                <span>Item Details</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="warehouse">Warehouse *</Label>
                  <Select value={warehouse} onValueChange={setWarehouse}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select warehouse..." />
                    </SelectTrigger>
                    <SelectContent>
                      {availableWarehouses.map((wh) => (
                        <SelectItem key={wh} value={wh}>
                          {wh}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantity to Deliver *</Label>
                  <Input
                    id="quantity"
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder="0"
                    min="1"
                    max={selectedItem.pendingQty}
                    step="0.01"
                  />
                </div>
              </div>

              {/* Item Info Display */}
              <div className="space-y-2">
                <Label>Item Info</Label>
                <div className="text-sm text-muted-foreground">
                  <p>UOM: {selectedItem.uom}</p>
                  <p>Pending: {selectedItem.pendingQty} {selectedItem.uom}</p>
                  <p>Rate: ₹{selectedItem.rate}</p>
                  {hasSerialBatchTracking && (
                    <div className="flex gap-2 mt-1">
                      {selectedItem.itemCode.toLowerCase().includes('serial') && (
                        <Badge variant="outline">Serial Tracking</Badge>
                      )}
                      {selectedItem.itemCode.toLowerCase().includes('batch') && (
                        <Badge variant="outline">Batch Tracking</Badge>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Serial/Batch Entry Method - only show if item has tracking */}
              {hasSerialBatchTracking && selectedItemCode && warehouse && (
                <div className="space-y-4">
                  <Label>Serial/Batch Entry Method</Label>
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
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {selectedItem.itemCode.toLowerCase().includes('batch') && (
                          <div className="space-y-2">
                            <Label htmlFor="batch_no">Batch No</Label>
                            <div className="flex space-x-2">
                              <Input
                                id="batch_no"
                                value={batchNumber}
                                onChange={(e) => setBatchNumber(e.target.value)}
                                placeholder="Enter batch number"
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
                        )}
                        {selectedItem.itemCode.toLowerCase().includes('serial') && (
                          <div className="space-y-2">
                            <Label htmlFor="serial_no">Serial No</Label>
                            <Input
                              id="serial_no"
                              value={serialNumber}
                              onChange={(e) => setSerialNumber(e.target.value)}
                              placeholder="Enter serial number"
                            />
                          </div>
                        )}
                      </div>
                    </TabsContent>

                    <TabsContent value="bundle" className="space-y-4">
                      <div className="space-y-2">
                        <Label>Create Serial and Batch Bundle</Label>
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
                          company={company}
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

              {/* Simple batch/serial fields for non-tracked items or when no tracking detected */}
              {!hasSerialBatchTracking && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="batch">Batch Number</Label>
                    <div className="flex space-x-2">
                      <Input
                        id="batch"
                        value={batchNumber}
                        onChange={(e) => setBatchNumber(e.target.value)}
                        placeholder="Enter batch number (optional)"
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
                  <div className="space-y-2">
                    <Label htmlFor="serial">Serial Number</Label>
                    <Input
                      id="serial"
                      value={serialNumber}
                      onChange={(e) => setSerialNumber(e.target.value)}
                      placeholder="Enter serial number (optional)"
                    />
                  </div>
                </div>
              )}

              <Button 
                onClick={handleAddItem} 
                className="w-full"
                disabled={!warehouse || !quantity}
              >
                <Package className="w-4 h-4 mr-2" />
                Add Item to Delivery
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

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

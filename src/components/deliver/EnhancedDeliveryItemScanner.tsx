
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Scan, Package, AlertCircle } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DeliveryEntry, SOItem } from "../../pages/Deliver";
import { useToast } from "@/hooks/use-toast";
import { createERPNextAPI, getUserDefaultCompany } from "@/services/erpnextApi";
import BatchSelector from "./BatchSelector";

interface EnhancedDeliveryItemScannerProps {
  soItems: SOItem[];
  onAddEntry: (entry: DeliveryEntry) => void;
  company?: string;
  deliveryNoteName?: string;
}

const EnhancedDeliveryItemScanner = ({ 
  soItems, 
  onAddEntry, 
  company,
  deliveryNoteName
}: EnhancedDeliveryItemScannerProps) => {
  const [selectedItemCode, setSelectedItemCode] = useState("");
  const [scannedCode, setScannedCode] = useState("");
  const [warehouse, setWarehouse] = useState("");
  const [batchNumber, setBatchNumber] = useState("");
  const [serialNumber, setSerialNumber] = useState("");
  const [quantity, setQuantity] = useState("");
  const [loading, setLoading] = useState(false);
  const [itemDetails, setItemDetails] = useState<any>(null);
  const [isBatchSelectorOpen, setIsBatchSelectorOpen] = useState(false);
  const { toast } = useToast();

  const selectedItem = soItems.find(item => item.itemCode === selectedItemCode);

  // Check if item is batch/serial tracked
  const checkItemTracking = async (itemCode: string) => {
    try {
      const erpnextAPI = await createERPNextAPI();
      if (!erpnextAPI) return { hasBatch: false, hasSerial: false };

      const result = await erpnextAPI.items.getItemDetails(itemCode);
      return {
        hasBatch: result.data?.has_batch_no === 1,
        hasSerial: result.data?.has_serial_no === 1
      };
    } catch (error) {
      console.error('Error checking item tracking:', error);
      return { hasBatch: false, hasSerial: false };
    }
  };

  useEffect(() => {
    if (selectedItemCode) {
      checkItemTracking(selectedItemCode).then(tracking => {
        setItemDetails({ ...tracking });
      });
    }
  }, [selectedItemCode]);

  const handleScanItem = () => {
    // Find item by scanned code
    const foundItem = soItems.find(item => 
      item.itemCode.toLowerCase().includes(scannedCode.toLowerCase()) ||
      item.itemName.toLowerCase().includes(scannedCode.toLowerCase())
    );
    
    if (foundItem) {
      setSelectedItemCode(foundItem.itemCode);
      setWarehouse(foundItem.warehouse || ""); // Auto-fill warehouse from SO
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
    if (!selectedItem) {
      toast({
        title: "No Item Selected",
        description: "Please select an item first",
        variant: "destructive"
      });
      return;
    }

    if (!warehouse) {
      toast({
        title: "No Warehouse Selected",
        description: "Please select a warehouse first",
        variant: "destructive"
      });
      return;
    }

    if (!quantity || parseInt(quantity) <= 0) {
      toast({
        title: "Invalid Quantity",
        description: "Please enter a valid quantity first",
        variant: "destructive"
      });
      return;
    }

    setIsBatchSelectorOpen(true);
  };

  const handleBatchesSelected = (batches: any[]) => {
    console.log('Batches selected:', batches);
    
    // Use the first batch's bundle reference
    const bundleRef = batches.length > 0 ? batches[0].serial_and_batch_bundle : undefined;
    
    if (selectedItem && warehouse && quantity) {
      const entry: DeliveryEntry = {
        itemCode: selectedItem.itemCode,
        itemName: selectedItem.itemName,
        warehouse: warehouse,
        batch: batches.length > 0 ? batches.map(b => b.batch_no).join(', ') : batchNumber,
        serial: serialNumber || undefined,
        qtyToDeliver: parseInt(quantity),
        actualQty: parseInt(quantity),
        rate: selectedItem.rate,
        uom: selectedItem.uom,
        serial_batch_bundle: bundleRef
      };

      onAddEntry(entry);
      
      // Reset form
      setSelectedItemCode("");
      setWarehouse("");
      setBatchNumber("");
      setSerialNumber("");
      setQuantity("");
      setItemDetails(null);

      toast({
        title: "Item Added",
        description: `${quantity} ${selectedItem.uom} of ${selectedItem.itemCode} added to delivery with batch tracking`,
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

    // Check if item requires batch/serial tracking
    if (itemDetails?.hasBatch || itemDetails?.hasSerial) {
      if (!batchNumber && !serialNumber) {
        toast({
          title: "Tracking Required",
          description: "This item requires batch or serial number tracking. Please use the batch selector or enter manually.",
          variant: "destructive"
        });
        return;
      }
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
    setItemDetails(null);

    toast({
      title: "Item Added",
      description: `${qty} ${selectedItem.uom} of ${selectedItem.itemCode} added to delivery`,
    });
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Package className="w-5 h-5" />
            <span>Scan & Add Items</span>
          </CardTitle>
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

              {/* Tracking Information */}
              {itemDetails && (itemDetails.hasBatch || itemDetails.hasSerial) && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-3">
                    <AlertCircle className="w-4 h-4 text-yellow-600" />
                    <span className="text-sm font-medium text-yellow-800">
                      This item requires tracking:
                    </span>
                    {itemDetails.hasBatch && <Badge variant="outline">Batch</Badge>}
                    {itemDetails.hasSerial && <Badge variant="outline">Serial</Badge>}
                  </div>
                  
                  <div className="space-y-3">
                    {itemDetails.hasBatch && (
                      <div className="flex space-x-2">
                        <div className="flex-1">
                          <label className="text-sm font-medium mb-1 block">Batch Number</label>
                          <Input
                            placeholder="Enter batch number"
                            value={batchNumber}
                            onChange={(e) => setBatchNumber(e.target.value)}
                          />
                        </div>
                        <div className="flex items-end">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={handleOpenBatchSelector}
                            disabled={!selectedItem || !warehouse || !quantity}
                          >
                            Pick Serial / Batch No
                          </Button>
                        </div>
                      </div>
                    )}
                    
                    {itemDetails.hasSerial && (
                      <div>
                        <label className="text-sm font-medium mb-1 block">Serial Number</label>
                        <Input
                          placeholder="Enter serial number"
                          value={serialNumber}
                          onChange={(e) => setSerialNumber(e.target.value)}
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Manual Batch/Serial for non-tracked items */}
              {itemDetails && !itemDetails.hasBatch && !itemDetails.hasSerial && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Batch Number (Optional)</label>
                    <Input
                      placeholder="Enter batch number"
                      value={batchNumber}
                      onChange={(e) => setBatchNumber(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Serial Number (Optional)</label>
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
                
                {itemDetails && (
                  <div className="mt-2 flex space-x-4">
                    <div className="flex items-center space-x-1">
                      <span className="text-xs text-gray-600">Batch Tracking:</span>
                      <Badge variant={itemDetails.hasBatch ? "default" : "secondary"} className="text-xs">
                        {itemDetails.hasBatch ? "Yes" : "No"}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-1">
                      <span className="text-xs text-gray-600">Serial Tracking:</span>
                      <Badge variant={itemDetails.hasSerial ? "default" : "secondary"} className="text-xs">
                        {itemDetails.hasSerial ? "Yes" : "No"}
                      </Badge>
                    </div>
                  </div>
                )}
              </div>

              <Button 
                onClick={handleAddItem} 
                className="w-full"
                disabled={!warehouse || !quantity || loading}
              >
                {loading ? 'Adding...' : 'Add Item to Delivery'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Batch Selector Modal */}
      <BatchSelector
        isOpen={isBatchSelectorOpen}
        onClose={() => setIsBatchSelectorOpen(false)}
        itemCode={selectedItem?.itemCode || ""}
        itemName={selectedItem?.itemName || ""}
        warehouse={warehouse}
        requiredQty={parseInt(quantity) || 1}
        onBatchesSelected={handleBatchesSelected}
        company={company || ""}
        deliveryNoteName={deliveryNoteName}
      />
    </>
  );
};

export default EnhancedDeliveryItemScanner;

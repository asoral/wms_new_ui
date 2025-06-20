
import { useState, useEffect } from "react";
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
import WarehouseSelector from "../bin-enquiry/WarehouseSelector";
import { createERPNextAPI } from "@/services/erpnextApi";

interface BatchInfo {
  batch_no: string;
  qty: number;
  available_qty?: number;
  expiry_date?: string;
  serial_and_batch_bundle?: string;
}

interface ItemTrackingInfo {
  has_batch_no: boolean;
  has_serial_no: boolean;
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
  const [itemTrackingInfo, setItemTrackingInfo] = useState<ItemTrackingInfo | null>(null);
  const [loadingTracking, setLoadingTracking] = useState(false);
  const { toast } = useToast();

  const selectedItem = soItems.find(item => item.itemCode === selectedItemCode);

  // Fetch item tracking information from ERPNext when item is selected
  useEffect(() => {
    const fetchItemTrackingInfo = async () => {
      if (!selectedItemCode) {
        setItemTrackingInfo(null);
        return;
      }

      setLoadingTracking(true);
      try {
        const erpnextAPI = await createERPNextAPI();
        if (erpnextAPI) {
          console.log('Fetching tracking info for item:', selectedItemCode);
          const itemDetails = await erpnextAPI.items.getItemDetails(selectedItemCode);
          console.log('Item details from ERPNext:', itemDetails.data);
          
          setItemTrackingInfo({
            has_batch_no: itemDetails.data.has_batch_no || false,
            has_serial_no: itemDetails.data.has_serial_no || false
          });
        }
      } catch (error) {
        console.error('Error fetching item tracking info:', error);
        // Fallback to pattern matching if API fails
        setItemTrackingInfo({
          has_batch_no: selectedItemCode.toLowerCase().includes('batch') || 
                        Boolean(selectedItemCode.match(/^(BAT|BATCH|BHG)/i)),
          has_serial_no: selectedItemCode.toLowerCase().includes('serial') || 
                         Boolean(selectedItemCode.match(/^(SER|SERIAL)/i))
        });
      } finally {
        setLoadingTracking(false);
      }
    };

    fetchItemTrackingInfo();
  }, [selectedItemCode]);

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

  // Use actual tracking information from ERPNext
  const hasSerialTracking = itemTrackingInfo?.has_serial_no || false;
  const hasBatchTracking = itemTrackingInfo?.has_batch_no || false;
  const hasSerialBatchTracking = hasSerialTracking || hasBatchTracking;

  const handleWarehouseSelected = (warehouseCode: string) => {
    setWarehouse(warehouseCode);
  };

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
            <CardContent className="space-y-6">
              {/* Item Info Display - Improved Layout */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-1">
                    <Label className="text-sm font-medium text-blue-800">Item Code</Label>
                    <div className="font-semibold text-blue-900">{selectedItem.itemCode}</div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-sm font-medium text-blue-800">Item Name</Label>
                    <div className="font-medium text-blue-900 text-sm">{selectedItem.itemName}</div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-sm font-medium text-blue-800">Pending Qty</Label>
                    <div className="font-semibold text-blue-900">{selectedItem.pendingQty} {selectedItem.uom}</div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-sm font-medium text-blue-800">Rate</Label>
                    <div className="font-semibold text-blue-900">₹{selectedItem.rate}</div>
                  </div>
                </div>
                
                {/* Tracking Information */}
                <div className="mt-4 pt-4 border-t border-blue-200">
                  <Label className="text-sm font-medium text-blue-800 mb-2 block">Item Tracking</Label>
                  <div className="flex gap-2">
                    {loadingTracking ? (
                      <Badge variant="secondary" className="bg-gray-100 text-gray-600">
                        Loading tracking info...
                      </Badge>
                    ) : (
                      <>
                        {hasSerialTracking && (
                          <Badge variant="default" className="bg-green-100 text-green-800 border-green-300">
                            Serial Tracking
                          </Badge>
                        )}
                        {hasBatchTracking && (
                          <Badge variant="default" className="bg-orange-100 text-orange-800 border-orange-300">
                            Batch Tracking
                          </Badge>
                        )}
                        {!hasSerialBatchTracking && (
                          <Badge variant="secondary" className="bg-gray-100 text-gray-600">
                            No Tracking
                          </Badge>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <WarehouseSelector 
                    onWarehouseSelected={handleWarehouseSelected}
                    isLoading={false}
                  />
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

              {/* Serial/Batch Selection - Only show if item has tracking and required fields are filled */}
              {hasSerialBatchTracking && selectedItemCode && warehouse && quantity && !loadingTracking && (
                <div className="space-y-4">
                  <Label>Serial/Batch Entry Method</Label>
                  <Tabs 
                    value={useTraditionalEntry ? "manual" : "bundle"} 
                    onValueChange={(value) => setUseTraditionalEntry(value === "manual")}
                    className="w-full"
                  >
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="manual">Pick Serial / Batch No</TabsTrigger>
                      <TabsTrigger value="bundle">Use Bundle</TabsTrigger>
                    </TabsList>

                    <TabsContent value="manual" className="space-y-4">
                      <div className="space-y-4">
                        {/* Batch Selection - ERPNext style */}
                        {hasBatchTracking && (
                          <div className="space-y-2">
                            <Label>Select Batch No</Label>
                            <Button
                              variant="outline"
                              onClick={handleOpenBatchSelector}
                              className="w-full justify-start h-auto p-3"
                            >
                              <div className="flex flex-col items-start">
                                <div className="flex items-center">
                                  <Package className="w-4 h-4 mr-2" />
                                  <span className="font-medium">
                                    {batchNumber || "Pick Serial / Batch No"}
                                  </span>
                                </div>
                                <span className="text-xs text-muted-foreground mt-1">
                                  Select from available batches in {warehouse}
                                </span>
                              </div>
                            </Button>
                          </div>
                        )}
                        
                        {/* Serial Selection */}
                        {hasSerialTracking && (
                          <div className="space-y-2">
                            <Label>Select Serial No</Label>
                            <Button
                              variant="outline"
                              onClick={() => {
                                toast({
                                  title: "Feature Coming Soon",
                                  description: "Serial number selector will be available soon",
                                });
                              }}
                              className="w-full justify-start h-auto p-3"
                            >
                              <div className="flex flex-col items-start">
                                <div className="flex items-center">
                                  <Package className="w-4 h-4 mr-2" />
                                  <span className="font-medium">
                                    {serialNumber || "Pick Serial / Batch No"}
                                  </span>
                                </div>
                                <span className="text-xs text-muted-foreground mt-1">
                                  Select from available serials in {warehouse}
                                </span>
                              </div>
                            </Button>
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
                          hasSerial={hasSerialTracking}
                          hasBatch={hasBatchTracking}
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
      {showBatchSelector && selectedItem && company && (
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

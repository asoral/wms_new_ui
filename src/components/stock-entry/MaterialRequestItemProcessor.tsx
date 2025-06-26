
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Package, ScanLine, CheckCircle, SkipForward, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import ItemSelector from "../item-enquiry/ItemSelector";
import WarehouseSelector from "../bin-enquiry/WarehouseSelector";
import BatchSelector from "../deliver/BatchSelector";
import { createERPNextAPI } from "@/services/erpnextApi";

interface MaterialRequestItem {
  item_code: string;
  item_name: string;
  qty: number;
  uom: string;
  warehouse?: string;
  stock_qty?: number;
  description?: string;
}

interface ProcessedItem {
  item_code: string;
  item_name: string;
  qty: number;
  uom: string;
  warehouse: string;
  batch_no?: string;
  serial_no?: string;
  scanned: boolean;
  skipped: boolean;
}

interface MaterialRequestItemProcessorProps {
  materialRequestName: string;
  materialRequestItems: MaterialRequestItem[];
  onItemsProcessed: (items: ProcessedItem[]) => void;
  onBack: () => void;
}

// Use the BatchInfo interface from the BatchSelector component's expected format
interface BatchInfo {
  batch_id: string;
  batch_qty: number;
  expiry_date?: string;
}

const MaterialRequestItemProcessor = ({
  materialRequestName,
  materialRequestItems,
  onItemsProcessed,
  onBack
}: MaterialRequestItemProcessorProps) => {
  const [currentItemIndex, setCurrentItemIndex] = useState(0);
  const [processedItems, setProcessedItems] = useState<ProcessedItem[]>([]);
  const [currentWarehouse, setCurrentWarehouse] = useState("");
  const [currentQty, setCurrentQty] = useState(0);
  const [currentBatch, setCurrentBatch] = useState("");
  const [currentSerial, setCurrentSerial] = useState("");
  const [scannedItemCode, setScannedItemCode] = useState("");
  const [itemDetails, setItemDetails] = useState<any>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const currentItem = materialRequestItems[currentItemIndex];
  const totalItems = materialRequestItems.length;
  const progress = ((currentItemIndex) / totalItems) * 100;

  useEffect(() => {
    if (currentItem) {
      setCurrentQty(currentItem.qty);
      fetchItemDetails(currentItem.item_code);
    }
  }, [currentItemIndex, currentItem]);

  const fetchItemDetails = async (itemCode: string) => {
    try {
      const erpnextAPI = await createERPNextAPI();
      if (!erpnextAPI) return;

      const itemResult = await erpnextAPI.getItemDetails(itemCode);
      if (itemResult.data) {
        setItemDetails(itemResult.data);
      }
    } catch (error) {
      console.error('Error fetching item details:', error);
    }
  };

  const handleScanItem = (itemCode: string) => {
    if (itemCode === currentItem.item_code) {
      setScannedItemCode(itemCode);
      setIsScanning(false);
      toast({
        title: "Item Scanned Successfully",
        description: `${currentItem.item_name} confirmed`,
      });
    } else {
      toast({
        title: "Wrong Item Scanned",
        description: `Expected: ${currentItem.item_code}, Got: ${itemCode}`,
        variant: "destructive"
      });
    }
  };

  const handleWarehouseSelected = (warehouse: string) => {
    setCurrentWarehouse(warehouse);
  };

  const handleBatchSelected = (batches: BatchInfo[]) => {
    if (batches.length > 0) {
      setCurrentBatch(batches[0].batch_id);
    }
  };

  const handleConfirmItem = async () => {
    if (!currentWarehouse) {
      toast({
        title: "Warehouse Required",
        description: "Please select a warehouse",
        variant: "destructive"
      });
      return;
    }

    if (currentQty <= 0) {
      toast({
        title: "Invalid Quantity",
        description: "Please enter a valid quantity",
        variant: "destructive"
      });
      return;
    }

    const processedItem: ProcessedItem = {
      item_code: currentItem.item_code,
      item_name: currentItem.item_name,
      qty: currentQty,
      uom: currentItem.uom,
      warehouse: currentWarehouse,
      batch_no: currentBatch || undefined,
      serial_no: currentSerial || undefined,
      scanned: !!scannedItemCode,
      skipped: false
    };

    setProcessedItems(prev => [...prev, processedItem]);
    moveToNextItem();
  };

  const handleSkipItem = () => {
    const skippedItem: ProcessedItem = {
      item_code: currentItem.item_code,
      item_name: currentItem.item_name,
      qty: 0,
      uom: currentItem.uom,
      warehouse: "",
      scanned: false,
      skipped: true
    };

    setProcessedItems(prev => [...prev, skippedItem]);
    moveToNextItem();
  };

  const moveToNextItem = () => {
    if (currentItemIndex < totalItems - 1) {
      setCurrentItemIndex(prev => prev + 1);
      // Reset form for next item
      setScannedItemCode("");
      setCurrentWarehouse("");
      setCurrentBatch("");
      setCurrentSerial("");
      setItemDetails(null);
    } else {
      // All items processed
      const confirmedItems = processedItems.filter(item => !item.skipped);
      onItemsProcessed(confirmedItems);
    }
  };

  const hasSerialBatchTracking = itemDetails && (itemDetails.has_serial_no || itemDetails.has_batch_no);

  if (!currentItem) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">All Items Processed</h3>
          <p className="text-gray-600 mb-4">
            {processedItems.filter(item => !item.skipped).length} items confirmed, {processedItems.filter(item => item.skipped).length} items skipped
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Progress Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Package className="w-5 h-5" />
              <span>Processing Material Request: {materialRequestName}</span>
            </CardTitle>
            <Badge variant="outline">
              {currentItemIndex + 1} of {totalItems}
            </Badge>
          </div>
          <Progress value={progress} className="w-full" />
        </CardHeader>
      </Card>

      {/* Current Item */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span>Item {currentItemIndex + 1}: {currentItem.item_name}</span>
              {scannedItemCode && (
                <Badge variant="default" className="bg-green-100 text-green-800">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Scanned
                </Badge>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Item Details */}
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Item Code:</span> {currentItem.item_code}
              </div>
              <div>
                <span className="font-medium">Required Qty:</span> {currentItem.qty} {currentItem.uom}
              </div>
              {itemDetails && hasSerialBatchTracking && (
                <div className="col-span-2 flex gap-2">
                  {itemDetails.has_serial_no && <Badge variant="outline">Serial Tracking</Badge>}
                  {itemDetails.has_batch_no && <Badge variant="outline">Batch Tracking</Badge>}
                </div>
              )}
            </div>
          </div>

          {/* Scan or Confirm Item */}
          {!scannedItemCode && (
            <div className="space-y-4">
              <Label>Scan Item to Confirm (Optional)</Label>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setIsScanning(true)}
                  className="flex-1"
                >
                  <ScanLine className="w-4 h-4 mr-2" />
                  Scan Item
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setScannedItemCode(currentItem.item_code)}
                >
                  Confirm Without Scan
                </Button>
              </div>
              {isScanning && (
                <div className="mt-4">
                  <ItemSelector
                    onItemSelected={handleScanItem}
                    isLoading={false}
                  />
                </div>
              )}
            </div>
          )}

          {/* Warehouse Selection */}
          {scannedItemCode && (
            <div className="space-y-4">
              <div>
                <Label>Select Warehouse *</Label>
                <WarehouseSelector
                  onWarehouseSelected={handleWarehouseSelected}
                  isLoading={false}
                />
              </div>

              {/* Quantity */}
              <div>
                <Label>Quantity *</Label>
                <Input
                  type="number"
                  value={currentQty}
                  onChange={(e) => setCurrentQty(Number(e.target.value))}
                  min="0"
                  step="0.01"
                />
              </div>

              {/* Batch/Serial for tracked items */}
              {hasSerialBatchTracking && currentWarehouse && (
                <div className="space-y-4">
                  {itemDetails.has_batch_no && (
                    <div>
                      <Label>Select Batch</Label>
                      <BatchSelector
                        itemCode={currentItem.item_code}
                        warehouse={currentWarehouse}
                        onBatchesSelected={handleBatchSelected}
                        isLoading={loading}
                      />
                    </div>
                  )}
                  {itemDetails.has_serial_no && (
                    <div>
                      <Label>Serial Number</Label>
                      <Input
                        value={currentSerial}
                        onChange={(e) => setCurrentSerial(e.target.value)}
                        placeholder="Enter serial number"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex space-x-2 pt-4">
                <Button
                  onClick={handleConfirmItem}
                  disabled={!currentWarehouse || currentQty <= 0}
                  className="flex-1"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Confirm Item
                </Button>
                <Button
                  variant="outline"
                  onClick={handleSkipItem}
                  className="flex-1"
                >
                  <SkipForward className="w-4 h-4 mr-2" />
                  Skip Item
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Back Button */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          Back to Document Selection
        </Button>
        {processedItems.length > 0 && (
          <div className="text-sm text-gray-600">
            {processedItems.filter(item => !item.skipped).length} items processed
          </div>
        )}
      </div>
    </div>
  );
};

export default MaterialRequestItemProcessor;

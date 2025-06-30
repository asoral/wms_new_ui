
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Package, ScanLine, CheckCircle, SkipForward, ArrowLeft, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import ItemSelector from "../item-enquiry/ItemSelector";
import WarehouseSelector from "../bin-enquiry/WarehouseSelector";

interface PickListItem {
  item_code: string;
  item_name: string;
  qty: number;
  uom: string;
  warehouse?: string;
  bin?: string;
  batch?: string;
  serial?: string;
}

interface ProcessedPickItem {
  item_code: string;
  item_name: string;
  qty: number;
  uom: string;
  warehouse: string;
  bin?: string;
  batch_no?: string;
  serial_no?: string;
  scanned: boolean;
  skipped: boolean;
}

interface PickListItemProcessorProps {
  pickListNumber: string;
  pickListItems: PickListItem[];
  onItemsProcessed: (items: ProcessedPickItem[]) => void;
  onBack: () => void;
}

const PickListItemProcessor = ({
  pickListNumber,
  pickListItems,
  onItemsProcessed,
  onBack
}: PickListItemProcessorProps) => {
  const [currentItemIndex, setCurrentItemIndex] = useState(0);
  const [processedItems, setProcessedItems] = useState<ProcessedPickItem[]>([]);
  const [currentWarehouse, setCurrentWarehouse] = useState("");
  const [currentBin, setCurrentBin] = useState("");
  const [currentQty, setCurrentQty] = useState(0);
  const [currentBatch, setCurrentBatch] = useState("");
  const [currentSerial, setCurrentSerial] = useState("");
  const [scannedItemCode, setScannedItemCode] = useState("");
  const [itemDetails, setItemDetails] = useState<any>(null);
  const [isScanning, setIsScanning] = useState(false);
  const { toast } = useToast();

  const currentItem = pickListItems[currentItemIndex];
  const totalItems = pickListItems.length;
  const progress = ((currentItemIndex) / totalItems) * 100;

  useEffect(() => {
    if (currentItem) {
      setCurrentQty(currentItem.qty);
      setCurrentWarehouse(currentItem.warehouse || "");
      setCurrentBin(currentItem.bin || "");
      setCurrentBatch(currentItem.batch || "");
      setCurrentSerial(currentItem.serial || "");
    }
  }, [currentItemIndex, currentItem]);

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

  const handleConfirmItem = () => {
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

    const processedItem: ProcessedPickItem = {
      item_code: currentItem.item_code,
      item_name: currentItem.item_name,
      qty: currentQty,
      uom: currentItem.uom,
      warehouse: currentWarehouse,
      bin: currentBin || undefined,
      batch_no: currentBatch || undefined,
      serial_no: currentSerial || undefined,
      scanned: !!scannedItemCode,
      skipped: false
    };

    setProcessedItems(prev => [...prev, processedItem]);
    moveToNextItem();
  };

  const handleSkipItem = () => {
    const skippedItem: ProcessedPickItem = {
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
      resetForm();
    } else {
      // All items processed
      const confirmedItems = processedItems.filter(item => !item.skipped);
      onItemsProcessed([...confirmedItems, processedItems[processedItems.length - 1]]);
    }
  };

  const resetForm = () => {
    setScannedItemCode("");
    setCurrentWarehouse("");
    setCurrentBin("");
    setCurrentBatch("");
    setCurrentSerial("");
    setItemDetails(null);
  };

  const handlePreviousItem = () => {
    if (currentItemIndex > 0) {
      setCurrentItemIndex(prev => prev - 1);
      // Remove the last processed item if going back
      setProcessedItems(prev => prev.slice(0, -1));
      resetForm();
    }
  };

  if (!currentItem) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">All Items Processed</h3>
          <p className="text-gray-600 mb-4">
            {processedItems.filter(item => !item.skipped).length} items picked, {processedItems.filter(item => item.skipped).length} items skipped
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
              <span>Pick List: {pickListNumber}</span>
            </CardTitle>
            <Badge variant="outline">
              Item {currentItemIndex + 1} of {totalItems}
            </Badge>
          </div>
          <Progress value={progress} className="w-full mt-4" />
        </CardHeader>
      </Card>

      {/* Current Item */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span>Pick Item: {currentItem.item_name}</span>
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
              {currentItem.warehouse && (
                <div>
                  <span className="font-medium">Suggested Warehouse:</span> {currentItem.warehouse}
                </div>
              )}
              {currentItem.bin && (
                <div>
                  <span className="font-medium">Bin Location:</span> {currentItem.bin}
                </div>
              )}
            </div>
          </div>

          {/* Scan Item */}
          {!scannedItemCode && (
            <div className="space-y-4">
              <Label>Scan Item to Confirm *</Label>
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

          {/* Warehouse and Location Selection */}
          {scannedItemCode && (
            <div className="space-y-4">
              <div>
                <Label>Confirm Warehouse *</Label>
                <WarehouseSelector
                  onWarehouseSelected={handleWarehouseSelected}
                  isLoading={false}
                />
              </div>

              <div>
                <Label>Bin Location</Label>
                <Input
                  value={currentBin}
                  onChange={(e) => setCurrentBin(e.target.value)}
                  placeholder="Enter bin location (optional)"
                />
              </div>

              {/* Quantity */}
              <div>
                <Label>Quantity to Pick *</Label>
                <Input
                  type="number"
                  value={currentQty}
                  onChange={(e) => setCurrentQty(Number(e.target.value))}
                  min="0"
                  step="0.01"
                />
              </div>

              {/* Batch/Serial Numbers */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Batch Number</Label>
                  <Input
                    value={currentBatch}
                    onChange={(e) => setCurrentBatch(e.target.value)}
                    placeholder="Enter batch number (if applicable)"
                  />
                </div>
                <div>
                  <Label>Serial Number</Label>
                  <Input
                    value={currentSerial}
                    onChange={(e) => setCurrentSerial(e.target.value)}
                    placeholder="Enter serial number (if applicable)"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-2 pt-4">
                <Button
                  onClick={handleConfirmItem}
                  disabled={!currentWarehouse || currentQty <= 0}
                  className="flex-1"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Confirm Pick
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

      {/* Navigation Buttons */}
      <div className="flex justify-between items-center">
        <div className="flex space-x-2">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Creation
          </Button>
          {currentItemIndex > 0 && (
            <Button variant="outline" onClick={handlePreviousItem}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Previous Item
            </Button>
          )}
        </div>
        
        {processedItems.length > 0 && (
          <div className="text-sm text-gray-600">
            {processedItems.filter(item => !item.skipped).length} items picked
          </div>
        )}
      </div>
    </div>
  );
};

export default PickListItemProcessor;

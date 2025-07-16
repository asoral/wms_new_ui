import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, ChevronLeft, Package, ScanLine, CheckCircle, SkipForward, Scan, Hash } from "lucide-react";
import { PickList, PickListItem } from "../../pages/PickList";
import { useToast } from "@/hooks/use-toast";
import BarcodeScanner from "@/components/common/BarcodeScanner";

interface PickingProcessProps {
  pickList: PickList;
  onBack: () => void;
  onComplete: (items: PickListItem[]) => void;
}

const PickingProcess = ({ pickList, onBack, onComplete }: PickingProcessProps) => {
  const [currentItemIndex, setCurrentItemIndex] = useState(0);
  const [scannedCode, setScannedCode] = useState("");
  const [scannedQty, setScannedQty] = useState<string>("");
  const [items, setItems] = useState<PickListItem[]>(pickList.items || []);
  const [scanningStep, setScanningStep] = useState<'item' | 'batch_serial' | 'qty' | 'complete'>('item');
  const [isItemVerified, setIsItemVerified] = useState(false);
  const [scannedSerials, setScannedSerials] = useState<string[]>([]);
  const [scannedBatch, setScannedBatch] = useState("");
  const [showScanner, setShowScanner] = useState(false);
  const [scannerMode, setScannerMode] = useState<'item' | 'batch' | 'serial'>('item');
  const { toast } = useToast();

  useEffect(() => {
    // Initialize items with proper status - check both items and locations
    let itemsToUse = pickList.items || pickList.locations || [];
    
    if (itemsToUse.length === 0 && pickList.locations) {
      // Use locations if items are empty
      itemsToUse = pickList.locations;
    }
    
    const initializedItems = itemsToUse.map((item: any, index: number) => ({
      id: item.id || (index + 1).toString(),
      item_code: item.item_code,
      item_name: item.item_name || item.item_code,
      qty: item.qty || 0,
      picked_qty: item.picked_qty || 0,
      pickedQty: item.pickedQty || item.picked_qty || 0,
      warehouse: item.warehouse,
      batch_no: item.batch_no || '',
      serial_no: item.serial_no || '',
      has_batch_no: item.has_batch_no || false,
      has_serial_no: item.has_serial_no || false,
      status: item.status || "pending"
    }));
    
    console.log('Initialized items for picking:', initializedItems);
    setItems(initializedItems);
  }, [pickList]);

  useEffect(() => {
    // Reset scanning state when moving to a new item
    setScanningStep('item');
    setIsItemVerified(false);
    setScannedSerials([]);
    setScannedBatch("");
    setScannedCode("");
    setScannedQty("");
  }, [currentItemIndex]);

  const handleBarcodeScanned = (code: string) => {
    const currentItem = getCurrentItem();
    
    if (scannerMode === 'item') {
      setScannedCode(code);
      if (code === currentItem.item_code) {
        setIsItemVerified(true);
        setScanningStep('batch_serial');
        toast({
          title: "Item Verified",
          description: "Item code matches!",
        });
      } else {
        toast({
          title: "Item Mismatch",
          description: "Scanned code does not match item code",
          variant: "destructive"
        });
      }
    } else if (scannerMode === 'batch') {
      // Validate batch matches expected batch
      if (currentItem.batch_no && code !== currentItem.batch_no) {
        toast({
          title: "Batch Mismatch",
          description: `Expected batch: ${currentItem.batch_no}, Scanned: ${code}`,
          variant: "destructive"
        });
        return;
      }
      setScannedBatch(code);
      setScanningStep('qty');
      toast({
        title: "Batch Verified",
        description: `Batch ${code} verified`,
      });
    } else if (scannerMode === 'serial') {
      // Validate serial number exists in expected serials if available
      if (currentItem.serial_no) {
        const expectedSerials = currentItem.serial_no.split('\n').map(s => s.trim()).filter(s => s);
        if (expectedSerials.length > 0 && !expectedSerials.includes(code)) {
          toast({
            title: "Serial Not Found",
            description: `Serial ${code} not in expected list`,
            variant: "destructive"
          });
          return;
        }
      }
      
      if (!scannedSerials.includes(code)) {
        const newSerials = [...scannedSerials, code];
        setScannedSerials(newSerials);
        
        // If serial tracked, update quantity automatically
        if (currentItem.serial_no || currentItem.has_serial_no) {
          setScannedQty(newSerials.length.toString());
          if (newSerials.length >= currentItem.qty) {
            setScanningStep('complete');
          }
        }
        
        toast({
          title: "Serial Verified",
          description: `Serial ${code} added (${newSerials.length}/${currentItem.qty})`,
        });
      } else {
        toast({
          title: "Duplicate Serial",
          description: "This serial number was already scanned",
          variant: "destructive"
        });
      }
    }
    
    setShowScanner(false);
  };

  const handleItemVerification = () => {
    const currentItem = getCurrentItem();
    if (scannedCode === currentItem.item_code) {
      setIsItemVerified(true);
      setScanningStep('batch_serial');
      toast({
        title: "Item Verified",
        description: "Item code matches!",
      });
    } else {
      toast({
        title: "Item Mismatch",
        description: "Code does not match item code. Please scan correct item or skip.",
        variant: "destructive"
      });
      // Don't allow progression with wrong item
      return;
    }
  };

  const handleSkipItemVerification = () => {
    setIsItemVerified(true);
    setScanningStep('batch_serial');
    toast({
      title: "Item Verification Skipped",
      description: "Manual confirmation accepted",
    });
  };

  const handleConfirmPick = async () => {
    const currentItem = getCurrentItem();
    const quantity = (currentItem.serial_no || currentItem.has_serial_no) ? scannedSerials.length : parseInt(scannedQty);

    // Validate item verification
    if (!isItemVerified) {
      toast({
        title: "Item Not Verified",
        description: "Please verify the item first",
        variant: "destructive"
      });
      return;
    }

    // Validate batch if required
    if (currentItem.batch_no && scannedBatch !== currentItem.batch_no) {
      toast({
        title: "Batch Validation Failed",
        description: `Expected: ${currentItem.batch_no}, Got: ${scannedBatch}`,
        variant: "destructive"
      });
      return;
    }

    // Validate serials if required
    if (currentItem.serial_no) {
      const expectedSerials = currentItem.serial_no.split('\n').map(s => s.trim()).filter(s => s);
      const invalidSerials = scannedSerials.filter(s => !expectedSerials.includes(s));
      if (invalidSerials.length > 0) {
        toast({
          title: "Invalid Serial Numbers",
          description: `Remove invalid serials: ${invalidSerials.join(', ')}`,
          variant: "destructive"
        });
        // Remove invalid serials
        const validSerials = scannedSerials.filter(s => expectedSerials.includes(s));
        setScannedSerials(validSerials);
        setScannedQty(validSerials.length.toString());
        return;
      }
    }

    if (!quantity || quantity <= 0) {
      toast({
        title: "Invalid Quantity",
        description: "Please enter a valid quantity or scan serial numbers",
        variant: "destructive"
      });
      return;
    }

    if (quantity > currentItem.qty) {
      toast({
        title: "Quantity Exceeded",
        description: "Cannot pick more than required quantity",
        variant: "destructive"
      });
      return;
    }

    // Update the current item and send to ERPNext
    const updatedItems = [...items];
    const updatedItem = {
      ...currentItem,
      picked_qty: quantity,
      pickedQty: quantity,
      status: quantity === currentItem.qty ? "completed" : "partial",
      scanned_serials: scannedSerials,
      scanned_batch: scannedBatch
    };
    
    // Update ERPNext with picked quantities
    try {
      const { createERPNextAPI } = await import("@/services/erpnextApi");
      const erpnextAPI = await createERPNextAPI();
      
      if (erpnextAPI) {
        // Update the pick list item with picked quantities
        const updateData = {
          locations: [{
            ...updatedItem,
            serial_and_batch_bundle: scannedSerials.length > 0 ? scannedSerials.join('\n') : null
          }]
        };
        
        await erpnextAPI.updatePickList(pickList.name, updateData);
      }
    } catch (error) {
      console.error('Error updating pick list:', error);
      toast({
        title: "Update Warning",
        description: "Item picked locally but failed to sync with ERPNext",
        variant: "destructive"
      });
    }
    
    updatedItems[currentItemIndex] = updatedItem;
    setItems(updatedItems);

    toast({
      title: "Item Picked",
      description: `Successfully picked ${quantity} units`,
    });

    // Check if this is the last item or all items are processed
    if (currentItemIndex === items.length - 1) {
      // Show review page
      setTimeout(() => {
        onComplete(updatedItems);
      }, 1000);
    } else {
      // Move to next item
      setCurrentItemIndex(currentItemIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentItemIndex > 0) {
      setCurrentItemIndex(currentItemIndex - 1);
    }
  };

  const handleSkipItem = () => {
    if (currentItemIndex < items.length - 1) {
      setCurrentItemIndex(currentItemIndex + 1);
    } else {
      // If last item, show review
      onComplete(items);
    }
  };

  const getCurrentItem = () => {
    return items[currentItemIndex];
  };

  const getItemStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300";
      case "partial":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getProgressPercentage = () => {
    const completedItems = items.filter(item => item.status === "completed").length;
    return items.length > 0 ? (completedItems / items.length) * 100 : 0;
  };

  const isAllCompleted = () => {
    return items.length > 0 && items.every(item => (item.picked_qty || 0) === item.qty);
  };

  // Early return if no items - first check if locations exist
  if (!items || items.length === 0) {
    // Check if pickList has locations instead of items
    const locations = pickList.locations || [];
    if (locations.length > 0) {
      // Convert locations to items format
      const convertedItems = locations.map((loc: any, index: number) => ({
        id: (index + 1).toString(),
        item_code: loc.item_code,
        item_name: loc.item_name || loc.item_code,
        qty: loc.qty || 0,
        picked_qty: loc.picked_qty || 0,
        warehouse: loc.warehouse,
        batch_no: loc.batch_no || '',
        serial_no: loc.serial_no || '',
        has_batch_no: loc.has_batch_no || false,
        has_serial_no: loc.has_serial_no || false,
        status: (loc.picked_qty || 0) === 0 ? "pending" : 
                (loc.picked_qty || 0) < loc.qty ? "partial" : "completed"
      }));
      
      // Update items state with converted locations
      if (convertedItems.length > 0) {
        setItems(convertedItems);
        // Don't return early, continue with normal flow
      }
    } else {
      return (
        <div className="p-6 space-y-6">
          <div className="flex items-center space-x-2 mb-6">
            <Package className="w-6 h-6 text-blue-600" />
            <h1 className="text-2xl font-bold">Pick List</h1>
          </div>
          <div className="text-center py-8">
            <p className="text-gray-500">No items to pick in this pick list.</p>
            <Button onClick={onBack} className="mt-4">
              Back to Pick List
            </Button>
          </div>
        </div>
      );
    }
  }

  const currentItem = getCurrentItem();
  const codeMatches = currentItem && scannedCode === currentItem.item_code;

  if (isAllCompleted()) {
    return (
      <div className="p-6 space-y-6">
        {/* Header with stepper */}
        <div className="flex items-center space-x-2 mb-6">
          <Package className="w-6 h-6 text-blue-600" />
          <h1 className="text-2xl font-bold">Pick List</h1>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center space-x-4 mb-6">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-400 flex items-center justify-center text-sm font-medium">
              1
            </div>
            <span className="text-gray-400">Select</span>
          </div>
          <div className="w-8 h-px bg-gray-200"></div>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-400 flex items-center justify-center text-sm font-medium">
              2
            </div>
            <span className="text-gray-400">Details</span>
          </div>
          <div className="w-8 h-px bg-gray-200"></div>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-medium">
              3
            </div>
            <span className="text-blue-600 font-medium">Pick</span>
          </div>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={onBack} className="flex items-center space-x-2">
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Details</span>
          </Button>
          <div className="flex items-center space-x-4">
            <span className="font-semibold">{pickList.name}</span>
            <Badge className="bg-blue-100 text-blue-800">{items.length}/{items.length} Items</Badge>
          </div>
        </div>

        {/* Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Progress</span>
            <span>100%</span>
          </div>
          <Progress value={100} className="h-2" />
        </div>

        {/* Completion Card */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-8 text-center">
          <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-green-900 mb-2">Picking Complete!</h2>
          <p className="text-green-700 mb-6">All items have been successfully picked.</p>
          <Button 
            className="bg-green-600 hover:bg-green-700"
            onClick={() => onComplete(items)}
          >
            Complete Pick List
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto p-3 md:p-6 space-y-6 overflow-x-hidden">
      {/* Header with stepper */}
      <div className="flex items-center space-x-2 mb-6">
        <Package className="w-6 h-6 text-primary" />
        <h1 className="text-xl md:text-2xl font-bold text-foreground">Pick List</h1>
      </div>

      {/* Progress Steps */}
      <div className="flex justify-center mb-6">
        <div className="flex items-center space-x-2 md:space-x-4">
          <div className="flex items-center space-x-1 md:space-x-2">
            <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-xs md:text-sm font-medium">
              1
            </div>
            <span className="text-muted-foreground text-sm md:text-base">Select</span>
          </div>
          <div className="w-4 md:w-8 h-px bg-border"></div>
          <div className="flex items-center space-x-1 md:space-x-2">
            <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-xs md:text-sm font-medium">
              2
            </div>
            <span className="text-muted-foreground text-sm md:text-base">Details</span>
          </div>
          <div className="w-4 md:w-8 h-px bg-border"></div>
          <div className="flex items-center space-x-1 md:space-x-2">
            <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs md:text-sm font-medium">
              3
            </div>
            <span className="text-primary font-medium text-sm md:text-base">Pick</span>
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onBack} className="flex items-center space-x-2">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Details</span>
        </Button>
        <div className="flex items-center space-x-4">
          <span className="font-semibold">{pickList.name}</span>
          <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300">{Math.floor(getProgressPercentage() / (100 / items.length))}/{items.length} Items</Badge>
        </div>
      </div>

      {/* Progress */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>Progress</span>
          <span>{Math.round(getProgressPercentage())}%</span>
        </div>
        <Progress value={getProgressPercentage()} className="h-2" />
      </div>

      {/* Compact Item Card */}
      <Card className="border-l-4 border-l-primary overflow-hidden">
        <CardContent className="p-4">
          {/* Item Header - Compact */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <Package className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-semibold">Item {currentItemIndex + 1} of {items.length}</h3>
            </div>
            <Badge className={getItemStatusColor(getCurrentItem().status || "pending")}>
              {getCurrentItem().status || "pending"}
            </Badge>
          </div>

          {/* Item Details - 2 rows on mobile, 1 row on desktop */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 mb-4 text-sm">
            <div className="min-w-0">
              <span className="text-xs text-muted-foreground">Item Code:</span>
              <p className="font-medium text-sm truncate">{getCurrentItem().item_code}</p>
            </div>
            <div className="min-w-0">
              <span className="text-xs text-muted-foreground">Item Name:</span>
              <p className="font-medium text-sm truncate">{getCurrentItem().item_name}</p>
            </div>
            <div className="min-w-0">
              <span className="text-xs text-muted-foreground">Warehouse:</span>
              <p className="text-sm truncate">{getCurrentItem().warehouse}</p>
            </div>
            <div className="min-w-0">
              <span className="text-xs text-muted-foreground">Bin:</span>
              <p className="text-sm truncate">{getCurrentItem().bin || "N/A"}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-4 text-sm">
            {getCurrentItem().batch_no && (
              <div className="min-w-0">
                <span className="text-xs text-muted-foreground">Batch:</span>
                <p className="text-sm">{getCurrentItem().batch_no}</p>
              </div>
            )}
            <div>
              <span className="text-xs text-muted-foreground">Required Qty:</span>
              <p className="font-semibold text-sm">{getCurrentItem().qty}</p>
            </div>
            <div>
              <span className="text-xs text-muted-foreground">Picked Qty:</span>
              <p className="font-semibold text-sm text-green-600">{getCurrentItem().picked_qty || 0}</p>
            </div>
          </div>

          {/* Scanning Workflow */}
          {scanningStep === 'item' && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Step 1: Verify Item</h4>
              <div className="flex space-x-2">
                <Button
                  onClick={() => {
                    setScannerMode('item');
                    setShowScanner(true);
                  }}
                  size="sm"
                  variant="outline"
                  className="flex-1"
                >
                  <Scan className="w-4 h-4 mr-1" />
                  Scan Item
                </Button>
                <Button
                  onClick={handleSkipItemVerification}
                  size="sm"
                  variant="outline"
                  className="flex-1"
                >
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Manual Confirm
                </Button>
              </div>
              <div className="flex space-x-2">
                <Input
                  placeholder="Or enter item code"
                  value={scannedCode}
                  onChange={(e) => setScannedCode(e.target.value)}
                  className="text-sm"
                />
                <Button
                  onClick={handleItemVerification}
                  size="sm"
                  disabled={!scannedCode}
                >
                  Verify
                </Button>
              </div>
            </div>
          )}

          {scanningStep === 'batch_serial' && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Step 2: Track Batch/Serial</h4>
              
              {(getCurrentItem().batch_no || getCurrentItem().has_batch_no) && (
                <div className="space-y-2">
                  <Label className="text-xs">Batch Number</Label>
                  <div className="flex space-x-2">
                    <Button
                      onClick={() => {
                        setScannerMode('batch');
                        setShowScanner(true);
                      }}
                      size="sm"
                      variant="outline"
                    >
                      <Scan className="w-4 h-4 mr-1" />
                      Scan Batch
                    </Button>
                    <Input
                      placeholder="Or enter batch"
                      value={scannedBatch}
                      onChange={(e) => setScannedBatch(e.target.value)}
                      className="text-sm"
                    />
                  </div>
                </div>
              )}

              {(getCurrentItem().serial_no || getCurrentItem().has_serial_no) && (
                <div className="space-y-2">
                  <Label className="text-xs">Serial Numbers ({scannedSerials.length}/{getCurrentItem().qty})</Label>
                  <div className="flex space-x-2">
                    <Button
                      onClick={() => {
                        setScannerMode('serial');
                        setShowScanner(true);
                      }}
                      size="sm"
                      variant="outline"
                      disabled={scannedSerials.length >= getCurrentItem().qty}
                    >
                      <Hash className="w-4 h-4 mr-1" />
                      Scan Serial
                    </Button>
                  </div>
                  {scannedSerials.length > 0 && (
                    <div className="text-xs text-muted-foreground">
                      Scanned: {scannedSerials.join(', ')}
                    </div>
                  )}
                </div>
              )}

              <Button
                onClick={() => {
                  // Validate batch before proceeding
                  if (getCurrentItem().batch_no && scannedBatch !== getCurrentItem().batch_no) {
                    toast({
                      title: "Batch Required",
                      description: `Please scan the correct batch: ${getCurrentItem().batch_no}`,
                      variant: "destructive"
                    });
                    return;
                  }
                  setScanningStep('qty');
                }}
                size="sm"
                className="w-full"
                disabled={getCurrentItem().batch_no && scannedBatch !== getCurrentItem().batch_no}
              >
                Continue to Quantity
              </Button>
            </div>
          )}

          {scanningStep === 'qty' && !(getCurrentItem().serial_no || getCurrentItem().has_serial_no) && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Step 3: Enter Quantity</h4>
              <Input
                type="number"
                inputMode="numeric"
                placeholder="Enter picked quantity"
                value={scannedQty}
                onChange={(e) => setScannedQty(e.target.value)}
                className="text-sm"
                max={getCurrentItem().qty}
              />
              <Button
                onClick={() => setScanningStep('complete')}
                size="sm"
                className="w-full"
                disabled={!scannedQty || parseInt(scannedQty) <= 0}
              >
                Continue to Confirm
              </Button>
            </div>
          )}

          {(scanningStep === 'complete' || ((getCurrentItem().serial_no || getCurrentItem().has_serial_no) && scannedSerials.length > 0)) && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Step 4: Confirm Pick</h4>
              <div className="bg-green-50 p-3 rounded text-sm">
                <p><strong>Item:</strong> {getCurrentItem().item_code}</p>
                <p><strong>Quantity:</strong> {(getCurrentItem().serial_no || getCurrentItem().has_serial_no) ? scannedSerials.length : scannedQty}</p>
                {scannedBatch && <p><strong>Batch:</strong> {scannedBatch}</p>}
                {scannedSerials.length > 0 && <p><strong>Serials:</strong> {scannedSerials.length} items</p>}
              </div>
              <Button
                onClick={handleConfirmPick}
                size="sm"
                className="w-full bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="w-4 h-4 mr-1" />
                Confirm Pick
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex items-center justify-between space-x-2">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentItemIndex === 0}
          size="sm"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Previous
        </Button>

        <Button
          variant="outline"
          onClick={handleSkipItem}
          size="sm"
          className="flex-1"
        >
          <SkipForward className="w-4 h-4 mr-1" />
          Skip Item
        </Button>
      </div>

      {/* Barcode Scanner Modal */}
      {showScanner && (
        <BarcodeScanner
          onBarcodeScanned={handleBarcodeScanned}
          onClose={() => setShowScanner(false)}
          title={`Scan ${scannerMode === 'item' ? 'Item Code' : scannerMode === 'batch' ? 'Batch Number' : 'Serial Number'}`}
          isModal={true}
        />
      )}
    </div>
  );
};

export default PickingProcess;
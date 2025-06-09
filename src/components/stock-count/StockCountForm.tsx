import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Loader2, AlertCircle, CheckCircle } from "lucide-react";
import { createERPNextAPI } from "@/services/erpnextApi";
import { useNotification } from "@/hooks/useNotification";
import { toast } from "sonner";
import ItemSelector from "./ItemSelector";
import SerialBatchBundleSelector from './SerialBatchBundleSelector';
import CameraScanner from "../bin-enquiry/CameraScanner";

interface ItemInfo {
  item_code: string;
  item_name: string;
  stock_uom: string;
  has_batch_no?: number;
  has_serial_no?: number;
}

interface StockCountFormProps {
  warehouse: string;
  onAddEntry: (entry: {
    itemCode: string;
    itemName: string;
    warehouse: string;
    batch?: string;
    serial?: string;
    serialBatchBundle?: string;
    currentQty: number;
    actualQty: number;
    uom: string;
  }) => void;
}

const StockCountForm = ({ warehouse, onAddEntry }: StockCountFormProps) => {
  const [formData, setFormData] = useState({
    batch: '',
    serial: '',
    actualQty: 0,
    serialBatchBundle: ''
  });
  const [isScanning, setIsScanning] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ItemInfo | null>(null);
  const [currentQty, setCurrentQty] = useState<number>(0);
  const [isLoadingQty, setIsLoadingQty] = useState(false);
  const [qtyError, setQtyError] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const { showError, showSuccess, showLoading, dismiss } = useNotification();

  const [useBundle, setUseBundle] = useState(false);

  const fetchCurrentQty = async (itemCode: string, batch?: string, serial?: string) => {
    if (!itemCode || !warehouse) return;
    
    setIsLoadingQty(true);
    setQtyError(null);
    
    try {
      const erpnextAPI = await createERPNextAPI();
      if (!erpnextAPI) {
        setQtyError('ERPNext API not configured');
        setCurrentQty(0);
        return;
      }

      console.log('Fetching current qty for:', { itemCode, warehouse, batch, serial });
      const qty = await erpnextAPI.getCurrentStock(itemCode, warehouse, batch, serial);
      setCurrentQty(qty);
      console.log('Current quantity fetched:', qty);
    } catch (error) {
      console.error('Failed to fetch current quantity:', error);
      setQtyError('Unable to fetch current stock. You can still proceed with the count.');
      setCurrentQty(0);
    } finally {
      setIsLoadingQty(false);
    }
  };

  const handleBarcodeDetected = async (barcode: string) => {
    console.log('Barcode detected in StockCountForm:', barcode);
    setShowCamera(false);
    
    const loadingToast = showLoading('Looking up item by barcode...');
    
    try {
      const erpnextAPI = await createERPNextAPI();
      if (!erpnextAPI) {
        showError('ERPNext API not configured');
        return;
      }

      // Look up item by barcode
      const itemByBarcode = await erpnextAPI.getItemByBarcode(barcode);
      if (itemByBarcode && itemByBarcode.data && itemByBarcode.data.length > 0) {
        const item = itemByBarcode.data[0];
        const itemInfo: ItemInfo = {
          item_code: item.item_code,
          item_name: item.item_name,
          stock_uom: item.stock_uom,
          has_batch_no: item.has_batch_no || 0,
          has_serial_no: item.has_serial_no || 0
        };
        await handleItemSelected(itemInfo);
        showSuccess('Item found by barcode!');
      } else {
        showError('No item found with this barcode');
      }
    } catch (error) {
      console.error('Failed to lookup item by barcode:', error);
      showError('Failed to lookup item by barcode');
    } finally {
      dismiss(loadingToast);
    }
  };

  const handleItemSelected = async (item: ItemInfo) => {
    console.log('Item selected, setting item data:', item);
    
    setSelectedItem(item);
    
    const loadingToast = showLoading('Fetching item details...');
    
    try {
      const erpnextAPI = await createERPNextAPI();
      if (!erpnextAPI) {
        showError('ERPNext API not configured');
        return;
      }

      const itemDetails = await erpnextAPI.getItemDetails(item.item_code);
      if (itemDetails.data) {
        const fullItem = {
          ...item,
          has_batch_no: itemDetails.data.has_batch_no || 0,
          has_serial_no: itemDetails.data.has_serial_no || 0
        };
        console.log('Updated item with full details:', fullItem);
        setSelectedItem(fullItem);
        await fetchCurrentQty(fullItem.item_code);
      } else {
        console.log('Keeping original item data');
        await fetchCurrentQty(item.item_code);
      }
    } catch (error) {
      console.error('Failed to fetch item details:', error);
      await fetchCurrentQty(item.item_code);
    } finally {
      dismiss(loadingToast);
    }
  };

  const validateBatch = async (batchNo: string, itemCode: string): Promise<boolean> => {
    if (!batchNo || !itemCode) return true;
    
    try {
      const erpnextAPI = await createERPNextAPI();
      if (!erpnextAPI) return true;

      const isValid = await erpnextAPI.validateBatch(batchNo, itemCode);
      if (isValid) {
        toast.success('Batch validated successfully');
      }
      return isValid;
    } catch (error) {
      console.error('Batch validation error:', error);
      toast.error('Failed to validate/create batch');
      return false;
    }
  };

  const validateSerial = async (serialNo: string, itemCode: string): Promise<boolean> => {
    if (!serialNo || !itemCode) return true;
    
    try {
      const erpnextAPI = await createERPNextAPI();
      if (!erpnextAPI) return true;

      const isValid = await erpnextAPI.validateSerial(serialNo, itemCode, warehouse);
      if (isValid) {
        toast.success('Serial number validated successfully');
      }
      return isValid;
    } catch (error) {
      console.error('Serial validation error:', error);
      toast.error('Failed to validate/create serial number');
      return false;
    }
  };

  const handleBundleCreated = (bundleName: string, totalQty: number) => {
    setFormData(prev => ({ 
      ...prev, 
      serialBatchBundle: bundleName,
      actualQty: totalQty 
    }));
    setUseBundle(true);
    toast.success(`Bundle created with ${totalQty} items`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedItem) {
      toast.error('Please select an item first');
      return;
    }

    if (useBundle && !formData.serialBatchBundle) {
      toast.error('Please create a Serial and Batch Bundle first');
      return;
    }

    if (!useBundle) {
      if (selectedItem.has_batch_no && !formData.batch) {
        toast.error('Batch number is required for this item');
        return;
      }

      if (selectedItem.has_serial_no && !formData.serial) {
        toast.error('Serial number is required for this item');
        return;
      }

      // Validate batch if provided (will create if not exists)
      if (formData.batch) {
        const isValidBatch = await validateBatch(formData.batch, selectedItem.item_code);
        if (!isValidBatch) {
          toast.error('Failed to validate/create batch number');
          return;
        }
      }

      // Validate serial if provided (will create if not exists)
      if (formData.serial) {
        const isValidSerial = await validateSerial(formData.serial, selectedItem.item_code);
        if (!isValidSerial) {
          toast.error('Failed to validate/create serial number');
          return;
        }
      }
    }

    if (formData.actualQty < 0) {
      toast.error('Actual quantity cannot be negative');
      return;
    }

    try {
      console.log('Submitting entry with data:', {
        itemCode: selectedItem.item_code,
        itemName: selectedItem.item_name,
        warehouse: warehouse,
        batch: useBundle ? undefined : (formData.batch || undefined),
        serial: useBundle ? undefined : (formData.serial || undefined),
        serialBatchBundle: useBundle ? formData.serialBatchBundle : undefined,
        currentQty: currentQty,
        actualQty: formData.actualQty,
        uom: selectedItem.stock_uom
      });

      await onAddEntry({
        itemCode: selectedItem.item_code,
        itemName: selectedItem.item_name,
        warehouse: warehouse,
        batch: useBundle ? undefined : (formData.batch || undefined),
        serial: useBundle ? undefined : (formData.serial || undefined),
        serialBatchBundle: useBundle ? formData.serialBatchBundle : undefined,
        currentQty: currentQty,
        actualQty: formData.actualQty,
        uom: selectedItem.stock_uom
      });

      // Reset form but keep item selected for easier multiple entries
      setFormData({
        batch: '',
        serial: '',
        actualQty: 0,
        serialBatchBundle: ''
      });
      setUseBundle(false);
      setCurrentQty(0);
      setQtyError(null);
      
      toast.success('Item added to count successfully');
    } catch (error) {
      console.error('Error adding item to count:', error);
      toast.error('Failed to add item to count');
    }
  };

  const shouldShowBatch = selectedItem?.has_batch_no === 1;
  const shouldShowSerial = selectedItem?.has_serial_no === 1;
  const shouldShowBundleOption = shouldShowBatch || shouldShowSerial;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Item Selection */}
      <Card>
        <CardContent className="pt-6">
          <Tabs defaultValue="manual" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="manual">Manual Entry</TabsTrigger>
              <TabsTrigger value="scan">Scan Item</TabsTrigger>
            </TabsList>

            <TabsContent value="manual" className="space-y-4">
              <ItemSelector 
                onItemSelected={handleItemSelected}
                isLoading={false}
              />
              
              {/* Current Stock Info - Inline Display */}
              {selectedItem && (
                <div className="flex items-center justify-between text-sm bg-gray-50 p-3 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-600">Current Stock:</span>
                    {isLoadingQty ? (
                      <div className="flex items-center">
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        <span>Loading...</span>
                      </div>
                    ) : qtyError ? (
                      <div className="flex items-center text-orange-600">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        <span>{currentQty} {selectedItem.stock_uom}</span>
                      </div>
                    ) : (
                      <div className="flex items-center text-green-600">
                        <CheckCircle className="w-4 h-4 mr-1" />
                        <span className="font-medium">{currentQty} {selectedItem.stock_uom}</span>
                      </div>
                    )}
                  </div>
                  {qtyError && (
                    <span className="text-xs text-orange-600">{qtyError}</span>
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent value="scan" className="space-y-4">
              {!showCamera ? (
                <div className="text-center">
                  <Button 
                    type="button"
                    onClick={() => setShowCamera(true)} 
                    disabled={isScanning}
                    size="lg"
                    className="w-full"
                  >
                    Start Camera Scanner
                  </Button>
                </div>
              ) : (
                <CameraScanner
                  onBarcodeDetected={handleBarcodeDetected}
                  isActive={showCamera}
                  onClose={() => setShowCamera(false)}
                />
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Serial/Batch Input Method Selection */}
      {selectedItem && shouldShowBundleOption && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <Label>Serial/Batch Input Method</Label>
              <div className="flex space-x-4">
                <Button
                  type="button"
                  variant={!useBundle ? "default" : "outline"}
                  onClick={() => setUseBundle(false)}
                >
                  Traditional Entry
                </Button>
                <Button
                  type="button"
                  variant={useBundle ? "default" : "outline"}
                  onClick={() => setUseBundle(true)}
                >
                  Bundle Entry
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bundle Selector */}
      {selectedItem && useBundle && shouldShowBundleOption && (
        <SerialBatchBundleSelector
          itemCode={selectedItem.item_code}
          warehouse={warehouse}
          hasSerial={shouldShowSerial}
          hasBatch={shouldShowBatch}
          transactionType="Inward"
          onBundleCreated={handleBundleCreated}
          initialQuantity={formData.actualQty || 1}
        />
      )}

      {/* Traditional Additional Fields */}
      {selectedItem && !useBundle && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {shouldShowBatch && (
            <div>
              <Label htmlFor="batch">Batch Number *</Label>
              <Input
                id="batch"
                value={formData.batch}
                onChange={(e) => setFormData(prev => ({ ...prev, batch: e.target.value }))}
                placeholder="Enter batch number..."
                required
              />
            </div>
          )}
          {shouldShowSerial && (
            <div>
              <Label htmlFor="serial">Serial Number *</Label>
              <Input
                id="serial"
                value={formData.serial}
                onChange={(e) => setFormData(prev => ({ ...prev, serial: e.target.value }))}
                placeholder="Enter serial number..."
                required
              />
            </div>
          )}
          <div>
            <Label htmlFor="actualQty">Actual Quantity *</Label>
            <Input
              id="actualQty"
              type="number"
              step="any"
              value={formData.actualQty}
              onChange={(e) => setFormData(prev => ({ ...prev, actualQty: Number(e.target.value) }))}
              placeholder="Enter actual quantity..."
              required
            />
          </div>
        </div>
      )}

      {/* Bundle Quantity Input */}
      {selectedItem && useBundle && formData.serialBatchBundle && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="bundleQty">Bundle Total Quantity</Label>
            <Input
              id="bundleQty"
              type="number"
              value={formData.actualQty}
              disabled
              className="bg-gray-100"
            />
          </div>
        </div>
      )}

      {/* Submit */}
      {selectedItem && (
        <Button type="submit" className="w-full" disabled={isLoadingQty}>
          <Plus className="w-4 h-4 mr-2" />
          Add to Count
        </Button>
      )}
    </form>
  );
};

export default StockCountForm;


import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Scan, Plus, Loader2 } from "lucide-react";
import { createERPNextAPI } from "@/services/erpnextApi";
import { useNotification } from "@/hooks/useNotification";
import ItemSelector from "./ItemSelector";

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
    currentQty: number;
    actualQty: number;
    uom: string;
  }) => void;
}

const StockCountForm = ({ warehouse, onAddEntry }: StockCountFormProps) => {
  const [formData, setFormData] = useState({
    batch: '',
    serial: '',
    actualQty: 0
  });
  const [isScanning, setIsScanning] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ItemInfo | null>(null);
  const [currentQty, setCurrentQty] = useState<number>(0);
  const [isLoadingQty, setIsLoadingQty] = useState(false);
  const { showError, showSuccess, showLoading, dismiss } = useNotification();

  const fetchCurrentQty = async (itemCode: string, batch?: string, serial?: string) => {
    if (!itemCode || !warehouse) return;
    
    setIsLoadingQty(true);
    try {
      const erpnextAPI = await createERPNextAPI();
      if (!erpnextAPI) {
        showError('ERPNext API not configured');
        return;
      }

      const qty = await erpnextAPI.getCurrentStock(itemCode, warehouse, batch, serial);
      setCurrentQty(qty);
    } catch (error) {
      console.error('Failed to fetch current quantity:', error);
      showError('Failed to fetch current stock quantity');
      setCurrentQty(0);
    } finally {
      setIsLoadingQty(false);
    }
  };

  const handleItemScan = () => {
    setIsScanning(true);
    
    setTimeout(() => {
      const scannedItem = {
        item_code: "ITM-001",
        item_name: "Sample Scanned Item",
        stock_uom: "Nos",
        has_batch_no: 0,
        has_serial_no: 0
      };
      setSelectedItem(scannedItem);
      setIsScanning(false);
      fetchCurrentQty(scannedItem.item_code);
    }, 2000);
  };

  const handleItemSelected = async (item: ItemInfo) => {
    const loadingToast = showLoading('Fetching item details...');
    
    try {
      const erpnextAPI = await createERPNextAPI();
      if (!erpnextAPI) {
        showError('ERPNext API not configured');
        return;
      }

      // Get full item details including batch/serial tracking
      const itemDetails = await erpnextAPI.getItemDetails(item.item_code);
      if (itemDetails.data) {
        const fullItem = {
          ...item,
          has_batch_no: itemDetails.data.has_batch_no || 0,
          has_serial_no: itemDetails.data.has_serial_no || 0
        };
        setSelectedItem(fullItem);
        await fetchCurrentQty(fullItem.item_code);
      } else {
        setSelectedItem(item);
        await fetchCurrentQty(item.item_code);
      }
    } catch (error) {
      console.error('Failed to fetch item details:', error);
      setSelectedItem(item);
      await fetchCurrentQty(item.item_code);
    } finally {
      dismiss(loadingToast);
    }
  };

  // Refetch quantity when batch/serial changes
  useEffect(() => {
    if (selectedItem) {
      fetchCurrentQty(selectedItem.item_code, formData.batch, formData.serial);
    }
  }, [formData.batch, formData.serial, selectedItem]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedItem) return;

    // Validate required fields
    if (selectedItem.has_batch_no && !formData.batch) {
      showError('Batch number is required for this item');
      return;
    }

    if (selectedItem.has_serial_no && !formData.serial) {
      showError('Serial number is required for this item');
      return;
    }

    onAddEntry({
      itemCode: selectedItem.item_code,
      itemName: selectedItem.item_name,
      warehouse: warehouse,
      batch: formData.batch || undefined,
      serial: formData.serial || undefined,
      currentQty: currentQty,
      actualQty: formData.actualQty,
      uom: selectedItem.stock_uom
    });

    // Reset form
    setFormData({
      batch: '',
      serial: '',
      actualQty: 0
    });
    setSelectedItem(null);
    setCurrentQty(0);
    
    showSuccess('Item added to count successfully');
  };

  const shouldShowBatch = selectedItem?.has_batch_no === 1;
  const shouldShowSerial = selectedItem?.has_serial_no === 1;

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
            </TabsContent>

            <TabsContent value="scan" className="space-y-4">
              <div className="text-center">
                <Button 
                  type="button"
                  onClick={handleItemScan} 
                  disabled={isScanning}
                  size="lg"
                  className="w-full"
                >
                  {isScanning ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Scanning...
                    </>
                  ) : (
                    <>
                      <Scan className="w-4 h-4 mr-2" />
                      Scan Item
                    </>
                  )}
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Item Details */}
      {selectedItem && (
        <Card className="bg-blue-50">
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <div>
                <Label>Item Name</Label>
                <p className="font-medium">{selectedItem.item_name}</p>
              </div>
              <div>
                <Label>Current Qty</Label>
                <p className="font-medium">
                  {isLoadingQty ? (
                    <Loader2 className="w-4 h-4 animate-spin inline" />
                  ) : (
                    `${currentQty} ${selectedItem.stock_uom}`
                  )}
                </p>
              </div>
              <div>
                <Label>UOM</Label>
                <p className="font-medium">{selectedItem.stock_uom}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Additional Fields */}
      {selectedItem && (
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
              value={formData.actualQty}
              onChange={(e) => setFormData(prev => ({ ...prev, actualQty: Number(e.target.value) }))}
              placeholder="Enter actual quantity..."
              required
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


import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Scan, Plus, Loader2 } from "lucide-react";
import { POItem, ReceiveEntry } from "../../pages/Receive";
import { createERPNextAPI } from "@/services/erpnextApi";

interface ReceiveFormProps {
  poItems: POItem[];
  onAddEntry: (entry: ReceiveEntry) => void;
  defaultWarehouse?: string;
}

interface ItemDetails {
  has_batch_no?: number;
  has_serial_no?: number;
}

const ReceiveForm = ({ poItems, onAddEntry, defaultWarehouse }: ReceiveFormProps) => {
  const [formData, setFormData] = useState({
    selectedItem: '',
    receivedQty: 0,
    warehouse: '',
    batch: '',
    serial: ''
  });
  const [isScanning, setIsScanning] = useState(false);
  const [inputMethod, setInputMethod] = useState<'traditional' | 'bundle'>('traditional');
  const [itemDetails, setItemDetails] = useState<ItemDetails | null>(null);
  const [loadingItemDetails, setLoadingItemDetails] = useState(false);
  const [bundleData, setBundleData] = useState({
    batches: '',
    serials: '',
    qty: 0
  });

  const selectedItemData = poItems.find(item => item.itemCode === formData.selectedItem);

  // Fetch item details when selected item changes
  useEffect(() => {
    if (formData.selectedItem) {
      fetchItemDetails(formData.selectedItem);
    }
  }, [formData.selectedItem]);

  const fetchItemDetails = async (itemCode: string) => {
    setLoadingItemDetails(true);
    try {
      const erpnextAPI = await createERPNextAPI();
      if (erpnextAPI) {
        const result = await erpnextAPI.getItemDetails(itemCode);
        setItemDetails(result.data);
        console.log('Item details:', result.data);
      }
    } catch (error) {
      console.error('Failed to fetch item details:', error);
      setItemDetails(null);
    } finally {
      setLoadingItemDetails(false);
    }
  };

  const handleItemScan = () => {
    setIsScanning(true);
    
    setTimeout(() => {
      const scannedItem = poItems[0]?.itemCode || '';
      setFormData(prev => ({ 
        ...prev, 
        selectedItem: scannedItem,
        warehouse: defaultWarehouse || poItems[0]?.warehouse || ''
      }));
      setIsScanning(false);
    }, 2000);
  };

  const handleBundleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedItemData || bundleData.qty <= 0) return;

    const hasBatch = itemDetails?.has_batch_no === 1;
    const hasSerial = itemDetails?.has_serial_no === 1;

    if (hasBatch && hasSerial) {
      // Handle both batch and serial
      const batches = bundleData.batches.split('\n').filter(b => b.trim());
      const serials = bundleData.serials.split('\n').filter(s => s.trim());
      
      // Create entries for each serial with its corresponding batch
      serials.forEach((serial, index) => {
        const batch = batches[Math.min(index, batches.length - 1)]; // Use last batch if fewer batches than serials
        onAddEntry({
          itemCode: selectedItemData.itemCode,
          itemName: selectedItemData.itemName,
          receivedQty: 1, // Each serial is qty 1
          warehouse: formData.warehouse || defaultWarehouse || selectedItemData.warehouse,
          batch: batch?.trim() || undefined,
          serial: serial.trim(),
          uom: selectedItemData.uom,
          rate: selectedItemData.rate
        });
      });
    } else if (hasBatch) {
      // Handle batch only - allow multiple batches
      const batches = bundleData.batches.split('\n').filter(b => b.trim());
      const qtyPerBatch = Math.floor(bundleData.qty / batches.length);
      const remainder = bundleData.qty % batches.length;
      
      batches.forEach((batch, index) => {
        const qty = qtyPerBatch + (index < remainder ? 1 : 0);
        onAddEntry({
          itemCode: selectedItemData.itemCode,
          itemName: selectedItemData.itemName,
          receivedQty: qty,
          warehouse: formData.warehouse || defaultWarehouse || selectedItemData.warehouse,
          batch: batch.trim(),
          uom: selectedItemData.uom,
          rate: selectedItemData.rate
        });
      });
    } else if (hasSerial) {
      // Handle serial only - allow multiple serials
      const serials = bundleData.serials.split('\n').filter(s => s.trim());
      serials.forEach((serial) => {
        onAddEntry({
          itemCode: selectedItemData.itemCode,
          itemName: selectedItemData.itemName,
          receivedQty: 1, // Each serial is qty 1
          warehouse: formData.warehouse || defaultWarehouse || selectedItemData.warehouse,
          serial: serial.trim(),
          uom: selectedItemData.uom,
          rate: selectedItemData.rate
        });
      });
    }

    // Reset bundle form
    setBundleData({ batches: '', serials: '', qty: 0 });
    setFormData({
      selectedItem: '',
      receivedQty: 0,
      warehouse: defaultWarehouse || '',
      batch: '',
      serial: ''
    });
    setItemDetails(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedItemData || formData.receivedQty <= 0) return;

    // Validate required fields based on item tracking
    const hasBatch = itemDetails?.has_batch_no === 1;
    const hasSerial = itemDetails?.has_serial_no === 1;

    if (hasBatch && !formData.batch.trim()) {
      alert('Batch number is required for this item');
      return;
    }

    if (hasSerial && !formData.serial.trim()) {
      alert('Serial number is required for this item');
      return;
    }

    onAddEntry({
      itemCode: selectedItemData.itemCode,
      itemName: selectedItemData.itemName,
      receivedQty: formData.receivedQty,
      warehouse: formData.warehouse || defaultWarehouse || selectedItemData.warehouse,
      batch: formData.batch || undefined,
      serial: formData.serial || undefined,
      uom: selectedItemData.uom,
      rate: selectedItemData.rate
    });

    // Reset form
    setFormData({
      selectedItem: '',
      receivedQty: 0,
      warehouse: defaultWarehouse || '',
      batch: '',
      serial: ''
    });
    setItemDetails(null);
  };

  const hasBatchTracking = itemDetails?.has_batch_no === 1;
  const hasSerialTracking = itemDetails?.has_serial_no === 1;

  return (
    <div className="space-y-6">
      {/* Scan Items Section - Moved above the PO Items Table */}
      <Card>
        <CardContent className="pt-6">
          <h3 className="text-lg font-semibold mb-4">Scan Items</h3>
          
          <Tabs defaultValue="manual" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="manual">Manual Entry</TabsTrigger>
              <TabsTrigger value="scan">Scan Item</TabsTrigger>
            </TabsList>

            <TabsContent value="manual" className="space-y-4 mt-4">
              <div>
                <Label htmlFor="itemSelect">Item Code / Name</Label>
                <Select 
                  value={formData.selectedItem} 
                  onValueChange={(value) => {
                    const item = poItems.find(i => i.itemCode === value);
                    setFormData(prev => ({ 
                      ...prev, 
                      selectedItem: value,
                      warehouse: defaultWarehouse || item?.warehouse || '',
                      batch: '',
                      serial: ''
                    }));
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select an item to receive..." />
                  </SelectTrigger>
                  <SelectContent>
                    {poItems.filter(item => item.pendingQty > 0).map((item) => (
                      <SelectItem key={item.itemCode} value={item.itemCode}>
                        {item.itemCode} - {item.itemName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>

            <TabsContent value="scan" className="space-y-4 mt-4">
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

          {/* Item Details */}
          {selectedItemData && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <Label>Item Name</Label>
                  <p className="font-medium">{selectedItemData.itemName}</p>
                </div>
                <div>
                  <Label>Pending Qty</Label>
                  <p className="font-medium text-orange-600">{selectedItemData.pendingQty} {selectedItemData.uom}</p>
                </div>
                <div>
                  <Label>Rate</Label>
                  <p className="font-medium">₹{selectedItemData.rate}</p>
                </div>
                <div>
                  <Label>Warehouse</Label>
                  <p className="font-medium">{defaultWarehouse || selectedItemData.warehouse}</p>
                </div>
              </div>
              
              {/* Show tracking information */}
              {loadingItemDetails && (
                <div className="flex items-center mt-2 text-sm text-gray-600">
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Loading item tracking details...
                </div>
              )}
              
              {itemDetails && (
                <div className="flex gap-2 mt-2">
                  {hasBatchTracking && (
                    <Badge variant="secondary">Batch Tracked</Badge>
                  )}
                  {hasSerialTracking && (
                    <Badge variant="secondary">Serial Tracked</Badge>
                  )}
                  {!hasBatchTracking && !hasSerialTracking && (
                    <Badge variant="outline">No Tracking Required</Badge>
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Serial/Batch Input Method */}
      {selectedItemData && itemDetails && (hasBatchTracking || hasSerialTracking) && (
        <Card>
          <CardContent className="pt-6">
            <h3 className="text-lg font-semibold mb-4">Serial/Batch Input Method</h3>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <Button
                type="button"
                variant={inputMethod === 'traditional' ? 'default' : 'outline'}
                onClick={() => setInputMethod('traditional')}
                className="h-12"
              >
                Traditional Entry
              </Button>
              <Button
                type="button"
                variant={inputMethod === 'bundle' ? 'default' : 'outline'}
                onClick={() => setInputMethod('bundle')}
                className="h-12"
              >
                Bundle Entry
              </Button>
            </div>

            {inputMethod === 'traditional' ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {hasBatchTracking && (
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
                  <div>
                    <Label htmlFor="receivedQty">Actual Quantity *</Label>
                    <Input
                      id="receivedQty"
                      type="number"
                      value={formData.receivedQty}
                      onChange={(e) => setFormData(prev => ({ ...prev, receivedQty: Number(e.target.value) }))}
                      placeholder="0"
                      max={selectedItemData.pendingQty}
                      min="1"
                      required
                    />
                  </div>
                </div>

                {hasSerialTracking && (
                  <div>
                    <Label htmlFor="serial">Serial Number *</Label>
                    <Input
                      id="serial"
                      value={formData.serial}
                      onChange={(e) => setFormData(prev => ({ ...prev, serial: e.target.value }))}
                      placeholder="Enter serial number..."
                      required={hasSerialTracking}
                    />
                  </div>
                )}

                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={
                    formData.receivedQty <= 0 || 
                    (hasBatchTracking && !formData.batch.trim()) ||
                    (hasSerialTracking && !formData.serial.trim())
                  }
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add to Count
                </Button>
              </form>
            ) : (
              <form onSubmit={handleBundleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="bundleQty">Total Quantity *</Label>
                  <Input
                    id="bundleQty"
                    type="number"
                    value={bundleData.qty}
                    onChange={(e) => setBundleData(prev => ({ ...prev, qty: Number(e.target.value) }))}
                    placeholder="0"
                    max={selectedItemData.pendingQty}
                    min="1"
                    required
                  />
                </div>

                {hasBatchTracking && (
                  <div>
                    <Label htmlFor="batches">Batch Numbers (one per line) *</Label>
                    <Textarea
                      id="batches"
                      value={bundleData.batches}
                      onChange={(e) => setBundleData(prev => ({ ...prev, batches: e.target.value }))}
                      placeholder="BATCH001&#10;BATCH002&#10;BATCH003"
                      rows={4}
                      required
                    />
                  </div>
                )}

                {hasSerialTracking && (
                  <div>
                    <Label htmlFor="serials">Serial Numbers (one per line) *</Label>
                    <Textarea
                      id="serials"
                      value={bundleData.serials}
                      onChange={(e) => setBundleData(prev => ({ ...prev, serials: e.target.value }))}
                      placeholder="SN001&#10;SN002&#10;SN003"
                      rows={4}
                      required
                    />
                  </div>
                )}

                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={
                    bundleData.qty <= 0 || 
                    (hasBatchTracking && !bundleData.batches.trim()) ||
                    (hasSerialTracking && !bundleData.serials.trim())
                  }
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Bundle to Count
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      )}

      {/* Simple quantity entry for non-tracked items */}
      {selectedItemData && itemDetails && !hasBatchTracking && !hasSerialTracking && (
        <Card>
          <CardContent className="pt-6">
            <h3 className="text-lg font-semibold mb-4">Quantity Entry</h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="receivedQty">Actual Quantity *</Label>
                <Input
                  id="receivedQty"
                  type="number"
                  value={formData.receivedQty}
                  onChange={(e) => setFormData(prev => ({ ...prev, receivedQty: Number(e.target.value) }))}
                  placeholder="0"
                  max={selectedItemData.pendingQty}
                  min="1"
                  required
                />
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                disabled={formData.receivedQty <= 0}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add to Count
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* PO Items Table - Moved below scan section */}
      <Card>
        <CardContent className="pt-6">
          <h3 className="text-lg font-semibold mb-4">Purchase Order Items</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Item Code</th>
                  <th className="text-left p-2">Item Name</th>
                  <th className="text-right p-2">Ordered</th>
                  <th className="text-right p-2">Received</th>
                  <th className="text-right p-2">Pending</th>
                  <th className="text-left p-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {poItems.map((item, index) => (
                  <tr key={index} className="border-b hover:bg-gray-50">
                    <td className="p-2 font-medium">{item.itemCode}</td>
                    <td className="p-2">{item.itemName}</td>
                    <td className="p-2 text-right">{item.orderedQty} {item.uom}</td>
                    <td className="p-2 text-right">{item.receivedQty} {item.uom}</td>
                    <td className="p-2 text-right font-medium">{item.pendingQty} {item.uom}</td>
                    <td className="p-2">
                      <Badge variant={item.pendingQty === 0 ? "default" : "secondary"}>
                        {item.pendingQty === 0 ? "Completed" : "Pending"}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReceiveForm;

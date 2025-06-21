import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Plus, Loader2, Trash2 } from "lucide-react";
import { POItem, ReceiveEntry } from "../../pages/Receive";
import { createERPNextAPI } from "@/services/erpnextApi";
import { useToast } from "@/hooks/use-toast";
import ReceiveItemScanner from "./ReceiveItemScanner";

interface ReceiveFormProps {
  poItems: POItem[];
  onAddEntry: (entry: ReceiveEntry) => void;
  defaultWarehouse?: string;
}

interface ItemDetails {
  has_batch_no?: number;
  has_serial_no?: number;
}

interface BatchEntry {
  batch: string;
  qty: number;
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
  const [batchEntries, setBatchEntries] = useState<BatchEntry[]>([{ batch: '', qty: 0 }]);
  const [processingBundle, setProcessingBundle] = useState(false);
  const { toast } = useToast();

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
      toast({
        title: "Error",
        description: "Failed to fetch item details",
        variant: "destructive"
      });
    } finally {
      setLoadingItemDetails(false);
    }
  };

  const handleItemScanned = (itemCode: string) => {
    const item = poItems.find(i => i.itemCode === itemCode);
    if (item && item.pendingQty > 0) {
      setFormData(prev => ({ 
        ...prev, 
        selectedItem: itemCode,
        warehouse: defaultWarehouse || item.warehouse || '',
        batch: '',
        serial: ''
      }));
    } else {
      toast({
        title: "Item Not Found",
        description: `Item ${itemCode} is not in this Purchase Order or has no pending quantity`,
        variant: "destructive"
      });
    }
  };

  const addBatchEntry = () => {
    setBatchEntries(prev => [...prev, { batch: '', qty: 0 }]);
  };

  const removeBatchEntry = (index: number) => {
    setBatchEntries(prev => prev.filter((_, i) => i !== index));
  };

  const updateBatchEntry = (index: number, field: 'batch' | 'qty', value: string | number) => {
    setBatchEntries(prev => prev.map((entry, i) => 
      i === index ? { ...entry, [field]: value } : entry
    ));
  };

  const handleBundleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedItemData || batchEntries.length === 0) {
      toast({
        title: "Error",
        description: "Please select an item and add batch entries",
        variant: "destructive"
      });
      return;
    }

    const hasBatch = itemDetails?.has_batch_no === 1;
    const hasSerial = itemDetails?.has_serial_no === 1;

    // Validate batch entries
    const validBatchEntries = batchEntries.filter(entry => entry.batch.trim() && entry.qty > 0);
    if (validBatchEntries.length === 0) {
      toast({
        title: "Error",
        description: "Please enter at least one valid batch with quantity greater than 0",
        variant: "destructive"
      });
      return;
    }

    // Check total quantity doesn't exceed pending quantity
    const totalQty = validBatchEntries.reduce((sum, entry) => sum + entry.qty, 0);
    if (totalQty > selectedItemData.pendingQty) {
      toast({
        title: "Error",
        description: `Total quantity (${totalQty}) exceeds pending quantity (${selectedItemData.pendingQty})`,
        variant: "destructive"
      });
      return;
    }

    setProcessingBundle(true);
    let successCount = 0;
    let errorCount = 0;

    try {
      const erpnextAPI = await createERPNextAPI();
      
      // Process each batch entry individually
      for (const [index, batchEntry] of validBatchEntries.entries()) {
        try {
          // Check if batch exists, create if not
          if (hasBatch && erpnextAPI) {
            const batchExists = await erpnextAPI.purchase.ensureBatchExists(batchEntry.batch, selectedItemData.itemCode);
            if (!batchExists) {
              toast({
                title: "Warning",
                description: `Failed to create/verify batch: ${batchEntry.batch}`,
                variant: "destructive"
              });
              errorCount++;
              continue;
            }
          }

          // Create entry for this batch
          await onAddEntry({
            itemCode: selectedItemData.itemCode,
            itemName: selectedItemData.itemName,
            receivedQty: batchEntry.qty,
            warehouse: formData.warehouse || defaultWarehouse || selectedItemData.warehouse,
            batch: hasBatch ? batchEntry.batch : undefined,
            serial: hasSerial ? formData.serial : undefined,
            uom: selectedItemData.uom,
            rate: selectedItemData.rate
          });

          successCount++;
          console.log(`Successfully processed batch entry ${index + 1}: ${batchEntry.batch} - ${batchEntry.qty}`);
        } catch (entryError) {
          console.error(`Error processing batch entry ${index + 1}:`, entryError);
          errorCount++;
          toast({
            title: "Error",
            description: `Failed to process batch ${batchEntry.batch}: ${entryError instanceof Error ? entryError.message : 'Unknown error'}`,
            variant: "destructive"
          });
        }
      }

      // Show summary toast
      if (successCount > 0) {
        toast({
          title: "Bundle Processing Complete",
          description: `Successfully processed ${successCount} batch entries${errorCount > 0 ? `, ${errorCount} failed` : ''}`,
          variant: successCount === validBatchEntries.length ? "default" : "destructive"
        });

        // Reset form only if some entries were successful
        setBatchEntries([{ batch: '', qty: 0 }]);
        setFormData({
          selectedItem: '',
          receivedQty: 0,
          warehouse: defaultWarehouse || '',
          batch: '',
          serial: ''
        });
        setItemDetails(null);
      } else {
        toast({
          title: "Bundle Processing Failed",
          description: "No batch entries were successfully processed",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error processing batch entries:', error);
      toast({
        title: "Error",
        description: `Bundle processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive"
      });
    } finally {
      setProcessingBundle(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedItemData || formData.receivedQty <= 0) {
      toast({
        title: "Error",
        description: "Please select an item and enter a valid quantity",
        variant: "destructive"
      });
      return;
    }

    // Validate required fields based on item tracking
    const hasBatch = itemDetails?.has_batch_no === 1;
    const hasSerial = itemDetails?.has_serial_no === 1;

    if (hasBatch && !formData.batch.trim()) {
      toast({
        title: "Error",
        description: "Batch number is required for this item",
        variant: "destructive"
      });
      return;
    }

    if (hasSerial && !formData.serial.trim()) {
      toast({
        title: "Error",
        description: "Serial number is required for this item",
        variant: "destructive"
      });
      return;
    }

    if (formData.receivedQty > selectedItemData.pendingQty) {
      toast({
        title: "Error",
        description: `Received quantity (${formData.receivedQty}) cannot exceed pending quantity (${selectedItemData.pendingQty})`,
        variant: "destructive"
      });
      return;
    }

    try {
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

      toast({
        title: "Success",
        description: "Item added to receipt successfully",
      });
    } catch (error) {
      console.error('Error adding item:', error);
      toast({
        title: "Error",
        description: `Failed to add item: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive"
      });
    }
  };

  const hasBatchTracking = itemDetails?.has_batch_no === 1;
  const hasSerialTracking = itemDetails?.has_serial_no === 1;
  const totalBundleQty = batchEntries.reduce((sum, entry) => sum + entry.qty, 0);

  return (
    <div className="space-y-6">
      {/* Scan Items Section */}
      <Card>
        <CardContent className="pt-6">
          <h3 className="text-lg font-semibold mb-4">Scan Items</h3>
          
          <ReceiveItemScanner
            poItems={poItems}
            onItemScanned={handleItemScanned}
            isLoading={loadingItemDetails}
          />

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
                      step="0.01"
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
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Batch Entries</Label>
                    <div className="text-sm text-gray-600">
                      Total: {totalBundleQty} / {selectedItemData.pendingQty} {selectedItemData.uom}
                    </div>
                  </div>
                  
                  <div className="border rounded-lg">
                    <div className="grid grid-cols-12 gap-2 p-3 bg-gray-50 border-b font-medium text-sm">
                      <div className="col-span-6">Batch Number</div>
                      <div className="col-span-4">Quantity</div>
                      <div className="col-span-2">Action</div>
                    </div>
                    <div className="space-y-2 p-3">
                      {batchEntries.map((entry, index) => (
                        <div key={index} className="grid grid-cols-12 gap-2 items-center">
                          <div className="col-span-6">
                            <Input
                              placeholder="Enter batch number"
                              value={entry.batch}
                              onChange={(e) => updateBatchEntry(index, 'batch', e.target.value)}
                              className="h-9"
                            />
                          </div>
                          <div className="col-span-4">
                            <Input
                              type="number"
                              placeholder="Qty"
                              value={entry.qty || ''}
                              onChange={(e) => updateBatchEntry(index, 'qty', Number(e.target.value) || 0)}
                              min="0"
                              step="0.01"
                              className="h-9"
                            />
                          </div>
                          <div className="col-span-2">
                            {batchEntries.length > 1 && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => removeBatchEntry(index)}
                                className="h-9 w-full"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={addBatchEntry}
                    className="w-full"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Batch Row
                  </Button>
                </div>

                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={
                    processingBundle || 
                    batchEntries.filter(e => e.batch.trim() && e.qty > 0).length === 0 ||
                    totalBundleQty > selectedItemData.pendingQty
                  }
                >
                  {processingBundle ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing Bundle...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Bundle to Count ({batchEntries.filter(e => e.batch.trim() && e.qty > 0).length} batches)
                    </>
                  )}
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
                  step="0.01"
                  required
                />
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                disabled={formData.receivedQty <= 0 || formData.receivedQty > selectedItemData.pendingQty}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add to Count
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* PO Items Table */}
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

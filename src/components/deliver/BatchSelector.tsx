import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus } from 'lucide-react';
import { createERPNextAPI } from '@/services/erpnextApi';
import { useToast } from '@/hooks/use-toast';

interface BatchInfo {
  batch_no: string;
  qty: number;
  available_qty?: number;
  expiry_date?: string;
}

interface BatchSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  itemCode: string;
  warehouse: string;
  requiredQty: number;
  onBatchesSelected: (batches: BatchInfo[]) => void;
}

const BatchSelector = ({ 
  isOpen, 
  onClose, 
  itemCode, 
  warehouse, 
  requiredQty,
  onBatchesSelected 
}: BatchSelectorProps) => {
  const [availableBatches, setAvailableBatches] = useState<BatchInfo[]>([]);
  const [selectedBatches, setSelectedBatches] = useState<BatchInfo[]>([]);
  const [qtyToFetch, setQtyToFetch] = useState(requiredQty);
  const [fetchMethod, setFetchMethod] = useState<'FIFO' | 'LIFO' | 'FEFO'>('FIFO');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && itemCode && warehouse) {
      fetchAvailableBatches();
    }
  }, [isOpen, itemCode, warehouse]);

  const fetchAvailableBatches = async () => {
    setLoading(true);
    try {
      const erpnextAPI = await createERPNextAPI();
      if (!erpnextAPI) return;

      console.log('Fetching batches for item:', itemCode, 'warehouse:', warehouse);

      // Use ERPNext's batch-wise stock balance API
      try {
        // Call the batch-wise stock balance method
        const response = await fetch(`${erpnextAPI.baseURL}/api/method/erpnext.stock.utils.get_stock_balance`, {
          method: 'POST',
          headers: {
            'Authorization': `token ${erpnextAPI.apiKey}:${erpnextAPI.apiSecret}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            item_code: itemCode,
            warehouse: warehouse,
            batch_wise: 1
          })
        });

        if (response.ok) {
          const result = await response.json();
          console.log('Batch-wise stock balance result:', result);
          
          if (result.message && Array.isArray(result.message)) {
            const batchesWithStock = result.message
              .filter((batch: any) => batch.batch_no && batch.actual_qty > 0)
              .map((batch: any) => ({
                batch_no: batch.batch_no,
                qty: 0,
                available_qty: batch.actual_qty,
                expiry_date: batch.expiry_date
              }));

            console.log('Available batches with stock:', batchesWithStock);
            setAvailableBatches(batchesWithStock);
            
            if (batchesWithStock.length === 0) {
              toast({
                title: "No Stock Available",
                description: "No batches found with available stock in the selected warehouse",
                variant: "destructive"
              });
            }
          } else {
            console.log('No batch stock data returned');
            setAvailableBatches([]);
          }
        } else {
          throw new Error(`API call failed: ${response.status}`);
        }
      } catch (apiError) {
        console.warn('Batch-wise API failed, trying alternative method:', apiError);
        
        // Fallback: Get all batches for the item and check each one individually
        const batchResult = await erpnextAPI.stock.getBatches(itemCode);
        console.log('Fallback batch result:', batchResult);
        
        if (batchResult.data && batchResult.data.length > 0) {
          // For each batch, get its stock balance in the specific warehouse
          const batchStockPromises = batchResult.data.map(async (batch: any) => {
            const batchNo = batch.batch_id || batch.name;
            
            try {
              // Get stock balance for this specific batch-warehouse combination
              const stockResponse = await fetch(`${erpnextAPI.baseURL}/api/method/erpnext.stock.utils.get_stock_balance`, {
                method: 'POST',
                headers: {
                  'Authorization': `token ${erpnextAPI.apiKey}:${erpnextAPI.apiSecret}`,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  item_code: itemCode,
                  warehouse: warehouse,
                  batch_no: batchNo
                })
              });

              if (stockResponse.ok) {
                const stockResult = await stockResponse.json();
                const availableQty = stockResult.message || 0;
                
                console.log(`Batch ${batchNo}: available qty = ${availableQty}`);

                return {
                  batch_no: batchNo,
                  qty: 0,
                  available_qty: Math.max(0, availableQty),
                  expiry_date: batch.expiry_date
                };
              }
            } catch (error) {
              console.warn(`Error fetching stock for batch ${batchNo}:`, error);
            }
            
            return {
              batch_no: batchNo,
              qty: 0,
              available_qty: 0,
              expiry_date: batch.expiry_date
            };
          });

          const batchesWithStock = await Promise.all(batchStockPromises);
          
          // Filter to only show batches with available stock
          const availableBatchesWithStock = batchesWithStock.filter(
            (batch: BatchInfo) => batch.available_qty && batch.available_qty > 0
          );

          console.log('Available batches with stock (fallback):', availableBatchesWithStock);
          setAvailableBatches(availableBatchesWithStock);
          
          if (availableBatchesWithStock.length === 0) {
            toast({
              title: "No Stock Available",
              description: "No batches found with available stock in the selected warehouse",
              variant: "destructive"
            });
          }
        }
      }
    } catch (error) {
      console.error('Error fetching batches:', error);
      toast({
        title: "Error",
        description: "Failed to fetch available batches",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const autoFetchBatches = () => {
    let remainingQty = qtyToFetch;
    const selected: BatchInfo[] = [];
    
    // Sort batches based on fetch method
    let sortedBatches = [...availableBatches];
    if (fetchMethod === 'FIFO') {
      // First In First Out - no sorting needed (assume chronological order)
    } else if (fetchMethod === 'LIFO') {
      // Last In First Out - reverse order
      sortedBatches.reverse();
    } else if (fetchMethod === 'FEFO') {
      // First Expiry First Out - sort by expiry date
      sortedBatches.sort((a, b) => {
        if (!a.expiry_date) return 1;
        if (!b.expiry_date) return -1;
        return new Date(a.expiry_date).getTime() - new Date(b.expiry_date).getTime();
      });
    }

    for (const batch of sortedBatches) {
      if (remainingQty <= 0) break;
      
      const qtyToTake = Math.min(remainingQty, batch.available_qty || 0);
      if (qtyToTake > 0) {
        selected.push({
          ...batch,
          qty: qtyToTake
        });
        remainingQty -= qtyToTake;
      }
    }

    setSelectedBatches(selected);
  };

  const updateBatchQty = (batchNo: string, qty: number) => {
    setSelectedBatches(prev => 
      prev.map(batch => 
        batch.batch_no === batchNo 
          ? { ...batch, qty: Math.min(qty, batch.available_qty || 0) }
          : batch
      )
    );
  };

  const toggleBatch = (batch: BatchInfo, checked: boolean) => {
    if (checked) {
      setSelectedBatches(prev => [...prev, { ...batch, qty: Math.min(1, batch.available_qty || 0) }]);
    } else {
      setSelectedBatches(prev => prev.filter(b => b.batch_no !== batch.batch_no));
    }
  };

  const addNewRow = () => {
    const emptyBatch: BatchInfo = {
      batch_no: '',
      qty: 0,
      available_qty: 0
    };
    setSelectedBatches(prev => [...prev, emptyBatch]);
  };

  const getTotalSelectedQty = () => {
    return selectedBatches.reduce((sum, batch) => sum + batch.qty, 0);
  };

  const handleConfirm = () => {
    const validBatches = selectedBatches.filter(batch => batch.batch_no && batch.qty > 0);
    if (validBatches.length === 0) {
      toast({
        title: "No Batches Selected",
        description: "Please select at least one batch with quantity",
        variant: "destructive"
      });
      return;
    }

    onBatchesSelected(validBatches);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Select Batch No</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Auto Fetch Section */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium mb-3">Auto Fetch</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Qty to Fetch</Label>
                <Input
                  type="number"
                  value={qtyToFetch}
                  onChange={(e) => setQtyToFetch(Number(e.target.value))}
                  min="1"
                />
              </div>
              <div>
                <Label>Fetch Based On</Label>
                <Select value={fetchMethod} onValueChange={(value: 'FIFO' | 'LIFO' | 'FEFO') => setFetchMethod(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FIFO">FIFO</SelectItem>
                    <SelectItem value="LIFO">LIFO</SelectItem>
                    <SelectItem value="FEFO">FEFO</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button onClick={autoFetchBatches} className="mt-3" disabled={loading}>
              Auto Fetch Batches
            </Button>
          </div>

          {/* Warehouse Info */}
          <div className="bg-blue-50 p-3 rounded">
            <Label className="text-sm text-gray-600">Warehouse</Label>
            <div className="font-medium">{warehouse}</div>
          </div>

          {/* Available Batches Table */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium">Available Batches</h4>
              <Badge variant="secondary">
                Selected Qty: {getTotalSelectedQty()} / {requiredQty}
              </Badge>
            </div>
            
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left p-3 border-b text-sm">Select</th>
                    <th className="text-left p-3 border-b text-sm">Batch No</th>
                    <th className="text-left p-3 border-b text-sm">Available Qty</th>
                    <th className="text-left p-3 border-b text-sm">Selected Qty</th>
                    <th className="text-left p-3 border-b text-sm">Expiry Date</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="p-4 text-center text-gray-500">
                        Loading batches...
                      </td>
                    </tr>
                  ) : availableBatches.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-4 text-center text-gray-500">
                        No batches with available stock found
                      </td>
                    </tr>
                  ) : (
                    availableBatches.map((batch) => {
                      const selectedBatch = selectedBatches.find(s => s.batch_no === batch.batch_no);
                      const isSelected = !!selectedBatch;
                      
                      return (
                        <tr key={batch.batch_no} className="border-b hover:bg-gray-50">
                          <td className="p-3">
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={(checked) => toggleBatch(batch, !!checked)}
                            />
                          </td>
                          <td className="p-3 font-medium">{batch.batch_no}</td>
                          <td className="p-3">{batch.available_qty}</td>
                          <td className="p-3">
                            {isSelected ? (
                              <Input
                                type="number"
                                value={selectedBatch.qty}
                                onChange={(e) => updateBatchQty(batch.batch_no, Number(e.target.value))}
                                min="1"
                                max={batch.available_qty}
                                className="w-20"
                              />
                            ) : (
                              '-'
                            )}
                          </td>
                          <td className="p-3 text-sm text-gray-600">
                            {batch.expiry_date ? new Date(batch.expiry_date).toLocaleDateString() : '-'}
                          </td>
                        </tr>
                      );
                    })
                  )}
                  
                  {/* Selected batches that are not in available list */}
                  {selectedBatches
                    .filter(selected => !availableBatches.find(avail => avail.batch_no === selected.batch_no))
                    .map((batch, index) => (
                      <tr key={`selected-${index}`} className="border-b bg-yellow-50">
                        <td className="p-3">
                          <Checkbox checked={true} />
                        </td>
                        <td className="p-3">
                          <Input
                            value={batch.batch_no}
                            onChange={(e) => {
                              const newBatches = [...selectedBatches];
                              const batchIndex = selectedBatches.findIndex(b => b === batch);
                              newBatches[batchIndex] = { ...batch, batch_no: e.target.value };
                              setSelectedBatches(newBatches);
                            }}
                            placeholder="Enter batch number"
                          />
                        </td>
                        <td className="p-3">-</td>
                        <td className="p-3">
                          <Input
                            type="number"
                            value={batch.qty}
                            onChange={(e) => updateBatchQty(batch.batch_no, Number(e.target.value))}
                            min="1"
                            className="w-20"
                          />
                        </td>
                        <td className="p-3">-</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={addNewRow}
              className="mt-2"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Row
            </Button>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between pt-4">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <div className="space-x-2">
              <Button variant="outline">
                Edit Full Form
              </Button>
              <Button onClick={handleConfirm}>
                Add Batch Nos
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BatchSelector;

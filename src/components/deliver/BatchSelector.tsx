import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search } from 'lucide-react';
import { createERPNextAPI } from '@/services/erpnextApi';
import { useToast } from '@/hooks/use-toast';

interface BatchInfo {
  batch_no: string;
  qty: number;
  available_qty?: number;
  expiry_date?: string;
  serial_and_batch_bundle?: string;
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
  const [fetchMethod, setFetchMethod] = useState<'FIFO' | 'LIFO' | 'FEFO'>('FEFO');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && itemCode && warehouse) {
      fetchAvailableBatches();
    }
  }, [isOpen, itemCode, warehouse]);

  useEffect(() => {
    setQtyToFetch(requiredQty);
  }, [requiredQty]);

  const fetchAvailableBatches = async () => {
    setLoading(true);
    try {
      const erpnextAPI = await createERPNextAPI();
      if (!erpnextAPI) return;

      console.log('Fetching batches for item:', itemCode, 'warehouse:', warehouse);

      // Method 1: Use ERPNext v15+ method for getting available batches
      try {
        const response = await fetch(`${erpnextAPI.stock.baseURL}/api/method/erpnext.stock.doctype.batch.batch.get_batch_qty`, {
          method: 'POST',
          headers: {
            'Authorization': `token ${erpnextAPI.stock.apiKey}:${erpnextAPI.stock.apiSecret}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify({
            batch_no: '',
            warehouse: warehouse,
            item_code: itemCode
          })
        });

        if (response.ok) {
          const result = await response.json();
          console.log('Batch qty method result:', result);
          
          if (result.message && typeof result.message === 'object') {
            // If we get batch data from this method
            const batchData = Object.entries(result.message).map(([batchNo, qty]) => ({
              batch_no: batchNo,
              qty: 0,
              available_qty: Number(qty) || 0,
              expiry_date: null
            })).filter(batch => batch.available_qty > 0);

            if (batchData.length > 0) {
              // Get expiry dates for the batches
              const batchDetailsResponse = await fetch(`${erpnextAPI.stock.baseURL}/api/resource/Batch?${new URLSearchParams({
                filters: JSON.stringify([
                  ['name', 'in', batchData.map(b => b.batch_no)],
                  ['item', '=', itemCode]
                ]),
                fields: JSON.stringify(['name', 'expiry_date'])
              })}`, {
                method: 'GET',
                headers: {
                  'Authorization': `token ${erpnextAPI.stock.apiKey}:${erpnextAPI.stock.apiSecret}`,
                  'Content-Type': 'application/json',
                  'Accept': 'application/json',
                }
              });

              if (batchDetailsResponse.ok) {
                const batchDetailsResult = await batchDetailsResponse.json();
                const batchDetails = batchDetailsResult.data || [];
                
                // Merge expiry dates
                const finalBatches = batchData.map(batch => {
                  const details = batchDetails.find((d: any) => d.name === batch.batch_no);
                  return {
                    ...batch,
                    expiry_date: details?.expiry_date
                  };
                });

                console.log('Final available batches with expiry:', finalBatches);
                setAvailableBatches(finalBatches);
                return;
              }
            }
          }
        }
      } catch (error) {
        console.log('ERPNext batch qty method failed:', error);
      }

      // Method 2: Use Stock Balance report method (v15+ compatible)
      try {
        const response = await fetch(`${erpnextAPI.stock.baseURL}/api/method/erpnext.stock.utils.get_stock_balance`, {
          method: 'POST',
          headers: {
            'Authorization': `token ${erpnextAPI.stock.apiKey}:${erpnextAPI.stock.apiSecret}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify({
            item_code: itemCode,
            warehouse: warehouse,
            with_valuation_rate: 0,
            with_serial_no: 0
          })
        });

        if (response.ok) {
          const result = await response.json();
          console.log('Stock balance method result:', result);
          
          if (result.message && Array.isArray(result.message)) {
            const batchData = result.message
              .filter((item: any) => item.actual_qty > 0 && item.batch_no)
              .map((item: any) => ({
                batch_no: item.batch_no,
                qty: 0,
                available_qty: item.actual_qty,
                expiry_date: item.expiry_date
              }));

            console.log('Stock balance batches:', batchData);
            setAvailableBatches(batchData);
            
            if (batchData.length === 0) {
              toast({
                title: "No Batches Available",
                description: `No batches found with available stock in warehouse: ${warehouse}`,
                variant: "destructive"
              });
            }
            return;
          }
        }
      } catch (error) {
        console.log('Stock balance method failed:', error);
      }

      // Method 3: Fallback to querying Batch doctype and checking stock via Bin
      try {
        console.log('Using fallback method: Batch + Bin');
        const batchResponse = await fetch(`${erpnextAPI.stock.baseURL}/api/resource/Batch?${new URLSearchParams({
          filters: JSON.stringify([
            ['item', '=', itemCode],
            ['disabled', '=', 0]
          ]),
          fields: JSON.stringify(['name', 'batch_id', 'expiry_date'])
        })}`, {
          method: 'GET',
          headers: {
            'Authorization': `token ${erpnextAPI.stock.apiKey}:${erpnextAPI.stock.apiSecret}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          }
        });

        if (batchResponse.ok) {
          const batchResult = await batchResponse.json();
          console.log('Batch result:', batchResult);
          
          if (batchResult.data && Array.isArray(batchResult.data)) {
            const batchNames = batchResult.data.map((batch: any) => batch.batch_id || batch.name);
            
            if (batchNames.length > 0) {
              // Get stock for these batches in the specific warehouse
              const binResponse = await fetch(`${erpnextAPI.stock.baseURL}/api/resource/Bin?${new URLSearchParams({
                filters: JSON.stringify([
                  ['item_code', '=', itemCode],
                  ['warehouse', '=', warehouse],
                  ['batch_no', 'in', batchNames],
                  ['actual_qty', '>', 0]
                ]),
                fields: JSON.stringify(['batch_no', 'actual_qty'])
              })}`, {
                method: 'GET',
                headers: {
                  'Authorization': `token ${erpnextAPI.stock.apiKey}:${erpnextAPI.stock.apiSecret}`,
                  'Content-Type': 'application/json',
                  'Accept': 'application/json',
                }
              });

              if (binResponse.ok) {
                const binResult = await binResponse.json();
                console.log('Bin result for batches:', binResult);
                
                if (binResult.data && Array.isArray(binResult.data)) {
                  const batchesWithStock = binResult.data.map((bin: any) => {
                    const batchDetails = batchResult.data.find((batch: any) => 
                      (batch.batch_id || batch.name) === bin.batch_no
                    );
                    
                    return {
                      batch_no: bin.batch_no,
                      qty: 0,
                      available_qty: bin.actual_qty,
                      expiry_date: batchDetails?.expiry_date
                    };
                  });

                  console.log('Final batches with stock:', batchesWithStock);
                  setAvailableBatches(batchesWithStock);
                  
                  if (batchesWithStock.length === 0) {
                    toast({
                      title: "No Batches Available",
                      description: `No batches found with available stock in warehouse: ${warehouse}`,
                      variant: "destructive"
                    });
                  }
                  return;
                }
              }
            }
          }
        }
      } catch (error) {
        console.error('Fallback method failed:', error);
      }

      // If all methods fail
      setAvailableBatches([]);
      toast({
        title: "No Batches Available",
        description: `No batches found with available stock in warehouse: ${warehouse}`,
        variant: "destructive"
      });

    } catch (error) {
      console.error('Error fetching batches:', error);
      toast({
        title: "Error",
        description: "Failed to fetch available batches",
        variant: "destructive"
      });
      setAvailableBatches([]);
    } finally {
      setLoading(false);
    }
  };

  const autoFetchBatches = async () => {
    setLoading(true);
    try {
      let sortedBatches = [...availableBatches];
      
      switch (fetchMethod) {
        case 'FEFO':
          sortedBatches.sort((a, b) => {
            if (!a.expiry_date && !b.expiry_date) return 0;
            if (!a.expiry_date) return 1;
            if (!b.expiry_date) return -1;
            return new Date(a.expiry_date).getTime() - new Date(b.expiry_date).getTime();
          });
          break;
        case 'FIFO':
          break;
        case 'LIFO':
          sortedBatches.reverse();
          break;
      }

      let remainingQty = qtyToFetch;
      const selected: BatchInfo[] = [];

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
      
      if (selected.length > 0) {
        toast({
          title: "Batches Auto-Selected",
          description: `Selected ${selected.length} batches using ${fetchMethod} method (total: ${selected.reduce((sum, b) => sum + b.qty, 0)})`,
        });
      } else {
        toast({
          title: "No Batches Available",
          description: "No batches with sufficient stock found",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error auto-fetching batches:', error);
      toast({
        title: "Error",
        description: "Failed to auto-fetch batches",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
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

  const filteredBatches = availableBatches.filter(batch =>
    batch.batch_no.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Select Batch No</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Auto Fetch Section */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium mb-3">Auto Fetch Batches</h4>
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
                    <SelectItem value="FEFO">FEFO (First Expiry, First Out) - Default</SelectItem>
                    <SelectItem value="FIFO">FIFO (First In, First Out)</SelectItem>
                    <SelectItem value="LIFO">LIFO (Last In, First Out)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button onClick={autoFetchBatches} className="mt-3" disabled={loading || availableBatches.length === 0}>
              Auto Fetch Batches
            </Button>
          </div>

          {/* Warehouse Info */}
          <div className="bg-blue-50 p-3 rounded">
            <Label className="text-sm text-gray-600">Warehouse</Label>
            <div className="font-medium">{warehouse}</div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search batch numbers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Available Batches Table */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium">Available Batches (ERPNext v15+ Compatible)</h4>
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
                        Loading available batches...
                      </td>
                    </tr>
                  ) : filteredBatches.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-4 text-center text-gray-500">
                        {searchTerm ? 'No matching batches found' : `No batches with available stock found in warehouse: ${warehouse}`}
                      </td>
                    </tr>
                  ) : (
                    filteredBatches.map((batch) => {
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
                  
                  {/* Selected batches that are not in available list (manual entries) */}
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
            <Button onClick={handleConfirm}>
              Add Batch Nos
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BatchSelector;

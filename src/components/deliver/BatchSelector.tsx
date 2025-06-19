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

      // Method 1: Use Stock Ledger Entry to get actual batch-wise stock balances
      try {
        const stockLedgerResponse = await fetch(`${erpnextAPI.stock.baseURL}/api/resource/Stock Ledger Entry?${new URLSearchParams({
          filters: JSON.stringify([
            ['item_code', '=', itemCode],
            ['warehouse', '=', warehouse],
            ['batch_no', '!=', '']
          ]),
          fields: JSON.stringify(['batch_no', 'actual_qty']),
          order_by: 'posting_date desc'
        })}`, {
          method: 'GET',
          headers: {
            'Authorization': `token ${erpnextAPI.stock.apiKey}:${erpnextAPI.stock.apiSecret}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          }
        });

        if (stockLedgerResponse.ok) {
          const stockLedgerResult = await stockLedgerResponse.json();
          console.log('Stock Ledger entries:', stockLedgerResult);

          if (stockLedgerResult.data && Array.isArray(stockLedgerResult.data)) {
            // Group by batch_no and sum actual_qty to get current stock per batch
            const batchStockMap = new Map<string, number>();
            
            stockLedgerResult.data.forEach((entry: any) => {
              if (entry.batch_no) {
                const currentStock = batchStockMap.get(entry.batch_no) || 0;
                batchStockMap.set(entry.batch_no, currentStock + (entry.actual_qty || 0));
              }
            });

            console.log('Batch stock map:', Object.fromEntries(batchStockMap));

            // Get batch details (expiry dates, etc.)
            const batchNosWithStock = Array.from(batchStockMap.keys()).filter(batchNo => 
              (batchStockMap.get(batchNo) || 0) > 0
            );

            if (batchNosWithStock.length > 0) {
              const batchDetailsResponse = await fetch(`${erpnextAPI.stock.baseURL}/api/resource/Batch?${new URLSearchParams({
                filters: JSON.stringify([
                  ['name', 'in', batchNosWithStock],
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
                console.log('Batch details:', batchDetailsResult);

                const batches = batchDetailsResult.data?.map((batch: any) => ({
                  batch_no: batch.name,
                  qty: 0,
                  available_qty: batchStockMap.get(batch.name) || 0,
                  expiry_date: batch.expiry_date
                })).filter((batch: any) => batch.available_qty > 0) || [];

                console.log('Final available batches:', batches);
                setAvailableBatches(batches);

                if (batches.length === 0) {
                  toast({
                    title: "No Batches Available",
                    description: `No batches found with available stock in warehouse: ${warehouse}`,
                    variant: "destructive"
                  });
                }
                return;
              }
            } else {
              console.log('No batches with positive stock found');
              setAvailableBatches([]);
              toast({
                title: "No Batches Available",
                description: `No batches found with available stock in warehouse: ${warehouse}`,
                variant: "destructive"
              });
              return;
            }
          }
        }
      } catch (error) {
        console.log('Stock Ledger approach failed:', error);
      }

      // Method 2: Fallback - Use Bin doctype for batch stock
      try {
        console.log('Using Bin doctype for batch stock');
        const binResponse = await fetch(`${erpnextAPI.stock.baseURL}/api/resource/Bin?${new URLSearchParams({
          filters: JSON.stringify([
            ['item_code', '=', itemCode],
            ['warehouse', '=', warehouse],
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
            const batchesFromBin = binResult.data
              .filter((bin: any) => bin.batch_no && bin.actual_qty > 0)
              .map((bin: any) => ({
                batch_no: bin.batch_no,
                qty: 0,
                available_qty: bin.actual_qty,
                expiry_date: null
              }));

            console.log('Batches from Bin:', batchesFromBin);
            setAvailableBatches(batchesFromBin);

            if (batchesFromBin.length === 0) {
              toast({
                title: "No Batches Available",
                description: `No batches found with available stock in warehouse: ${warehouse}`,
                variant: "destructive"
              });
            }
          }
        }
      } catch (error) {
        console.error('Bin approach also failed:', error);
        setAvailableBatches([]);
        toast({
          title: "Error",
          description: "Failed to fetch available batches",
          variant: "destructive"
        });
      }
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
              <h4 className="font-medium">Available Batches (Stock Ledger Based)</h4>
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

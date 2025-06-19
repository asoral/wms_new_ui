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

  const fetchAvailableBatches = async () => {
    setLoading(true);
    try {
      const erpnextAPI = await createERPNextAPI();
      if (!erpnextAPI) return;

      console.log('Fetching batches using ERPNext methodology for item:', itemCode, 'warehouse:', warehouse);

      // Step 1: Get all batch numbers for this item that have stock ledger entries in this warehouse
      const stockLedgerFilters = [
        ['item_code', '=', itemCode],
        ['warehouse', '=', warehouse],
        ['batch_no', '!=', '']  // Only entries with batch numbers
      ];

      const stockLedgerResponse = await fetch(`${erpnextAPI.stock.baseURL}/api/resource/Stock Ledger Entry?${new URLSearchParams({
        filters: JSON.stringify(stockLedgerFilters),
        fields: JSON.stringify(['batch_no', 'actual_qty', 'posting_date']),
        order_by: 'posting_date asc'  // FIFO order by default
      })}`, {
        headers: {
          'Authorization': `token ${erpnextAPI.stock.apiKey}:${erpnextAPI.stock.apiSecret}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });

      console.log('Stock Ledger API response status:', stockLedgerResponse.status);

      if (stockLedgerResponse.ok) {
        const stockLedgerResult = await stockLedgerResponse.json();
        console.log('Stock Ledger result:', stockLedgerResult);

        if (stockLedgerResult.data && stockLedgerResult.data.length > 0) {
          // Step 2: Group by batch_no and calculate current stock for each batch
          // This mimics ERPNext's logic: SUM(actual_qty) GROUP BY batch_no
          const batchStockMap = new Map<string, number>();
          
          stockLedgerResult.data.forEach((entry: any) => {
            if (entry.batch_no) {
              const currentStock = batchStockMap.get(entry.batch_no) || 0;
              batchStockMap.set(entry.batch_no, currentStock + (entry.actual_qty || 0));
            }
          });

          console.log('Batch stock map from Stock Ledger:', Array.from(batchStockMap.entries()));

          // Step 3: Filter batches with positive stock (available for delivery)
          const batchesWithStock = Array.from(batchStockMap.entries())
            .filter(([batchNo, stock]) => stock > 0)
            .map(([batchNo, stock]) => ({ batchNo, stock }));

          console.log('Batches with positive stock:', batchesWithStock);

          if (batchesWithStock.length > 0) {
            // Step 4: Get detailed batch information including expiry dates
            // This follows ERPNext's pattern of fetching batch details after identifying available batches
            const batchPromises = batchesWithStock.map(async ({ batchNo, stock }) => {
              try {
                // Get batch details including expiry date from Batch doctype
                const batchResponse = await fetch(`${erpnextAPI.stock.baseURL}/api/resource/Batch/${batchNo}`, {
                  headers: {
                    'Authorization': `token ${erpnextAPI.stock.apiKey}:${erpnextAPI.stock.apiSecret}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                  },
                });
                
                let expiryDate = null;
                if (batchResponse.ok) {
                  const batchData = await batchResponse.json();
                  expiryDate = batchData.data?.expiry_date;
                  console.log(`Batch ${batchNo} details:`, { expiry_date: expiryDate, available_qty: stock });
                }

                return {
                  batch_no: batchNo,
                  qty: 0, // Will be set when selected
                  available_qty: stock,
                  expiry_date: expiryDate
                };
              } catch (error) {
                console.warn('Error fetching batch details for', batchNo, ':', error);
                return {
                  batch_no: batchNo,
                  qty: 0,
                  available_qty: stock
                };
              }
            });

            const batchDetails = await Promise.all(batchPromises);
            
            // Step 5: Sort batches according to ERPNext's FEFO logic by default
            // Sort by expiry_date ASC (earliest first), then by creation (batch_no)
            const sortedBatches = batchDetails.sort((a, b) => {
              if (a.expiry_date && b.expiry_date) {
                const dateA = new Date(a.expiry_date).getTime();
                const dateB = new Date(b.expiry_date).getTime();
                if (dateA !== dateB) return dateA - dateB;
              }
              // If dates are same or missing, sort by batch number
              return a.batch_no.localeCompare(b.batch_no);
            });
            
            console.log('Available batches (FEFO sorted):', sortedBatches);
            setAvailableBatches(sortedBatches);
            
            if (sortedBatches.length === 0) {
              toast({
                title: "No Stock Available",
                description: "No batches found with available stock in the selected warehouse",
                variant: "destructive"
              });
            }
          } else {
            console.log('No batches found with positive stock');
            setAvailableBatches([]);
            toast({
              title: "No Batches Found",
              description: "No batches with positive stock found for this item in the selected warehouse",
              variant: "destructive"
            });
          }
        } else {
          console.log('No stock ledger entries found with batch numbers');
          setAvailableBatches([]);
          toast({
            title: "No Stock Available",
            description: "No stock ledger entries found for this item in the selected warehouse",
            variant: "destructive"
          });
        }
      } else {
        console.error('Stock Ledger API failed:', stockLedgerResponse.statusText);
        throw new Error(`Failed to fetch stock ledger entries: ${stockLedgerResponse.statusText}`);
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
    
    // Sort batches based on fetch method (following ERPNext's logic)
    let sortedBatches = [...availableBatches];
    
    if (fetchMethod === 'LIFO') {
      // Last In First Out - reverse the FIFO order
      sortedBatches.reverse();
    } else if (fetchMethod === 'FEFO') {
      // First Expiry First Out - sort by expiry date (already sorted this way)
      sortedBatches.sort((a, b) => {
        if (!a.expiry_date) return 1;
        if (!b.expiry_date) return -1;
        return new Date(a.expiry_date).getTime() - new Date(b.expiry_date).getTime();
      });
    }
    // FIFO is default order (no additional sorting needed)

    // Auto-allocate stock following ERPNext's allocation logic
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

  // Filter batches based on search term
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
            <h4 className="font-medium mb-3">Auto Fetch (ERPNext Style)</h4>
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
                        Loading batches from Stock Ledger...
                      </td>
                    </tr>
                  ) : filteredBatches.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-4 text-center text-gray-500">
                        {searchTerm ? 'No matching batches found' : 'No batches with available stock found in Stock Ledger'}
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

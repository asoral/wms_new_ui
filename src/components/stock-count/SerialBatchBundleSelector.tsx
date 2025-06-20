
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Package, AlertCircle } from 'lucide-react';
import { getAvailableSerialBatch, createSerialBatchBundle, SerialBatchBundleEntry, checkBatchExists } from '@/services/serialBatchBundleApi';
import { getUserDefaultCompany } from '@/services/erpnextApi';
import { toast } from 'sonner';

interface SerialBatchBundleSelectorProps {
  itemCode: string;
  itemName: string;
  itemGroup: string;
  hasSerial: boolean;
  hasBatch: boolean;
  warehouse: string;
  transactionType: 'Inward' | 'Outward';
  onBundleCreated: (bundleName: string, totalQty: number) => void;
  initialQuantity?: number;
}

interface BundleEntry {
  serial_no?: string;
  batch_no?: string;
  qty: number;
}

const SerialBatchBundleSelector = ({
  itemCode,
  itemName,
  itemGroup,
  hasSerial,
  hasBatch,
  warehouse,
  transactionType,
  onBundleCreated,
  initialQuantity = 1
}: SerialBatchBundleSelectorProps) => {
  const [entries, setEntries] = useState<BundleEntry[]>([]);
  const [availableSerials, setAvailableSerials] = useState<string[]>([]);
  const [availableBatches, setAvailableBatches] = useState<Array<{batch_no: string, qty: number}>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newBatches, setNewBatches] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (itemCode && warehouse && (hasSerial || hasBatch)) {
      loadAvailableSerialBatch();
    }
  }, [itemCode, warehouse, hasSerial, hasBatch]);

  useEffect(() => {
    // Initialize with default entry
    const defaultEntry: BundleEntry = { qty: initialQuantity };
    if (hasSerial) defaultEntry.serial_no = '';
    if (hasBatch) defaultEntry.batch_no = '';
    setEntries([defaultEntry]);
  }, [hasSerial, hasBatch, initialQuantity]);

  const loadAvailableSerialBatch = async () => {
    setIsLoading(true);
    try {
      const result = await getAvailableSerialBatch(itemCode, warehouse, hasSerial, hasBatch);
      if (result.serial_nos) {
        setAvailableSerials(result.serial_nos);
      }
      if (result.batch_nos) {
        setAvailableBatches(result.batch_nos);
      }
    } catch (error) {
      console.error('Failed to load available serial/batch:', error);
      toast.error('Failed to load available serial/batch numbers');
    } finally {
      setIsLoading(false);
    }
  };

  const checkAndMarkNewBatches = async (batchNo: string) => {
    if (!batchNo) return;
    
    const exists = await checkBatchExists(batchNo, itemCode);
    if (!exists) {
      setNewBatches(prev => new Set([...prev, batchNo]));
    } else {
      setNewBatches(prev => {
        const newSet = new Set(prev);
        newSet.delete(batchNo);
        return newSet;
      });
    }
  };

  const addEntry = () => {
    const newEntry: BundleEntry = { qty: 1 };
    if (hasSerial) newEntry.serial_no = '';
    if (hasBatch) newEntry.batch_no = '';
    setEntries([...entries, newEntry]);
  };

  const removeEntry = (index: number) => {
    const removedEntry = entries[index];
    if (removedEntry.batch_no) {
      setNewBatches(prev => {
        const newSet = new Set(prev);
        newSet.delete(removedEntry.batch_no!);
        return newSet;
      });
    }
    setEntries(entries.filter((_, i) => i !== index));
  };

  const updateEntry = (index: number, field: keyof BundleEntry, value: string | number) => {
    const updatedEntries = [...entries];
    const oldBatch = updatedEntries[index].batch_no;
    updatedEntries[index] = { ...updatedEntries[index], [field]: value };
    setEntries(updatedEntries);

    // Check if batch is new when batch_no is updated
    if (field === 'batch_no' && typeof value === 'string') {
      if (oldBatch) {
        setNewBatches(prev => {
          const newSet = new Set(prev);
          newSet.delete(oldBatch);
          return newSet;
        });
      }
      checkAndMarkNewBatches(value);
    }
  };

  const createBundle = async () => {
    // Validate entries
    const validEntries = entries.filter(entry => {
      if (hasSerial && !entry.serial_no) return false;
      if (hasBatch && !entry.batch_no) return false;
      if (entry.qty === undefined || entry.qty <= 0) return false;
      return true;
    });

    if (validEntries.length === 0) {
      toast.error('Please add at least one valid entry');
      return;
    }

    const totalQty = validEntries.reduce((sum, entry) => sum + (entry.qty || 0), 0);

    setIsCreating(true);
    try {
      const company = await getUserDefaultCompany();
      
      // Convert entries to ERPNext format
      const bundleEntries: SerialBatchBundleEntry[] = validEntries.map(entry => ({
        qty: entry.qty,
        warehouse: warehouse,
        delivered_qty: 0,
        incoming_rate: 0,
        outgoing_rate: 0,
        stock_value_difference: 0,
        is_outward: transactionType === 'Outward' ? 1 : 0,
        ...(entry.batch_no && { batch_no: entry.batch_no }),
        ...(entry.serial_no && { serial_no: entry.serial_no })
      }));

      const bundleData = {
        company: company || '',
        item_code: itemCode,
        item_name: itemName,
        item_group: itemGroup,
        has_serial_no: hasSerial ? 1 : 0,
        has_batch_no: hasBatch ? 1 : 0,
        warehouse: warehouse,
        type_of_transaction: transactionType,
        total_qty: totalQty,
        avg_rate: 0,
        total_amount: 0,
        posting_date: new Date().toISOString().split('T')[0],
        posting_time: new Date().toTimeString().split(' ')[0].slice(0, 8),
        voucher_type: 'Stock Reconciliation', // Add the missing voucher_type field
        entries: bundleEntries
      };

      const result = await createSerialBatchBundle(bundleData);
      if (result?.data?.name) {
        toast.success('Serial and Batch Bundle created successfully');
        onBundleCreated(result.data.name, totalQty);
        // Clear new batches set after successful creation
        setNewBatches(new Set());
      }
    } catch (error) {
      console.error('Failed to create bundle:', error);
      toast.error('Failed to create Serial and Batch Bundle');
    } finally {
      setIsCreating(false);
    }
  };

  const getTotalQuantity = () => {
    return entries.reduce((sum, entry) => sum + (entry.qty || 0), 0);
  };

  if (!hasSerial && !hasBatch) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Package className="w-5 h-5" />
          <span>Serial and Batch Bundle</span>
          <Badge variant="outline">
            Total Qty: {getTotalQuantity()}
          </Badge>
          {newBatches.size > 0 && (
            <Badge variant="secondary" className="flex items-center space-x-1">
              <AlertCircle className="w-3 h-3" />
              <span>{newBatches.size} New Batch{newBatches.size > 1 ? 'es' : ''}</span>
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {entries.map((entry, index) => (
          <div key={index} className="flex items-end space-x-2 p-3 border rounded-lg">
            {hasSerial && (
              <div className="flex-1">
                <Label>Serial Number</Label>
                <Input
                  value={entry.serial_no || ''}
                  onChange={(e) => updateEntry(index, 'serial_no', e.target.value)}
                  placeholder="Enter serial number"
                  list={`serials-${index}`}
                />
                {availableSerials.length > 0 && (
                  <datalist id={`serials-${index}`}>
                    {availableSerials.map((serial) => (
                      <option key={serial} value={serial} />
                    ))}
                  </datalist>
                )}
              </div>
            )}
            
            {hasBatch && (
              <div className="flex-1">
                <Label className="flex items-center space-x-1">
                  <span>Batch Number</span>
                  {entry.batch_no && newBatches.has(entry.batch_no) && (
                    <Badge variant="outline" className="text-xs">New</Badge>
                  )}
                </Label>
                <Input
                  value={entry.batch_no || ''}
                  onChange={(e) => updateEntry(index, 'batch_no', e.target.value)}
                  placeholder="Enter batch number"
                  list={`batches-${index}`}
                />
                {availableBatches.length > 0 && (
                  <datalist id={`batches-${index}`}>
                    {availableBatches.map((batch) => (
                      <option key={batch.batch_no} value={batch.batch_no} />
                    ))}
                  </datalist>
                )}
              </div>
            )}
            
            <div className="w-24">
              <Label>Quantity</Label>
              <Input
                type="number"
                value={entry.qty || ''}
                onChange={(e) => updateEntry(index, 'qty', Number(e.target.value))}
                placeholder="Qty"
                min="1"
                step="1"
              />
            </div>
            
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => removeEntry(index)}
              disabled={entries.length === 1}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        ))}

        <div className="flex justify-between">
          <Button type="button" variant="outline" onClick={addEntry}>
            <Plus className="w-4 h-4 mr-2" />
            Add Entry
          </Button>
          
          <Button 
            type="button" 
            onClick={createBundle}
            disabled={isCreating || getTotalQuantity() === 0}
          >
            {isCreating ? 'Creating...' : 'Create Bundle'}
          </Button>
        </div>

        {newBatches.size > 0 && (
          <div className="text-sm text-muted-foreground p-3 bg-yellow-50 rounded-lg border border-yellow-200">
            <div className="flex items-center space-x-2 mb-2">
              <AlertCircle className="w-4 h-4 text-yellow-600" />
              <span className="font-medium text-yellow-800">New Batches</span>
            </div>
            <p className="text-yellow-700">
              The following batch numbers will be created automatically: {Array.from(newBatches).join(', ')}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SerialBatchBundleSelector;


import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Package } from 'lucide-react';
import { getAvailableSerialBatch, createSerialBatchBundle, SerialBatchBundleItem } from '@/services/serialBatchBundleApi';
import { toast } from 'sonner';

interface SerialBatchBundleSelectorProps {
  itemCode: string;
  warehouse: string;
  hasSerial: boolean;
  hasBatch: boolean;
  transactionType: 'Inward' | 'Outward';
  onBundleCreated: (bundleName: string, totalQty: number) => void;
  initialQuantity?: number;
}

const SerialBatchBundleSelector = ({
  itemCode,
  warehouse,
  hasSerial,
  hasBatch,
  transactionType,
  onBundleCreated,
  initialQuantity = 1
}: SerialBatchBundleSelectorProps) => {
  const [entries, setEntries] = useState<SerialBatchBundleItem[]>([]);
  const [availableSerials, setAvailableSerials] = useState<string[]>([]);
  const [availableBatches, setAvailableBatches] = useState<Array<{batch_no: string, qty: number}>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (itemCode && warehouse && (hasSerial || hasBatch)) {
      loadAvailableSerialBatch();
    }
  }, [itemCode, warehouse, hasSerial, hasBatch]);

  useEffect(() => {
    // Initialize with default entry
    if (hasSerial && !hasBatch) {
      setEntries([{ serial_no: '', qty: 1 }]);
    } else if (hasBatch && !hasSerial) {
      setEntries([{ batch_no: '', qty: initialQuantity }]);
    } else if (hasSerial && hasBatch) {
      setEntries([{ serial_no: '', batch_no: '', qty: 1 }]);
    }
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

  const addEntry = () => {
    const newEntry: SerialBatchBundleItem = {};
    if (hasSerial) newEntry.serial_no = '';
    if (hasBatch) newEntry.batch_no = '';
    if (hasSerial && !hasBatch) newEntry.qty = 1;
    if (hasBatch) newEntry.qty = 1;
    
    setEntries([...entries, newEntry]);
  };

  const removeEntry = (index: number) => {
    setEntries(entries.filter((_, i) => i !== index));
  };

  const updateEntry = (index: number, field: keyof SerialBatchBundleItem, value: string | number) => {
    const updatedEntries = [...entries];
    updatedEntries[index] = { ...updatedEntries[index], [field]: value };
    setEntries(updatedEntries);
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
      const bundleData = {
        item_code: itemCode,
        warehouse: warehouse,
        type_of_transaction: transactionType,
        total_qty: totalQty,
        entries: validEntries,
        posting_date: new Date().toISOString().split('T')[0],
        posting_time: new Date().toTimeString().split(' ')[0].slice(0, 8),
      };

      const result = await createSerialBatchBundle(bundleData);
      if (result?.data?.name) {
        toast.success('Serial and Batch Bundle created successfully');
        onBundleCreated(result.data.name, totalQty);
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
                <Label>Batch Number</Label>
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
      </CardContent>
    </Card>
  );
};

export default SerialBatchBundleSelector;

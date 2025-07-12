
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useIsMobile } from "@/hooks/use-mobile";
import { Edit, Trash2, Check, X } from "lucide-react";
import { ReceiveEntry } from "../../pages/Receive";

interface ReceiveTableProps {
  entries: ReceiveEntry[];
  onUpdateEntry?: (index: number, updatedEntry: ReceiveEntry) => void;
  onDeleteEntry?: (index: number) => void;
  mode?: 'edit' | 'view';
}

const ReceiveTable = ({ entries, onUpdateEntry, onDeleteEntry, mode = 'edit' }: ReceiveTableProps) => {
  const isMobile = useIsMobile();
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingEntry, setEditingEntry] = useState<ReceiveEntry | null>(null);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getTotalValue = () => {
    return entries.reduce((total, entry) => total + (entry.receivedQty * entry.rate), 0);
  };

  const handleEditEntry = (index: number) => {
    setEditingIndex(index);
    setEditingEntry({ ...entries[index] });
  };

  const handleSaveEdit = async () => {
    if (editingIndex !== null && editingEntry && onUpdateEntry) {
      onUpdateEntry(editingIndex, editingEntry);
      setEditingIndex(null);
      setEditingEntry(null);
    }
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setEditingEntry(null);
  };

  const handleDeleteEntry = (index: number) => {
    if (onDeleteEntry) {
      onDeleteEntry(index);
    }
  };

  // Use card view for all screens (mobile and desktop)
  return (
    <div className="space-y-4">
      {entries.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-gray-500">No items added yet. Scan or select items to add them to the receipt.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Card View for all devices */}
          <div className="space-y-3">
            {entries.map((entry, index) => (
              <Card key={index} className="border-l-4 border-l-green-500">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    {/* Header with Item Info and Total */}
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg text-gray-900">{entry.itemCode}</h3>
                        <p className="text-gray-600 text-sm">{entry.itemName}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg text-green-600">{formatCurrency(entry.receivedQty * entry.rate)}</p>
                        <p className="text-sm text-gray-600">{formatCurrency(entry.rate)}/unit</p>
                      </div>
                    </div>

                    {/* Details Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Received Qty:</span>
                        {editingIndex === index ? (
                          <Input
                            type="number"
                            value={editingEntry?.receivedQty || 0}
                            onChange={(e) => setEditingEntry(prev => prev ? {
                              ...prev,
                              receivedQty: parseFloat(e.target.value) || 0
                            } : null)}
                            className="mt-1 text-sm"
                            min="0"
                            step="0.01"
                          />
                        ) : (
                          <p className="font-medium">{entry.receivedQty} {entry.uom}</p>
                        )}
                      </div>
                      <div>
                        <span className="text-gray-600">Warehouse:</span>
                        <p className="font-medium">{entry.warehouse}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">UOM:</span>
                        <p className="font-medium">{entry.uom}</p>
                      </div>
                    </div>

                    {/* Batch/Serial Info */}
                    {(entry.batch || entry.serial) && (
                      <div className="flex flex-wrap gap-2">
                        {entry.batch && (
                          <div>
                            <span className="text-gray-600 text-sm">Batch:</span>
                            {editingIndex === index ? (
                              <Input
                                value={editingEntry?.batch || ''}
                                onChange={(e) => setEditingEntry(prev => prev ? {
                                  ...prev,
                                  batch: e.target.value
                                } : null)}
                                className="mt-1 text-sm"
                                placeholder="Enter batch number"
                              />
                            ) : (
                              <Badge variant="outline" className="ml-1">Batch: {entry.batch}</Badge>
                            )}
                          </div>
                        )}
                        {entry.serial && (
                          <div>
                            <span className="text-gray-600 text-sm">Serial:</span>
                            {editingIndex === index ? (
                              <Input
                                value={editingEntry?.serial || ''}
                                onChange={(e) => setEditingEntry(prev => prev ? {
                                  ...prev,
                                  serial: e.target.value
                                } : null)}
                                className="mt-1 text-sm"
                                placeholder="Enter serial number"
                              />
                            ) : (
                              <Badge variant="outline" className="ml-1">Serial: {entry.serial}</Badge>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Action Buttons */}
                    {mode !== 'view' && (
                      <div className="flex justify-end space-x-2 pt-2 border-t">
                        {editingIndex === index ? (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={handleSaveEdit}
                              className="h-8 px-3"
                            >
                              <Check className="w-4 h-4 mr-1" />
                              Save
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={handleCancelEdit}
                              className="h-8 px-3"
                            >
                              <X className="w-4 h-4 mr-1" />
                              Cancel
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditEntry(index)}
                              className="h-8 px-3"
                            >
                              <Edit className="w-4 h-4 mr-1" />
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDeleteEntry(index)}
                              className="h-8 px-3"
                            >
                              <Trash2 className="w-4 h-4 mr-1" />
                              Delete
                            </Button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Summary Card */}
          <Card className="bg-gray-50 border-2 border-dashed border-gray-300">
            <CardContent className="p-4">
              <div className="text-center space-y-2">
                <p className="text-sm text-gray-600">Total Items: {entries.length}</p>
                <p className="text-xl font-bold text-gray-900">Total Value: {formatCurrency(getTotalValue())}</p>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default ReceiveTable;

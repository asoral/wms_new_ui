import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, Package, Warehouse } from "lucide-react";
import { DeliveryEntry } from "@/types";
import { useIsMobile } from "@/hooks/use-mobile";

interface DeliveryTableProps {
  entries: DeliveryEntry[];
  onUpdate?: (index: number, entry: DeliveryEntry) => void;
  onRemove: (index: number) => void;
}

const DeliveryTable = ({ entries, onUpdate, onRemove }: DeliveryTableProps) => {
  const isMobile = useIsMobile();
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const totalValue = entries.reduce((sum, entry) => sum + (entry.deliveredQty * entry.rate), 0);

  if (isMobile) {
    // Mobile Card View
    return (
      <div className="space-y-4">
        {entries.map((entry, index) => (
          <Card key={index} className="border-l-4 border-l-blue-500">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Package className="w-4 h-4" />
                  <CardTitle className="text-base">{entry.itemCode}</CardTitle>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onRemove(index)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-sm text-gray-600">{entry.itemName}</p>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Warehouse className="w-4 h-4 text-gray-500" />
                  <Badge variant="outline">{entry.warehouse}</Badge>
                  {entry.batch && <Badge variant="secondary">Batch: {entry.batch}</Badge>}
                  {entry.batches && entry.batches.length > 0 && (
                    <Badge variant="secondary">
                      {entry.batches.length} Batch{entry.batches.length > 1 ? 'es' : ''}
                    </Badge>
                  )}
                  {entry.serial && <Badge variant="secondary">Serial: {entry.serial}</Badge>}
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-gray-500 text-xs">Quantity</div>
                    <div className="font-medium">{entry.deliveredQty} {entry.uom}</div>
                  </div>
                  <div>
                    <div className="text-gray-500 text-xs">Rate</div>
                    <div className="font-medium">{formatCurrency(entry.rate)}</div>
                  </div>
                </div>
                
                <div className="pt-2 border-t">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">Total</span>
                    <span className="font-semibold">{formatCurrency(entry.deliveredQty * entry.rate)}</span>
                  </div>
                </div>
                
                {/* Batch Details for Mobile */}
                {entry.batches && entry.batches.length > 0 && (
                  <div className="pt-2 border-t">
                    <div className="text-xs text-gray-500 mb-2">Batch Details:</div>
                    <div className="space-y-1">
                      {entry.batches.map((batch, batchIndex) => (
                        <div key={batchIndex} className="flex justify-between text-xs bg-gray-50 p-2 rounded">
                          <span>{batch.batch_no}</span>
                          <span>{batch.qty} {entry.uom}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
        
        {entries.length > 0 && (
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex justify-between items-center font-semibold">
                <span>Total Value:</span>
                <span className="text-lg">{formatCurrency(totalValue)}</span>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  // Desktop Table View
  return (
    <Card>
      <CardHeader>
        <CardTitle>Items for Delivery</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {entries.map((entry, index) => (
            <div key={index} className="border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center space-x-2">
                    <h3 className="font-semibold">{entry.itemCode}</h3>
                    <Badge variant="outline">{entry.warehouse}</Badge>
                    {entry.batch && <Badge variant="secondary">Batch: {entry.batch}</Badge>}
                    {entry.batches && entry.batches.length > 0 && (
                      <Badge variant="secondary">
                        {entry.batches.length} Batch{entry.batches.length > 1 ? 'es' : ''}
                      </Badge>
                    )}
                    {entry.serial && <Badge variant="secondary">Serial: {entry.serial}</Badge>}
                  </div>
                  <p className="text-gray-600 text-sm">{entry.itemName}</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Quantity:</span>
                      <p className="font-medium">{entry.deliveredQty} {entry.uom}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Rate:</span>
                      <p className="font-medium">{formatCurrency(entry.rate)}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Total:</span>
                      <p className="font-medium">{formatCurrency(entry.deliveredQty * entry.rate)}</p>
                    </div>
                    <div className="flex justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onRemove(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  
                  {/* Batch Details for Desktop */}
                  {entry.batches && entry.batches.length > 0 && (
                    <div className="mt-3 pt-3 border-t">
                      <div className="text-sm text-gray-600 mb-2">Batch Details:</div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                        {entry.batches.map((batch, batchIndex) => (
                          <div key={batchIndex} className="bg-gray-50 p-2 rounded text-xs">
                            <div className="font-medium">{batch.batch_no}</div>
                            <div className="text-gray-600">{batch.qty} {entry.uom}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          
          {entries.length > 0 && (
            <div className="border-t pt-4">
              <div className="flex justify-between items-center font-semibold">
                <span>Total Value:</span>
                <span>{formatCurrency(totalValue)}</span>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default DeliveryTable;
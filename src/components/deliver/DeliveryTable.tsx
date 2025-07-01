
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2 } from "lucide-react";
import { DeliveryEntry } from "@/types";

interface DeliveryTableProps {
  entries: DeliveryEntry[];
  onRemoveEntry: (index: number) => Promise<void>;
}

const DeliveryTable = ({ entries, onRemoveEntry }: DeliveryTableProps) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const totalValue = entries.reduce((sum, entry) => sum + (entry.deliveredQty * entry.rate), 0);

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
                        onClick={() => onRemoveEntry(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
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

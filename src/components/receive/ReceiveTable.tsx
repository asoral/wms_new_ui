
import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Scan, AlertTriangle } from "lucide-react";
import { ReceiveEntry } from "../../pages/Receive";

interface ReceiveTableProps {
  entries: ReceiveEntry[];
  onUpdateEntry: (index: number, entry: ReceiveEntry) => void;
  onScanSerial: (index: number) => void;
}

const ReceiveTable = ({ entries, onUpdateEntry, onScanSerial }: ReceiveTableProps) => {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const handleQuantityChange = (index: number, actualQty: number) => {
    const entry = entries[index];
    onUpdateEntry(index, { ...entry, actualQty });
  };

  const getTotalReceived = () => {
    return entries.reduce((sum, entry) => sum + entry.actualQty, 0);
  };

  const getTotalOrdered = () => {
    return entries.reduce((sum, entry) => sum + entry.qtyToReceive, 0);
  };

  const getDifferenceColor = (ordered: number, actual: number) => {
    if (actual === ordered) return "text-green-600";
    if (actual > ordered) return "text-blue-600";
    return "text-red-600";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Items to Receive</span>
          <div className="text-sm text-gray-600">
            Total: {getTotalReceived()}/{getTotalOrdered()}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead>Warehouse</TableHead>
                <TableHead className="text-right">Ordered</TableHead>
                <TableHead className="text-right">To Receive</TableHead>
                <TableHead className="text-right">Actual Qty</TableHead>
                <TableHead>Serial/Batch</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map((entry, index) => {
                const difference = entry.actualQty - entry.qtyToReceive;
                return (
                  <TableRow key={index}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{entry.itemCode}</div>
                        <div className="text-sm text-gray-600">{entry.itemName}</div>
                      </div>
                    </TableCell>
                    <TableCell>{entry.warehouse}</TableCell>
                    <TableCell className="text-right">{entry.qtyToReceive} {entry.uom}</TableCell>
                    <TableCell className="text-right">{entry.qtyToReceive} {entry.uom}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center space-x-2">
                        <Input
                          type="number"
                          value={entry.actualQty}
                          onChange={(e) => handleQuantityChange(index, parseInt(e.target.value) || 0)}
                          className="w-20 text-right"
                          min="0"
                        />
                        <span className="text-sm text-gray-600">{entry.uom}</span>
                      </div>
                      {difference !== 0 && (
                        <div className={`text-xs ${getDifferenceColor(entry.qtyToReceive, entry.actualQty)}`}>
                          {difference > 0 ? '+' : ''}{difference}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {entry.batch && (
                          <Badge variant="outline" className="text-xs">
                            Batch: {entry.batch}
                          </Badge>
                        )}
                        {entry.serial && (
                          <Badge variant="outline" className="text-xs">
                            Serial: {entry.serial}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onScanSerial(index)}
                      >
                        <Scan className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {/* Summary */}
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Total Ordered:</span>
              <div className="font-semibold">{getTotalOrdered()}</div>
            </div>
            <div>
              <span className="text-gray-600">Total Received:</span>
              <div className="font-semibold">{getTotalReceived()}</div>
            </div>
            <div>
              <span className="text-gray-600">Difference:</span>
              <div className={`font-semibold ${getDifferenceColor(getTotalOrdered(), getTotalReceived())}`}>
                {getTotalReceived() - getTotalOrdered()}
              </div>
            </div>
          </div>
        </div>

        {/* Warnings */}
        {entries.some(e => e.actualQty !== e.qtyToReceive) && (
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-start space-x-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
              <div className="text-sm text-amber-800">
                <p className="font-medium">Quantity Variance Detected</p>
                <p>Some items have different actual quantities than ordered. Please verify before submitting.</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ReceiveTable;

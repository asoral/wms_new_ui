
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { StockCountEntry } from "@/types";

interface StockCountTableProps {
  entries: StockCountEntry[];
  onUpdateEntry: (index: number, actualQty: number) => void;
}

const StockCountTable = ({ entries, onUpdateEntry }: StockCountTableProps) => {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");

  const handleEdit = (index: number, currentQty: number) => {
    setEditingIndex(index);
    setEditValue(currentQty.toString());
  };

  const handleSave = (index: number) => {
    onUpdateEntry(index, parseFloat(editValue) || 0);
    setEditingIndex(null);
    setEditValue("");
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      'matched': { variant: 'outline', color: 'text-green-600' },
      'variance': { variant: 'destructive', color: 'text-red-600' },
      'pending': { variant: 'secondary', color: 'text-gray-600' }
    };
    const config = statusMap[status as keyof typeof statusMap] || statusMap.pending;
    return <Badge variant={config.variant as any}>{status}</Badge>;
  };

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Item Code</TableHead>
            <TableHead>Item Name</TableHead>
            <TableHead>Warehouse</TableHead>
            <TableHead>Current Qty</TableHead>
            <TableHead>Actual Qty</TableHead>
            <TableHead>Difference</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.map((entry, index) => (
            <TableRow key={index}>
              <TableCell className="font-medium">{entry.itemCode}</TableCell>
              <TableCell>{entry.itemName}</TableCell>
              <TableCell>{entry.warehouse}</TableCell>
              <TableCell>{entry.currentQty} {entry.uom}</TableCell>
              <TableCell>
                {editingIndex === index ? (
                  <Input
                    type="number"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    className="w-20"
                  />
                ) : (
                  `${entry.actualQty} ${entry.uom}`
                )}
              </TableCell>
              <TableCell className={entry.difference !== 0 ? 'text-red-600 font-medium' : 'text-green-600'}>
                {entry.difference > 0 ? '+' : ''}{entry.difference} {entry.uom}
              </TableCell>
              <TableCell>{getStatusBadge(entry.status)}</TableCell>
              <TableCell>
                {editingIndex === index ? (
                  <div className="flex space-x-1">
                    <Button size="sm" onClick={() => handleSave(index)}>Save</Button>
                    <Button size="sm" variant="outline" onClick={() => setEditingIndex(null)}>Cancel</Button>
                  </div>
                ) : (
                  <Button size="sm" variant="outline" onClick={() => handleEdit(index, entry.actualQty)}>
                    Edit
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default StockCountTable;

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StockCountEntry } from "@/types";

interface StockCountTableProps {
  entries: StockCountEntry[];
  onUpdateEntry: (index: number, actualQty: number) => void;
  readOnly?: boolean;
}

const StockCountTable = ({ entries, onUpdateEntry, readOnly }: StockCountTableProps) => {
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [tempQty, setTempQty] = useState("");

  const handleEdit = (index: number, currentQty: number) => {
    setEditIndex(index);
    setTempQty(currentQty.toString());
  };

  const handleCancel = () => {
    setEditIndex(null);
    setTempQty("");
  };

  const handleSave = (index: number) => {
    const actualQty = parseFloat(tempQty);
    if (!isNaN(actualQty)) {
      onUpdateEntry(index, actualQty);
    }
    setEditIndex(null);
    setTempQty("");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Stock Count Entries</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-muted">
                <th className="p-2 border text-left">Item</th>
                <th className="p-2 border text-left">Warehouse</th>
                <th className="p-2 border text-left">Current Qty</th>
                <th className="p-2 border text-left">Actual Qty</th>
                <th className="p-2 border text-left">UOM</th>
                <th className="p-2 border text-left">Batch</th>
                <th className="p-2 border text-left">Serial</th>
                <th className="p-2 border text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry, index) => (
                <tr key={index} className="border-b">
                  <td className="p-2 border">{entry.itemName}</td>
                  <td className="p-2 border">{entry.warehouse}</td>
                  <td className="p-2 border">{entry.currentQty}</td>
                  <td className="p-2 border">
                    {editIndex === index ? (
                      <Input
                        type="number"
                        value={tempQty}
                        onChange={(e) => setTempQty(e.target.value)}
                        className="w-24"
                      />
                    ) : (
                      entry.actualQty
                    )}
                  </td>
                  <td className="p-2 border">{entry.uom}</td>
                  <td className="p-2 border">{entry.batch || '-'}</td>
                  <td className="p-2 border">{entry.serial || '-'}</td>
                  <td className="p-2 border">
                    {readOnly ? null : (
                      editIndex === index ? (
                        <div className="flex space-x-2">
                          <Button size="sm" onClick={() => handleSave(index)}>Save</Button>
                          <Button size="sm" variant="ghost" onClick={handleCancel}>Cancel</Button>
                        </div>
                      ) : (
                        <Button size="sm" onClick={() => handleEdit(index, entry.actualQty)}>Edit</Button>
                      )
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};

export default StockCountTable;

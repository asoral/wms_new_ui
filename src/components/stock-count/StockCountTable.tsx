
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { StockCountEntry } from "../../pages/StockCount";

interface StockCountTableProps {
  entries: StockCountEntry[];
}

const StockCountTable = ({ entries }: StockCountTableProps) => {
  const getStatusBadge = (status: StockCountEntry['status'], difference: number) => {
    switch (status) {
      case 'matched':
        return <Badge className="bg-green-100 text-green-800">Matched</Badge>;
      case 'variance':
        return (
          <Badge className={difference > 0 ? "bg-blue-100 text-blue-800" : "bg-red-100 text-red-800"}>
            {difference > 0 ? `+${difference}` : difference}
          </Badge>
        );
      default:
        return <Badge variant="secondary">New</Badge>;
    }
  };

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Item Code</TableHead>
            <TableHead>Item Name</TableHead>
            <TableHead>Batch/Serial</TableHead>
            <TableHead className="text-right">System Qty</TableHead>
            <TableHead className="text-right">Scanned Qty</TableHead>
            <TableHead>UOM</TableHead>
            <TableHead className="text-center">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.map((entry, index) => (
            <TableRow key={index}>
              <TableCell className="font-medium">{entry.itemCode}</TableCell>
              <TableCell>{entry.itemName}</TableCell>
              <TableCell>
                {entry.batch && (
                  <Badge variant="outline" className="mr-1">
                    Batch: {entry.batch}
                  </Badge>
                )}
                {entry.serial && (
                  <Badge variant="outline">
                    Serial: {entry.serial}
                  </Badge>
                )}
                {!entry.batch && !entry.serial && (
                  <span className="text-gray-400">-</span>
                )}
              </TableCell>
              <TableCell className="text-right font-medium">{entry.systemQty}</TableCell>
              <TableCell className="text-right font-medium">{entry.scannedQty}</TableCell>
              <TableCell>{entry.uom}</TableCell>
              <TableCell className="text-center">
                {getStatusBadge(entry.status, entry.difference)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {entries.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No items scanned yet. Start scanning items to populate the count.
        </div>
      )}
    </div>
  );
};

export default StockCountTable;

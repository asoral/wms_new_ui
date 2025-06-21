
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useIsMobile } from "@/hooks/use-mobile";
import { StockCountEntry } from "../../pages/StockCount";

interface StockCountTableProps {
  entries: StockCountEntry[];
}

const StockCountTable = ({ entries }: StockCountTableProps) => {
  const isMobile = useIsMobile();

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

  if (isMobile) {
    return (
      <div className="space-y-4">
        {entries.map((entry, index) => (
          <Card key={index} className="border-l-4 border-l-orange-500">
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-lg">{entry.itemCode}</h3>
                    <p className="text-gray-600 text-sm">{entry.itemName}</p>
                  </div>
                  <div className="text-right">
                    {getStatusBadge(entry.status, entry.difference)}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Current Qty:</span>
                    <p className="font-medium">{entry.currentQty} {entry.uom}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Actual Qty:</span>
                    <p className="font-medium">{entry.actualQty} {entry.uom}</p>
                  </div>
                </div>

                {(entry.batch || entry.serial) && (
                  <div className="flex flex-wrap gap-2">
                    {entry.batch && (
                      <Badge variant="outline">Batch: {entry.batch}</Badge>
                    )}
                    {entry.serial && (
                      <Badge variant="outline">Serial: {entry.serial}</Badge>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}

        {entries.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-gray-500">No items scanned yet. Start scanning items to populate the count.</p>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  // Desktop table view
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Item Code</TableHead>
            <TableHead>Item Name</TableHead>
            <TableHead>Batch/Serial</TableHead>
            <TableHead className="text-right">Current Qty</TableHead>
            <TableHead className="text-right">Actual Qty</TableHead>
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
              <TableCell className="text-right font-medium">{entry.currentQty}</TableCell>
              <TableCell className="text-right font-medium">{entry.actualQty}</TableCell>
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

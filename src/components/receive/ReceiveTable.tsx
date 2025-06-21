
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useIsMobile } from "@/hooks/use-mobile";
import { ReceiveEntry } from "../../pages/Receive";

interface ReceiveTableProps {
  entries: ReceiveEntry[];
}

const ReceiveTable = ({ entries }: ReceiveTableProps) => {
  const isMobile = useIsMobile();

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

  if (isMobile) {
    return (
      <div className="space-y-4">
        {entries.map((entry, index) => (
          <Card key={index} className="border-l-4 border-l-green-500">
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-lg">{entry.itemCode}</h3>
                    <p className="text-gray-600 text-sm">{entry.itemName}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg">{formatCurrency(entry.receivedQty * entry.rate)}</p>
                    <p className="text-sm text-gray-600">{formatCurrency(entry.rate)}/unit</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Received Qty:</span>
                    <p className="font-medium">{entry.receivedQty} {entry.uom}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Warehouse:</span>
                    <p className="font-medium">{entry.warehouse}</p>
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
              <p className="text-gray-500">No items added yet. Scan or select items to add them to the receipt.</p>
            </CardContent>
          </Card>
        )}

        {entries.length > 0 && (
          <Card className="bg-gray-50">
            <CardContent className="p-4">
              <div className="text-center space-y-2">
                <p className="text-sm text-gray-600">Total Items: {entries.length}</p>
                <p className="text-xl font-bold">Total Value: {formatCurrency(getTotalValue())}</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  // Desktop table view
  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Item Code</TableHead>
              <TableHead>Item Name</TableHead>
              <TableHead className="text-right">Received Qty</TableHead>
              <TableHead>UOM</TableHead>
              <TableHead>Warehouse</TableHead>
              <TableHead>Batch/Serial</TableHead>
              <TableHead className="text-right">Rate</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.map((entry, index) => (
              <TableRow key={index}>
                <TableCell className="font-medium">{entry.itemCode}</TableCell>
                <TableCell>{entry.itemName}</TableCell>
                <TableCell className="text-right font-semibold">{entry.receivedQty}</TableCell>
                <TableCell>{entry.uom}</TableCell>
                <TableCell>{entry.warehouse}</TableCell>
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
                <TableCell className="text-right">{formatCurrency(entry.rate)}</TableCell>
                <TableCell className="text-right font-semibold">
                  {formatCurrency(entry.receivedQty * entry.rate)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {entries.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No items added yet. Scan or select items to add them to the receipt.
        </div>
      )}

      {entries.length > 0 && (
        <div className="flex justify-end">
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="text-right">
              <p className="text-sm text-gray-600">Total Items: {entries.length}</p>
              <p className="text-lg font-bold">Total Value: {formatCurrency(getTotalValue())}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReceiveTable;

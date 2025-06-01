
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useIsMobile } from "@/hooks/use-mobile";
import { DeliveryEntry } from "../../pages/Deliver";

interface DeliveryTableProps {
  entries: DeliveryEntry[];
}

const DeliveryTable = ({ entries }: DeliveryTableProps) => {
  const isMobile = useIsMobile();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getTotalValue = () => {
    return entries.reduce((total, entry) => total + (entry.actualQty * entry.rate), 0);
  };

  const getVarianceBadge = (toDeliver: number, actual: number) => {
    const difference = actual - toDeliver;
    if (difference === 0) {
      return <Badge className="bg-green-100 text-green-800 border-green-300">Exact</Badge>;
    } else if (difference > 0) {
      return <Badge className="bg-blue-100 text-blue-800 border-blue-300">+{difference}</Badge>;
    } else {
      return <Badge className="bg-red-100 text-red-800 border-red-300">{difference}</Badge>;
    }
  };

  if (isMobile) {
    return (
      <div className="space-y-4">
        {entries.map((entry, index) => (
          <Card key={index} className="border-l-4 border-l-blue-500">
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg text-gray-900">{entry.itemCode}</h3>
                    <p className="text-gray-600 text-sm mt-1">{entry.itemName}</p>
                  </div>
                  <div className="text-right ml-3">
                    <p className="font-bold text-lg text-green-600">{formatCurrency(entry.actualQty * entry.rate)}</p>
                    <p className="text-sm text-gray-600">{formatCurrency(entry.rate)}/unit</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600 font-medium">Warehouse:</span>
                    <p className="font-semibold mt-1">{entry.warehouse}</p>
                  </div>
                  <div>
                    <span className="text-gray-600 font-medium">To Deliver:</span>
                    <p className="font-semibold mt-1">{entry.qtyToDeliver} {entry.uom}</p>
                  </div>
                  <div>
                    <span className="text-gray-600 font-medium">Actual Qty:</span>
                    <p className="font-semibold mt-1">{entry.actualQty} {entry.uom}</p>
                  </div>
                  <div>
                    <span className="text-gray-600 font-medium">Variance:</span>
                    <div className="mt-1">{getVarianceBadge(entry.qtyToDeliver, entry.actualQty)}</div>
                  </div>
                </div>

                {(entry.batch || entry.serial) && (
                  <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
                    {entry.batch && (
                      <Badge variant="outline" className="bg-gray-50">
                        Batch: {entry.batch}
                      </Badge>
                    )}
                    {entry.serial && (
                      <Badge variant="outline" className="bg-gray-50">
                        Serial: {entry.serial}
                      </Badge>
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
              <p className="text-gray-500">No items added yet. Scan or select items to add them to the delivery.</p>
            </CardContent>
          </Card>
        )}

        {entries.length > 0 && (
          <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
            <CardContent className="p-4">
              <div className="text-center space-y-2">
                <p className="text-sm text-gray-600">Total Items: {entries.length}</p>
                <p className="text-xl font-bold text-green-700">Total Value: {formatCurrency(getTotalValue())}</p>
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
      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="font-semibold">Item Code</TableHead>
              <TableHead className="font-semibold">Item Name</TableHead>
              <TableHead className="font-semibold">Warehouse</TableHead>
              <TableHead className="font-semibold">Batch/Serial</TableHead>
              <TableHead className="text-right font-semibold">To Deliver</TableHead>
              <TableHead className="text-right font-semibold">Actual Qty</TableHead>
              <TableHead className="text-center font-semibold">Variance</TableHead>
              <TableHead className="text-right font-semibold">Rate</TableHead>
              <TableHead className="text-right font-semibold">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.map((entry, index) => (
              <TableRow key={index} className="hover:bg-gray-50">
                <TableCell className="font-medium">{entry.itemCode}</TableCell>
                <TableCell className="max-w-48 truncate">{entry.itemName}</TableCell>
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
                <TableCell className="text-right font-medium">{entry.qtyToDeliver} {entry.uom}</TableCell>
                <TableCell className="text-right font-medium">{entry.actualQty} {entry.uom}</TableCell>
                <TableCell className="text-center">
                  {getVarianceBadge(entry.qtyToDeliver, entry.actualQty)}
                </TableCell>
                <TableCell className="text-right">{formatCurrency(entry.rate)}</TableCell>
                <TableCell className="text-right font-semibold">
                  {formatCurrency(entry.actualQty * entry.rate)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {entries.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No items added yet. Scan or select items to add them to the delivery.
        </div>
      )}

      {entries.length > 0 && (
        <div className="flex justify-end">
          <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-lg border border-green-200">
            <div className="text-right">
              <p className="text-sm text-gray-600">Total Items: {entries.length}</p>
              <p className="text-lg font-bold text-green-700">Total Value: {formatCurrency(getTotalValue())}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeliveryTable;

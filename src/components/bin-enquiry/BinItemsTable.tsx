
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { BinItem } from "../../pages/BinEnquiry";

interface BinItemsTableProps {
  items: BinItem[];
}

const BinItemsTable = ({ items }: BinItemsTableProps) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getAgeColor = (age: number) => {
    if (age <= 30) return "bg-green-100 text-green-800";
    if (age <= 60) return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  };

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Item Code</TableHead>
            <TableHead>Item Name</TableHead>
            <TableHead className="text-right">Quantity</TableHead>
            <TableHead>UOM</TableHead>
            <TableHead>Batch/Serial</TableHead>
            <TableHead className="text-right">Age (Days)</TableHead>
            <TableHead className="text-right">Valuation</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item, index) => (
            <TableRow key={index}>
              <TableCell className="font-medium">{item.itemCode}</TableCell>
              <TableCell>{item.itemName}</TableCell>
              <TableCell className="text-right font-semibold">{item.qty}</TableCell>
              <TableCell>{item.uom}</TableCell>
              <TableCell>
                {item.batch && (
                  <Badge variant="outline" className="mr-1">
                    Batch: {item.batch}
                  </Badge>
                )}
                {item.serial && (
                  <Badge variant="outline">
                    Serial: {item.serial}
                  </Badge>
                )}
                {!item.batch && !item.serial && (
                  <span className="text-gray-400">-</span>
                )}
              </TableCell>
              <TableCell className="text-right">
                <Badge className={getAgeColor(item.age)}>
                  {item.age} days
                </Badge>
              </TableCell>
              <TableCell className="text-right font-semibold">
                {formatCurrency(item.valuation)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default BinItemsTable;

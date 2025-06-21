
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { StockCount } from "../../pages/StockCount";

interface StockCountTableProps {
  stockCounts: StockCount[];
  onEdit: (count: StockCount) => void;
  onViewSummary: (count: StockCount) => void;
  isLoading: boolean;
}

const StockCountTable = ({ stockCounts, onEdit, onViewSummary, isLoading }: StockCountTableProps) => {
  const isMobile = useIsMobile();

  const getStatusBadge = (status: StockCount['status']) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
      case 'in_progress':
        return <Badge className="bg-blue-100 text-blue-800">In Progress</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-800">Cancelled</Badge>;
      default:
        return <Badge variant="secondary">Draft</Badge>;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-gray-500">Loading stock counts...</p>
        </CardContent>
      </Card>
    );
  }

  if (isMobile) {
    return (
      <div className="space-y-4">
        {stockCounts.map((count, index) => (
          <Card key={index} className="border-l-4 border-l-orange-500">
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-lg">{count.number}</h3>
                    <p className="text-gray-600 text-sm">{count.warehouse}</p>
                  </div>
                  <div className="text-right">
                    {getStatusBadge(count.status)}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Count Date:</span>
                    <p className="font-medium">{count.countDate}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Total Items:</span>
                    <p className="font-medium">{count.totalItems}</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => onEdit(count)}>
                    Edit
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => onViewSummary(count)}>
                    Summary
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {stockCounts.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-gray-500">No stock counts found. Create a new stock count to get started.</p>
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
            <TableHead>Count Number</TableHead>
            <TableHead>Warehouse</TableHead>
            <TableHead>Count Date</TableHead>
            <TableHead>Counted By</TableHead>
            <TableHead className="text-right">Total Items</TableHead>
            <TableHead className="text-center">Status</TableHead>
            <TableHead className="text-center">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {stockCounts.map((count, index) => (
            <TableRow key={index}>
              <TableCell className="font-medium">{count.number}</TableCell>
              <TableCell>{count.warehouse}</TableCell>
              <TableCell>{count.countDate}</TableCell>
              <TableCell>{count.countedBy}</TableCell>
              <TableCell className="text-right font-medium">{count.totalItems}</TableCell>
              <TableCell className="text-center">
                {getStatusBadge(count.status)}
              </TableCell>
              <TableCell className="text-center">
                <div className="flex gap-2 justify-center">
                  <Button variant="outline" size="sm" onClick={() => onEdit(count)}>
                    Edit
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => onViewSummary(count)}>
                    Summary
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {stockCounts.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No stock counts found. Create a new stock count to get started.
        </div>
      )}
    </div>
  );
};

export default StockCountTable;

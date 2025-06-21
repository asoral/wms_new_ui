
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { Edit, Eye, FileText } from "lucide-react";
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

  if (!stockCounts || stockCounts.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">No stock counts found</p>
          <p className="text-sm text-gray-400">Create your first stock count to get started</p>
        </CardContent>
      </Card>
    );
  }

  if (isMobile) {
    return (
      <div className="space-y-4">
        {stockCounts.map((count, index) => (
          <Card key={count.id || index} className="border-l-4 border-l-blue-500">
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-lg">{count.number}</h3>
                    <p className="text-gray-600 text-sm">{count.warehouse}</p>
                    <p className="text-gray-500 text-xs">
                      {count.countDate} • {count.countedBy}
                    </p>
                  </div>
                  <div className="text-right">
                    {getStatusBadge(count.status)}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Total Items:</span>
                    <p className="font-medium">{count.totalItems}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Progress:</span>
                    <p className="font-medium">{count.completionPercentage}%</p>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEdit(count)}
                    className="flex-1"
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onViewSummary(count)}
                    className="flex-1"
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    View
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Desktop table view
  return (
    <Card>
      <CardHeader>
        <CardTitle>Stock Counts</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Count Number</TableHead>
                <TableHead>Warehouse</TableHead>
                <TableHead>Count Date</TableHead>
                <TableHead>Counted By</TableHead>
                <TableHead className="text-center">Total Items</TableHead>
                <TableHead className="text-center">Progress</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stockCounts.map((count, index) => (
                <TableRow key={count.id || index}>
                  <TableCell className="font-medium">{count.number}</TableCell>
                  <TableCell>{count.warehouse}</TableCell>
                  <TableCell>{count.countDate}</TableCell>
                  <TableCell>{count.countedBy}</TableCell>
                  <TableCell className="text-center">{count.totalItems}</TableCell>
                  <TableCell className="text-center">{count.completionPercentage}%</TableCell>
                  <TableCell className="text-center">
                    {getStatusBadge(count.status)}
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex justify-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onEdit(count)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onViewSummary(count)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default StockCountTable;


import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle } from "lucide-react";

interface StockCountSession {
  id: string;
  name: string;
  warehouse: string;
  status: "draft" | "in_progress" | "completed" | "cancelled";
  countDate: string;
  countedBy: string;
  items: Array<{
    itemCode: string;
    itemName: string;
    warehouse: string;
    currentQty: number;
    countedQty: number;
    difference: number;
    uom: string;
  }>;
}

interface StockCountSummaryProps {
  session: StockCountSession;
}

const StockCountSummary = ({ session }: StockCountSummaryProps) => {
  const getTotalVariance = () => {
    return session.items.reduce((sum, item) => sum + Math.abs(item.difference), 0);
  };

  const getPositiveVariance = () => {
    return session.items.filter(item => item.difference > 0).length;
  };

  const getNegativeVariance = () => {
    return session.items.filter(item => item.difference < 0).length;
  };

  const getAccurateCount = () => {
    return session.items.filter(item => item.difference === 0).length;
  };

  const getVarianceIcon = (difference: number) => {
    if (difference > 0) return <TrendingUp className="w-4 h-4 text-green-600" />;
    if (difference < 0) return <TrendingDown className="w-4 h-4 text-red-600" />;
    return <CheckCircle className="w-4 h-4 text-green-600" />;
  };

  const getVarianceColor = (difference: number) => {
    if (difference > 0) return "text-green-600 bg-green-50";
    if (difference < 0) return "text-red-600 bg-red-50";
    return "text-green-600 bg-green-50";
  };

  return (
    <div className="space-y-6">
      {/* Summary Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Stock Count Summary</span>
            <Badge variant={session.status === "completed" ? "default" : "secondary"}>
              {session.status}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium mb-2">Count Information</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Count Number:</span>
                  <span className="font-medium">{session.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Warehouse:</span>
                  <span className="font-medium">{session.warehouse}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Count Date:</span>
                  <span className="font-medium">{new Date(session.countDate).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Counted By:</span>
                  <span className="font-medium">{session.countedBy}</span>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="font-medium mb-2">Variance Summary</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{getAccurateCount()}</div>
                  <div className="text-sm text-green-600">Accurate</div>
                </div>
                <div className="p-3 bg-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">{session.items.length - getAccurateCount()}</div>
                  <div className="text-sm text-red-600">Variance</div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Variance */}
      <Card>
        <CardHeader>
          <CardTitle>Item-wise Variance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item Code</TableHead>
                  <TableHead>Item Name</TableHead>
                  <TableHead className="text-right">System Qty</TableHead>
                  <TableHead className="text-right">Counted Qty</TableHead>
                  <TableHead className="text-right">Difference</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {session.items.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{item.itemCode}</TableCell>
                    <TableCell>{item.itemName}</TableCell>
                    <TableCell className="text-right">{item.currentQty} {item.uom}</TableCell>
                    <TableCell className="text-right">{item.countedQty} {item.uom}</TableCell>
                    <TableCell className={`text-right font-medium ${getVarianceColor(item.difference)}`}>
                      <div className="flex items-center justify-end space-x-1">
                        {getVarianceIcon(item.difference)}
                        <span>{item.difference > 0 ? '+' : ''}{item.difference}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      {item.difference === 0 ? (
                        <Badge className="bg-green-100 text-green-800">Accurate</Badge>
                      ) : (
                        <Badge variant="destructive">Variance</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-4">
            <Button variant="outline">
              Export Summary
            </Button>
            <Button variant="outline">
              Print Report
            </Button>
            {session.status !== "completed" && (
              <Button>
                Complete Count
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StockCountSummary;

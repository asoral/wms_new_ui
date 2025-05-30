
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StockCountSession } from "../../pages/StockCount";

interface StockCountSummaryProps {
  session: StockCountSession;
}

const StockCountSummary = ({ session }: StockCountSummaryProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Stock Count Session
          <Badge variant={session.purpose === 'reconciliation' ? 'default' : 'secondary'}>
            {session.purpose === 'reconciliation' ? 'Reconciliation' : 'Opening'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{session.warehouse}</div>
            <div className="text-sm text-gray-600">Warehouse</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{session.totalItems}</div>
            <div className="text-sm text-gray-600">Total Items</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{session.matchedItems}</div>
            <div className="text-sm text-gray-600">Matched</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{session.varianceItems}</div>
            <div className="text-sm text-gray-600">Variance</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StockCountSummary;

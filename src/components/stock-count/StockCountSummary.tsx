
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
        <div className="space-y-4">
          {/* Warehouse name on its own row with smaller font */}
          <div className="w-full">
            <div className="text-sm text-gray-600 mb-1">Warehouse</div>
            <div className="text-lg font-semibold text-blue-600 break-words">{session.warehouse}</div>
          </div>
          
          {/* Stats in a grid below */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{session.totalItems}</div>
              <div className="text-xs text-gray-600">Total Items</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{session.matchedItems}</div>
              <div className="text-xs text-gray-600">Matched</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{session.varianceItems}</div>
              <div className="text-xs text-gray-600">Variance</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StockCountSummary;


import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, Clock, DollarSign, Scale } from "lucide-react";
import { ItemStockData } from "../../pages/ItemEnquiry";

interface StockSummaryProps {
  stockData: ItemStockData;
}

const StockSummary = ({ stockData }: StockSummaryProps) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const summaryCards = [
    {
      title: "Total Stock",
      value: `${stockData.totalStock} ${stockData.uom}`,
      icon: Package,
      color: "text-blue-600",
      bgColor: "bg-blue-50"
    },
    {
      title: "Unit of Measure",
      value: stockData.uom,
      icon: Scale,
      color: "text-green-600",
      bgColor: "bg-green-50"
    },
    {
      title: "Average Age",
      value: `${stockData.averageAge} days`,
      icon: Clock,
      color: "text-orange-600",
      bgColor: "bg-orange-50"
    },
    {
      title: "Total Valuation",
      value: formatCurrency(stockData.totalValuation),
      icon: DollarSign,
      color: "text-purple-600",
      bgColor: "bg-purple-50"
    }
  ];

  return (
    <div className="space-y-4">
      {/* Item Information */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">{stockData.itemName}</CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                Item Code: <Badge variant="outline">{stockData.itemCode}</Badge>
              </p>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <Card key={index}>
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${card.bgColor}`}>
                    <Icon className={`w-5 h-5 ${card.color}`} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">{card.title}</p>
                    <p className="text-lg font-semibold text-gray-900">{card.value}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default StockSummary;

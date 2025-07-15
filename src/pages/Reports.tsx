
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  BarChart3, 
  TrendingUp, 
  Package, 
  AlertTriangle,
  Calendar,
  Warehouse,
  Filter,
  Download,
  RefreshCcw
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const Reports = () => {
  const navigate = useNavigate();
  const [selectedReport, setSelectedReport] = useState<string | null>(null);

  const reportCategories = [
    {
      title: "Stock Reports",
      reports: [
        { 
          id: "stock-balance", 
          name: "Stock Balance", 
          description: "Current stock levels across warehouses",
          icon: Package,
          color: "bg-blue-500"
        },
        { 
          id: "stock-aging", 
          name: "Stock Aging", 
          description: "Age analysis of stock items",
          icon: Calendar,
          color: "bg-orange-500"
        },
        { 
          id: "stock-projected", 
          name: "Stock Projected Qty", 
          description: "Projected stock quantities",
          icon: TrendingUp,
          color: "bg-green-500"
        },
        { 
          id: "item-shortage", 
          name: "Item Shortage", 
          description: "Items below minimum stock level",
          icon: AlertTriangle,
          color: "bg-red-500"
        }
      ]
    },
    {
      title: "Movement Reports",
      reports: [
        { 
          id: "stock-ledger", 
          name: "Stock Ledger", 
          description: "Stock movement transactions",
          icon: BarChart3,
          color: "bg-purple-500"
        },
        { 
          id: "warehouse-wise", 
          name: "Warehouse-wise Stock", 
          description: "Stock distribution by warehouse",
          icon: Warehouse,
          color: "bg-teal-500"
        }
      ]
    }
  ];

  const sampleStockBalance = [
    { item: "RAW-MAT-001", warehouse: "Main Store", qty: 150, uom: "Nos", value: 15000 },
    { item: "FIN-GOOD-001", warehouse: "Finished Goods", qty: 75, uom: "Pcs", value: 37500 },
    { item: "COMP-001", warehouse: "Components", qty: 200, uom: "Nos", value: 20000 },
    { item: "PKG-MAT-001", warehouse: "Packaging", qty: 500, uom: "Nos", value: 5000 }
  ];

  const renderReportData = () => {
    if (!selectedReport) return null;

    switch (selectedReport) {
      case "stock-balance":
        return (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4 mb-4">
              <Input placeholder="Item Code/Name" className="flex-1" />
              <Input placeholder="Warehouse" className="flex-1" />
              <Button variant="outline">
                <Filter className="w-4 h-4 mr-2" />
                Filter
              </Button>
            </div>
            
            {/* Mobile Card View */}
            <div className="md:hidden space-y-3">
              {sampleStockBalance.map((item, index) => (
                <Card key={index}>
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <div className="flex justify-between items-start">
                        <h4 className="font-medium">{item.item}</h4>
                        <Badge variant="outline">{item.warehouse}</Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Quantity:</span>
                          <p className="font-medium">{item.qty} {item.uom}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Value:</span>
                          <p className="font-medium">₹{item.value.toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-3 text-foreground">Item Code</th>
                    <th className="text-left p-3 text-foreground">Warehouse</th>
                    <th className="text-right p-3 text-foreground">Quantity</th>
                    <th className="text-left p-3 text-foreground">UOM</th>
                    <th className="text-right p-3 text-foreground">Value</th>
                  </tr>
                </thead>
                <tbody>
                  {sampleStockBalance.map((item, index) => (
                    <tr key={index} className="border-b border-border hover:bg-accent">
                      <td className="p-3 text-foreground">{item.item}</td>
                      <td className="p-3 text-foreground">{item.warehouse}</td>
                      <td className="p-3 text-right text-foreground">{item.qty}</td>
                      <td className="p-3 text-foreground">{item.uom}</td>
                      <td className="p-3 text-right text-foreground">₹{item.value.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      default:
        return (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Report data will be displayed here</p>
          </div>
        );
    }
  };

  if (selectedReport) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <Button variant="outline" onClick={() => setSelectedReport(null)}>
                ← Back
              </Button>
              <h1 className="text-2xl font-bold text-foreground">
                {reportCategories.flatMap(c => c.reports).find(r => r.id === selectedReport)?.name}
              </h1>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" size="icon">
                <RefreshCcw className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="icon">
                <Download className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <Card>
            <CardContent className="p-6">
              {renderReportData()}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <BarChart3 className="w-6 h-6 text-blue-600" />
            <h1 className="text-2xl font-bold text-foreground">Reports</h1>
          </div>
        </div>

        <div className="space-y-8">
          {reportCategories.map((category, categoryIndex) => (
            <div key={categoryIndex}>
              <h2 className="text-xl font-semibold mb-4">{category.title}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {category.reports.map((report) => {
                  const Icon = report.icon;
                  return (
                    <Card 
                      key={report.id} 
                      className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => setSelectedReport(report.id)}
                    >
                      <CardHeader>
                        <CardTitle className="flex items-center space-x-3">
                          <div className={`w-10 h-10 rounded-lg ${report.color} flex items-center justify-center`}>
                            <Icon className="w-5 h-5 text-white" />
                          </div>
                          <span>{report.name}</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground">{report.description}</p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Reports;

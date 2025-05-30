
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { Search, FileText, Package, CheckCircle, Clock, LucideIcon } from "lucide-react";

interface DashboardData {
  pendingPOs: number;
  receiptsThisWeek: number;
  draftReceipts: number;
  pendingQC: number;
}

interface Shortcut {
  label: string;
  icon: LucideIcon;
  action: () => void;
}

interface ReceiveDashboardProps {
  data: DashboardData;
  onSelectPO: (poNumber: string) => void;
  shortcuts: Shortcut[];
}

const ReceiveDashboard = ({ data, onSelectPO, shortcuts }: ReceiveDashboardProps) => {
  const [poNumber, setPONumber] = useState("");

  const handlePOSearch = () => {
    if (poNumber.trim()) {
      onSelectPO(poNumber.trim());
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handlePOSearch();
    }
  };

  const dashboardItems = [
    {
      title: "Pending POs (Today)",
      value: data.pendingPOs,
      icon: Clock,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      clickable: true
    },
    {
      title: "Receipts This Week",
      value: data.receiptsThisWeek,
      icon: Package,
      color: "text-green-600",
      bgColor: "bg-green-50",
      clickable: true
    },
    {
      title: "Draft Receipts",
      value: data.draftReceipts,
      icon: FileText,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      clickable: true
    },
    {
      title: "Pending QC",
      value: data.pendingQC,
      icon: CheckCircle,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      clickable: true
    }
  ];

  return (
    <div className="space-y-6">
      {/* PO Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Search className="w-5 h-5" />
            <span>Select Purchase Order</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-2">
            <div className="flex-1">
              <Label htmlFor="poNumber">Purchase Order Number</Label>
              <Input
                id="poNumber"
                value={poNumber}
                onChange={(e) => setPONumber(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Enter PO number..."
              />
            </div>
            <div className="pt-6">
              <Button onClick={handlePOSearch} disabled={!poNumber.trim()}>
                <Search className="w-4 h-4 mr-2" />
                Select PO
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dashboard Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {dashboardItems.map((item, index) => {
          const Icon = item.icon;
          return (
            <Card 
              key={index} 
              className={`cursor-pointer hover:shadow-md transition-shadow ${item.bgColor}`}
              onClick={() => item.clickable && console.log(`Clicked ${item.title}`)}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">{item.title}</p>
                    <p className={`text-2xl font-bold ${item.color}`}>{item.value}</p>
                  </div>
                  <Icon className={`w-8 h-8 ${item.color}`} />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {shortcuts.map((shortcut, index) => {
              const Icon = shortcut.icon;
              return (
                <Button
                  key={index}
                  variant="outline"
                  onClick={shortcut.action}
                  className="h-16 flex-col"
                >
                  <Icon className="w-6 h-6 mb-2" />
                  {shortcut.label}
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReceiveDashboard;

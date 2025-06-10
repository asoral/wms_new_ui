
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Truck, Package, CheckCircle, FileText, Search } from "lucide-react";
import { createERPNextAPI, getUserDefaultCompany } from "@/services/erpnextApi";

interface ReceiveDashboardProps {
  onSelectPO: (poNumber: string) => void;
  shortcuts: Array<{ label: string; icon: any; action: () => void }>;
}

const ReceiveDashboard = ({ onSelectPO, shortcuts }: ReceiveDashboardProps) => {
  const [poSearch, setPOSearch] = useState("");
  const [pendingPOs, setPendingPOs] = useState<any[]>([]);
  const [receiptDrafts, setReceiptDrafts] = useState<any[]>([]);
  const [qcPending, setQCPending] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const erpnextAPI = await createERPNextAPI();
      if (!erpnextAPI) return;

      const company = await getUserDefaultCompany();

      // Load pending purchase orders
      const pendingResult = await erpnextAPI.getPendingPurchaseOrders(company || undefined);
      setPendingPOs(pendingResult.data || []);

      // Load draft receipts
      const draftsResult = await erpnextAPI.getReceiptDrafts(company || undefined);
      setReceiptDrafts(draftsResult.data || []);

      // Load QC pending items
      const qcResult = await erpnextAPI.getQualityInspectionsPending(company || undefined);
      setQCPending(qcResult.data || []);

    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePOSearch = () => {
    if (poSearch.trim()) {
      onSelectPO(poSearch.trim());
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handlePOSearch();
    }
  };

  return (
    <div className="space-y-6">
      {/* PO Search */}
      <Card>
        <CardHeader>
          <CardTitle>Purchase Order Lookup</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-2">
            <Input
              placeholder="Enter PO Number (e.g., PUR-ORD-2024-00001)"
              value={poSearch}
              onChange={(e) => setPOSearch(e.target.value)}
              onKeyPress={handleKeyPress}
            />
            <Button onClick={handlePOSearch} disabled={!poSearch.trim()}>
              <Search className="w-4 h-4 mr-2" />
              Search
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Dashboard Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Pending POs */}
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => {}}>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center justify-between">
              <span>Pending POs</span>
              <Truck className="w-5 h-5 text-orange-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600 mb-2">
              {loading ? '...' : pendingPOs.length}
            </div>
            <p className="text-sm text-gray-600">Orders awaiting receipt</p>
            {pendingPOs.slice(0, 3).map((po, index) => (
              <div key={index} className="mt-2 p-2 bg-orange-50 rounded text-xs">
                <div className="font-medium">{po.name}</div>
                <div className="text-gray-600">{po.supplier}</div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Draft Receipts */}
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => {}}>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center justify-between">
              <span>Receipts</span>
              <FileText className="w-5 h-5 text-blue-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600 mb-2">
              {loading ? '...' : receiptDrafts.length}
            </div>
            <p className="text-sm text-gray-600">Draft receipts</p>
            {receiptDrafts.slice(0, 3).map((receipt, index) => (
              <div key={index} className="mt-2 p-2 bg-blue-50 rounded text-xs">
                <div className="font-medium">{receipt.name}</div>
                <div className="text-gray-600">{receipt.supplier}</div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* QC Pending */}
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => {}}>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center justify-between">
              <span>QC</span>
              <CheckCircle className="w-5 h-5 text-green-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 mb-2">
              {loading ? '...' : qcPending.length}
            </div>
            <p className="text-sm text-gray-600">Quality checks pending</p>
            {qcPending.slice(0, 3).map((qc, index) => (
              <div key={index} className="mt-2 p-2 bg-green-50 rounded text-xs">
                <div className="font-medium">{qc.name}</div>
                <div className="text-gray-600">{qc.item_code}</div>
              </div>
            ))}
          </CardContent>
        </Card>
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
                  className="h-16 flex flex-col items-center justify-center space-y-2"
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-sm">{shortcut.label}</span>
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

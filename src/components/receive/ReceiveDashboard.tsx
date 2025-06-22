import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, Loader2, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { createERPNextAPI } from "@/services/erpnextApi";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface DraftReceipt {
  id: string;
  supplier: string;
  date: string;
  items: number;
  amount: number;
}

interface ReceiveDashboardProps {
  onSelectPO: (poNumber: string) => void;
  onSelectDraftReceipt?: (receiptId: string) => void;
  shortcuts: Array<{
    label: string;
    icon: any;
    action: () => void;
  }>;
}

const ReceiveDashboard = ({ onSelectPO, onSelectDraftReceipt, shortcuts }: ReceiveDashboardProps) => {
  const [poNumber, setPONumber] = useState("");
  const [draftReceipts, setDraftReceipts] = useState<DraftReceipt[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    fetchDraftReceipts();
  }, []);

  const fetchDraftReceipts = async () => {
    setLoading(true);
    try {
      const erpnextAPI = await createERPNextAPI();
      if (!erpnextAPI) {
        toast({
          title: "ERPNext Not Configured",
          description: "Please configure your ERPNext settings in the Profile page.",
          variant: "destructive"
        });
        return;
      }

      // Fetch draft purchase receipts
      const filters = { docstatus: 0 }; // 0 for draft
      const receiptsResult = await erpnextAPI.purchase.getPurchaseReceipts(filters);

      if (receiptsResult.data) {
        const transformedReceipts: DraftReceipt[] = receiptsResult.data.map((receipt: any) => ({
          id: receipt.name,
          supplier: receipt.supplier,
          date: receipt.posting_date,
          items: receipt.items ? receipt.items.length : 0,
          amount: receipt.grand_total || 0
        }));
        setDraftReceipts(transformedReceipts);
      }
    } catch (error) {
      console.error('Error fetching draft receipts:', error);
      toast({
        title: "Error",
        description: "Failed to fetch draft purchase receipts",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePOSearch = () => {
    if (poNumber.trim()) {
      onSelectPO(poNumber.trim());
    }
  };

  const handleDraftReceiptView = (receiptId: string) => {
    if (onSelectDraftReceipt) {
      onSelectDraftReceipt(receiptId);
    }
  };

  return (
    <div className="space-y-6">
      {/* PO Search */}
      <Card>
        <CardHeader>
          <CardTitle>Receive Items from Purchase Order</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <Input
              type="text"
              placeholder="Enter Purchase Order Number"
              value={poNumber}
              onChange={(e) => setPONumber(e.target.value)}
            />
            <Button onClick={handlePOSearch}>
              <Search className="w-4 h-4 mr-2" />
              Search
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {shortcuts.map((shortcut, index) => (
              <Button key={index} onClick={shortcut.action} className="h-12">
                <shortcut.icon className="w-4 h-4 mr-2" />
                {shortcut.label}
              </Button>
            ))}
          </CardContent>
        </CardHeader>
      </Card>

      {/* Draft Purchase Receipts */}
      <Card>
        <CardHeader>
          <CardTitle>Draft Purchase Receipts</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              <span className="ml-2 text-gray-600">Loading draft receipts...</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Receipt ID</th>
                    <th className="text-left py-2">Supplier</th>
                    <th className="text-left py-2">Date</th>
                    <th className="text-left py-2">Items</th>
                    <th className="text-left py-2">Amount</th>
                    <th className="text-left py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {draftReceipts.map((receipt) => (
                    <tr key={receipt.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 font-medium text-blue-600">{receipt.id}</td>
                      <td className="py-3">{receipt.supplier}</td>
                      <td className="py-3">{receipt.date}</td>
                      <td className="py-3">{receipt.items} items</td>
                      <td className="py-3">₹{receipt.amount.toLocaleString()}</td>
                      <td className="py-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDraftReceiptView(receipt.id)}
                          className="flex items-center"
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {draftReceipts.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No draft purchase receipts found
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Shortcuts */}
      <Card>
        <CardHeader>
          <CardTitle>Shortcuts</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {shortcuts.map((shortcut, index) => (
            <Button key={index} onClick={shortcut.action} className="h-12">
              <shortcut.icon className="w-4 h-4 mr-2" />
              {shortcut.label}
            </Button>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default ReceiveDashboard;

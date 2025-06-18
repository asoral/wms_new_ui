
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Truck, FileText, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createERPNextAPI, getUserDefaultCompany } from "@/services/erpnextApi";
import { useToast } from "@/hooks/use-toast";

interface DraftReceipt {
  name: string;
  supplier: string;
  supplier_name?: string;
  posting_date: string;
  grand_total: number;
  status: string;
  items: any[];
}

const DraftReceipts = () => {
  const navigate = useNavigate();
  const [draftReceipts, setDraftReceipts] = useState<DraftReceipt[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadDraftReceipts();
  }, []);

  const loadDraftReceipts = async () => {
    try {
      setLoading(true);
      const erpnextAPI = await createERPNextAPI();
      if (!erpnextAPI) {
        toast({
          title: "ERPNext Not Configured",
          description: "Please configure your ERPNext settings in the Profile page.",
          variant: "destructive"
        });
        return;
      }

      const defaultCompany = await getUserDefaultCompany();
      
      // Fetch draft purchase receipts
      const response = await erpnextAPI.purchase.getPurchaseReceipts([
        ['docstatus', '=', 0] // Draft status = 0
      ], defaultCompany || undefined);
      
      console.log('Draft receipts response:', response);
      
      if (response?.data) {
        setDraftReceipts(response.data);
      } else {
        setDraftReceipts([]);
      }

    } catch (error) {
      console.error('Failed to load draft receipts:', error);
      toast({
        title: "Error",
        description: "Failed to load draft receipts from ERPNext",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const viewReceipt = (receiptId: string) => {
    navigate(`/receipt-detail/${receiptId}`);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <FileText className="w-6 h-6 mr-2 text-blue-600" />
          <h1 className="text-2xl font-bold">Draft Receipts</h1>
        </div>
        <Button variant="outline" onClick={() => navigate('/receive')}>
          <Truck className="w-4 h-4 mr-2" />
          Back to Receive
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Draft Purchase Receipts</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading draft receipts...</p>
            </div>
          ) : draftReceipts.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="py-3 px-4 text-left font-semibold text-sm text-gray-600">Receipt ID</th>
                    <th className="py-3 px-4 text-left font-semibold text-sm text-gray-600">Supplier</th>
                    <th className="py-3 px-4 text-left font-semibold text-sm text-gray-600">Date</th>
                    <th className="py-3 px-4 text-left font-semibold text-sm text-gray-600">Items</th>
                    <th className="py-3 px-4 text-right font-semibold text-sm text-gray-600">Amount</th>
                    <th className="py-3 px-4 text-right font-semibold text-sm text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {draftReceipts.map((receipt) => (
                    <tr key={receipt.name} className="border-b hover:bg-gray-50">
                      <td className="py-4 px-4">{receipt.name}</td>
                      <td className="py-4 px-4">{receipt.supplier_name || receipt.supplier}</td>
                      <td className="py-4 px-4">{formatDate(receipt.posting_date)}</td>
                      <td className="py-4 px-4">{receipt.items?.length || 0} items</td>
                      <td className="py-4 px-4 text-right">{formatCurrency(receipt.grand_total)}</td>
                      <td className="py-4 px-4 text-right">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => viewReceipt(receipt.name)}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 mx-auto text-gray-400" />
              <h3 className="mt-4 text-lg font-medium">No Draft Receipts</h3>
              <p className="mt-1 text-gray-500">You don't have any draft purchase receipts at the moment.</p>
              <Button 
                className="mt-6" 
                onClick={() => navigate('/receive')}
              >
                Create New Receipt
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DraftReceipts;

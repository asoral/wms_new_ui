
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
  posting_date?: string;
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
      const response = await erpnextAPI.getPurchaseReceipts([
        ['docstatus', '=', 0] // Draft status = 0
      ], defaultCompany || undefined);
      
      console.log('Draft receipts response:', response);
      
      if (response?.data) {
        // Transform the data to match our DraftReceipt interface
        const transformedReceipts: DraftReceipt[] = response.data.map((receipt: any) => ({
          name: receipt.name,
          supplier: receipt.supplier,
          supplier_name: receipt.supplier_name,
          posting_date: receipt.posting_date || new Date().toISOString().split('T')[0],
          grand_total: receipt.grand_total,
          status: receipt.status,
          items: receipt.items || []
        }));
        
        setDraftReceipts(transformedReceipts);
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

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
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
              <div className="animate-spin rounded-full w-8 h-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading draft receipts...</p>
            </div>
          ) : draftReceipts.length > 0 ? (
            <div className="space-y-4">
              {draftReceipts.map((receipt) => (
                <div key={receipt.name} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <FileText className="w-4 h-4 text-gray-600" />
                      <span className="font-semibold text-gray-900">{receipt.name}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">
                        Draft
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => viewReceipt(receipt.name)}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                    <div>
                      <span className="font-medium">Supplier:</span>
                      <p className="text-gray-900">{receipt.supplier_name || receipt.supplier}</p>
                    </div>
                    <div>
                      <span className="font-medium">Amount:</span>
                      <p className="text-gray-900">{formatCurrency(receipt.grand_total)}</p>
                    </div>
                    <div>
                      <span className="font-medium">Date:</span>
                      <p className="text-gray-900">{formatDate(receipt.posting_date)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">No draft receipts found</p>
              <p className="text-gray-500 text-sm mt-1">
                Draft receipts will appear here when you start receiving items
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DraftReceipts;

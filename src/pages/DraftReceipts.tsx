
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileText, Edit, Eye, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createERPNextAPI, getUserDefaultCompany } from "@/services/erpnextApi";
import { useToast } from "@/hooks/use-toast";

interface DraftReceipt {
  name: string;
  supplier: string;
  supplier_name: string;
  posting_date: string;
  grand_total: number;
  status: string;
  purchase_order?: string;
}

const DraftReceipts = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [draftReceipts, setDraftReceipts] = useState<DraftReceipt[]>([]);
  const [loading, setLoading] = useState(true);

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
      
      // Fetch draft Purchase Receipts with company filter
      const result = await erpnextAPI.purchase.getPurchaseReceipts([
        ['docstatus', '=', 0],
        ...(defaultCompany ? [['company', '=', defaultCompany]] : [])
      ]);
      
      if (result?.data) {
        const transformedReceipts: DraftReceipt[] = result.data.map((receipt: any) => ({
          name: receipt.name || '',
          supplier: receipt.supplier || '',
          supplier_name: receipt.supplier_name || receipt.supplier || 'Unknown Supplier',
          posting_date: receipt.posting_date || '',
          grand_total: Number(receipt.grand_total) || 0,
          status: receipt.status || 'Draft',
          purchase_order: receipt.purchase_order || ''
        }));
        
        setDraftReceipts(transformedReceipts);
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

  const handleReceiptClick = (receiptName: string) => {
    // Navigate to receipt detail page for editing/submitting
    navigate(`/receive/receipt/${encodeURIComponent(receiptName)}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Button variant="ghost" onClick={() => navigate('/receive')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <FileText className="w-6 h-6 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">Draft Purchase Receipts</h1>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Draft Purchase Receipts ({draftReceipts.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <p>Loading draft receipts...</p>
              </div>
            ) : draftReceipts.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No draft purchase receipts found</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Receipt No.</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead>PO Reference</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Total Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {draftReceipts.map((receipt) => (
                    <TableRow key={receipt.name} className="cursor-pointer hover:bg-gray-50">
                      <TableCell className="font-medium">{receipt.name}</TableCell>
                      <TableCell>{receipt.supplier_name}</TableCell>
                      <TableCell>
                        {receipt.purchase_order && (
                          <Badge variant="outline">{receipt.purchase_order}</Badge>
                        )}
                      </TableCell>
                      <TableCell>{receipt.posting_date}</TableCell>
                      <TableCell>₹{receipt.grand_total.toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{receipt.status}</Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleReceiptClick(receipt.name)}
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DraftReceipts;

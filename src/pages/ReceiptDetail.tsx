
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Package, CheckCircle } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { createERPNextAPI } from "@/services/erpnextApi";
import { useToast } from "@/hooks/use-toast";

interface ReceiptItem {
  item_code: string;
  item_name: string;
  qty: number;
  rate: number;
  amount: number;
  warehouse: string;
  batch_no?: string;
  serial_no?: string;
}

interface ReceiptDetail {
  name: string;
  supplier: string;
  supplier_name: string;
  posting_date: string;
  grand_total: number;
  status: string;
  docstatus: number;
  purchase_order?: string;
  company: string;
  items: ReceiptItem[];
}

const ReceiptDetail = () => {
  const navigate = useNavigate();
  const { receiptName } = useParams<{ receiptName: string }>();
  const { toast } = useToast();
  const [receipt, setReceipt] = useState<ReceiptDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (receiptName) {
      loadReceiptDetail();
    }
  }, [receiptName]);

  const loadReceiptDetail = async () => {
    if (!receiptName) return;
    
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

      // Get Purchase Receipt details directly from ERPNext API
      const response = await fetch(`${erpnextAPI.baseURL}/api/resource/Purchase Receipt/${encodeURIComponent(decodeURIComponent(receiptName))}`, {
        headers: {
          'Authorization': `token ${erpnextAPI.apiKey}:${erpnextAPI.apiSecret}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch receipt: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result?.data) {
        const receiptData = result.data;
        const transformedReceipt: ReceiptDetail = {
          name: receiptData.name || '',
          supplier: receiptData.supplier || '',
          supplier_name: receiptData.supplier_name || receiptData.supplier || 'Unknown Supplier',
          posting_date: receiptData.posting_date || '',
          grand_total: Number(receiptData.grand_total) || 0,
          status: receiptData.status || 'Draft',
          docstatus: receiptData.docstatus || 0,
          purchase_order: receiptData.purchase_order || '',
          company: receiptData.company || '',
          items: receiptData.items ? receiptData.items.map((item: any) => ({
            item_code: item.item_code || '',
            item_name: item.item_name || '',
            qty: Number(item.qty) || 0,
            rate: Number(item.rate) || 0,
            amount: Number(item.amount) || 0,
            warehouse: item.warehouse || '',
            batch_no: item.batch_no || '',
            serial_no: item.serial_no || ''
          })) : []
        };
        
        setReceipt(transformedReceipt);
      }
    } catch (error) {
      console.error('Failed to load receipt detail:', error);
      toast({
        title: "Error",
        description: "Failed to load receipt details from ERPNext",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReceipt = async () => {
    if (!receipt || !receiptName) return;
    
    try {
      setSubmitting(true);
      const erpnextAPI = await createERPNextAPI();
      if (!erpnextAPI) {
        toast({
          title: "ERPNext Not Configured",
          description: "Please configure your ERPNext settings.",
          variant: "destructive"
        });
        return;
      }

      // Submit the Purchase Receipt
      const response = await fetch(`${erpnextAPI.baseURL}/api/resource/Purchase Receipt/${receipt.name}`, {
        method: 'PUT',
        headers: {
          'Authorization': `token ${erpnextAPI.apiKey}:${erpnextAPI.apiSecret}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          docstatus: 1
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to submit receipt: ${response.statusText}`);
      }
      
      toast({
        title: "Success",
        description: `Purchase receipt ${receipt.name} submitted successfully!`,
      });
      
      // Navigate back to draft receipts
      navigate('/receive/drafts');
      
    } catch (error) {
      console.error('Error submitting receipt:', error);
      toast({
        title: "Error",
        description: `Failed to submit purchase receipt: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-8">
            <p>Loading receipt details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!receipt) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-8">
            <p>Receipt not found</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Button variant="ghost" onClick={() => navigate('/receive/drafts')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Drafts
            </Button>
            <Package className="w-6 h-6 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">Purchase Receipt: {receipt.name}</h1>
          </div>
          {receipt.docstatus === 0 && (
            <Button onClick={handleSubmitReceipt} disabled={submitting}>
              <CheckCircle className="w-4 h-4 mr-2" />
              {submitting ? 'Submitting...' : 'Submit Receipt'}
            </Button>
          )}
        </div>

        {/* Receipt Summary */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Purchase Receipt Details
              <Badge variant={receipt.docstatus === 0 ? 'destructive' : 'default'}>
                {receipt.status}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Receipt Number</p>
                <p className="font-medium">{receipt.name}</p>
              </div>
              <div>
                <p className="text-gray-600">Supplier</p>
                <p className="font-medium">{receipt.supplier_name}</p>
              </div>
              <div>
                <p className="text-gray-600">Date</p>
                <p className="font-medium">{receipt.posting_date}</p>
              </div>
              <div>
                <p className="text-gray-600">Total Amount</p>
                <p className="font-medium">₹{receipt.grand_total.toLocaleString()}</p>
              </div>
              {receipt.purchase_order && (
                <div>
                  <p className="text-gray-600">PO Reference</p>
                  <p className="font-medium">{receipt.purchase_order}</p>
                </div>
              )}
              <div>
                <p className="text-gray-600">Company</p>
                <p className="font-medium">{receipt.company}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Items Table */}
        <Card>
          <CardHeader>
            <CardTitle>Items ({receipt.items.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item Code</TableHead>
                  <TableHead>Item Name</TableHead>
                  <TableHead>Qty</TableHead>
                  <TableHead>Rate</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Warehouse</TableHead>
                  <TableHead>Batch/Serial</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {receipt.items.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{item.item_code}</TableCell>
                    <TableCell>{item.item_name}</TableCell>
                    <TableCell>{item.qty}</TableCell>
                    <TableCell>₹{item.rate.toLocaleString()}</TableCell>
                    <TableCell>₹{item.amount.toLocaleString()}</TableCell>
                    <TableCell>{item.warehouse}</TableCell>
                    <TableCell>
                      {item.batch_no && <Badge variant="outline" className="mr-1">B: {item.batch_no}</Badge>}
                      {item.serial_no && <Badge variant="outline">S: {item.serial_no}</Badge>}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ReceiptDetail;

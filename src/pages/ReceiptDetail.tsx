import { useState, useEffect } from "react";
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Download } from "lucide-react";
import { createERPNextAPI } from "@/services/erpnextApi";
import { useToast } from "@/hooks/use-toast";

interface ReceiptItem {
  item_code: string;
  item_name: string;
  qty: number;
  rate: number;
  amount: number;
}

interface Receipt {
  name: string;
  supplier: string;
  posting_date: string;
  grand_total: number;
  items: ReceiptItem[];
}

const ReceiptDetail = () => {
  const { receiptNumber } = useParams<{ receiptNumber: string }>();
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadReceipt();
  }, [receiptNumber]);

  const loadReceipt = async () => {
    if (!receiptNumber) return;

    try {
      const api = await createERPNextAPI();
      if (!api) return;

      const result = await api.getPurchaseReceipt(receiptNumber);
      if (result.data) {
        // Transform the data to match our interface
        const transformedItems = result.data.items?.map((item: any) => ({
          item_code: item.item_code,
          item_name: item.item_name || item.description,
          qty: item.qty,
          rate: item.rate,
          amount: item.amount || (item.qty * item.rate)
        })) || [];

        setReceipt({
          name: result.data.name,
          supplier: result.data.supplier,
          posting_date: result.data.posting_date,
          grand_total: result.data.grand_total,
          items: transformedItems
        });
      }
    } catch (error) {
      console.error('Error loading receipt:', error);
      toast({
        title: "Error",
        description: "Failed to load receipt details",
        variant: "destructive"
      });
    }
  };

  const generateReceiptPDF = async () => {
    if (!receipt) return;

    try {
      const api = await createERPNextAPI();
      if (!api) return;

      const pdfUrl = `${api.getBaseURL}/api/method/frappe.utils.print_format.download_pdf`;
      
      const params = new URLSearchParams({
        doctype: 'Purchase Receipt',
        name: receipt.name,
        format: 'Standard',
        _lang: 'en',
        letterhead: '1'
      });

      const response = await fetch(`${pdfUrl}?${params}`, {
        headers: {
          'Authorization': `token ${api.getApiKey}:${api.getApiSecret}`
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${receipt.name}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "Error",
        description: "Failed to generate PDF",
        variant: "destructive"
      });
    }
  };

  const generateExcel = async () => {
    if (!receipt?.items) return;

    try {
      const api = await createERPNextAPI();
      if (!api) return;

      const excelUrl = `${api.getBaseURL}/api/method/frappe.desk.query_report.export_query`;
      
      const params = new URLSearchParams({
        report_name: 'Purchase Receipt',
        file_format_type: 'Excel',
        filters: JSON.stringify({
          'Purchase Receipt': receipt.name
        })
      });

      const response = await fetch(`${excelUrl}?${params}`, {
        headers: {
          'Authorization': `token ${api.getApiKey}:${api.getApiSecret}`
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${receipt.name}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Error generating Excel:', error);
      toast({
        title: "Error",
        description: "Failed to generate Excel file",
        variant: "destructive"
      });
    }
  };

  if (!receipt) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Card className="w-full max-w-md">
          <CardContent className="text-center">
            Loading receipt details...
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto mt-6 md:mt-8">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-2xl font-bold">
            <FileText className="mr-2 h-5 w-5 inline-block align-middle" />
            Purchase Receipt: {receipt.name}
          </CardTitle>
          <Button onClick={generateReceiptPDF}>
            <Download className="mr-2 h-4 w-4" />
            Generate PDF
          </Button>
          <Button onClick={generateExcel}>
            <Download className="mr-2 h-4 w-4" />
            Generate Excel
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-lg font-semibold">Supplier</h3>
              <p>{receipt.supplier}</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold">Posting Date</h3>
              <p>{new Date(receipt.posting_date).toLocaleDateString()}</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold">Total Amount</h3>
              <p>₹{receipt.grand_total.toLocaleString()}</p>
            </div>
          </div>

          <h2 className="text-xl font-semibold mt-6 mb-2">Items</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full leading-normal">
              <thead>
                <tr>
                  <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Item Code
                  </th>
                  <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Item Name
                  </th>
                  <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Quantity
                  </th>
                  <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Rate
                  </th>
                  <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody>
                {receipt.items.map((item) => (
                  <tr key={item.item_code}>
                    <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                      {item.item_code}
                    </td>
                    <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                      {item.item_name}
                    </td>
                    <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                      {item.qty}
                    </td>
                    <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                      ₹{item.rate.toLocaleString()}
                    </td>
                    <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                      ₹{item.amount.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReceiptDetail;

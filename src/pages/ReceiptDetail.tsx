import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Package, CheckCircle, Truck, Calendar, DollarSign, User, Hash, Warehouse, Archive } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { createERPNextAPI } from "@/services/erpnextApi";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";

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
  const isMobile = useIsMobile();
  const [receipt, setReceipt] = useState<ReceiptDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("details");

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

  const MobileItemCard = ({ item, index }: { item: ReceiptItem; index: number }) => (
    <Card className="mb-4">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="font-semibold text-lg">{item.item_code}</div>
          <Badge variant="default" className="text-xs">Received</Badge>
        </div>
        
        <div className="space-y-2 text-sm">
          <div>
            <span className="text-gray-600">Item:</span>
            <p className="font-medium">{item.item_name}</p>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center">
              <Hash className="w-4 h-4 mr-2 text-gray-500" />
              <div>
                <span className="text-gray-600">Qty:</span>
                <p className="font-medium">{item.qty}</p>
              </div>
            </div>
            
            <div className="flex items-center">
              <DollarSign className="w-4 h-4 mr-2 text-gray-500" />
              <div>
                <span className="text-gray-600">Rate:</span>
                <p className="font-medium">₹{item.rate.toLocaleString()}</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center">
            <DollarSign className="w-4 h-4 mr-2 text-gray-500" />
            <span className="text-gray-600">Amount:</span>
            <span className="ml-1 font-semibold">₹{item.amount.toLocaleString()}</span>
          </div>
          
          <div className="flex items-center">
            <Warehouse className="w-4 h-4 mr-2 text-gray-500" />
            <span className="text-gray-600">Warehouse:</span>
            <span className="ml-1">{item.warehouse}</span>
          </div>
          
          {(item.batch_no || item.serial_no) && (
            <div className="flex items-center">
              <Archive className="w-4 h-4 mr-2 text-gray-500" />
              <div className="flex flex-wrap gap-1">
                {item.batch_no && <Badge variant="outline" className="text-xs">B: {item.batch_no}</Badge>}
                {item.serial_no && <Badge variant="outline" className="text-xs">S: {item.serial_no}</Badge>}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

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
            <Truck className="w-6 h-6 text-blue-600" />
            <h1 className="text-xl md:text-2xl font-bold text-gray-900">Purchase Receipt: {receipt.name}</h1>
          </div>
          {receipt.docstatus === 0 && !isMobile && (
            <div className="flex items-center space-x-2">
              <Badge variant="outline">{receipt.name}</Badge>
              <Button onClick={handleSubmitReceipt} disabled={submitting}>
                <CheckCircle className="w-4 h-4 mr-2" />
                {submitting ? 'Submitting...' : 'Submit Receipt'}
              </Button>
            </div>
          )}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="details">Receipt Details</TabsTrigger>
            <TabsTrigger value="review">Review & Submit</TabsTrigger>
          </TabsList>

          <TabsContent value="details">
            <div className="space-y-6">
              {/* Purchase Receipt Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    Purchase Receipt Details
                    <Badge variant={receipt.docstatus === 0 ? 'destructive' : 'default'}>
                      {receipt.status}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isMobile ? (
                    // Mobile Card View
                    <div className="space-y-4">
                      <div>
                        <div className="flex items-center mb-2">
                          <Hash className="w-4 h-4 mr-2 text-gray-500" />
                          <span className="text-gray-600">Receipt Number</span>
                        </div>
                        <p className="font-medium">{receipt.name}</p>
                      </div>
                      
                      <div>
                        <div className="flex items-center mb-2">
                          <User className="w-4 h-4 mr-2 text-gray-500" />
                          <span className="text-gray-600">Supplier</span>
                        </div>
                        <p className="font-medium">{receipt.supplier_name}</p>
                      </div>
                      
                      <div>
                        <div className="flex items-center mb-2">
                          <Calendar className="w-4 h-4 mr-2 text-gray-500" />
                          <span className="text-gray-600">Date</span>
                        </div>
                        <p className="font-medium">{receipt.posting_date}</p>
                      </div>
                      
                      <div>
                        <div className="flex items-center mb-2">
                          <DollarSign className="w-4 h-4 mr-2 text-gray-500" />
                          <span className="text-gray-600">Total Amount</span>
                        </div>
                        <p className="font-medium text-lg">₹{receipt.grand_total.toLocaleString()}</p>
                      </div>
                      
                      {receipt.purchase_order && (
                        <div>
                          <div className="flex items-center mb-2">
                            <Package className="w-4 h-4 mr-2 text-gray-500" />
                            <span className="text-gray-600">PO Reference</span>
                          </div>
                          <p className="font-medium">{receipt.purchase_order}</p>
                        </div>
                      )}
                      
                      <div>
                        <div className="flex items-center mb-2">
                          <Warehouse className="w-4 h-4 mr-2 text-gray-500" />
                          <span className="text-gray-600">Company</span>
                        </div>
                        <p className="font-medium">{receipt.company}</p>
                      </div>
                    </div>
                  ) : (
                    // Desktop Grid View
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
                  )}
                </CardContent>
              </Card>

              {/* Items */}
              <Card>
                <CardHeader>
                  <CardTitle>Purchase Order Items</CardTitle>
                </CardHeader>
                <CardContent>
                  {isMobile ? (
                    // Mobile Card View
                    <div className="space-y-4">
                      {receipt.items.map((item, index) => (
                        <MobileItemCard key={index} item={item} index={index} />
                      ))}
                    </div>
                  ) : (
                    // Desktop Table View
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Item Code</TableHead>
                            <TableHead>Item Name</TableHead>
                            <TableHead>Ordered</TableHead>
                            <TableHead>Received</TableHead>
                            <TableHead>Pending</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {receipt.items.map((item, index) => (
                            <TableRow key={index}>
                              <TableCell className="font-medium">{item.item_code}</TableCell>
                              <TableCell>{item.item_name}</TableCell>
                              <TableCell>{item.qty}</TableCell>
                              <TableCell>{item.qty}</TableCell>
                              <TableCell>0</TableCell>
                              <TableCell>
                                <Badge variant="default" className="text-xs">
                                  Received
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="review">
            <Card>
              <CardHeader>
                <CardTitle>Review Receipt</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Summary */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-blue-900">Receipt Summary</h3>
                        <p className="text-sm text-blue-700">
                          {receipt.items.length} items • Total: ₹{receipt.grand_total.toLocaleString()}
                        </p>
                      </div>
                      <Package className="w-8 h-8 text-blue-600" />
                    </div>
                  </div>

                  {/* Items Summary */}
                  {isMobile ? (
                    // Mobile Card View
                    <div className="space-y-4">
                      {receipt.items.map((item, index) => (
                        <MobileItemCard key={index} item={item} index={index} />
                      ))}
                    </div>
                  ) : (
                    // Desktop Table View
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
                              {!item.batch_no && !item.serial_no && <span className="text-gray-400">-</span>}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}

                  {/* Submit Section */}
                  {receipt.docstatus === 0 && (
                    <div className="flex justify-end pt-4 border-t">
                      <Button onClick={handleSubmitReceipt} disabled={submitting} size="lg" className="w-full md:w-auto">
                        <CheckCircle className="w-4 h-4 mr-2" />
                        {submitting ? 'Submitting Receipt...' : 'Submit Receipt'}
                      </Button>
                    </div>
                  )}

                  {receipt.docstatus === 1 && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-center">
                        <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                        <p className="text-green-800 font-medium">
                          This purchase receipt has been successfully submitted.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ReceiptDetail;

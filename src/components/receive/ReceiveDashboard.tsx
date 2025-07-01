
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Truck, 
  Package, 
  FileText, 
  Search, 
  Calendar,
  Building2,
  Clock,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import { createERPNextAPI, getUserDefaultCompany } from "@/services/erpnextApi";
import { useToast } from "@/hooks/use-toast";

interface PurchaseOrder {
  name: string;
  supplier: string;
  supplier_name?: string;
  transaction_date: string;
  schedule_date?: string;
  grand_total: number;
  status: string;
  per_received: number;
}

interface DraftReceipt {
  name: string;
  supplier: string;
  supplier_name?: string;
  posting_date: string;
  grand_total: number;
  status: string;
}

interface ReceiveDashboardProps {
  onSelectPO: (poNumber: string) => void;
  onSelectDraftReceipt: (receiptId: string) => void;
  shortcuts?: Array<{
    label: string;
    icon: any;
    action: () => void;
  }>;
}

const ReceiveDashboard = ({ onSelectPO, onSelectDraftReceipt, shortcuts = [] }: ReceiveDashboardProps) => {
  const [pendingPOs, setPendingPOs] = useState<PurchaseOrder[]>([]);
  const [draftReceipts, setDraftReceipts] = useState<DraftReceipt[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchPO, setSearchPO] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
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

      // Load pending purchase orders
      const poResponse = await erpnextAPI.getPurchaseOrders({
        status: ['To Receive', 'To Receive and Bill', 'Partially Received']
      }, defaultCompany || undefined);
      
      if (poResponse?.data) {
        setPendingPOs(poResponse.data);
      }

      // Load draft purchase receipts
      const receiptResponse = await erpnextAPI.getPurchaseReceipts({
        docstatus: 0 // Draft status
      }, defaultCompany || undefined);
      
      if (receiptResponse?.data) {
        setDraftReceipts(receiptResponse.data);
      }

    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data from ERPNext",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePOSearch = () => {
    if (searchPO.trim()) {
      onSelectPO(searchPO.trim());
    }
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'To Receive': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'To Receive and Bill': return 'bg-red-100 text-red-800 border-red-200';
      case 'Partially Received': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Completed': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'To Receive': return <AlertCircle className="w-3 h-3" />;
      case 'Partially Received': return <Clock className="w-3 h-3" />;
      case 'Completed': return <CheckCircle className="w-3 h-3" />;
      default: return <Package className="w-3 h-3" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Quick PO Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Search className="w-5 h-5 text-blue-600" />
            <span>Quick PO Search</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-2">
            <div className="flex-1">
              <Label htmlFor="po-search" className="sr-only">Purchase Order Number</Label>
              <Input
                id="po-search"
                placeholder="Enter PO number (e.g., PO-2025-00001)"
                value={searchPO}
                onChange={(e) => setSearchPO(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handlePOSearch()}
              />
            </div>
            <Button onClick={handlePOSearch} disabled={!searchPO.trim() || loading}>
              <Search className="w-4 h-4 mr-2" />
              Search
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Dashboard Tabs */}
      <Tabs defaultValue="pending-pos" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pending-pos" className="flex items-center space-x-2">
            <Truck className="w-4 h-4" />
            <span>Pending POs ({pendingPOs.length})</span>
          </TabsTrigger>
          <TabsTrigger value="draft-receipts" className="flex items-center space-x-2">
            <FileText className="w-4 h-4" />
            <span>Draft Receipts ({draftReceipts.length})</span>
          </TabsTrigger>
          <TabsTrigger value="shortcuts" className="flex items-center space-x-2">
            <Package className="w-4 h-4" />
            <span>Shortcuts</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending-pos" className="mt-6">
          <div className="space-y-4">
            {loading ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <div className="animate-spin rounded-full w-8 h-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading purchase orders...</p>
                </CardContent>
              </Card>
            ) : pendingPOs.length > 0 ? (
              pendingPOs.map((po) => (
                <Card 
                  key={po.name} 
                  className="hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-orange-500"
                  onClick={() => onSelectPO(po.name)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <Truck className="w-4 h-4 text-gray-600" />
                        <span className="font-semibold text-gray-900">{po.name}</span>
                      </div>
                      <Badge className={`${getStatusColor(po.status)} flex items-center space-x-1`}>
                        {getStatusIcon(po.status)}
                        <span>{po.status}</span>
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm text-gray-600">
                      <div>
                        <span className="font-medium">Supplier:</span>
                        <p className="text-gray-900">{po.supplier_name || po.supplier}</p>
                      </div>
                      <div>
                        <span className="font-medium">Amount:</span>
                        <p className="text-gray-900">{formatCurrency(po.grand_total)}</p>
                      </div>
                      <div>
                        <span className="font-medium">Date:</span>
                        <p className="text-gray-900">{formatDate(po.schedule_date || po.transaction_date)}</p>
                      </div>
                    </div>
                    
                    {po.per_received > 0 && (
                      <div className="mt-3">
                        <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                          <span>Received Progress</span>
                          <span>{po.per_received}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${po.per_received}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <Truck className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">No pending purchase orders found</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="draft-receipts" className="mt-6">
          <div className="space-y-4">
            {loading ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <div className="animate-spin rounded-full w-8 h-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading draft receipts...</p>
                </CardContent>
              </Card>
            ) : draftReceipts.length > 0 ? (
              draftReceipts.map((receipt) => (
                <Card 
                  key={receipt.name} 
                  className="hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-blue-500"
                  onClick={() => onSelectDraftReceipt(receipt.name)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <FileText className="w-4 h-4 text-gray-600" />
                        <span className="font-semibold text-gray-900">{receipt.name}</span>
                      </div>
                      <Badge variant="secondary">Draft</Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm text-gray-600">
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
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">No draft receipts found</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="shortcuts" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {shortcuts.map((shortcut, index) => (
              <Card key={index} className="hover:shadow-md transition-shadow cursor-pointer" onClick={shortcut.action}>
                <CardContent className="p-6 text-center">
                  <shortcut.icon className="w-8 h-8 text-blue-600 mx-auto mb-3" />
                  <p className="font-medium">{shortcut.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ReceiveDashboard;

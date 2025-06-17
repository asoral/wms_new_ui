
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Truck, Package, CheckCircle, FileText, Printer, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createERPNextAPI } from "@/services/erpnextApi";
import { useToast } from "@/hooks/use-toast";
import ReceiveDashboard from "../components/receive/ReceiveDashboard";
import ReceiveForm from "../components/receive/ReceiveForm";
import ReceiveTable from "../components/receive/ReceiveTable";
import POItemsDisplay from "../components/receive/POItemsDisplay";

export interface PurchaseOrder {
  poNumber: string;
  supplier: string;
  date: string;
  totalAmount: number;
  status: 'pending' | 'partial' | 'completed';
  items: POItem[];
}

export interface POItem {
  itemCode: string;
  itemName: string;
  orderedQty: number;
  receivedQty: number;
  pendingQty: number;
  uom: string;
  rate: number;
  warehouse: string;
}

export interface ReceiveEntry {
  itemCode: string;
  itemName: string;
  receivedQty: number;
  warehouse: string;
  batch?: string;
  serial?: string;
  uom: string;
  rate: number;
}

const Receive = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);
  const [receiveEntries, setReceiveEntries] = useState<ReceiveEntry[]>([]);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [poNumber, setPONumber] = useState("");
  const [loading, setLoading] = useState(false);

  const selectPO = async (poNumber: string) => {
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

      // Fetch PO data from ERPNext
      const poResult = await erpnextAPI.getPurchaseOrder(poNumber);
      if (!poResult.data) {
        toast({
          title: "Purchase Order Not Found",
          description: `PO ${poNumber} could not be found in ERPNext.`,
          variant: "destructive"
        });
        return;
      }

      const po = poResult.data;
      
      // Transform ERPNext PO data to our interface
      const transformedPO: PurchaseOrder = {
        poNumber: po.name,
        supplier: po.supplier_name || po.supplier,
        date: po.schedule_date || po.transaction_date,
        totalAmount: po.grand_total || 0,
        status: po.status === 'To Receive' ? 'pending' : 
                po.status === 'Partially Received' ? 'partial' : 'completed',
        items: po.items ? po.items.map((item: any) => ({
          itemCode: item.item_code,
          itemName: item.item_name,
          orderedQty: item.qty || 0,
          receivedQty: item.received_qty || 0,
          pendingQty: (item.qty || 0) - (item.received_qty || 0),
          uom: item.stock_uom || item.uom,
          rate: item.rate || 0,
          warehouse: item.warehouse || 'Main Store'
        })) : []
      };

      setSelectedPO(transformedPO);
      setActiveTab("receive");
      
    } catch (error) {
      console.error('Error fetching PO:', error);
      toast({
        title: "Error",
        description: "Failed to fetch Purchase Order from ERPNext",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePOSearch = () => {
    if (poNumber.trim()) {
      selectPO(poNumber.trim());
    }
  };

  const addReceiveEntry = (entry: ReceiveEntry) => {
    setReceiveEntries(prev => [...prev, entry]);
  };

  const submitReceipt = async () => {
    if (!selectedPO || receiveEntries.length === 0) return;
    
    try {
      const erpnextAPI = await createERPNextAPI();
      if (!erpnextAPI) {
        toast({
          title: "ERPNext Not Configured",
          description: "Please configure your ERPNext settings.",
          variant: "destructive"
        });
        return;
      }

      // Create Purchase Receipt in ERPNext
      const receiptData = {
        supplier: selectedPO.supplier,
        posting_date: new Date().toISOString().split('T')[0],
        items: receiveEntries.map(entry => ({
          item_code: entry.itemCode,
          qty: entry.receivedQty,
          warehouse: entry.warehouse,
          rate: entry.rate,
          uom: entry.uom,
          batch_no: entry.batch,
          serial_no: entry.serial
        }))
      };

      await erpnextAPI.createPurchaseReceipt(receiptData);
      
      toast({
        title: "Success",
        description: "Purchase receipt created successfully!",
      });
      
      // Reset form
      setReceiveEntries([]);
      setSelectedPO(null);
      setActiveTab("dashboard");
      
    } catch (error) {
      console.error('Error creating receipt:', error);
      toast({
        title: "Error",
        description: "Failed to create purchase receipt",
        variant: "destructive"
      });
    }
  };

  const shortcuts = [
    { label: 'Print Label', icon: Printer, action: () => navigate('/print-label') },
    { label: 'Request QC', icon: CheckCircle, action: () => navigate('/quality-check') },
    { label: 'Transfer Stock', icon: ArrowRight, action: () => navigate('/stock-entry') }
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Truck className="w-6 h-6 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">Receive</h1>
          </div>
          {selectedPO && (
            <div className="flex items-center space-x-2">
              <Badge variant="outline">{selectedPO.poNumber}</Badge>
              <Button onClick={submitReceipt} disabled={receiveEntries.length === 0 || loading}>
                <Package className="w-4 h-4 mr-2" />
                Create Receipt
              </Button>
            </div>
          )}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="receive" disabled={!selectedPO}>
              Receive Items
            </TabsTrigger>
            <TabsTrigger value="review" disabled={receiveEntries.length === 0} className="relative">
              Review & Submit
              {receiveEntries.length > 0 && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></div>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <ReceiveDashboard 
              onSelectPO={selectPO}
              shortcuts={shortcuts}
            />
          </TabsContent>

          <TabsContent value="receive">
            {selectedPO && (
              <div className="space-y-6">
                {/* PO Summary */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      Purchase Order Details
                      <Badge variant={selectedPO.status === 'pending' ? 'destructive' : 'default'}>
                        {selectedPO.status}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">PO Number</p>
                        <p className="font-medium">{selectedPO.poNumber}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Supplier</p>
                        <p className="font-medium">{selectedPO.supplier}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Date</p>
                        <p className="font-medium">{selectedPO.date}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Total Amount</p>
                        <p className="font-medium">₹{selectedPO.totalAmount.toLocaleString()}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Receive Form */}
                <Card>
                  <CardHeader>
                    <CardTitle>Scan/Select Items to Receive</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ReceiveForm 
                      poItems={selectedPO.items} 
                      onAddEntry={addReceiveEntry}
                    />
                  </CardContent>
                </Card>

                {/* PO Items */}
                <Card>
                  <CardHeader>
                    <CardTitle>Purchase Order Items</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <POItemsDisplay items={selectedPO.items} />
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          <TabsContent value="review">
            <Card>
              <CardHeader>
                <CardTitle>Review Receipt</CardTitle>
              </CardHeader>
              <CardContent>
                <ReceiveTable entries={receiveEntries} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Receive;

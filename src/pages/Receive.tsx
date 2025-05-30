
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Truck, Package, CheckCircle, FileText, Printer, ArrowRight } from "lucide-react";
import ReceiveDashboard from "../components/receive/ReceiveDashboard";
import ReceiveForm from "../components/receive/ReceiveForm";
import ReceiveTable from "../components/receive/ReceiveTable";

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
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);
  const [receiveEntries, setReceiveEntries] = useState<ReceiveEntry[]>([]);
  const [activeTab, setActiveTab] = useState("dashboard");

  // Mock data for dashboard
  const dashboardData = {
    pendingPOs: 15,
    receiptsThisWeek: 45,
    draftReceipts: 8,
    pendingQC: 12
  };

  // Mock PO data
  const mockPO: PurchaseOrder = {
    poNumber: 'PO-2024-001',
    supplier: 'Tech Supplies Ltd',
    date: '2024-01-15',
    totalAmount: 250000,
    status: 'pending',
    items: [
      {
        itemCode: 'ITM-001',
        itemName: 'Laptop Computer',
        orderedQty: 50,
        receivedQty: 0,
        pendingQty: 50,
        uom: 'Nos',
        rate: 50000,
        warehouse: 'Main Store'
      },
      {
        itemCode: 'ITM-002',
        itemName: 'Wireless Mouse',
        orderedQty: 100,
        receivedQty: 0,
        pendingQty: 100,
        uom: 'Nos',
        rate: 1500,
        warehouse: 'Main Store'
      },
      {
        itemCode: 'ITM-003',
        itemName: 'USB Cable',
        orderedQty: 200,
        receivedQty: 50,
        pendingQty: 150,
        uom: 'Nos',
        rate: 500,
        warehouse: 'Main Store'
      }
    ]
  };

  const selectPO = (poNumber: string) => {
    // In real app, fetch PO data from API
    setSelectedPO(mockPO);
    setActiveTab("receive");
  };

  const addReceiveEntry = (entry: ReceiveEntry) => {
    setReceiveEntries(prev => [...prev, entry]);
  };

  const submitReceipt = () => {
    console.log('Submitting receipt:', {
      po: selectedPO,
      entries: receiveEntries
    });
    alert('Purchase receipt created successfully!');
    
    // Reset form
    setReceiveEntries([]);
    setSelectedPO(null);
    setActiveTab("dashboard");
  };

  const shortcuts = [
    { label: 'Print Label', icon: Printer, action: () => console.log('Print label') },
    { label: 'Request QC', icon: CheckCircle, action: () => console.log('Request QC') },
    { label: 'Transfer Stock', icon: ArrowRight, action: () => console.log('Transfer stock') }
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
              <Button onClick={submitReceipt} disabled={receiveEntries.length === 0}>
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
            <TabsTrigger value="review" disabled={receiveEntries.length === 0}>
              Review & Submit
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <div className="space-y-6">
              {/* Dashboard Cards */}
              <ReceiveDashboard 
                data={dashboardData} 
                onSelectPO={selectPO}
                shortcuts={shortcuts}
              />
            </div>
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
                    <CardTitle>Receive Items</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ReceiveForm 
                      poItems={selectedPO.items} 
                      onAddEntry={addReceiveEntry}
                    />
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

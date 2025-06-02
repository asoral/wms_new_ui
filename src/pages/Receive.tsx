import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Truck, Package, CheckCircle, FileText, Printer, ArrowRight, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
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
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);
  const [receiveEntries, setReceiveEntries] = useState<ReceiveEntry[]>([]);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [poNumber, setPONumber] = useState("");

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

  const handlePOSearch = () => {
    if (poNumber.trim()) {
      selectPO(poNumber.trim());
    }
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
              {receiveEntries.length > 0 && (
                <span className="ml-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {receiveEntries.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <div className="space-y-6">
              {/* PO Search */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Search className="w-5 h-5" />
                    <span>Select Purchase Order</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex space-x-2">
                    <div className="flex-1">
                      <Label htmlFor="poNumber">Purchase Order Number</Label>
                      <Input
                        id="poNumber"
                        value={poNumber}
                        onChange={(e) => setPONumber(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handlePOSearch()}
                        placeholder="Enter PO number..."
                      />
                    </div>
                    <div className="pt-6">
                      <Button onClick={handlePOSearch} disabled={!poNumber.trim()}>
                        <Search className="w-4 h-4 mr-2" />
                        Select PO
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

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

                {/* Receive Form - Now at the top */}
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

                {/* PO Items - Now below the receive form */}
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

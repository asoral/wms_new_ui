
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Truck, Package, CheckCircle, FileText, Printer, ArrowRight, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import DeliverDashboard from "../components/deliver/DeliverDashboard";
import SalesOrderList from "../components/deliver/SalesOrderList";
import DeliveryProcess from "../components/deliver/DeliveryProcess";

export interface SalesOrder {
  id: string;
  number: string;
  customer: string;
  totalItems: number;
  totalValue: number;
  expectedDelivery: string;
  status: "draft" | "confirmed" | "packed" | "shipped" | "To Deliver" | "To Deliver and Bill";
  percentDelivered: number;
  items: SOItem[];
}

export interface SOItem {
  itemCode: string;
  itemName: string;
  warehouse: string;
  qtyToDeliver: number;
  deliveredQty: number;
  rate: number;
  uom: string;
}

export interface DeliveryEntry {
  itemCode: string;
  itemName: string;
  warehouse: string;
  batch?: string;
  serial?: string;
  qtyToDeliver: number;
  actualQty: number;
  rate: number;
  uom: string;
}

const Deliver = () => {
  const navigate = useNavigate();
  const [selectedSO, setSelectedSO] = useState<SalesOrder | null>(null);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [soNumber, setSONumber] = useState("");

  // Mock data for dashboard
  const dashboardData = {
    todaysDelivery: 12,
    totalDeliveries: 145,
    fgStockValue: 2500000,
    averageAge: 15
  };

  // Mock SO data
  const mockSO: SalesOrder = {
    id: '1',
    number: 'SO-2024-001',
    customer: 'ABC Industries Ltd',
    totalItems: 2,
    totalValue: 575000,
    expectedDelivery: '2024-01-16',
    status: 'confirmed',
    percentDelivered: 0,
    items: [
      {
        itemCode: 'ITM-001',
        itemName: 'Laptop Computer',
        qtyToDeliver: 10,
        deliveredQty: 0,
        uom: 'Nos',
        rate: 50000,
        warehouse: 'Main Store'
      },
      {
        itemCode: 'ITM-002',
        itemName: 'Wireless Mouse',
        qtyToDeliver: 50,
        deliveredQty: 0,
        uom: 'Nos',
        rate: 1500,
        warehouse: 'Main Store'
      }
    ]
  };

  const selectSO = (order: SalesOrder) => {
    setSelectedSO(order);
    setActiveTab("process");
  };

  const handleSOSearch = () => {
    if (soNumber.trim()) {
      setSelectedSO(mockSO);
      setActiveTab("process");
    }
  };

  const shortcuts = [
    { label: 'Print Label', icon: Printer, action: () => navigate('/print-label') },
    { label: 'Quality Check', icon: CheckCircle, action: () => navigate('/quality-check') },
    { label: 'Packing', icon: Package, action: () => navigate('/packing') }
  ];

  const viewOrders = () => {
    setActiveTab("orders");
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Truck className="w-6 h-6 text-red-600" />
            <h1 className="text-2xl font-bold text-gray-900">Deliver</h1>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="orders">Sales Orders</TabsTrigger>
            <TabsTrigger value="process" disabled={!selectedSO}>
              Delivery Process
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <div className="space-y-6">
              {/* SO Search */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Search className="w-5 h-5" />
                    <span>Select Sales Order</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex space-x-2">
                    <div className="flex-1">
                      <Label htmlFor="soNumber">Sales Order Number</Label>
                      <Input
                        id="soNumber"
                        value={soNumber}
                        onChange={(e) => setSONumber(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSOSearch()}
                        placeholder="Enter SO number..."
                      />
                    </div>
                    <div className="pt-6">
                      <Button onClick={handleSOSearch} disabled={!soNumber.trim()}>
                        <Search className="w-4 h-4 mr-2" />
                        Select SO
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <DeliverDashboard 
                data={dashboardData} 
                shortcuts={shortcuts}
                onViewOrders={viewOrders}
              />
            </div>
          </TabsContent>

          <TabsContent value="orders">
            <SalesOrderList onSelectOrder={selectSO} />
          </TabsContent>

          <TabsContent value="process">
            {selectedSO && (
              <DeliveryProcess 
                salesOrder={selectedSO}
                onBack={() => setActiveTab("dashboard")}
              />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Deliver;

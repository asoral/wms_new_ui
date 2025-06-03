
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Truck, Package, CheckCircle, FileText, Printer, ArrowRight, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { createERPNextAPI, getUserDefaultCompany } from "@/services/erpnextApi";
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
  const { toast } = useToast();
  const [selectedSO, setSelectedSO] = useState<SalesOrder | null>(null);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [soNumber, setSONumber] = useState("");
  const [dashboardData, setDashboardData] = useState({
    todaysDelivery: 0,
    totalDeliveries: 0,
    fgStockValue: 0,
    averageAge: 0
  });
  const [loading, setLoading] = useState(true);

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

      // Fetch real data from ERPNext
      const [soResult, dnResult] = await Promise.allSettled([
        erpnextAPI.getSalesOrders([['status', '=', 'To Deliver']], defaultCompany || undefined),
        erpnextAPI.getDeliveryNotes(undefined, defaultCompany || undefined)
      ]);

      const todaysDelivery = soResult.status === 'fulfilled' && soResult.value?.data ? soResult.value.data.length : 0;
      const totalDeliveries = dnResult.status === 'fulfilled' && dnResult.value?.data ? dnResult.value.data.length : 0;

      setDashboardData({
        todaysDelivery,
        totalDeliveries,
        fgStockValue: 0, // Calculate from stock balance
        averageAge: 0 // Calculate from delivery notes
      });

    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data from ERPNext",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSOSearch = async () => {
    if (!soNumber.trim()) return;

    try {
      const erpnextAPI = await createERPNextAPI();
      if (!erpnextAPI) {
        toast({
          title: "ERPNext Not Configured",
          description: "Please configure your ERPNext settings first.",
          variant: "destructive"
        });
        return;
      }

      const result = await erpnextAPI.getSalesOrder(soNumber.trim());
      if (result?.data) {
        // Convert ERPNext data to our SalesOrder format
        const soData = result.data;
        const salesOrder: SalesOrder = {
          id: soData.name,
          number: soData.name,
          customer: soData.customer,
          totalItems: soData.items?.length || 0,
          totalValue: soData.grand_total || 0,
          expectedDelivery: soData.delivery_date || '',
          status: soData.status === 'To Deliver' ? 'To Deliver' : 'confirmed',
          percentDelivered: soData.per_delivered || 0,
          items: soData.items?.map((item: any) => ({
            itemCode: item.item_code,
            itemName: item.item_name,
            warehouse: item.warehouse,
            qtyToDeliver: item.qty,
            deliveredQty: item.delivered_qty || 0,
            rate: item.rate,
            uom: item.uom
          })) || []
        };
        
        setSelectedSO(salesOrder);
        setActiveTab("process");
        toast({
          title: "Sales Order Found",
          description: `Loaded SO: ${soData.name}`,
        });
      }
    } catch (error) {
      console.error('Failed to fetch sales order:', error);
      toast({
        title: "Sales Order Not Found",
        description: "Please check the SO number and try again.",
        variant: "destructive"
      });
    }
  };

  const selectSO = (order: SalesOrder) => {
    setSelectedSO(order);
    setActiveTab("process");
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

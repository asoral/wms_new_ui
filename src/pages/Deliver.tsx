
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Truck, Package, Search, CheckCircle, Printer, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createERPNextAPI, getUserDefaultCompany } from "@/services/erpnextApi";
import { useToast } from "@/hooks/use-toast";
import DeliverDashboard from "../components/deliver/DeliverDashboard";
import DeliveryProcess from "../components/deliver/DeliveryProcess";

export interface SalesOrder {
  number: string;
  customer: string;
  status: string;
  deliveryDate: string;
  totalItems: number;
  totalValue: number;
  items: SOItem[];
  id?: string;
  expectedDelivery?: string;
  percentDelivered?: number;
}

export interface SOItem {
  itemCode: string;
  itemName: string;
  orderedQty: number;
  deliveredQty: number;
  pendingQty: number;
  rate: number;
  uom: string;
  warehouse: string;
  qtyToDeliver?: number;
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
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [salesOrders, setSalesOrders] = useState<SalesOrder[]>([]);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [dashboardData, setDashboardData] = useState({
    todaysDelivery: 0,
    totalDeliveries: 0,
    fgStockValue: 0,
    averageAge: 0
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const erpnextAPI = await createERPNextAPI();
      if (!erpnextAPI) {
        return;
      }

      const defaultCompany = await getUserDefaultCompany();
      
      // Get today's date in YYYY-MM-DD format
      const today = new Date().toISOString().split('T')[0];
      
      // Fetch delivery notes for today
      const deliveryNotesResult = await erpnextAPI.sales.getDeliveryNotes([
        ['posting_date', '=', today]
      ], defaultCompany || undefined);
      
      // Fetch all delivery notes for total count
      const allDeliveryNotesResult = await erpnextAPI.sales.getDeliveryNotes(
        undefined, 
        defaultCompany || undefined
      );

      // Fetch stock balance to calculate FG stock value (simplified)
      const stockResult = await erpnextAPI.stock.getStockBalance(
        undefined, 
        defaultCompany || undefined
      );

      setDashboardData({
        todaysDelivery: deliveryNotesResult.data ? deliveryNotesResult.data.length : 0,
        totalDeliveries: allDeliveryNotesResult.data ? allDeliveryNotesResult.data.length : 0,
        fgStockValue: stockResult.data ? 
          stockResult.data.reduce((sum: number, item: any) => sum + (item.stock_value || 0), 0) : 0,
        averageAge: 15 // Placeholder - would need custom calculation
      });

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  };

  const searchSalesOrders = async () => {
    if (!searchTerm.trim()) {
      toast({
        title: "Search Required",
        description: "Please enter a sales order number or customer name to search.",
        variant: "destructive"
      });
      return;
    }

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

      const defaultCompany = await getUserDefaultCompany();
      
      // Search for Sales Orders with delivery-related statuses
      const filters = [
        ['status', 'in', ['To Deliver', 'To Deliver and Bill', 'Partially Delivered']],
        '|',
        ['name', 'like', `%${searchTerm}%`],
        ['customer', 'like', `%${searchTerm}%`]
      ];

      const salesOrdersResult = await erpnextAPI.sales.getSalesOrders(
        filters,
        defaultCompany || undefined,
        20
      );
      
      if (salesOrdersResult.data) {
        const transformedOrders: SalesOrder[] = salesOrdersResult.data.map((so: any) => ({
          number: so.name,
          customer: so.customer_name || so.customer,
          status: so.status,
          deliveryDate: so.delivery_date || so.transaction_date,
          totalItems: so.items ? so.items.length : 0,
          totalValue: so.grand_total || 0,
          items: so.items ? so.items.map((item: any) => ({
            itemCode: item.item_code,
            itemName: item.item_name,
            orderedQty: item.qty || 0,
            deliveredQty: item.delivered_qty || 0,
            pendingQty: (item.qty || 0) - (item.delivered_qty || 0),
            rate: item.rate || 0,
            uom: item.stock_uom || item.uom,
            warehouse: item.warehouse || 'Main Store',
            qtyToDeliver: (item.qty || 0) - (item.delivered_qty || 0)
          })) : []
        }));
        
        setSalesOrders(transformedOrders);
      }
      
    } catch (error) {
      console.error('Error searching sales orders:', error);
      toast({
        title: "Error",
        description: "Failed to search sales orders from ERPNext",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const selectSalesOrder = async (soNumber: string) => {
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

      // Fetch SO data from ERPNext
      const soResult = await erpnextAPI.sales.getSalesOrder(soNumber);
      if (!soResult.data) {
        toast({
          title: "Sales Order Not Found",
          description: `SO ${soNumber} could not be found in ERPNext.`,
          variant: "destructive"
        });
        return;
      }

      const so = soResult.data;
      
      // Transform ERPNext SO data to our interface
      const transformedSO: SalesOrder = {
        number: so.name,
        customer: so.customer_name || so.customer,
        status: so.status,
        deliveryDate: so.delivery_date || so.transaction_date,
        totalItems: so.items ? so.items.length : 0,
        totalValue: so.grand_total || 0,
        items: so.items ? so.items.map((item: any) => ({
          itemCode: item.item_code,
          itemName: item.item_name,
          orderedQty: item.qty || 0,
          deliveredQty: item.delivered_qty || 0,
          pendingQty: (item.qty || 0) - (item.delivered_qty || 0),
          rate: item.rate || 0,
          uom: item.stock_uom || item.uom,
          warehouse: item.warehouse || 'Main Store',
          qtyToDeliver: (item.qty || 0) - (item.delivered_qty || 0)
        })) : []
      };

      setSelectedSO(transformedSO);
      setActiveTab("deliver");
      
    } catch (error) {
      console.error('Error fetching SO:', error);
      toast({
        title: "Error",
        description: "Failed to fetch Sales Order from ERPNext",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const shortcuts = [
    { label: 'Print Label', icon: Printer, action: () => navigate('/print-label') },
    { label: 'Quality Check', icon: CheckCircle, action: () => navigate('/quality-check') },
    { label: 'Stock Transfer', icon: ArrowRight, action: () => navigate('/stock-entry') }
  ];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "To Deliver":
        return "bg-blue-100 text-blue-800";
      case "To Deliver and Bill":
        return "bg-green-100 text-green-800";
      case "Partially Delivered":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const tabsList = selectedSO 
    ? ["dashboard", "deliver", "review"] 
    : ["dashboard"];

  const tabsLabels = {
    dashboard: "Dashboard",
    deliver: "Deliver Items", 
    review: "Review & Submit"
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Truck className="w-6 h-6 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">Deliver</h1>
          </div>
          {selectedSO && (
            <Badge variant="outline">{selectedSO.number}</Badge>
          )}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className={`grid w-full ${selectedSO ? 'grid-cols-3' : 'grid-cols-1'}`}>
            {tabsList.map((tab) => (
              <TabsTrigger key={tab} value={tab} disabled={tab !== "dashboard" && !selectedSO}>
                {tabsLabels[tab as keyof typeof tabsLabels]}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <DeliverDashboard 
              data={dashboardData}
              shortcuts={shortcuts}
              onViewOrders={() => {}} // No separate search tab
            />
            
            {/* Search Sales Orders in Dashboard */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Search className="w-5 h-5" />
                  <span>Select Sales Order</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="searchSO">Search Sales Order</Label>
                    <div className="flex space-x-2">
                      <Input
                        id="searchSO"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Type at least 2 characters to search SO number, customer name..."
                        onKeyPress={(e) => e.key === 'Enter' && searchSalesOrders()}
                      />
                      <Button onClick={searchSalesOrders} disabled={loading}>
                        {loading ? 'Searching...' : 'Search'}
                      </Button>
                    </div>
                  </div>

                  {/* Sales Orders List */}
                  {salesOrders.length > 0 && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {salesOrders.map((order) => (
                        <Card key={order.number} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => selectSalesOrder(order.number)}>
                          <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-lg">{order.number}</CardTitle>
                              <Badge className={getStatusColor(order.status)}>
                                {order.status}
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="text-gray-600">Customer:</span>
                                <p className="font-medium">{order.customer}</p>
                              </div>
                              <div>
                                <span className="text-gray-600">Delivery Date:</span>
                                <p>{new Date(order.deliveryDate).toLocaleDateString()}</p>
                              </div>
                              <div>
                                <span className="text-gray-600">Items:</span>
                                <p>{order.totalItems} items</p>
                              </div>
                              <div>
                                <span className="text-gray-600">Total Value:</span>
                                <p>{formatCurrency(order.totalValue)}</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}

                  {salesOrders.length === 0 && searchTerm && !loading && (
                    <div className="text-center py-8 text-gray-500">
                      No sales orders found matching your search criteria.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {selectedSO && (
            <>
              <TabsContent value="deliver" className="space-y-6">
                <DeliveryProcess 
                  salesOrder={selectedSO}
                  onBack={() => {
                    setSelectedSO(null);
                    setActiveTab("dashboard");
                  }}
                  onNext={() => setActiveTab("review")}
                />
              </TabsContent>

              <TabsContent value="review" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Review & Submit Delivery Note</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8 text-gray-500">
                      Review and submit functionality coming soon...
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </>
          )}
        </Tabs>
      </div>
    </div>
  );
};

export default Deliver;

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Package, Truck, FileText, CheckCircle2, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { createERPNextAPI, getUserDefaultCompany } from "@/services/erpnextApi";
import DeliveryProcess from "@/components/deliver/DeliveryProcess";
import DeliveryTable from "@/components/deliver/DeliveryTable";
import { format } from 'date-fns';

export interface SalesOrderOption {
  id: string;
  number: string;
  customer: string;
  status: string;
  delivery_date?: string;
  totalValue: number;
  totalItems: number;
  expectedDelivery?: string;
  percentDelivered: number;
}

export interface DashboardData {
  pendingOrders: number;
  readyToShip: number;
  overdue: number;
  deliveredToday: number;
}

export interface SOItem {
  itemCode: string;
  itemName: string;
  orderedQty: number;
  deliveredQty: number;
  pendingQty: number;
  uom: string;
  rate: number;
  warehouse?: string;
}

// Update the existing SalesOrder interface to include missing properties
export interface SalesOrder {
  name: string;
  id: string;
  number: string;
  customer: string;
  customer_name?: string;
  status: string;
  delivery_date?: string;
  deliveryDate?: string;
  expectedDelivery?: string;
  grand_total: number;
  totalValue: number;
  totalItems: number;
  percentDelivered: number;
  per_delivered?: number;
  items: SalesOrderItem[];
}

// Update SalesOrderItem to include missing properties
export interface SalesOrderItem {
  name: string;
  item_code: string;
  itemCode: string;
  item_name: string;
  itemName: string;
  qty: number;
  orderedQty: number;
  delivered_qty: number;
  deliveredQty: number;
  pending_qty: number;
  pendingQty: number;
  rate: number;
  stock_uom: string;
  uom: string;
  warehouse?: string;
}

// Update DeliveryEntry to include missing properties
export interface DeliveryEntry {
  itemCode: string;
  itemName: string;
  deliveredQty: number;
  qtyToDeliver: number;
  warehouse: string;
  batch?: string;
  serial?: string;
  uom: string;
  rate: number;
  salesOrderItem: string;
}

const Deliver = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"dashboard" | "process" | "review">("dashboard");
  const [salesOrder, setSalesOrder] = useState<SalesOrder | null>(null);
  const [deliveryEntries, setDeliveryEntries] = useState<DeliveryEntry[]>([]);
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    pendingOrders: 0,
    readyToShip: 0,
    overdue: 0,
    deliveredToday: 0,
  });
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<SalesOrderOption[]>([]);
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

      // Fetch dummy dashboard data
      const dashboardData = {
        pendingOrders: Math.floor(Math.random() * 50),
        readyToShip: Math.floor(Math.random() * 30),
        overdue: Math.floor(Math.random() * 10),
        deliveredToday: Math.floor(Math.random() * 20),
      };
      setDashboardData(dashboardData);

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

  const searchSalesOrders = async () => {
    if (!searchTerm) return;

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

      // Fetch sales orders based on the search term
      const response = await erpnextAPI.getSalesOrders({
        'customer': ['like', `%${searchTerm}%`]
      });

      if (response?.data) {
        const transformedResults: SalesOrderOption[] = response.data.map((so: any) => ({
          id: so.name,
          number: so.name,
          customer: so.customer,
          status: so.status,
          delivery_date: so.delivery_date,
          totalValue: so.grand_total,
          totalItems: so.total_qty,
          percentDelivered: so.per_delivered
        }));
        setSearchResults(transformedResults);
      } else {
        setSearchResults([]);
      }

    } catch (error) {
      console.error('Failed to search sales orders:', error);
      toast({
        title: "Error",
        description: "Failed to search sales orders from ERPNext",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadSalesOrderDetails = async (salesOrderNumber: string) => {
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

      // Fetch the sales order details
      const response = await erpnextAPI.getSalesOrder(salesOrderNumber);

      if (response?.data) {
        // Transform the sales order data
        const transformedSO: SalesOrder = {
          name: response.data.name,
          id: response.data.name,
          number: response.data.name,
          customer: response.data.customer,
          customer_name: response.data.customer_name,
          status: response.data.status,
          delivery_date: response.data.delivery_date,
          deliveryDate: response.data.delivery_date,
          expectedDelivery: response.data.delivery_date,
          grand_total: response.data.grand_total,
          totalValue: response.data.grand_total,
          totalItems: response.data.total_qty,
          percentDelivered: response.data.per_delivered,
          per_delivered: response.data.per_delivered,
          items: response.data.items.map((item: any) => ({
            name: item.name,
            item_code: item.item_code,
            itemCode: item.item_code,
            item_name: item.item_name,
            itemName: item.item_name,
            qty: item.qty,
            orderedQty: item.qty,
            delivered_qty: item.delivered_qty,
            deliveredQty: item.delivered_qty,
            pending_qty: item.pending_qty,
            pendingQty: item.pending_qty,
            rate: item.rate,
            stock_uom: item.stock_uom,
            uom: item.stock_uom,
            warehouse: item.warehouse
          }))
        };
        setSalesOrder(transformedSO);
        setActiveTab("process");
      } else {
        toast({
          title: "Sales Order Not Found",
          description: `Sales order ${salesOrderNumber} not found in ERPNext`,
          variant: "destructive"
        });
      }

    } catch (error) {
      console.error('Failed to load sales order details:', error);
      toast({
        title: "Error",
        description: "Failed to load sales order details from ERPNext",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSOSelect = async (salesOrderOption: SalesOrderOption) => {
    await loadSalesOrderDetails(salesOrderOption.number);
  };

  const handleAddDeliveryEntry = (entry: DeliveryEntry) => {
    setDeliveryEntries([...deliveryEntries, entry]);
  };

  const handleRemoveDeliveryEntry = async (index: number) => {
    const updatedEntries = [...deliveryEntries];
    updatedEntries.splice(index, 1);
    setDeliveryEntries(updatedEntries);
  
    toast({
      title: "Item Removed",
      description: "Item removed from delivery list.",
    });
  };

  const handleSubmitDelivery = async () => {
    if (!salesOrder) {
      toast({
        title: "No Sales Order",
        description: "Please select a sales order to deliver.",
        variant: "destructive"
      });
      return;
    }

    if (deliveryEntries.length === 0) {
      toast({
        title: "No Items",
        description: "Please add items to the delivery list.",
        variant: "destructive"
      });
      return;
    }

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

      // Prepare the delivery data
      const deliveryData = {
        sales_order: salesOrder.name,
        customer: salesOrder.customer,
        company: 'Siddhivinayak Impex', // Replace with dynamic value if needed
        items: deliveryEntries.map(entry => ({
          item_code: entry.itemCode,
          qty: entry.qtyToDeliver,
          rate: entry.rate,
          uom: entry.uom,
          warehouse: entry.warehouse,
          batch_no: entry.batch,
          serial_no: entry.serial,
          sales_order_item: entry.salesOrderItem
        }))
      };

      // Submit the delivery data to ERPNext
      const response = await erpnextAPI.submitDeliveryNote(deliveryData);

      if (response?.data) {
        toast({
          title: "Delivery Submitted",
          description: "Delivery note submitted successfully.",
        });
        // Reset state and go back to dashboard
        setSalesOrder(null);
        setDeliveryEntries([]);
        setActiveTab("dashboard");
      } else {
        toast({
          title: "Delivery Failed",
          description: "Failed to submit delivery note.",
          variant: "destructive"
        });
      }

    } catch (error) {
      console.error('Failed to submit delivery:', error);
      toast({
        title: "Error",
        description: "Failed to submit delivery to ERPNext",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBackToDashboard = () => {
    setSalesOrder(null);
    setDeliveryEntries([]);
    setActiveTab("dashboard");
  };

  const handleReview = () => {
    setActiveTab("review");
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    try {
      const date = new Date(dateStr);
      return format(date, 'dd-MMM-yyyy');
    } catch (error) {
      console.error("Error formatting date:", error);
      return 'Invalid Date';
    }
  };

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Truck className="w-6 h-6 text-blue-600" />
          <h1 className="text-2xl font-bold">Deliver Items</h1>
        </div>
        <Button variant="outline" onClick={() => navigate('/')}>
          <FileText className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>
      </div>

      {loading && (
        <div className="fixed top-0 left-0 w-full h-full bg-gray-100 bg-opacity-50 z-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-4">
        <TabsList className="bg-gray-100 rounded-lg p-1 flex space-x-1">
          <TabsTrigger value="dashboard" className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md px-4 py-2 font-medium text-gray-700">Dashboard</TabsTrigger>
          <TabsTrigger value="process" disabled={!salesOrder} className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md px-4 py-2 font-medium text-gray-700">Process Delivery</TabsTrigger>
          <TabsTrigger value="review" disabled={deliveryEntries.length === 0} className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md px-4 py-2 font-medium text-gray-700">Review & Submit</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="outline-none">
          <Card>
            <CardHeader>
              <CardTitle>Dashboard</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-blue-600 mb-1">Pending Orders</p>
                        <p className="text-2xl font-bold text-blue-600">{dashboardData.pendingOrders}</p>
                      </div>
                      <AlertTriangle className="w-8 h-8 text-blue-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-green-50 border-green-200">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-green-600 mb-1">Ready to Ship</p>
                        <p className="text-2xl font-bold text-green-600">{dashboardData.readyToShip}</p>
                      </div>
                      <Package className="w-8 h-8 text-green-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-red-50 border-red-200">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-red-600 mb-1">Overdue Deliveries</p>
                        <p className="text-2xl font-bold text-red-600">{dashboardData.overdue}</p>
                      </div>
                      <Truck className="w-8 h-8 text-red-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-purple-50 border-purple-200">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-purple-600 mb-1">Delivered Today</p>
                        <p className="text-2xl font-bold text-purple-600">{dashboardData.deliveredToday}</p>
                      </div>
                      <CheckCircle2 className="w-8 h-8 text-purple-600" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="mt-6">
                <h2 className="text-xl font-semibold mb-4">Select Sales Order</h2>
                <div className="flex space-x-2">
                  <Input
                    type="text"
                    placeholder="Search by customer name"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <Button onClick={searchSalesOrders} disabled={loading}>
                    Search
                  </Button>
                </div>

                {searchResults.length > 0 && (
                  <div className="mt-4">
                    <h3 className="text-lg font-medium mb-2">Search Results</h3>
                    <div className="max-h-40 overflow-y-auto">
                      {searchResults.map((so) => (
                        <div
                          key={so.id}
                          className="p-3 hover:bg-gray-100 cursor-pointer rounded-md"
                          onClick={() => handleSOSelect(so)}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-semibold">{so.number}</p>
                              <p className="text-sm text-gray-600">{so.customer}</p>
                            </div>
                            <Badge>{so.status}</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="process" className="outline-none">
          {salesOrder ? (
            <DeliveryProcess
              salesOrder={salesOrder}
              onBack={handleBackToDashboard}
              onNext={handleReview}
              onAddEntry={handleAddDeliveryEntry}
            />
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <Package className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-500">No sales order selected. Please select a sales order from the dashboard to start processing the delivery.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="review" className="outline-none">
          {deliveryEntries.length > 0 ? (
            <div className="space-y-4">
              <DeliveryTable
                entries={deliveryEntries}
                onRemoveEntry={handleRemoveDeliveryEntry}
              />
              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setActiveTab("process")}>
                  Back to Delivery
                </Button>
                <Button onClick={handleSubmitDelivery} disabled={loading}>
                  Submit Delivery
                </Button>
              </div>
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <Package className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-500">No items added for delivery. Please add items from the delivery process tab.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Deliver;

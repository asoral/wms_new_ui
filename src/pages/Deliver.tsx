import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Truck, Package, CheckCircle, Printer, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createERPNextAPI, getUserDefaultCompany } from "@/services/erpnextApi";
import { useToast } from "@/hooks/use-toast";
import DeliverDashboard from "../components/deliver/DeliverDashboard";
import SalesOrderSelector from "../components/deliver/SalesOrderSelector";
import EnhancedDeliveryItemScanner from "../components/deliver/EnhancedDeliveryItemScanner";
import DeliveryTable from "../components/deliver/DeliveryTable";
import DraftDeliveryNotes from "../components/deliver/DraftDeliveryNotes";

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
  const [activeTab, setActiveTab] = useState("dashboard");
  const [currentDeliveryNote, setCurrentDeliveryNote] = useState<string | null>(null);
  const [deliveryEntries, setDeliveryEntries] = useState<DeliveryEntry[]>([]);
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
      console.log('Fetching dashboard data for company:', defaultCompany);
      
      // Get today's date in YYYY-MM-DD format
      const today = new Date().toISOString().split('T')[0];
      
      // Fetch delivery notes for today
      const deliveryNotesResult = await erpnextAPI.sales.getDeliveryNotes([
        ['posting_date', '=', today],
        ['docstatus', '=', 1]
      ], defaultCompany || undefined);
      
      // Fetch all delivery notes for total count
      const allDeliveryNotesResult = await erpnextAPI.sales.getDeliveryNotes([
        ['docstatus', '=', 1]
      ], defaultCompany || undefined);

      // Fetch stock balance to calculate FG stock value (simplified)
      let stockValue = 0;
      try {
        const stockResult = await erpnextAPI.stock.getStockBalance(
          undefined, 
          defaultCompany || undefined
        );
        stockValue = stockResult.data ? 
          stockResult.data.reduce((sum: number, item: any) => sum + (item.stock_value || 0), 0) : 0;
      } catch (error) {
        console.warn('Could not fetch stock balance:', error);
      }

      setDashboardData({
        todaysDelivery: deliveryNotesResult.data ? deliveryNotesResult.data.length : 0,
        totalDeliveries: allDeliveryNotesResult.data ? allDeliveryNotesResult.data.length : 0,
        fgStockValue: stockValue,
        averageAge: 15 // Placeholder - would need custom calculation
      });

      console.log('Dashboard data updated:', {
        todaysDelivery: deliveryNotesResult.data ? deliveryNotesResult.data.length : 0,
        totalDeliveries: allDeliveryNotesResult.data ? allDeliveryNotesResult.data.length : 0,
        fgStockValue: stockValue
      });

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  };

  const selectSalesOrder = (order: SalesOrder) => {
    console.log('Selected sales order:', order);
    setSelectedSO(order);
    setActiveTab("deliver");
  };

  const handleDraftSelected = (draftName: string) => {
    setCurrentDeliveryNote(draftName);
    toast({
      title: "Draft Loaded",
      description: `Draft delivery note ${draftName} loaded.`,
    });
  };

  const addDeliveryEntry = (entry: DeliveryEntry) => {
    console.log('Adding delivery entry:', entry);
    setDeliveryEntries(prev => [...prev, entry]);
  };

  const removeDeliveryEntry = (index: number) => {
    setDeliveryEntries(prev => prev.filter((_, i) => i !== index));
  };

  const submitDeliveryNote = async () => {
    if (!selectedSO || deliveryEntries.length === 0) {
      toast({
        title: "No Items to Deliver",
        description: "Please add items to deliver first.",
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
          description: "Please configure your ERPNext settings.",
          variant: "destructive"
        });
        return;
      }

      const company = await getUserDefaultCompany();
      console.log('Creating delivery note for company:', company);

      // Create delivery note data
      const deliveryData = {
        customer: selectedSO.customer,
        company: company,
        posting_date: new Date().toISOString().split('T')[0],
        against_sales_order: selectedSO.number,
        set_posting_time: 1,
        items: deliveryEntries.map(entry => ({
          item_code: entry.itemCode,
          qty: entry.qtyToDeliver,
          warehouse: entry.warehouse,
          rate: entry.rate,
          uom: entry.uom,
          against_sales_order: selectedSO.number,
          ...(entry.batch && { batch_no: entry.batch }),
          ...(entry.serial && { serial_no: entry.serial })
        }))
      };

      console.log('Delivery note data:', deliveryData);

      if (currentDeliveryNote) {
        // Update existing delivery note
        await erpnextAPI.sales.updateDeliveryNote(currentDeliveryNote, deliveryData);
        toast({
          title: "Success",
          description: `Delivery note ${currentDeliveryNote} updated successfully!`,
        });
      } else {
        // Create new delivery note
        const result = await erpnextAPI.sales.createDeliveryNote(deliveryData);
        console.log('Delivery note created:', result);
        toast({
          title: "Success",
          description: `Delivery note ${result.data?.name} created successfully!`,
        });
      }
      
      // Reset form
      setDeliveryEntries([]);
      setSelectedSO(null);
      setCurrentDeliveryNote(null);
      setActiveTab("dashboard");
      
      // Refresh dashboard data
      await fetchDashboardData();
      
    } catch (error) {
      console.error('Error submitting delivery note:', error);
      toast({
        title: "Error",
        description: `Failed to create delivery note: ${error instanceof Error ? error.message : 'Unknown error'}`,
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
            <div className="flex items-center space-x-2">
              <Badge variant="outline">{selectedSO.number}</Badge>
              {currentDeliveryNote && (
                <Badge variant="secondary">DN: {currentDeliveryNote}</Badge>
              )}
              <Button onClick={submitDeliveryNote} disabled={!selectedSO || loading || deliveryEntries.length === 0}>
                <Package className="w-4 h-4 mr-2" />
                {loading ? 'Submitting...' : 'Submit Delivery Note'}
              </Button>
            </div>
          )}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="deliver" disabled={!selectedSO}>
              Deliver Items
            </TabsTrigger>
            <TabsTrigger value="review" disabled={deliveryEntries.length === 0} className="relative">
              Review & Submit
              {deliveryEntries.length > 0 && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></div>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            {/* Sales Order Selector */}
            <SalesOrderSelector 
              onOrderSelected={selectSalesOrder}
              loading={loading}
            />

            {/* Dashboard Content */}
            <DeliverDashboard 
              data={dashboardData}
              shortcuts={shortcuts}
              onViewOrders={() => {
                toast({
                  title: "Feature Coming Soon",
                  description: "Advanced sales order search will be available soon.",
                });
              }}
            />

            {/* Draft Delivery Notes */}
            <DraftDeliveryNotes onSelectDraft={handleDraftSelected} />
          </TabsContent>

          {selectedSO && (
            <>
              <TabsContent value="deliver" className="space-y-6">
                {/* Sales Order Summary Card */}
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="p-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="text-center p-3 bg-white rounded-lg shadow-sm">
                        <div className="text-xl font-bold text-gray-900 truncate" title={selectedSO.customer}>
                          {selectedSO.customer}
                        </div>
                        <div className="text-sm text-gray-600">Customer</div>
                      </div>
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <div className="text-xl font-bold text-green-600">{selectedSO.totalItems}</div>
                        <div className="text-sm text-gray-600">Total Items</div>
                      </div>
                      <div className="text-center p-3 bg-purple-50 rounded-lg">
                        <div className="text-xl font-bold text-purple-600">₹{selectedSO.totalValue.toLocaleString()}</div>
                        <div className="text-sm text-gray-600">Total Value</div>
                      </div>
                      <div className="text-center p-3 bg-orange-50 rounded-lg">
                        <div className="text-xl font-bold text-orange-600">
                          {new Date(selectedSO.deliveryDate).toLocaleDateString()}
                        </div>
                        <div className="text-sm text-gray-600">Delivery Date</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Enhanced Item Scanner */}
                <EnhancedDeliveryItemScanner 
                  soItems={selectedSO.items}
                  onAddEntry={addDeliveryEntry}
                />

                {/* Sales Order Items Table */}
                <Card>
                  <CardHeader>
                    <CardTitle>Sales Order Items</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="bg-gray-50">
                            <th className="text-left p-3 border text-sm font-medium">Item Code</th>
                            <th className="text-left p-3 border text-sm font-medium">Item Name</th>
                            <th className="text-left p-3 border text-sm font-medium">Ordered</th>
                            <th className="text-left p-3 border text-sm font-medium">Delivered</th>
                            <th className="text-left p-3 border text-sm font-medium">Pending</th>
                            <th className="text-left p-3 border text-sm font-medium">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedSO.items.map((item, index) => (
                            <tr key={index} className="border-b hover:bg-gray-50">
                              <td className="p-3 border text-sm font-medium">{item.itemCode}</td>
                              <td className="p-3 border text-sm">{item.itemName}</td>
                              <td className="p-3 border text-sm">{item.orderedQty} {item.uom}</td>
                              <td className="p-3 border text-sm">{item.deliveredQty} {item.uom}</td>
                              <td className="p-3 border text-sm">{item.pendingQty} {item.uom}</td>
                              <td className="p-3 border text-sm">
                                <Badge variant={item.pendingQty > 0 ? "default" : "secondary"}>
                                  {item.pendingQty > 0 ? "Pending" : "Delivered"}
                                </Badge>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="review" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Review & Submit Delivery Note</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {deliveryEntries.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        No items added for delivery. Go back to add items.
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <DeliveryTable entries={deliveryEntries} />
                        <div className="flex justify-between items-center pt-4">
                          <Button 
                            variant="outline" 
                            onClick={() => setActiveTab("deliver")}
                          >
                            Back to Add Items
                          </Button>
                          <Button onClick={submitDeliveryNote} disabled={loading}>
                            {loading ? 'Submitting...' : 'Submit Delivery Note'}
                          </Button>
                        </div>
                      </div>
                    )}
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

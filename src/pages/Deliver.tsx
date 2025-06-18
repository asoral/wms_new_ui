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
import EnhancedDeliveryForm from "../components/deliver/EnhancedDeliveryForm";
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

  const tabsList = selectedSO 
    ? ["dashboard", "deliver", "review"] 
    : ["dashboard"];

  const tabsLabels = {
    dashboard: "Dashboard",
    deliver: "Scan & Add Items", 
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
          <TabsList className={`grid w-full ${selectedSO ? 'grid-cols-3' : 'grid-cols-1'}`}>
            {tabsList.map((tab) => (
              <TabsTrigger key={tab} value={tab} disabled={tab !== "dashboard" && !selectedSO}>
                {tabsLabels[tab as keyof typeof tabsLabels]}
              </TabsTrigger>
            ))}
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
                {/* Sales Order Summary */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <span>Delivering: {selectedSO.number}</span>
                      <Badge>{selectedSO.status}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <div className="text-lg md:text-xl font-bold text-gray-900 break-words">{selectedSO.customer}</div>
                        <div className="text-sm text-gray-600">Customer</div>
                      </div>
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <div className="text-xl md:text-2xl font-bold text-green-600">{selectedSO.totalItems}</div>
                        <div className="text-sm text-gray-600">Total Items</div>
                      </div>
                      <div className="text-center p-3 bg-purple-50 rounded-lg">
                        <div className="text-lg md:text-xl font-bold text-purple-600">₹{selectedSO.totalValue.toLocaleString()}</div>
                        <div className="text-sm text-gray-600">Total Value</div>
                      </div>
                      <div className="text-center p-3 bg-orange-50 rounded-lg">
                        <div className="text-lg md:text-xl font-bold text-orange-600">
                          {new Date(selectedSO.deliveryDate).toLocaleDateString()}
                        </div>
                        <div className="text-sm text-gray-600">Delivery Date</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Enhanced Delivery Form */}
                <EnhancedDeliveryForm 
                  soItems={selectedSO.items}
                  onAddEntry={addDeliveryEntry}
                />

                {/* Current Delivery Items */}
                {deliveryEntries.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Items to Deliver ({deliveryEntries.length})</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <DeliveryTable entries={deliveryEntries} />
                    </CardContent>
                  </Card>
                )}

                {/* Navigation */}
                <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
                  <Button variant="outline" onClick={() => {
                    setSelectedSO(null);
                    setActiveTab("dashboard");
                    setDeliveryEntries([]);
                  }}>
                    Back to Dashboard
                  </Button>
                  <Button onClick={() => setActiveTab("review")} size="lg" disabled={deliveryEntries.length === 0}>
                    Review & Submit ({deliveryEntries.length} items)
                  </Button>
                </div>
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

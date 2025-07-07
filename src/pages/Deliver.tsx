import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createERPNextAPI } from "@/services/erpnextApi";
import { useToast } from "@/hooks/use-toast";
import { Truck, ArrowLeft } from "lucide-react";
import DeliverDashboard from "@/components/deliver/DeliverDashboard";
import EnhancedDeliveryItemScanner from "@/components/deliver/EnhancedDeliveryItemScanner";
import DeliveryTable from "@/components/deliver/DeliveryTable";
import { SalesOrder, SalesOrderOption, DashboardData, DeliveryEntry } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Deliver = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<'dashboard' | 'deliver' | 'review'>('dashboard');
  const [selectedSalesOrder, setSelectedSalesOrder] = useState<SalesOrder | null>(null);
  const [deliveryEntries, setDeliveryEntries] = useState<DeliveryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const [dashboardData, setDashboardData] = useState<DashboardData>({
    pendingOrders: 0,
    readyToShip: 0,
    overdue: 0,
    deliveredToday: 0,
  });

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

      // Set default dashboard data since the get_counts API doesn't exist
      setDashboardData({
        pendingOrders: 0,
        readyToShip: 0,
        overdue: 0,
        deliveredToday: 0,
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

  const handleSelectSalesOrder = async (salesOrderOption: SalesOrderOption) => {
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

      // Fetch full sales order details
      const response = await erpnextAPI.getSalesOrder(salesOrderOption.number);
      
      if (response?.data) {
        const salesOrder: SalesOrder = {
          id: response.data.name,
          name: response.data.name,
          number: response.data.name,
          customer: response.data.customer,
          status: response.data.status,
          totalValue: response.data.grand_total || 0,
          grand_total: response.data.grand_total || 0,
          totalItems: response.data.items?.length || 0,
          percentDelivered: response.data.per_delivered || 0,
          items: response.data.items?.map((item: any) => ({
            itemCode: item.item_code,
            itemName: item.item_name,
            orderedQty: item.qty,
            deliveredQty: item.delivered_qty || 0,
            pendingQty: (item.qty || 0) - (item.delivered_qty || 0),
            rate: item.rate,
            uom: item.uom,
            warehouse: item.warehouse
          })) || []
        };

        setSelectedSalesOrder(salesOrder);
        setCurrentStep('deliver');
      }

    } catch (error) {
      console.error('Error fetching sales order:', error);
      toast({
        title: "Error",
        description: "Failed to fetch sales order details",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddDeliveryEntry = (entry: DeliveryEntry) => {
    setDeliveryEntries(prev => [...prev, entry]);
  };

  const handleBackToDashboard = () => {
    setCurrentStep('dashboard');
    setSelectedSalesOrder(null);
    setDeliveryEntries([]);
  };

  const handleProceedToReview = () => {
    if (deliveryEntries.length === 0) {
      toast({
        title: "No Items Added",
        description: "Please add items to the delivery before proceeding.",
        variant: "destructive"
      });
      return;
    }
    setCurrentStep('review');
  };

  const handleSubmitDelivery = async () => {
    if (!selectedSalesOrder || deliveryEntries.length === 0) {
      toast({
        title: "Invalid Delivery",
        description: "Please ensure a sales order is selected and items are added.",
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

      // Prepare delivery note data
      const deliveryNoteData = {
        customer: selectedSalesOrder.customer,
        items: deliveryEntries.map(entry => ({
          item_code: entry.itemCode,
          qty: entry.deliveredQty,
          rate: entry.rate,
          warehouse: entry.warehouse,
          against_sales_order: selectedSalesOrder.name,
          ...(entry.batch && { batch_no: entry.batch }),
          ...(entry.serial && { serial_no: entry.serial })
        }))
      };

      const response = await erpnextAPI.createDeliveryNote(deliveryNoteData);

      if (response?.data) {
        toast({
          title: "Delivery Note Created",
          description: `Delivery Note ${response.data.name} created successfully.`,
        });
        
        // Reset to dashboard
        handleBackToDashboard();
        
        // Optionally navigate to delivery note or stay on dashboard
        // navigate(`/delivery-note/${response.data.name}`);
      }

    } catch (error) {
      console.error('Failed to create delivery note:', error);
      toast({
        title: "Error",
        description: `Failed to create delivery note: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViewAllSalesOrders = () => {
    // Navigate to sales orders list
    navigate('/sales-orders');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="container mx-auto py-6">
      {currentStep === 'dashboard' ? (
        <>
          <div className="mb-6">
            <h1 className="text-2xl font-bold flex items-center space-x-2">
              <Truck className="w-6 h-6" />
              <span>Deliver</span>
            </h1>
            <p className="text-gray-500">Create a new delivery for a sales order.</p>
          </div>
          <DeliverDashboard
            onSelectSalesOrder={handleSelectSalesOrder}
            onViewSalesOrders={handleViewAllSalesOrders}
            dashboardData={dashboardData}
            isLoading={loading}
          />
        </>
      ) : (
        <>
          {/* Header with back button and sales order info */}
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button
                  variant="ghost"
                  onClick={handleBackToDashboard}
                  className="flex items-center space-x-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to Dashboard</span>
                </Button>
                <div className="h-6 w-px bg-gray-300" />
                <div className="flex items-center space-x-2">
                  <Truck className="w-5 h-5 text-blue-600" />
                  <span className="font-semibold">Deliver</span>
                </div>
              </div>
            </div>
            {selectedSalesOrder && (
              <div className="mt-4 text-sm text-gray-600">
                Selected: {selectedSalesOrder.number} - {selectedSalesOrder.customer}
              </div>
            )}
          </div>

          {/* Main Content with Tabs */}
          <Tabs value={currentStep} onValueChange={(value) => setCurrentStep(value as any)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="dashboard" disabled>Dashboard</TabsTrigger>
              <TabsTrigger value="deliver">Deliver Items</TabsTrigger>
              <TabsTrigger value="review">Review & Submit</TabsTrigger>
            </TabsList>

            <TabsContent value="deliver" className="mt-6">
              {selectedSalesOrder && (
                <div className="space-y-6">
                  {/* Selected Sales Order Summary */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Selected Sales Order</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-4 gap-4 text-center">
                        <div>
                          <div className="text-sm text-gray-600">Order:</div>
                          <div className="font-semibold text-blue-600">{selectedSalesOrder.number}</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-600">Customer:</div>
                          <div className="font-semibold">{selectedSalesOrder.customer}</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-600">Amount:</div>
                          <div className="font-semibold">{formatCurrency(selectedSalesOrder.totalValue)}</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-600">Draft DN:</div>
                          <div className="text-green-600 text-sm">Will create after first item</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Delivery Item Scanner */}
                  <EnhancedDeliveryItemScanner
                    soItems={selectedSalesOrder.items}
                    onAddEntry={handleAddDeliveryEntry}
                  />

                  {/* Items in Sales Order Table */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Items in {selectedSalesOrder.number}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                          <thead>
                            <tr className="bg-gray-50">
                              <th className="text-left p-3 border text-sm">Item Code</th>
                              <th className="text-left p-3 border text-sm">Item Name</th>
                              <th className="text-left p-3 border text-sm">Ordered</th>
                              <th className="text-left p-3 border text-sm">Delivered</th>
                              <th className="text-left p-3 border text-sm">Pending</th>
                              <th className="text-left p-3 border text-sm">Rate</th>
                              <th className="text-left p-3 border text-sm">Warehouse</th>
                              <th className="text-left p-3 border text-sm">Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedSalesOrder.items.map((item, index) => (
                              <tr key={index} className="border-b">
                                <td className="p-3 border text-sm">{item.itemCode}</td>
                                <td className="p-3 border text-sm">{item.itemName}</td>
                                <td className="p-3 border text-sm">{item.orderedQty} {item.uom}</td>
                                <td className="p-3 border text-sm">{item.deliveredQty} {item.uom}</td>
                                <td className="p-3 border text-sm text-orange-600 font-medium">{item.pendingQty} {item.uom}</td>
                                <td className="p-3 border text-sm">₹{item.rate}</td>
                                <td className="p-3 border text-sm">{item.warehouse}</td>
                                <td className="p-3 border text-sm">
                                  <Badge variant="secondary">Pending</Badge>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </TabsContent>

            <TabsContent value="review" className="mt-6">
              <div className="space-y-6">
                {/* Review Summary */}
                <Card>
                  <CardHeader>
                    <CardTitle>Review Delivery</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 mb-6">Review the items and submit the delivery note.</p>
                    
                    {deliveryEntries.length > 0 && (
                      <DeliveryTable entries={deliveryEntries} onRemoveEntry={(index) => {
                        setDeliveryEntries(prev => prev.filter((_, i) => i !== index));
                      }} />
                    )}
                    
                    <div className="flex justify-between items-center mt-6">
                      <Button
                        variant="outline"
                        onClick={() => setCurrentStep('deliver')}
                      >
                        Back to Edit
                      </Button>
                      <Button
                        onClick={handleSubmitDelivery}
                        disabled={loading || deliveryEntries.length === 0}
                      >
                        {loading ? 'Submitting...' : `Submit Delivery (${deliveryEntries.length} items)`}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
};

export default Deliver;
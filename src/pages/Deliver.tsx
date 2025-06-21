import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Truck, ArrowLeft } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Import components
import DeliverDashboard from "@/components/deliver/DeliverDashboard";
import DeliverySalesOrderList from "@/components/deliver/DeliverySalesOrderList";
import EnhancedDeliveryItemScanner from "@/components/deliver/EnhancedDeliveryItemScanner";
import SOItemsDisplay from "@/components/deliver/SOItemsDisplay";
import DeliveryProcess from "@/components/deliver/DeliveryProcess";
import { createERPNextAPI, getUserDefaultCompany } from "@/services/erpnextApi";
import { useToast } from "@/hooks/use-toast";

export interface DeliveryItem {
  itemCode: string;
  itemName: string;
  qty: number;
  deliveredQty?: number;
  uom: string;
  warehouse: string;
  rate?: number;
  amount?: number;
  serialNo?: string;
  batchNo?: string;
}

export interface DeliveryNote {
  id: string;
  name: string;
  customer: string;
  customerName: string;
  postingDate: string;
  status: "Draft" | "Submitted" | "Cancelled";
  salesOrder?: string;
  items: DeliveryItem[];
  totalQty: number;
  grandTotal: number;
  company: string;
}

export interface SalesOrderOption {
  value: string;
  label: string;
  customer: string;
  customer_name: string;
  delivery_date: string;
  grand_total: number;
  status: string;
  isDraft?: boolean;
  draftName?: string;
  items?: SOItem[];
}

// Add missing types that components need
export interface SOItem {
  itemCode: string;
  itemName: string;
  orderedQty: number;
  deliveredQty: number;
  pendingQty: number;
  rate: number;
  uom: string;
  warehouse: string;
  qtyToDeliver: number;
}

export interface SalesOrder {
  id?: string;
  number: string;
  customer: string;
  status: string;
  deliveryDate: string;
  expectedDelivery?: string;
  totalItems: number;
  totalValue: number;
  percentDelivered?: number;
  items: SOItem[];
  per_delivered?: number;
}

export interface DeliveryEntry {
  itemCode: string;
  itemName: string;
  warehouse: string;
  batch?: string;
  serial?: string;
  serial_batch_bundle?: string;
  qtyToDeliver: number;
  actualQty: number;
  rate: number;
  uom: string;
}

export interface DashboardData {
  todaysDelivery: number;
  totalDeliveries: number;
  pendingOrders: number;
  draftDeliveryNotes: DeliveryNote[];
}

const Deliver = () => {
  const [currentStep, setCurrentStep] = useState<"dashboard" | "deliverItems" | "reviewSubmit">("dashboard");
  const [selectedSalesOrder, setSelectedSalesOrder] = useState<SalesOrderOption | null>(null);
  const [deliveryEntries, setDeliveryEntries] = useState<DeliveryEntry[]>([]);
  const [currentDeliveryNote, setCurrentDeliveryNote] = useState<string | null>(null);
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    todaysDelivery: 0,
    totalDeliveries: 0,
    pendingOrders: 0,
    draftDeliveryNotes: []
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const erpnextAPI = await createERPNextAPI();
      if (!erpnextAPI) {
        console.warn('ERPNext API not configured');
        return;
      }

      const company = await getUserDefaultCompany();
      
      // Fetch delivery metrics
      const deliveryMetrics = await erpnextAPI.sales.getDeliveryMetrics(company || undefined);
      
      // Fetch draft delivery notes
      const draftDeliveryNotes = await erpnextAPI.getDeliveryNotes(
        [['docstatus', '=', 0]], // Draft status
        company || undefined,
        10
      );

      // Fetch pending sales orders
      const pendingSalesOrders = await erpnextAPI.getSalesOrders(
        [
          ['docstatus', '=', 1],
          ['status', 'in', ['To Deliver', 'To Deliver and Bill', 'Partially Delivered']]
        ],
        company || undefined,
        100
      );

      setDashboardData({
        todaysDelivery: deliveryMetrics.data?.todaysDelivery || 0,
        totalDeliveries: deliveryMetrics.data?.totalDeliveries || 0,
        pendingOrders: pendingSalesOrders.data?.length || 0,
        draftDeliveryNotes: draftDeliveryNotes.data?.map((dn: any) => ({
          id: dn.name,
          name: dn.name,
          customer: dn.customer,
          customerName: dn.customer_name || dn.customer,
          postingDate: dn.posting_date,
          status: dn.docstatus === 0 ? "Draft" : dn.docstatus === 1 ? "Submitted" : "Cancelled",
          salesOrder: dn.sales_order,
          items: [], // Will be loaded when needed
          totalQty: dn.total_qty || 0,
          grandTotal: dn.grand_total || 0,
          company: dn.company
        })) || []
      });

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch dashboard data",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createDraftDeliveryNote = async (salesOrder: SalesOrderOption) => {
    try {
      const erpnextAPI = await createERPNextAPI();
      if (!erpnextAPI) {
        throw new Error('ERPNext API not configured');
      }

      const company = await getUserDefaultCompany();

      // Create a minimal draft delivery note without items
      const deliveryNoteData = {
        doctype: "Delivery Note",
        customer: salesOrder.customer,
        company: company,
        posting_date: new Date().toISOString().split('T')[0],
        set_posting_time: 0,
        posting_time: new Date().toTimeString().split(' ')[0].slice(0, 8),
        docstatus: 0, // Draft
        items: [], // Empty items array - will be populated when items are added
        territory: "All Territories",
        currency: "INR",
        selling_price_list: "Standard Selling",
        ignore_pricing_rule: 1
      };

      console.log('Creating draft delivery note:', deliveryNoteData);

      const result = await erpnextAPI.sales.createDeliveryNote(deliveryNoteData);
      
      if (result.data && result.data.name) {
        setCurrentDeliveryNote(result.data.name);
        console.log('Draft delivery note created:', result.data.name);
        
        toast({
          title: "Draft Created",
          description: `Draft delivery note ${result.data.name} created successfully`,
        });

        return result.data.name;
      }
    } catch (error) {
      console.error('Error creating draft delivery note:', error);
      toast({
        title: "Error",
        description: "Failed to create draft delivery note",
        variant: "destructive"
      });
    }
    return null;
  };

  const handleSelectSalesOrder = async (salesOrder: SalesOrderOption) => {
    console.log('Sales order selected:', salesOrder);
    setSelectedSalesOrder(salesOrder);
    setDeliveryEntries([]);
    
    // Don't create draft delivery note immediately - wait for first item to be added
    if (salesOrder.isDraft) {
      setCurrentDeliveryNote(salesOrder.draftName || null);
    } else {
      setCurrentDeliveryNote(null);
    }
    
    setCurrentStep("deliverItems");
    
    toast({
      title: "Sales Order Selected",
      description: `Selected ${salesOrder.label} for delivery processing`,
    });
  };

  const handleAddDeliveryEntry = async (entry: DeliveryEntry) => {
    // Create draft delivery note if it doesn't exist (first item being added)
    if (!currentDeliveryNote && selectedSalesOrder && !selectedSalesOrder.isDraft) {
      const draftName = await createDraftDeliveryNote(selectedSalesOrder);
      if (draftName) {
        setCurrentDeliveryNote(draftName);
        // Update the entry with the delivery note reference if it has a bundle
        if (entry.serial_batch_bundle) {
          // The bundle should already be created with the delivery note reference
          // We just need to add the entry
        }
      }
    }
    
    setDeliveryEntries([...deliveryEntries, entry]);
  };

  const handleBackToDashboard = () => {
    setCurrentStep("dashboard");
    setSelectedSalesOrder(null);
    setDeliveryEntries([]);
    setCurrentDeliveryNote(null);
  };

  const handleViewSalesOrders = () => {
    // This could navigate to a separate sales order list view if needed
    toast({
      title: "View Sales Orders",
      description: "Feature to be implemented",
    });
  };

  const handleNextToReview = () => {
    if (deliveryEntries.length === 0) {
      toast({
        title: "No Items to Deliver",
        description: "Please add at least one item to the delivery",
        variant: "destructive"
      });
      return;
    }
    setCurrentStep("reviewSubmit");
  };

  const handleSubmitDeliveryNote = async () => {
    if (!currentDeliveryNote || deliveryEntries.length === 0) {
      toast({
        title: "Cannot Submit",
        description: "No delivery note or items to submit",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsLoading(true);
      const erpnextAPI = await createERPNextAPI();
      if (!erpnextAPI) {
        throw new Error('ERPNext API not configured');
      }

      // Update the draft delivery note with items
      const deliveryItems = deliveryEntries.map(entry => ({
        item_code: entry.itemCode,
        item_name: entry.itemName,
        qty: entry.qtyToDeliver,
        rate: entry.rate,
        amount: entry.qtyToDeliver * entry.rate,
        warehouse: entry.warehouse,
        uom: entry.uom,
        ...(entry.serial_batch_bundle && { serial_and_batch_bundle: entry.serial_batch_bundle })
      }));

      const updateData = {
        items: deliveryItems,
        docstatus: 1 // Submit the delivery note
      };

      await erpnextAPI.sales.updateDeliveryNote(currentDeliveryNote, updateData);

      toast({
        title: "Delivery Note Submitted",
        description: `Delivery note ${currentDeliveryNote} has been submitted successfully`,
      });

      // Reset and go back to dashboard
      handleBackToDashboard();
      fetchDashboardData(); // Refresh dashboard data

    } catch (error) {
      console.error('Error submitting delivery note:', error);
      toast({
        title: "Submission Error",
        description: "Failed to submit delivery note",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderTabContent = () => {
    switch (currentStep) {
      case "dashboard":
        return (
          <DeliverDashboard
            onSelectSalesOrder={handleSelectSalesOrder}
            onViewSalesOrders={handleViewSalesOrders}
            dashboardData={dashboardData}
            isLoading={isLoading}
          />
        );
      
      case "deliverItems":
        if (!selectedSalesOrder) return null;
        
        return (
          <div className="space-y-6">
            {/* Sales Order Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-medium text-blue-900 mb-2">Selected Sales Order</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Order:</span>
                  <div className="font-medium">{selectedSalesOrder.value}</div>
                </div>
                <div>
                  <span className="text-gray-600">Customer:</span>
                  <div className="font-medium">{selectedSalesOrder.customer_name}</div>
                </div>
                <div>
                  <span className="text-gray-600">Amount:</span>
                  <div className="font-medium">₹{selectedSalesOrder.grand_total.toLocaleString()}</div>
                </div>
                <div>
                  <span className="text-gray-600">Draft DN:</span>
                  <div className="font-medium text-green-600">{currentDeliveryNote || 'Will create after first item'}</div>
                </div>
              </div>
            </div>

            {/* Item Scanner - Moved above SO Items Display */}
            {selectedSalesOrder.items && (
              <EnhancedDeliveryItemScanner
                soItems={selectedSalesOrder.items}
                onAddEntry={handleAddDeliveryEntry}
                company={getUserDefaultCompany()?.toString()}
                deliveryNoteName={currentDeliveryNote || undefined}
              />
            )}

            {/* Sales Order Items Display - Moved below Scanner */}
            {selectedSalesOrder.items && (
              <SOItemsDisplay
                items={selectedSalesOrder.items}
                title={`Items in ${selectedSalesOrder.value}`}
              />
            )}

            {/* Delivery Entries Table */}
            {deliveryEntries.length > 0 && (
              <div className="bg-white border rounded-lg p-4">
                <h3 className="font-medium mb-4">Items to Deliver ({deliveryEntries.length})</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Item Code</th>
                        <th className="text-left p-2">Item Name</th>
                        <th className="text-left p-2">Warehouse</th>
                        <th className="text-left p-2">Quantity</th>
                        <th className="text-left p-2">UOM</th>
                        <th className="text-left p-2">Rate</th>
                        <th className="text-left p-2">Bundle</th>
                      </tr>
                    </thead>
                    <tbody>
                      {deliveryEntries.map((entry, index) => (
                        <tr key={index} className="border-b">
                          <td className="p-2">{entry.itemCode}</td>
                          <td className="p-2">{entry.itemName}</td>
                          <td className="p-2">{entry.warehouse}</td>
                          <td className="p-2">{entry.qtyToDeliver}</td>
                          <td className="p-2">{entry.uom}</td>
                          <td className="p-2">₹{entry.rate}</td>
                          <td className="p-2 text-xs text-gray-500">
                            {entry.serial_batch_bundle || '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        );
      
      case "reviewSubmit":
        return (
          <div className="space-y-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-medium text-green-900 mb-2">Review & Submit Delivery</h3>
              <p className="text-sm text-green-700">
                Review the delivery details below and submit to create the delivery note.
              </p>
            </div>

            {/* Summary */}
            <div className="bg-white border rounded-lg p-4">
              <h3 className="font-medium mb-4">Delivery Summary</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm mb-4">
                <div>
                  <span className="text-gray-600">Sales Order:</span>
                  <div className="font-medium">{selectedSalesOrder?.value}</div>
                </div>
                <div>
                  <span className="text-gray-600">Customer:</span>
                  <div className="font-medium">{selectedSalesOrder?.customer_name}</div>
                </div>
                <div>
                  <span className="text-gray-600">Total Items:</span>
                  <div className="font-medium">{deliveryEntries.length}</div>
                </div>
                <div>
                  <span className="text-gray-600">Draft DN:</span>
                  <div className="font-medium text-green-600">{currentDeliveryNote}</div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="text-left p-3">Item Code</th>
                      <th className="text-left p-3">Item Name</th>
                      <th className="text-left p-3">Warehouse</th>
                      <th className="text-left p-3">Quantity</th>
                      <th className="text-left p-3">Rate</th>
                      <th className="text-left p-3">Amount</th>
                      <th className="text-left p-3">Bundle</th>
                    </tr>
                  </thead>
                  <tbody>
                    {deliveryEntries.map((entry, index) => (
                      <tr key={index} className="border-b">
                        <td className="p-3">{entry.itemCode}</td>
                        <td className="p-3">{entry.itemName}</td>
                        <td className="p-3">{entry.warehouse}</td>
                        <td className="p-3">{entry.qtyToDeliver} {entry.uom}</td>
                        <td className="p-3">₹{entry.rate}</td>
                        <td className="p-3">₹{(entry.qtyToDeliver * entry.rate).toLocaleString()}</td>
                        <td className="p-3 text-xs text-gray-500">{entry.serial_batch_bundle || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-center">
              <Button size="lg" className="px-8" onClick={handleSubmitDeliveryNote} disabled={isLoading}>
                {isLoading ? 'Submitting...' : 'Submit Delivery Note'}
              </Button>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Truck className="w-6 h-6 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Deliver</h1>
              {selectedSalesOrder && (
                <p className="text-sm text-gray-600">
                  Selected: {selectedSalesOrder.label}
                  {currentDeliveryNote && <span className="text-green-600 ml-2">• DN: {currentDeliveryNote}</span>}
                </p>
              )}
            </div>
          </div>

          {/* Back Button - Only show when not on dashboard */}
          {currentStep !== "dashboard" && (
            <Button variant="outline" onClick={handleBackToDashboard}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          )}
        </div>

        {/* Tabs - Only show when we have selected an SO or draft */}
        {selectedSalesOrder ? (
          <Tabs value={currentStep} onValueChange={(value) => setCurrentStep(value as any)} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="dashboard" disabled>Dashboard</TabsTrigger>
              <TabsTrigger value="deliverItems">Deliver Items</TabsTrigger>
              <TabsTrigger value="reviewSubmit" disabled={deliveryEntries.length === 0} className="relative">
                Review & Submit
                {deliveryEntries.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="deliverItems" className="mt-6">
              {renderTabContent()}
            </TabsContent>

            <TabsContent value="reviewSubmit" className="mt-6">
              {renderTabContent()}
            </TabsContent>
          </Tabs>
        ) : (
          /* Dashboard View */
          <div className="mt-6">
            {renderTabContent()}
          </div>
        )}

        {/* Navigation Buttons for Deliver Items Tab */}
        {currentStep === "deliverItems" && deliveryEntries.length > 0 && (
          <div className="mt-6 flex justify-end">
            <Button onClick={handleNextToReview} size="lg">
              Next: Review & Submit ({deliveryEntries.length} items)
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Deliver;

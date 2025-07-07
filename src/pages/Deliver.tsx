import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createERPNextAPI } from "@/services/erpnextApi";
import { useToast } from "@/hooks/use-toast";
import { Truck } from "lucide-react";
import DeliverDashboard from "@/components/deliver/DeliverDashboard";
import DeliveryProcess from "@/components/deliver/DeliveryProcess";
import { SalesOrder, SalesOrderOption, DashboardData, DeliveryEntry } from "@/types";

const Deliver = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<'dashboard' | 'process' | 'review'>('dashboard');
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
        setCurrentStep('process');
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

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center space-x-2">
          <Truck className="w-6 h-6" />
          <span>Deliver</span>
        </h1>
        <p className="text-gray-500">Create a new delivery for a sales order.</p>
      </div>

      {currentStep === 'dashboard' && (
        <DeliverDashboard
          onSelectSalesOrder={handleSelectSalesOrder}
          onViewSalesOrders={handleViewAllSalesOrders}
          dashboardData={dashboardData}
          isLoading={loading}
        />
      )}

      {currentStep === 'process' && selectedSalesOrder && (
        <DeliveryProcess
          salesOrder={selectedSalesOrder}
          onBack={handleBackToDashboard}
          onNext={handleProceedToReview}
          onAddEntry={handleAddDeliveryEntry}
        />
      )}

      {currentStep === 'review' && selectedSalesOrder && (
        <div className="space-y-6">
          {/* Review and Submit functionality would go here */}
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-4">Review Delivery</h2>
            <p className="text-gray-600 mb-6">Review the items and submit the delivery note.</p>
            
            <div className="flex space-x-4 justify-center">
              <button
                onClick={() => setCurrentStep('process')}
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Back to Edit
              </button>
              <button
                onClick={handleSubmitDelivery}
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Submitting...' : 'Submit Delivery'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Deliver;
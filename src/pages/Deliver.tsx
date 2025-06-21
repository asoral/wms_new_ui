
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Truck, ArrowLeft } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Import components
import DeliverDashboard from "@/components/deliver/DeliverDashboard";
import DeliverySalesOrderList from "@/components/deliver/DeliverySalesOrderList";
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
  const [currentView, setCurrentView] = useState<"dashboard" | "salesOrderList">("dashboard");
  const [selectedSalesOrder, setSelectedSalesOrder] = useState<SalesOrderOption | null>(null);
  const [editingDeliveryNote, setEditingDeliveryNote] = useState<DeliveryNote | null>(null);
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

  const handleSelectSalesOrder = (salesOrder: SalesOrderOption) => {
    setSelectedSalesOrder(salesOrder);
    setEditingDeliveryNote(null);
    // For now, just show selection - actual delivery form implementation would go here
    toast({
      title: "Sales Order Selected",
      description: `Selected ${salesOrder.label} for delivery processing`,
    });
  };

  const handleEditDeliveryNote = (deliveryNote: DeliveryNote) => {
    setEditingDeliveryNote(deliveryNote);
    setSelectedSalesOrder(null);
    // Delivery note editing would be implemented here
    toast({
      title: "Delivery Note Selected",
      description: `Selected ${deliveryNote.name} for editing`,
    });
  };

  const handleBackToDashboard = () => {
    setCurrentView("dashboard");
    setSelectedSalesOrder(null);
    setEditingDeliveryNote(null);
  };

  const handleViewSalesOrders = () => {
    setCurrentView("salesOrderList");
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case "dashboard":
        return (
          <DeliverDashboard
            onSelectSalesOrder={handleSelectSalesOrder}
            onViewSalesOrders={handleViewSalesOrders}
            dashboardData={dashboardData}
            isLoading={isLoading}
          />
        );
      
      case "salesOrderList":
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Sales Orders for Delivery</h2>
              <Button variant="outline" onClick={() => setCurrentView("dashboard")}>
                Back to Dashboard
              </Button>
            </div>
            <DeliverySalesOrderList onSelectSalesOrder={handleSelectSalesOrder} />
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
            {currentView !== "dashboard" && (
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleBackToDashboard}
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
            )}
            <Truck className="w-6 h-6 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Deliver</h1>
              {selectedSalesOrder && (
                <p className="text-sm text-gray-600">
                  Selected: {selectedSalesOrder.label}
                </p>
              )}
              {editingDeliveryNote && (
                <p className="text-sm text-gray-600">
                  Editing delivery note {editingDeliveryNote.name}
                </p>
              )}
            </div>
          </div>

          {/* Quick Actions - Only show on dashboard */}
          {currentView === "dashboard" && (
            <div className="flex space-x-2">
              <Button variant="outline" onClick={handleViewSalesOrders}>
                View Sales Orders
              </Button>
            </div>
          )}
        </div>

        {/* Main Content */}
        {renderCurrentView()}
      </div>
    </div>
  );
};

export default Deliver;

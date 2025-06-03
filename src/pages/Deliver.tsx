
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
      const deliveryNotesResult = await erpnextAPI.getDeliveryNotes(
        [['posting_date', '=', today]], 
        defaultCompany || undefined
      );
      
      // Fetch all delivery notes for total count
      const allDeliveryNotesResult = await erpnextAPI.getDeliveryNotes(
        undefined, 
        defaultCompany || undefined
      );

      // Fetch stock balance to calculate FG stock value (simplified)
      const stockResult = await erpnextAPI.getStockBalance(
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
      const soResult = await erpnextAPI.getSalesOrder(soNumber);
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

  const viewSalesOrders = () => {
    // This would navigate to a sales orders list view
    console.log('Navigate to sales orders list');
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
            <Badge variant="outline">{selectedSO.number}</Badge>
          )}
        </div>

        {!selectedSO ? (
          <DeliverDashboard 
            data={dashboardData}
            shortcuts={shortcuts}
            onViewOrders={viewSalesOrders}
          />
        ) : (
          <DeliveryProcess 
            salesOrder={selectedSO}
            onBack={() => setSelectedSO(null)}
          />
        )}
      </div>
    </div>
  );
};

export default Deliver;

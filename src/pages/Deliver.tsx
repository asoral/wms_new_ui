import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { createERPNextAPI } from "@/services/erpnextApi";
import { useToast } from "@/hooks/use-toast";
import { Plus, CheckCircle, AlertTriangle, Loader2, Truck } from "lucide-react";
import { format } from 'date-fns';
import DeliveryForm from "@/components/deliver/DeliveryForm";
import SalesOrderSearch from "@/components/deliver/SalesOrderSearch";
import { SalesOrder, SalesOrderItem, SOItem, DeliveryEntry, SalesOrderOption, DashboardData } from "@/types";

const Deliver = () => {
  const navigate = useNavigate();
  const [salesOrder, setSalesOrder] = useState<SalesOrder | null>(null);
  const [deliveryEntries, setDeliveryEntries] = useState<DeliveryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const [dashboardData, setDashboardData] = useState<DashboardData>({
    pendingOrders: 0,
    readyToShip: 0,
    overdue: 0,
    deliveredToday: 0,
  });

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

      // Fetch dashboard data
      const response = await erpnextAPI.callAPI('frappe.desk.desk_page.get_counts');

      if (response?.data) {
        // Transform the data to match our DashboardData interface
        const transformedData: DashboardData = {
          pendingOrders: response.data.open_sales_orders || 0,
          readyToShip: response.data.items_to_deliver || 0,
          overdue: response.data.overdue_sales_orders || 0,
          deliveredToday: response.data.delivered_today || 0,
        };

        setDashboardData(transformedData);
      } else {
        setDashboardData({
          pendingOrders: 0,
          readyToShip: 0,
          overdue: 0,
          deliveredToday: 0,
        });
      }

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

  const handleSelectSO = (salesOrder: SalesOrder) => {
    setSalesOrder(salesOrder);
  };

  const handleAddEntry = (entry: DeliveryEntry) => {
    setDeliveryEntries([...deliveryEntries, entry]);
  };

  const calculateTotalDelivered = () => {
    return deliveryEntries.reduce((acc, entry) => acc + entry.actualQty, 0);
  };

  const calculateTotalValue = () => {
    return deliveryEntries.reduce((acc, entry) => acc + (entry.actualQty * entry.rate), 0);
  };

  const handleSubmitDelivery = async () => {
    if (!salesOrder) {
      toast({
        title: "Sales Order Required",
        description: "Please select a sales order before submitting delivery.",
        variant: "destructive"
      });
      return;
    }

    if (deliveryEntries.length === 0) {
      toast({
        title: "No Items to Deliver",
        description: "Please add items to the delivery before submitting.",
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

      // Prepare the data for creating the Delivery Note
      const deliveryNoteData = {
        sales_order: salesOrder.name,
        customer: salesOrder.customer,
        company: 'GrandLiners', // Replace with the actual company name
        items: deliveryEntries.map(entry => ({
          item_code: entry.itemCode,
          qty: entry.actualQty,
          rate: entry.rate,
          warehouse: entry.warehouse,
          batch_no: entry.batch,
          serial_no: entry.serial,
          uom: entry.uom
        }))
      };

      // Create the Delivery Note
      const response = await erpnextAPI.createDeliveryNote(deliveryNoteData);

      if (response?.data) {
        toast({
          title: "Delivery Note Created",
          description: `Delivery Note ${response.data.name} created successfully.`,
        });
        // Reset state after successful submission
        setSalesOrder(null);
        setDeliveryEntries([]);
        navigate('/deliveries');
      } else {
        toast({
          title: "Delivery Note Creation Failed",
          description: "Failed to create delivery note. Please try again.",
          variant: "destructive"
        });
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

  const shortcuts = [
    {
      label: "New Customer",
      icon: Plus,
      action: () => {
        // Implement the action to navigate to the new customer page
        navigate("/customers/new");
      },
    },
  ];

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center space-x-2">
          <Truck className="w-6 h-6" />
          <span>Deliver</span>
        </h1>
        <p className="text-gray-500">Create a new delivery for a sales order.</p>
      </div>

      {/* Dashboard Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
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
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-600 mb-1">Overdue</p>
                <p className="text-2xl font-bold text-red-600">{dashboardData.overdue}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-yellow-600 mb-1">Delivered Today</p>
                <p className="text-2xl font-bold text-yellow-600">{dashboardData.deliveredToday}</p>
              </div>
              <Truck className="w-8 h-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Order Selection */}
        <SalesOrderSearch onSelectSO={handleSelectSO} shortcuts={shortcuts} />

        {/* Delivery Form */}
        {salesOrder && (
          <DeliveryForm soItems={salesOrder.items} onAddEntry={handleAddEntry} />
        )}
      </div>

      {/* Delivery Summary */}
      {deliveryEntries.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Delivery Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead>Warehouse</TableHead>
                    <TableHead>Batch</TableHead>
                    <TableHead>Serial</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                    <TableHead className="text-right">Rate</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {deliveryEntries.map((entry, index) => (
                    <TableRow key={index}>
                      <TableCell>{entry.itemName}</TableCell>
                      <TableCell>{entry.warehouse}</TableCell>
                      <TableCell>{entry.batch || '-'}</TableCell>
                      <TableCell>{entry.serial || '-'}</TableCell>
                      <TableCell className="text-right">{entry.actualQty} {entry.uom}</TableCell>
                      <TableCell className="text-right">₹{entry.rate.toLocaleString()}</TableCell>
                      <TableCell className="text-right">₹{(entry.actualQty * entry.rate).toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell colSpan={4}>Total</TableCell>
                    <TableCell className="text-right">{calculateTotalDelivered()} Items</TableCell>
                    <TableCell></TableCell>
                    <TableCell className="text-right">₹{calculateTotalValue().toLocaleString()}</TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Submit Button */}
      {salesOrder && (
        <div className="mt-6">
          <Button
            onClick={handleSubmitDelivery}
            className="w-full"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting Delivery...
              </>
            ) : (
              "Submit Delivery"
            )}
          </Button>
        </div>
      )}
    </div>
  );
};

export default Deliver;

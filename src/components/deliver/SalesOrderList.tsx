import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { createERPNextAPI } from "@/services/erpnextApi";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { SalesOrder } from "@/types";

interface SalesOrderListProps {
  onSelectSO: (salesOrder: SalesOrder) => void;
}

const SalesOrderList = ({ onSelectSO }: SalesOrderListProps) => {
  const [salesOrders, setSalesOrders] = useState<SalesOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadSalesOrders();
  }, []);

  const loadSalesOrders = async () => {
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

      const response = await erpnextAPI.getSalesOrders();
      
      if (response?.data && Array.isArray(response.data)) {
        // Transform the data to match our SalesOrder interface
        const transformedOrders: SalesOrder[] = response.data.map((order: any) => ({
          id: order.name,
          name: order.name,
          number: order.name,
          customer: order.customer,
          status: order.status,
          delivery_date: order.delivery_date,
          grand_total: order.grand_total,
          totalValue: order.grand_total,
          totalItems: order.items?.length || 0,
          percentDelivered: order.per_delivered || 0,
          items: order.items || []
        }));
        
        setSalesOrders(transformedOrders);
      } else {
        setSalesOrders([]);
      }
    } catch (error) {
      console.error('Error loading sales orders:', error);
      toast({
        title: "Error",
        description: "Failed to load sales orders",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="h-full">
      <CardContent className="p-0">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading Sales Orders...
          </div>
        ) : salesOrders.length > 0 ? (
          <div className="overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order Number</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Total Value</TableHead>
                  <TableHead className="text-right">Items</TableHead>
                  <TableHead className="text-right">Delivered (%)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {salesOrders.map((order) => (
                  <TableRow key={order.id} onClick={() => onSelectSO(order)} className="cursor-pointer hover:bg-gray-100">
                    <TableCell className="font-medium">{order.number}</TableCell>
                    <TableCell>{order.customer}</TableCell>
                    <TableCell>{order.status}</TableCell>
                    <TableCell className="text-right">₹{order.totalValue?.toLocaleString()}</TableCell>
                    <TableCell className="text-right">{order.totalItems}</TableCell>
                    <TableCell className="text-right">{order.percentDelivered}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            No sales orders found.
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SalesOrderList;

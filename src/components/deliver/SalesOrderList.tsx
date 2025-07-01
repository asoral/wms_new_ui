
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SalesOrder } from "@/types";
import { createERPNextAPI } from "@/services/erpnextApi";
import { useToast } from "@/hooks/use-toast";

interface SalesOrderListProps {
  onSelectSalesOrder: (salesOrder: SalesOrder) => void;
}

const SalesOrderList = ({ onSelectSalesOrder }: SalesOrderListProps) => {
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
      if (!erpnextAPI) return;

      const response = await erpnextAPI.getSalesOrders([
        ['docstatus', '=', 1],
        ['status', 'in', ['To Deliver', 'To Deliver and Bill', 'Partially Delivered']]
      ]);

      if (response.data) {
        setSalesOrders(response.data);
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

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, any> = {
      'To Deliver': 'default',
      'To Deliver and Bill': 'default', 
      'Partially Delivered': 'outline'
    };
    return <Badge variant={statusMap[status] || 'outline'}>{status}</Badge>;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sales Orders</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-4">Loading...</div>
        ) : (
          <div className="space-y-4">
            {salesOrders.map((so) => (
              <div key={so.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-semibold">{so.number}</h3>
                    <p className="text-sm text-gray-600">{so.customer}</p>
                  </div>
                  {getStatusBadge(so.status)}
                </div>
                <Button 
                  onClick={() => onSelectSalesOrder(so)}
                  size="sm"
                >
                  Select
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SalesOrderList;

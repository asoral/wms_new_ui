import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Search, Plus } from "lucide-react";
import { createERPNextAPI } from "@/services/erpnextApi";
import { useToast } from "@/hooks/use-toast";
import SalesOrderList from "./SalesOrderList";
import { SalesOrder, SalesOrderOption } from "@/types";

interface SalesOrderSelectorProps {
  onSelectSO: (salesOrder: SalesOrder) => void;
  shortcuts?: Array<{
    label: string;
    icon: any;
    action: () => void;
  }>;
}

const SalesOrderSelector = ({ onSelectSO, shortcuts = [] }: SalesOrderSelectorProps) => {
  const [salesOrders, setSalesOrders] = useState<SalesOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const searchSalesOrders = async (searchTerm: string) => {
    if (!searchTerm.trim()) {
      setSalesOrders([]);
      return;
    }

    try {
      setLoading(true);
      const erpnextAPI = await createERPNextAPI();
      if (!erpnextAPI) return;

      // Search with proper status filters for delivery
      const filters = [
        ['name', 'like', `%${searchTerm}%`],
        ['docstatus', '=', 1],
        ['status', 'in', ['To Deliver', 'To Deliver and Bill', 'Partially Delivered']]
      ];
      const response = await erpnextAPI.getSalesOrders(filters);
      
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
      console.error('Error searching sales orders:', error);
      toast({
        title: "Error",
        description: "Failed to search sales orders",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSOSelect = (salesOrder: SalesOrder) => {
    onSelectSO(salesOrder);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Select Sales Order</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex space-x-2">
          <div className="flex-1">
            <Label htmlFor="so-search">Search Sales Order</Label>
            <Input
              id="so-search"
              placeholder="Enter SO number (e.g., SO-2024-00001)"
              onChange={(e) => searchSalesOrders(e.target.value)}
            />
          </div>
        </div>

        <SalesOrderList onSelectSO={handleSOSelect} />

        {/* Quick Actions */}
        {shortcuts.length > 0 && (
          <div className="mt-4">
            <CardTitle>Quick Actions</CardTitle>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {shortcuts.map((shortcut, index) => (
                <Button
                  key={index}
                  onClick={shortcut.action}
                  variant="outline"
                  className="h-16 flex flex-col items-center justify-center space-y-2 hover:bg-blue-50 hover:border-blue-200"
                >
                  <shortcut.icon className="w-5 h-5 text-blue-600" />
                  <span className="text-sm font-medium">{shortcut.label}</span>
                </Button>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SalesOrderSelector;

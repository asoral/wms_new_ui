import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Search, Package, Calendar, User, DollarSign, Loader2 } from "lucide-react";
import { createERPNextAPI, getUserDefaultCompany } from "@/services/erpnextApi";
import { useToast } from "@/hooks/use-toast";
import { SalesOrder } from "@/types";
import SOSelector from "./SOSelector";

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
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (searchTerm.trim()) {
      searchSalesOrders(searchTerm);
    } else {
      loadDefaultSalesOrders();
    }
  }, [searchTerm]);

  const loadDefaultSalesOrders = async () => {
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

      const company = await getUserDefaultCompany();
      
      // Get sales orders ready for delivery
      const filters = [
        ['docstatus', '=', 1],
        ['status', 'in', ['To Deliver', 'To Deliver and Bill', 'Partially Delivered']],
        ['company', '=', company]
      ];
      
      const response = await erpnextAPI.getSalesOrders(filters);
      
      if (response?.data && Array.isArray(response.data)) {
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

  const searchSalesOrders = async (searchTerm: string) => {
    try {
      setLoading(true);
      const erpnextAPI = await createERPNextAPI();
      if (!erpnextAPI) return;

      const company = await getUserDefaultCompany();
      
      // Search with proper status filters for delivery
      const filters = [
        ['name', 'like', `%${searchTerm}%`],
        ['docstatus', '=', 1],
        ['status', 'in', ['To Deliver', 'To Deliver and Bill', 'Partially Delivered']],
        ['company', '=', company]
      ];
      
      const response = await erpnextAPI.getSalesOrders(filters);
      
      if (response?.data && Array.isArray(response.data)) {
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "To Deliver": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "To Deliver and Bill": return "bg-blue-100 text-blue-800 border-blue-200";
      case "Partially Delivered": return "bg-orange-100 text-orange-800 border-orange-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Package className="w-5 h-5" />
          <span>Select Sales Order for Delivery</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="so-search">Search Sales Order</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              id="so-search"
              placeholder="SAL"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <SOSelector onOrderSelected={handleSOSelect} isLoading={loading} />
        </div>

        {/* Quick Actions */}
        {shortcuts.length > 0 && (
          <div className="mt-6 pt-4 border-t">
            <CardTitle className="mb-3">Quick Actions</CardTitle>
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

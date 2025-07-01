import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Search, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createERPNextAPI } from "@/services/erpnextApi";
import { useToast } from "@/hooks/use-toast";
import { SalesOrder } from "@/pages/Deliver";

interface SalesOrderSearchProps {
  onSelectSO: (salesOrder: SalesOrder) => void;
  shortcuts: Array<{
    label: string;
    icon: any;
    action: () => void;
  }>;
}

const SalesOrderSearch = ({ onSelectSO, shortcuts }: SalesOrderSearchProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SalesOrder[]>([]);
  const [searching, setSearching] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (searchQuery.length >= 2) {
      searchSalesOrders();
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const searchSalesOrders = async () => {
    try {
      setSearching(true);
      const erpnextAPI = await createERPNextAPI();
      if (!erpnextAPI) {
        toast({
          title: "ERPNext Not Configured",
          description: "Please configure your ERPNext settings in the Profile page.",
          variant: "destructive"
        });
        return;
      }

      const searchResult = await erpnextAPI.getSalesOrders({
        'customer': searchQuery
      });

      if (searchResult.data) {
        // Ensure the data is transformed to match the SalesOrder interface
        const transformedResults: SalesOrder[] = searchResult.data.map((so: any) => ({
          name: so.name,
          id: so.name,
          number: so.name,
          customer: so.customer,
          customer_name: so.customer_name,
          status: so.status,
          delivery_date: so.delivery_date,
          deliveryDate: so.delivery_date,
          expectedDelivery: so.delivery_date,
          grand_total: so.grand_total,
          totalValue: so.grand_total,
          totalItems: so.total_qty,
          percentDelivered: so.per_delivered,
          per_delivered: so.per_delivered,
          items: [] // You might need to fetch items separately if needed
        }));
        setSearchResults(transformedResults);
      }
    } catch (error) {
      console.error('Error searching sales orders:', error);
      toast({
        title: "Search Error",
        description: "Failed to search sales orders. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSearching(false);
    }
  };

  const handleSalesOrderSelect = async (salesOrder: SalesOrder) => {
    try {
      setSearching(true);
      const erpnextAPI = await createERPNextAPI();
      if (!erpnextAPI) {
        toast({
          title: "ERPNext Not Configured",
          description: "Please configure your ERPNext settings in the Profile page.",
          variant: "destructive"
        });
        return;
      }

      // Fetch the sales order items
      const salesOrderResult = await erpnextAPI.getSalesOrder(salesOrder.name);

      if (salesOrderResult.data) {
        // Transform the sales order items to match the SOItem interface
        const transformedItems = salesOrderResult.data.items.map((item: any) => ({
          name: item.name,
          item_code: item.item_code,
          itemCode: item.item_code,
          item_name: item.item_name,
          itemName: item.item_name,
          qty: item.qty,
          orderedQty: item.qty,
          delivered_qty: item.delivered_qty,
          deliveredQty: item.delivered_qty,
          pending_qty: item.pending_qty,
          pendingQty: item.pending_qty,
          rate: item.rate,
          stock_uom: item.stock_uom,
          uom: item.stock_uom,
          warehouse: item.warehouse
        }));

        // Update the sales order with the transformed items
        const updatedSalesOrder: SalesOrder = {
          ...salesOrder,
          items: transformedItems,
        };

        onSelectSO(updatedSalesOrder);
        setSearchQuery(salesOrder.customer);
        setSearchResults([]);
      } else {
        toast({
          title: "Sales Order Error",
          description: "Failed to fetch sales order details. Please try again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error fetching sales order details:', error);
      toast({
        title: "Sales Order Error",
        description: "Failed to fetch sales order details. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSearching(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Search className="w-5 h-5 text-blue-600" />
          <span>Select Sales Order</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex space-x-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by customer name"
              className="pl-10"
              disabled={searching}
            />
          </div>
          {shortcuts.map((shortcut) => (
            <Button
              key={shortcut.label}
              variant="outline"
              onClick={shortcut.action}
              disabled={searching}
            >
              {shortcut.label}
            </Button>
          ))}
        </div>

        {searchResults.length > 0 && (
          <div className="border rounded-lg max-h-60 overflow-y-auto">
            {searchResults.map((salesOrder) => (
              <div
                key={salesOrder.id}
                className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                onClick={() => handleSalesOrderSelect(salesOrder)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{salesOrder.customer_name || salesOrder.customer}</p>
                    <p className="text-sm text-gray-600">{salesOrder.number}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Status: {salesOrder.status}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {searching && (
          <div className="text-center py-4">
            <div className="inline-flex items-center space-x-2">
              <div className="animate-spin rounded-full w-4 h-4 border-b-2 border-blue-600"></div>
              <span className="text-sm text-gray-600">Searching...</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SalesOrderSearch;

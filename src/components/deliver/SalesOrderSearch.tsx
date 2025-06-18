
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { createERPNextAPI, getUserDefaultCompany } from "@/services/erpnextApi";
import { useToast } from "@/hooks/use-toast";
import { SalesOrder } from "../../pages/Deliver";

interface SalesOrderSearchProps {
  onOrderSelected: (order: SalesOrder) => void;
  loading: boolean;
}

const SalesOrderSearch = ({ onOrderSelected, loading }: SalesOrderSearchProps) => {
  const [soNumber, setSoNumber] = useState("");
  const { toast } = useToast();

  const handleSearch = async () => {
    if (!soNumber.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter a Sales Order number.",
        variant: "destructive"
      });
      return;
    }

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
      const soResult = await erpnextAPI.sales.getSalesOrder(soNumber.trim());
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

      onOrderSelected(transformedSO);
      
    } catch (error) {
      console.error('Error fetching SO:', error);
      toast({
        title: "Error",
        description: "Failed to fetch Sales Order from ERPNext",
        variant: "destructive"
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Search className="w-5 h-5" />
          <span>Search Sales Order</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex space-x-4">
          <div className="flex-1">
            <Label htmlFor="soNumber">Sales Order Number</Label>
            <Input
              id="soNumber"
              value={soNumber}
              onChange={(e) => setSoNumber(e.target.value)}
              placeholder="Enter SO number..."
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleSearch();
                }
              }}
            />
          </div>
          <div className="flex items-end">
            <Button onClick={handleSearch} disabled={loading}>
              {loading ? 'Searching...' : 'Search'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SalesOrderSearch;

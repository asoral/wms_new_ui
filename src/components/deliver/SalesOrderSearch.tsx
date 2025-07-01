
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
  const [searching, setSearching] = useState(false);
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

      const company = await getUserDefaultCompany();
      console.log('Searching SO with company:', company);

      // First try to get the specific SO
      try {
        const soResult = await erpnextAPI.getSalesOrder(soNumber.trim());
        console.log('SO search result:', soResult);
        
        if (soResult.data) {
          const so = soResult.data;
          
          // Check if SO belongs to the correct company
          if (company && so.company !== company) {
            toast({
              title: "Sales Order Not Found",
              description: `SO ${soNumber} not found for company ${company}.`,
              variant: "destructive"
            });
            return;
          }
          
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
          toast({
            title: "Success",
            description: `Sales Order ${soNumber} loaded successfully.`,
          });
        }
      } catch (error) {
        console.error('Error fetching specific SO:', error);
        
        // If direct fetch fails, try searching
        try {
          const searchResult = await erpnextAPI.searchSalesOrders(soNumber.trim(), company);
          console.log('SO search by term result:', searchResult);
          
          if (searchResult.data && searchResult.data.length > 0) {
            const so = searchResult.data[0]; // Take first match
            
            // Get full SO details
            const fullSOResult = await erpnextAPI.getSalesOrder(so.name);
            if (fullSOResult.data) {
              const fullSO = fullSOResult.data;
              
              const transformedSO: SalesOrder = {
                number: fullSO.name,
                customer: fullSO.customer_name || fullSO.customer,
                status: fullSO.status,
                deliveryDate: fullSO.delivery_date || fullSO.transaction_date,
                totalItems: fullSO.items ? fullSO.items.length : 0,
                totalValue: fullSO.grand_total || 0,
                items: fullSO.items ? fullSO.items.map((item: any) => ({
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
              toast({
                title: "Success",
                description: `Sales Order ${fullSO.name} loaded successfully.`,
              });
            }
          } else {
            toast({
              title: "Sales Order Not Found",
              description: `No sales order found matching "${soNumber}".`,
              variant: "destructive"
            });
          }
        } catch (searchError) {
          console.error('Error searching SO:', searchError);
          toast({
            title: "Error",
            description: "Failed to search for Sales Order in ERPNext",
            variant: "destructive"
          });
        }
      }
      
    } catch (error) {
      console.error('Error in SO search:', error);
      toast({
        title: "Error",
        description: "Failed to fetch Sales Order from ERPNext",
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
            <Button onClick={handleSearch} disabled={loading || searching}>
              {searching ? 'Searching...' : 'Search'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SalesOrderSearch;

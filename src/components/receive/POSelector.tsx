
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Search, Package, Calendar, User, DollarSign, Loader2 } from "lucide-react";
import { createERPNextAPI, getUserDefaultCompany } from "@/services/erpnextApi";
import { useToast } from "@/hooks/use-toast";

interface PurchaseOrder {
  name: string;
  supplier: string;
  supplier_name: string;
  schedule_date: string;
  grand_total: number;
  status: string;
  per_received: number;
}

interface POSelectorProps {
  onOrderSelected: (order: any) => void;
  loading: boolean;
}

const POSelector = ({ onOrderSelected, loading }: POSelectorProps) => {
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (searchTerm.trim()) {
      searchPurchaseOrders(searchTerm);
    } else {
      loadDefaultPurchaseOrders();
    }
  }, [searchTerm]);

  const loadDefaultPurchaseOrders = async () => {
    try {
      setIsLoading(true);
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
      
      const result = await erpnextAPI.getPurchaseOrders([
        ['docstatus', '=', 1],
        ['status', 'in', ['To Receive', 'To Receive and Bill', 'Partially Received']],
        ['company', '=', company]
      ]);
      
      if (result.data && Array.isArray(result.data)) {
        const transformedResults: PurchaseOrder[] = result.data.map((po: any) => ({
          name: po.name,
          supplier: po.supplier,
          supplier_name: po.supplier_name || po.supplier,
          schedule_date: po.schedule_date || po.transaction_date,
          grand_total: po.grand_total || 0,
          status: po.status,
          per_received: po.per_received || 0
        }));
        
        setPurchaseOrders(transformedResults);
      } else {
        setPurchaseOrders([]);
      }
    } catch (error) {
      console.error('Error loading purchase orders:', error);
      toast({
        title: "Error",
        description: "Failed to load purchase orders from ERPNext",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const searchPurchaseOrders = async (searchTerm: string) => {
    try {
      setIsLoading(true);
      const erpnextAPI = await createERPNextAPI();
      if (!erpnextAPI) return;

      const company = await getUserDefaultCompany();
      
      // Search with proper status filters for receiving
      const filters = [
        ['name', 'like', `%${searchTerm}%`],
        ['docstatus', '=', 1],
        ['status', 'in', ['To Receive', 'To Receive and Bill', 'Partially Received']],
        ['company', '=', company]
      ];
      
      const result = await erpnextAPI.getPurchaseOrders(filters, company, 50);
      
      if (result.data && Array.isArray(result.data)) {
        const transformedResults: PurchaseOrder[] = result.data.map((po: any) => ({
          name: po.name,
          supplier: po.supplier,
          supplier_name: po.supplier_name || po.supplier,
          schedule_date: po.schedule_date || po.transaction_date,
          grand_total: po.grand_total || 0,
          status: po.status,
          per_received: po.per_received || 0
        }));
        
        setPurchaseOrders(transformedResults);
      } else {
        setPurchaseOrders([]);
      }
    } catch (error) {
      console.error('Error searching purchase orders:', error);
      toast({
        title: "Error",
        description: "Failed to search purchase orders",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const selectPurchaseOrder = async (po: PurchaseOrder) => {
    try {
      setIsLoading(true);
      const erpnextAPI = await createERPNextAPI();
      if (!erpnextAPI) return;

      // Get full PO details
      const fullPOResult = await erpnextAPI.getPurchaseOrder(po.name);
      if (fullPOResult.data) {
        const fullPO = fullPOResult.data;
        
        const transformedPO = {
          number: fullPO.name,
          supplier: fullPO.supplier_name || fullPO.supplier,
          status: fullPO.status,
          scheduleDate: fullPO.schedule_date || fullPO.transaction_date,
          totalItems: fullPO.items ? fullPO.items.length : 0,
          totalValue: fullPO.grand_total || 0,
          items: fullPO.items ? fullPO.items.map((item: any) => ({
            itemCode: item.item_code,
            itemName: item.item_name,
            orderedQty: item.qty || 0,
            receivedQty: item.received_qty || 0,
            pendingQty: (item.qty || 0) - (item.received_qty || 0),
            rate: item.rate || 0,
            uom: item.stock_uom || item.uom,
            warehouse: item.warehouse || 'Main Store',
            qtyToReceive: (item.qty || 0) - (item.received_qty || 0)
          })) : []
        };

        // Call the parent handler to proceed to receiving
        onOrderSelected(transformedPO);
      }
    } catch (error) {
      console.error('Error fetching PO details:', error);
      toast({
        title: "Error",
        description: "Failed to fetch Purchase Order details",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "To Receive": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "To Receive and Bill": return "bg-blue-100 text-blue-800 border-blue-200";
      case "Partially Received": return "bg-orange-100 text-orange-800 border-orange-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Package className="w-5 h-5" />
          <span>Select Purchase Order to Receive</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="po-search">Search Purchase Order</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              id="po-search"
              placeholder="PUR"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Purchase Orders List */}
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              Loading purchase orders...
            </div>
          ) : purchaseOrders.length > 0 ? (
            purchaseOrders.map((po) => (
              <div
                key={po.name}
                onClick={() => selectPurchaseOrder(po)}
                className="p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 hover:border-blue-300 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <div className="font-semibold text-lg">{po.name}</div>
                      <Badge className={getStatusColor(po.status)} variant="outline">
                        {po.status}
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-600 mt-1">{po.supplier_name}</div>
                    <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                      <div className="flex items-center">
                        <Calendar className="w-3 h-3 mr-1" />
                        Due: {po.schedule_date ? new Date(po.schedule_date).toLocaleDateString() : 'N/A'}
                      </div>
                      <div>
                        Received: {po.per_received}%
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-green-600 text-lg">
                      ₹{po.grand_total.toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Package className="w-8 h-8 mx-auto mb-2 text-gray-400" />
              <p>No purchase orders found</p>
              <p className="text-sm mt-1">
                {searchTerm ? 'Try a different search term' : 'No purchase orders available for receiving'}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default POSelector;


import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Search, ChevronDown, Package, Calendar, User, DollarSign, Loader2 } from "lucide-react";
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
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<PurchaseOrder[]>([]);
  const [searching, setSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (searchTerm.length >= 2) {
      const debounceTimer = setTimeout(() => {
        searchPurchaseOrders();
      }, 300);
      return () => clearTimeout(debounceTimer);
    } else {
      setSearchResults([]);
      setShowDropdown(false);
    }
  }, [searchTerm]);

  const searchPurchaseOrders = async () => {
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
      
      // Search for submitted POs with pending receiving status
      const filters = {
        docstatus: 1,
        status: ['in', ['To Receive', 'To Receive and Bill', 'Partially Received']]
      };

      // Add search filter if we have a search term
      if (searchTerm.trim()) {
        Object.assign(filters, {
          name: ['like', `%${searchTerm.trim()}%`]
        });
      }
      
      const result = await erpnextAPI.getPurchaseOrders(filters, company, 20);
      
      if (result.data) {
        // Transform the data to match our interface
        const transformedResults: PurchaseOrder[] = result.data.map((po: any) => ({
          name: po.name,
          supplier: po.supplier,
          supplier_name: po.supplier_name || po.supplier,
          schedule_date: po.schedule_date || po.transaction_date,
          grand_total: po.grand_total || 0,
          status: po.status,
          per_received: po.per_received || 0
        }));
        
        setSearchResults(transformedResults);
        setShowDropdown(true);
      }
    } catch (error) {
      console.error('Error searching purchase orders:', error);
      toast({
        title: "Search Error",
        description: "Failed to search purchase orders from ERPNext",
        variant: "destructive"
      });
    } finally {
      setSearching(false);
    }
  };

  const selectPurchaseOrder = async (po: PurchaseOrder) => {
    try {
      setSearching(true);
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

        setSelectedPO(po);
        setShowDropdown(false);
        setSearchTerm(po.name);
        
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
      setSearching(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "To Receive": return "bg-yellow-100 text-yellow-800";
      case "To Receive and Bill": return "bg-blue-100 text-blue-800";
      case "Partially Received": return "bg-orange-100 text-orange-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Search className="w-5 h-5" />
          <span>Select Purchase Order</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative">
          <Label htmlFor="poSearch">Search Purchase Order</Label>
          <div className="relative mt-1">
            <Input
              id="poSearch"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by PO number..."
              className="pr-10"
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
              {searching && (
                <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
              )}
              <ChevronDown className="w-4 h-4 text-gray-400" />
            </div>
          </div>

          {/* Dropdown Results */}
          {showDropdown && searchResults.length > 0 && (
            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
              {searchResults.map((po, index) => (
                <div
                  key={index}
                  className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                  onClick={() => selectPurchaseOrder(po)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900">{po.name}</div>
                      <div className="text-sm text-gray-600 truncate">{po.supplier_name || po.supplier}</div>
                      <div className="flex items-center space-x-4 mt-1">
                        <Badge variant="outline" className={getStatusColor(po.status)}>
                          {po.status}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          Due: {new Date(po.schedule_date).toLocaleDateString()}
                        </span>
                        <span className="text-xs text-gray-500">
                          Received: {po.per_received || 0}%
                        </span>
                      </div>
                    </div>
                    <div className="text-right ml-2">
                      <div className="font-medium text-green-600">
                        ₹{(po.grand_total || 0).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {showDropdown && searchResults.length === 0 && !searching && searchTerm.length >= 2 && (
            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg p-4 text-center text-gray-500">
              No purchase orders found matching "{searchTerm}"
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default POSelector;

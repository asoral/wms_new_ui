
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<PurchaseOrder[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (searchTerm.length >= 3) {
      const debounceTimer = setTimeout(() => {
        searchPurchaseOrders();
      }, 300);
      return () => clearTimeout(debounceTimer);
    } else {
      setSearchResults([]);
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
      
      // Search for submitted POs with proper receiving status using Frappe filters
      const filters = {
        docstatus: 1, // Submitted documents only
        status: ['in', ['To Receive', 'To Receive and Bill', 'Partially Received']]
      };

      // Add search filter if we have a search term
      if (searchTerm.trim()) {
        Object.assign(filters, {
          name: ['like', `%${searchTerm.trim()}%`]
        });
      }
      
      const result = await erpnextAPI.getPurchaseOrders(filters, company, 20);
      
      if (result.data && Array.isArray(result.data)) {
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
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Error searching purchase orders:', error);
      toast({
        title: "Search Error",
        description: "Failed to search purchase orders from ERPNext",
        variant: "destructive"
      });
      setSearchResults([]);
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
        setSearchTerm(po.name);
        setSearchResults([]);
        
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
      case "To Receive": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "To Receive and Bill": return "bg-blue-100 text-blue-800 border-blue-200";
      case "Partially Received": return "bg-orange-100 text-orange-800 border-orange-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      searchPurchaseOrders();
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Package className="w-5 h-5" />
            <span>Receive Items from Purchase Order</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearchSubmit} className="flex space-x-2">
            <div className="flex-1">
              <Label htmlFor="poSearch" className="sr-only">Search Purchase Order</Label>
              <Input
                id="poSearch"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Enter Purchase Order number (e.g., PUR-ORD-2025-00001)"
                className="w-full"
              />
            </div>
            <Button 
              type="submit" 
              disabled={searching || !searchTerm.trim()}
              className="px-6"
            >
              {searching ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
              Search
            </Button>
          </form>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="mt-4 space-y-2 max-h-60 overflow-y-auto">
              {searchResults.map((po, index) => (
                <div
                  key={index}
                  className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => selectPurchaseOrder(po)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-gray-900 text-lg">{po.name}</div>
                      <div className="text-sm text-gray-600 flex items-center mt-1">
                        <User className="w-4 h-4 mr-1" />
                        {po.supplier_name || po.supplier}
                      </div>
                      <div className="flex items-center space-x-4 mt-2">
                        <Badge className={getStatusColor(po.status)}>
                          {po.status}
                        </Badge>
                        <div className="text-sm text-gray-500 flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          Due: {new Date(po.schedule_date).toLocaleDateString()}
                        </div>
                        <div className="text-sm text-gray-500">
                          Received: {po.per_received || 0}%
                        </div>
                      </div>
                    </div>
                    <div className="text-right ml-4">
                      <div className="font-semibold text-green-600 flex items-center">
                        <DollarSign className="w-4 h-4 mr-1" />
                        ₹{(po.grand_total || 0).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {searchResults.length === 0 && !searching && searchTerm.length >= 3 && (
            <div className="mt-4 p-4 border border-gray-200 rounded-lg text-center text-gray-500">
              <Package className="w-8 h-8 mx-auto mb-2 text-gray-400" />
              <p>No purchase orders found matching "{searchTerm}"</p>
              <p className="text-sm mt-1">Try searching with a different Purchase Order number</p>
            </div>
          )}

          {searchTerm.length > 0 && searchTerm.length < 3 && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                Please enter at least 3 characters to search for Purchase Orders
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default POSelector;

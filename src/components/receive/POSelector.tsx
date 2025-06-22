
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, ChevronDown, Package, Calendar, User, DollarSign } from "lucide-react";
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
      searchPurchaseOrders();
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
      
      // Search for purchase orders that are ready for receiving
      const result = await erpnextAPI.purchase.searchPurchaseOrders(searchTerm.trim(), company, 20);
      
      if (result.data) {
        setSearchResults(result.data);
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
      const fullPOResult = await erpnextAPI.purchase.getPurchaseOrder(po.name);
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
    <div className="space-y-6">
      {/* Search Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Search className="w-5 h-5" />
            <span>Select Purchase Order for Receiving</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Label htmlFor="poSearch">Search Purchase Order</Label>
            <div className="flex space-x-2 mt-1">
              <div className="relative flex-1">
                <Input
                  id="poSearch"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by PO number, supplier name..."
                  className="pr-10"
                />
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                {searching && (
                  <div className="absolute right-8 top-1/2 transform -translate-y-1/2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  </div>
                )}
              </div>
            </div>

            {/* Dropdown Results */}
            {showDropdown && searchResults.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
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
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg p-4 text-center text-gray-500">
                No purchase orders found matching "{searchTerm}"
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Selected PO Details */}
      {selectedPO && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center space-x-2">
                <Package className="w-5 h-5" />
                <span>Selected Purchase Order</span>
              </span>
              <Badge className={getStatusColor(selectedPO.status)}>{selectedPO.status}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Package className="w-5 h-5 text-blue-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-medium truncate">{selectedPO.name}</div>
                  <div className="text-sm text-gray-600">Order Number</div>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <User className="w-5 h-5 text-green-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-medium truncate" title={selectedPO.supplier_name || selectedPO.supplier}>
                    {selectedPO.supplier_name || selectedPO.supplier}
                  </div>
                  <div className="text-sm text-gray-600">Supplier</div>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Calendar className="w-5 h-5 text-orange-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-medium">
                    {new Date(selectedPO.schedule_date).toLocaleDateString()}
                  </div>
                  <div className="text-sm text-gray-600">Schedule Date</div>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <DollarSign className="w-5 h-5 text-purple-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-medium">₹{selectedPO.grand_total.toLocaleString()}</div>
                  <div className="text-sm text-gray-600">Total Value</div>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <Button disabled={loading} size="lg">
                Proceed to Receive Items
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default POSelector;

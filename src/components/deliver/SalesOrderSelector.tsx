
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, ChevronDown, Package, Calendar, User, DollarSign } from "lucide-react";
import { createERPNextAPI, getUserDefaultCompany } from "@/services/erpnextApi";
import { useToast } from "@/hooks/use-toast";
import { SalesOrder } from "../../pages/Deliver";

interface SalesOrderSelectorProps {
  onOrderSelected: (order: SalesOrder) => void;
  loading: boolean;
}

const SalesOrderSelector = ({ onOrderSelected, loading }: SalesOrderSelectorProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedSO, setSelectedSO] = useState<SalesOrder | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (searchTerm.length >= 2) {
      searchSalesOrders();
    } else {
      setSearchResults([]);
      setShowDropdown(false);
    }
  }, [searchTerm]);

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

      const company = await getUserDefaultCompany();
      
      // Search for sales orders that are ready for delivery
      const result = await erpnextAPI.sales.searchSalesOrders(searchTerm.trim(), company, 20);
      
      if (result.data) {
        setSearchResults(result.data);
        setShowDropdown(true);
      }
    } catch (error) {
      console.error('Error searching sales orders:', error);
      toast({
        title: "Search Error",
        description: "Failed to search sales orders from ERPNext",
        variant: "destructive"
      });
    } finally {
      setSearching(false);
    }
  };

  const selectSalesOrder = async (so: any) => {
    try {
      setSearching(true);
      const erpnextAPI = await createERPNextAPI();
      if (!erpnextAPI) return;

      // Get full SO details
      const fullSOResult = await erpnextAPI.sales.getSalesOrder(so.name);
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

        setSelectedSO(transformedSO);
        setShowDropdown(false);
        setSearchTerm(so.name);
      }
    } catch (error) {
      console.error('Error fetching SO details:', error);
      toast({
        title: "Error",
        description: "Failed to fetch Sales Order details",
        variant: "destructive"
      });
    } finally {
      setSearching(false);
    }
  };

  const proceedToDelivery = () => {
    if (selectedSO) {
      onOrderSelected(selectedSO);
    }
  };

  return (
    <div className="space-y-6">
      {/* Search Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Search className="w-5 h-5" />
            <span>Select Sales Order for Delivery</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Label htmlFor="soSearch">Search Sales Order</Label>
            <div className="flex space-x-2 mt-1">
              <div className="relative flex-1">
                <Input
                  id="soSearch"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by SO number, customer name..."
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
                {searchResults.map((so, index) => (
                  <div
                    key={index}
                    className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                    onClick={() => selectSalesOrder(so)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900">{so.name}</div>
                        <div className="text-sm text-gray-600 truncate">{so.customer_name || so.customer}</div>
                        <div className="flex items-center space-x-4 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {so.status}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            Due: {new Date(so.delivery_date || so.transaction_date).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="text-right ml-2">
                        <div className="font-medium text-green-600">
                          ₹{(so.grand_total || 0).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {showDropdown && searchResults.length === 0 && !searching && searchTerm.length >= 2 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg p-4 text-center text-gray-500">
                No sales orders found matching "{searchTerm}"
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Selected SO Details */}
      {selectedSO && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center space-x-2">
                <Package className="w-5 h-5" />
                <span>Selected Sales Order</span>
              </span>
              <Badge>{selectedSO.status}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Package className="w-5 h-5 text-blue-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-medium truncate">{selectedSO.number}</div>
                  <div className="text-sm text-gray-600">Order Number</div>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <User className="w-5 h-5 text-green-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-medium truncate" title={selectedSO.customer}>{selectedSO.customer}</div>
                  <div className="text-sm text-gray-600">Customer</div>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Calendar className="w-5 h-5 text-orange-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-medium">
                    {new Date(selectedSO.deliveryDate).toLocaleDateString()}
                  </div>
                  <div className="text-sm text-gray-600">Delivery Date</div>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <DollarSign className="w-5 h-5 text-purple-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-medium">₹{selectedSO.totalValue.toLocaleString()}</div>
                  <div className="text-sm text-gray-600">Total Value</div>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <Button onClick={proceedToDelivery} disabled={loading} size="lg">
                Proceed to Scan Items
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SalesOrderSelector;

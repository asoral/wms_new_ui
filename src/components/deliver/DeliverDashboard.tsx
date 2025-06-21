
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Printer,
  Package,
  Warehouse,
  Search,
  TrendingUp,
  AlertTriangle,
  Calendar,
  DollarSign,
  CheckCircle,
  ArrowRightLeft,
  RefreshCw,
  FileText,
  User,
  ChevronDown
} from "lucide-react";
import { createERPNextAPI, getUserDefaultCompany } from "@/services/erpnextApi";
import { useToast } from "@/hooks/use-toast";
import DraftDeliveryNotes from "./DraftDeliveryNotes";

interface DeliverDashboardProps {
  onSelectSalesOrder: (salesOrder: any) => void;
  onViewSalesOrders: () => void;
  dashboardData: {
    todaysDelivery: number;
    totalDeliveries: number;
  };
  isLoading: boolean;
}

interface SalesOrder {
  name: string;
  customer: string;
  customer_name: string;
  delivery_date: string;
  grand_total: number;
  status: string;
  per_delivered: number;
  total_qty: number;
}

const DeliverDashboard = ({ onSelectSalesOrder, onViewSalesOrders, dashboardData, isLoading }: DeliverDashboardProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<SalesOrder[]>([]);
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
      
      // Search for sales orders using the sales API
      const result = await erpnextAPI.sales.searchSalesOrders(searchTerm.trim(), company, 20);
      
      if (result.data) {
        const transformedOrders: SalesOrder[] = result.data.map((order: any) => ({
          name: order.name || '',
          customer: order.customer || '',
          customer_name: order.customer_name || order.customer || '',
          delivery_date: order.delivery_date || '',
          grand_total: order.grand_total || 0,
          status: order.status || '',
          per_delivered: order.per_delivered || 0,
          total_qty: order.total_qty || 0
        }));
        
        setSearchResults(transformedOrders);
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

  const selectSalesOrder = async (so: SalesOrder) => {
    try {
      setSearching(true);
      const erpnextAPI = await createERPNextAPI();
      if (!erpnextAPI) return;

      // Get full SO details
      const fullSOResult = await erpnextAPI.sales.getSalesOrder(so.name);
      if (fullSOResult.data) {
        const fullSO = fullSOResult.data;
        
        const transformedSO = {
          value: fullSO.name,
          label: `${fullSO.name} - ${fullSO.customer_name || fullSO.customer}`,
          customer: fullSO.customer,
          customer_name: fullSO.customer_name || fullSO.customer,
          delivery_date: fullSO.delivery_date || fullSO.transaction_date,
          grand_total: fullSO.grand_total || 0,
          status: fullSO.status,
          totalItems: fullSO.items ? fullSO.items.length : 0,
          items: fullSO.items ? fullSO.items.map((item: any) => ({
            itemCode: item.item_code,
            itemName: item.item_name,
            orderedQty: item.qty || 0,
            deliveredQty: item.delivered_qty || 0,
            pendingQty: (item.qty || 0) - (item.delivered_qty || 0),
            rate: item.rate || 0,
            uom: item.stock_uom || item.uom,
            warehouse: item.warehouse || 'Main Store'
          })) : []
        };

        setSelectedSO(so);
        setShowDropdown(false);
        setSearchTerm(so.name);
        
        // Call the parent handler to proceed to the next step
        onSelectSalesOrder(transformedSO);
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "To Deliver": return "bg-yellow-100 text-yellow-800";
      case "To Deliver and Bill": return "bg-blue-100 text-blue-800";
      case "Partially Delivered": return "bg-orange-100 text-orange-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const handleDraftSelect = async (draftName: string, salesOrderNumber?: string) => {
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

      // Get the draft delivery note details
      const draftResult = await erpnextAPI.sales.getDeliveryNote(draftName);
      if (draftResult.data) {
        const draftData = draftResult.data;
        
        // Transform to the format expected by the delivery workflow
        const transformedDraft = {
          value: draftName,
          label: `${draftName} - ${draftData.customer_name || draftData.customer}`,
          customer: draftData.customer,
          customer_name: draftData.customer_name || draftData.customer,
          delivery_date: draftData.posting_date,
          grand_total: draftData.grand_total || 0,
          status: "Draft",
          isDraft: true,
          draftName: draftName,
          items: draftData.items ? draftData.items.map((item: any) => ({
            itemCode: item.item_code,
            itemName: item.item_name,
            orderedQty: item.qty || 0,
            deliveredQty: 0,
            pendingQty: item.qty || 0,
            rate: item.rate || 0,
            uom: item.stock_uom || item.uom,
            warehouse: item.warehouse || 'Main Store'
          })) : []
        };

        onSelectSalesOrder(transformedDraft);
        
        toast({
          title: "Draft Delivery Note Selected",
          description: `Continuing with draft delivery note: ${draftName}`,
        });
      }
    } catch (error) {
      console.error('Error loading draft delivery note:', error);
      toast({
        title: "Error",
        description: "Failed to load draft delivery note details",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5" />
            <span>Delivery Summary</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-600 mb-1">Today's Deliveries</p>
                    <p className="text-2xl font-bold text-blue-600">{dashboardData.todaysDelivery}</p>
                  </div>
                  <Calendar className="w-8 h-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-green-50 border-green-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-green-600 mb-1">Total Deliveries</p>
                    <p className="text-2xl font-bold text-green-600">{dashboardData.totalDeliveries}</p>
                  </div>
                  <Package className="w-8 h-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Sales Order Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Warehouse className="w-5 h-5" />
            <span>Select Sales Order for Delivery</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="relative">
              <Label htmlFor="soSearch">Search Sales Order</Label>
              <div className="relative mt-1">
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
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  </div>
                )}
              </div>

              {/* Dropdown Results */}
              {showDropdown && searchResults.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                  {searchResults.map((so, index) => (
                    <div
                      key={index}
                      className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                      onClick={() => selectSalesOrder(so)}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-900">{so.name}</div>
                          <div className="text-sm text-gray-600 truncate">{so.customer_name}</div>
                          <div className="flex items-center space-x-4 mt-1">
                            <Badge className={getStatusColor(so.status)} variant="outline">
                              {so.status}
                            </Badge>
                            <span className="text-xs text-gray-500">
                              Due: {new Date(so.delivery_date).toLocaleDateString()}
                            </span>
                            <span className="text-xs text-gray-500">
                              Delivered: {so.per_delivered}%
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
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg p-4 text-center text-gray-500">
                  No sales orders found matching "{searchTerm}"
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Button variant="outline" className="h-20 flex-col space-y-2" onClick={onViewSalesOrders}>
              <FileText className="w-6 h-6" />
              <span>View All SOs</span>
            </Button>
            
            <Button variant="outline" className="h-20 flex-col space-y-2">
              <Printer className="w-6 h-6" />
              <span>Print Label</span>
            </Button>
            
            <Button variant="outline" className="h-20 flex-col space-y-2">
              <CheckCircle className="w-6 h-6" />
              <span>Quality Check</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Draft Delivery Notes */}
      <DraftDeliveryNotes onSelectDraft={handleDraftSelect} />
    </div>
  );
};

export default DeliverDashboard;

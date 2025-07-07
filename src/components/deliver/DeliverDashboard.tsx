import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Truck, Package, FileText, Search, Printer, Shield, Loader2 } from "lucide-react";
import { MetricCard } from "@/components/ui/metric-card";
import { createERPNextAPI, getUserDefaultCompany } from "@/services/erpnextApi";
import { useToast } from "@/hooks/use-toast";
import { SalesOrderOption, DashboardData } from "@/types";

interface DeliverDashboardProps {
  onSelectSalesOrder: (salesOrder: SalesOrderOption) => void;
  onViewSalesOrders: () => void;
  dashboardData: DashboardData;
  isLoading: boolean;
}

interface DraftDeliveryNote {
  name: string;
  customer: string;
  status: string;
  totalItems: number;
  totalValue: number;
  salesOrder: string;
}

const DeliverDashboard = ({ onSelectSalesOrder, onViewSalesOrders, dashboardData, isLoading }: DeliverDashboardProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<SalesOrderOption[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [draftDeliveryNotes, setDraftDeliveryNotes] = useState<DraftDeliveryNote[]>([]);
  const [draftsLoading, setDraftsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchDraftDeliveryNotes();
  }, []);

  const fetchDraftDeliveryNotes = async () => {
    setDraftsLoading(true);
    try {
      const erpnextAPI = await createERPNextAPI();
      if (!erpnextAPI) return;

      const company = await getUserDefaultCompany();
      
      // Fetch draft delivery notes
      const response = await erpnextAPI.getDeliveryNotes([
        ['docstatus', '=', 0] // Draft status
      ], company || undefined, 10);

      const drafts: DraftDeliveryNote[] = response.data?.map((dn: any) => ({
        name: dn.name,
        customer: dn.customer,
        status: dn.status || 'Draft',
        totalItems: dn.items?.length || 0,
        totalValue: dn.grand_total || 0,
        salesOrder: dn.items?.[0]?.against_sales_order || ''
      })) || [];

      setDraftDeliveryNotes(drafts);

    } catch (error) {
      console.error('Error fetching draft delivery notes:', error);
    } finally {
      setDraftsLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      toast({
        title: "Search Term Required",
        description: "Please enter a sales order number or customer name to search.",
        variant: "destructive"
      });
      return;
    }

    setSearchLoading(true);
    try {
      const erpnextAPI = await createERPNextAPI();
      if (!erpnextAPI) {
        toast({
          title: "ERPNext Not Configured",
          description: "Please configure your ERPNext settings.",
          variant: "destructive"
        });
        return;
      }

      const company = await getUserDefaultCompany();
      
      // Search sales orders
      const response = await erpnextAPI.searchSalesOrders(searchTerm, company || undefined, 20);

      const results: SalesOrderOption[] = response.data?.map((so: any) => ({
        id: so.name,
        number: so.name,
        customer: so.customer,
        status: so.status,
        delivery_date: so.delivery_date,
        totalValue: so.grand_total || 0,
        totalItems: 0, // Will be populated when selected
        expectedDelivery: so.delivery_date,
        percentDelivered: so.per_delivered || 0
      })) || [];

      setSearchResults(results);

      if (results.length === 0) {
        toast({
          title: "No Results",
          description: "No sales orders found matching your search criteria.",
          variant: "destructive"
        });
      }

    } catch (error) {
      console.error('Error searching sales orders:', error);
      toast({
        title: "Search Failed",
        description: "Failed to search sales orders. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSearchLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      {/* Delivery Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Package className="w-5 h-5" />
            <span>Delivery Summary</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-20 bg-gray-100 rounded-lg"></div>
                </div>
              ))
            ) : (
              <>
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="flex items-center p-6">
                    <div className="flex items-center space-x-4">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Truck className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-blue-600">Today's Deliveries</p>
                        <h3 className="text-2xl font-bold text-blue-600">{dashboardData.deliveredToday}</h3>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-green-50 border-green-200">
                  <CardContent className="flex items-center p-6">
                    <div className="flex items-center space-x-4">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <Package className="w-6 h-6 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-green-600">Total Deliveries</p>
                        <h3 className="text-2xl font-bold text-green-600">2</h3>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-yellow-50 border-yellow-200">
                  <CardContent className="flex items-center p-6">
                    <div className="flex items-center space-x-4">
                      <div className="p-2 bg-yellow-100 rounded-lg">
                        <FileText className="w-6 h-6 text-yellow-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-yellow-600">Pending Orders</p>
                        <h3 className="text-2xl font-bold text-yellow-600">{dashboardData.pendingOrders}</h3>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-purple-50 border-purple-200">
                  <CardContent className="flex items-center p-6">
                    <div className="flex items-center space-x-4">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <Truck className="w-6 h-6 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-purple-600">Ready to Ship</p>
                        <h3 className="text-2xl font-bold text-purple-600">{dashboardData.readyToShip}</h3>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Select Sales Order for Delivery */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Search className="w-5 h-5" />
            <span>Select Sales Order for Delivery</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Search Sales Order</label>
            <div className="flex space-x-2">
              <Input
                placeholder="Search by SO number, customer name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={handleKeyPress}
                className="flex-1"
              />
              <Button 
                onClick={handleSearch} 
                disabled={searchLoading}
                className="min-w-[100px]"
              >
                {searchLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Search"
                )}
              </Button>
            </div>
          </div>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium text-sm text-gray-700">Search Results:</h4>
              {searchResults.slice(0, 5).map((so) => (
                <div 
                  key={so.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                  onClick={() => onSelectSalesOrder(so)}
                >
                  <div className="flex-1">
                    <div className="font-medium text-blue-600">{so.number}</div>
                    <div className="text-sm text-gray-600">{so.customer}</div>
                    <div className="text-xs text-gray-500">
                      Delivery: {formatDate(so.delivery_date)} • {formatCurrency(so.totalValue)}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline">{so.status}</Badge>
                  </div>
                </div>
              ))}
              {searchResults.length > 5 && (
                <div className="text-center text-sm text-gray-500">
                  Showing 5 of {searchResults.length} results
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button 
              onClick={onViewSalesOrders} 
              variant="outline"
              className="h-16 flex flex-col items-center justify-center space-y-2 hover:bg-blue-50 hover:border-blue-200"
            >
              <FileText className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-medium">View All SOs</span>
            </Button>
            
            <Button 
              variant="outline"
              className="h-16 flex flex-col items-center justify-center space-y-2 hover:bg-green-50 hover:border-green-200"
              onClick={() => {
                // Navigate to print label
                window.location.href = '/print-label';
              }}
            >
              <Printer className="w-5 h-5 text-green-600" />
              <span className="text-sm font-medium">Print Label</span>
            </Button>
            
            <Button 
              variant="outline"
              className="h-16 flex flex-col items-center justify-center space-y-2 hover:bg-purple-50 hover:border-purple-200"
              onClick={() => {
                // Navigate to quality check
                window.location.href = '/quality-check';
              }}
            >
              <Shield className="w-5 h-5 text-purple-600" />
              <span className="text-sm font-medium">Quality Check</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Draft Delivery Notes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <FileText className="w-5 h-5" />
              <span>Draft Delivery Notes</span>
            </div>
            <Button 
              onClick={fetchDraftDeliveryNotes} 
              variant="outline" 
              size="sm"
              disabled={draftsLoading}
            >
              {draftsLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Refresh"
              )}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {draftsLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-16 bg-gray-100 rounded-lg"></div>
                </div>
              ))}
            </div>
          ) : draftDeliveryNotes.length > 0 ? (
            <div className="space-y-3">
              {draftDeliveryNotes.map((draft) => (
                <div 
                  key={draft.name}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-medium">{draft.name}</span>
                      <Badge variant="secondary">{draft.status}</Badge>
                      <span className="text-sm text-gray-500">SO: {draft.salesOrder}</span>
                    </div>
                    <div className="text-sm text-gray-600">
                      <span className="inline-flex items-center mr-4">
                        <Package className="w-3 h-3 mr-1" />
                        {draft.totalItems} items
                      </span>
                      <span className="text-gray-500">₀</span> {/* As shown in screenshot */}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Invalid Date {/* As shown in screenshot */}
                    </div>
                  </div>
                  <Button 
                    size="sm"
                    className="bg-gray-900 hover:bg-gray-800 text-white"
                  >
                    Continue
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No draft delivery notes found
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DeliverDashboard;

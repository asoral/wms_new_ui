
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Package, FileText, CheckCircle, AlertTriangle, Search } from "lucide-react";
import { MetricCard } from "@/components/ui/metric-card";
import { createERPNextAPI, getUserDefaultCompany } from "@/services/erpnextApi";
import { useToast } from "@/hooks/use-toast";
import StatusBadge from "@/components/ui/status-badge";
import PurchaseOrderSelector from "./PurchaseOrderSelector";

interface ReceiveDashboardProps {
  onSelectPO: (purchaseOrder: any) => void;
  onSelectDraftReceipt: (receiptId: string) => void;
  shortcuts?: Array<{
    label: string;
    icon: any;
    action: () => void;
  }>;
}

interface DashboardAnalytics {
  totalPOs: number;
  pendingPOs: number;
  completedPOs: number;
  draftReceipts: number;
}

const ReceiveDashboard = ({ onSelectPO, onSelectDraftReceipt, shortcuts = [] }: ReceiveDashboardProps) => {
  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([]);
  const [filteredPOs, setFilteredPOs] = useState<any[]>([]);
  const [draftReceipts, setDraftReceipts] = useState<any[]>([]);
  const [filteredDrafts, setFilteredDrafts] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<DashboardAnalytics>({
    totalPOs: 0,
    pendingPOs: 0,
    completedPOs: 0,
    draftReceipts: 0
  });
  const [loading, setLoading] = useState(false);
  const [poSearchTerm, setPOSearchTerm] = useState("");
  const [draftSearchTerm, setDraftSearchTerm] = useState("");
  const { toast } = useToast();

  // Helper function to safely format dates
  const formatDate = (dateString: string | null | undefined): string => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'N/A';
      return date.toLocaleDateString();
    } catch (error) {
      return 'N/A';
    }
  };

  // Helper function to count items safely (from items array or total_qty)
  const getItemCount = (obj: any): string => {
    // Try to get items array length first
    if (obj.items && Array.isArray(obj.items)) {
      return obj.items.length.toString();
    }
    // Fallback to total_qty if items array not available
    if (obj.total_qty && typeof obj.total_qty === 'number') {
      return obj.total_qty.toString();
    }
    return '0';
  };

  // Helper function to get supplier name (from ERPNext supplier_name field)
  const getSupplierName = (obj: any): string => {
    return obj.supplier_name || obj.supplier || 'Unknown Supplier';
  };

  // Helper function to get total value (from ERPNext grand_total field)
  const getTotalValue = (obj: any): number => {
    const total = obj.grand_total || 0;
    return (typeof total === 'number') ? total : 0;
  };

  // Helper function to get PO required date (from schedule_date)
  const getPORequiredDate = (po: any): string => {
    return formatDate(po.schedule_date);
  };

  // Helper function to get receipt created date (from posting_date)
  const getReceiptCreatedDate = (receipt: any): string => {
    return formatDate(receipt.posting_date);
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Update filtered lists when main lists change (but not when searching)
  useEffect(() => {
    if (poSearchTerm.trim() === "") {
      // Sort by creation date descending before slicing
      const sortedData = [...purchaseOrders].sort((a: any, b: any) => 
        new Date(b.creation).getTime() - new Date(a.creation).getTime()
      );
      setFilteredPOs(sortedData.slice(0, 5));
    }
  }, [purchaseOrders]);

  useEffect(() => {
    if (draftSearchTerm.trim() === "") {
      // Sort by creation date descending before slicing
      const sortedData = [...draftReceipts].sort((a: any, b: any) => 
        new Date(b.creation).getTime() - new Date(a.creation).getTime()
      );
      setFilteredDrafts(sortedData.slice(0, 5));
    }
  }, [draftReceipts]);

  // Handle PO search - fetch from ERPNext when search term provided
  useEffect(() => {
    if (poSearchTerm.trim() !== "") {
      // Search directly in ERPNext
      fetchPurchaseOrders(poSearchTerm.trim());
    }
  }, [poSearchTerm]);

  // Handle draft receipt search - fetch from ERPNext when search term provided
  useEffect(() => {
    if (draftSearchTerm.trim() !== "") {
      // Search directly in ERPNext
      fetchDraftReceipts(draftSearchTerm.trim());
    }
  }, [draftSearchTerm]);

  const fetchDashboardData = async () => {
    setLoading(true);
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

      const company = await getUserDefaultCompany();
      
      // Fetch purchase orders and draft receipts
      await Promise.all([
        fetchPurchaseOrders(),
        fetchDraftReceipts()
      ]);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch dashboard data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchPurchaseOrders = async (searchTerm?: string) => {
    try {
      const erpnextAPI = await createERPNextAPI();
      if (!erpnextAPI) return;

      const company = await getUserDefaultCompany();
      
      // Fetch purchase orders
      const poFilters: any[] = [
        ['docstatus', '=', 1], // Submitted orders only
        ['status', 'in', ['To Receive', 'To Receive and Bill', 'Partially Received']]
      ];

      if (company) {
        poFilters.push(['company', '=', company]);
      }

      // Add search filter if search term provided  
      if (searchTerm) {
        // Search by PO name OR supplier name
        poFilters.push(['name', 'like', `%${searchTerm}%`]);
        // Also create separate query for supplier name search
        const supplierFilters = [...poFilters.slice(0, -1)]; // Remove the name filter
        supplierFilters.push(['supplier_name', 'like', `%${searchTerm}%`]);
        
        // We'll make two calls and combine results
        const [nameResults, supplierResults] = await Promise.all([
          erpnextAPI.getPurchaseOrders(poFilters, company || undefined),
          erpnextAPI.getPurchaseOrders(supplierFilters, company || undefined)
        ]);
        
        // Combine and deduplicate results
        const combinedResults: any[] = [];
        const seenNames = new Set();
        
        [...(nameResults?.data || []), ...(supplierResults?.data || [])].forEach((po: any) => {
          if (!seenNames.has(po.name)) {
            seenNames.add(po.name);
            combinedResults.push(po);
          }
        });
        
        const sortedData = combinedResults.sort((a: any, b: any) => 
          new Date(b.creation).getTime() - new Date(a.creation).getTime()
        );
        
        setFilteredPOs(sortedData);
        setPurchaseOrders(sortedData);
        
        // Calculate analytics
        const totalPOs = sortedData.length;
        const pendingPOs = sortedData.filter((po: any) => po.status === 'To Receive').length;
        const completedPOs = sortedData.filter((po: any) => po.status === 'Completed').length;
        
        setAnalytics(prev => ({
          ...prev,
          totalPOs,
          pendingPOs,
          completedPOs
        }));
        
        return; // Exit early since we handled the search above
      }

      // This section only executes when there's no searchTerm (handled above)
      const poResponse = await erpnextAPI.getPurchaseOrders(poFilters, company || undefined);
      
      if (poResponse?.data && Array.isArray(poResponse.data)) {
        const sortedData = poResponse.data.sort((a: any, b: any) => 
          new Date(b.creation).getTime() - new Date(a.creation).getTime()
        );
        
        setPurchaseOrders(sortedData);
        // Let the useEffect handle setting filteredPOs to ensure consistent sorting

        // Calculate analytics
        const totalPOs = sortedData.length;
        const pendingPOs = sortedData.filter((po: any) => po.status === 'To Receive').length;
        const completedPOs = sortedData.filter((po: any) => po.status === 'Completed').length;
        
        setAnalytics(prev => ({
          ...prev,
          totalPOs,
          pendingPOs,
          completedPOs
        }));
      } else {
        setPurchaseOrders([]);
        setFilteredPOs([]);
      }
    } catch (error) {
      console.error('Error fetching purchase orders:', error);
    }
  };

  const fetchDraftReceipts = async (searchTerm?: string) => {
    try {
      const erpnextAPI = await createERPNextAPI();
      if (!erpnextAPI) return;

      const company = await getUserDefaultCompany();

      // Fetch draft purchase receipts
      const receiptFilters: any[] = [
        ['docstatus', '=', 0] // Draft receipts only
      ];

      if (company) {
        receiptFilters.push(['company', '=', company]);
      }

      // Add search filter if search term provided
      if (searchTerm) {
        receiptFilters.push(['name', 'like', `%${searchTerm}%`]);
      }

      const receiptResponse = await erpnextAPI.getPurchaseReceipts(receiptFilters, company || undefined);
      
      if (receiptResponse?.data && Array.isArray(receiptResponse.data)) {
        const sortedData = receiptResponse.data.sort((a: any, b: any) => 
          new Date(b.creation).getTime() - new Date(a.creation).getTime()
        );
        
        if (searchTerm) {
          setFilteredDrafts(sortedData);
          setDraftReceipts(sortedData); // Update full list for analytics
        } else {
          setDraftReceipts(sortedData);
          // Let the useEffect handle setting filteredDrafts to ensure consistent sorting
        }

        // Calculate analytics
        const draftReceiptsCount = sortedData.length;
        
        setAnalytics(prev => ({
          ...prev,
          draftReceipts: draftReceiptsCount
        }));
      } else {
        setDraftReceipts([]);
        setFilteredDrafts([]);
      }
    } catch (error) {
      console.error('Error fetching draft receipts:', error);
    }
  };


  return (
    <div className="space-y-6">
      {/* Dashboard Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Purchase Orders"
          value={analytics.totalPOs.toString()}
          icon={FileText}
        />
        <MetricCard
          title="Pending to Receive"
          value={analytics.pendingPOs.toString()}
          icon={Package}
        />
        <MetricCard
          title="Completed"
          value={analytics.completedPOs.toString()}
          icon={CheckCircle}
        />
        <MetricCard
          title="Draft Receipts"
          value={analytics.draftReceipts.toString()}
          icon={AlertTriangle}
        />
      </div>

      {/* PO Selector */}
      <PurchaseOrderSelector 
        onSelectPO={onSelectPO}
        shortcuts={[]}
      />

      {/* Quick Actions - Moved to top */}
      {shortcuts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {shortcuts.map((shortcut, index) => (
                <Button
                  key={index}
                  onClick={shortcut.action}
                  variant="outline"
                  className="h-16 flex flex-col items-center justify-center space-y-2 hover:bg-blue-50 hover:border-blue-200"
                >
                  <shortcut.icon className="w-5 h-5 text-blue-600" />
                  <span className="text-sm font-medium">{shortcut.label}</span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Purchase Orders */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle>Recent Purchase Orders to Receive</CardTitle>
              {!poSearchTerm && (
                <p className="text-sm text-muted-foreground mt-1">
                  Showing last 5 records - use search to find more
                </p>
              )}
            </div>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search purchase orders..."
                value={poSearchTerm}
                onChange={(e) => setPOSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-4 text-muted-foreground">Loading purchase orders...</div>
          ) : (
            <div className="space-y-4">
              {filteredPOs.map((po) => (
                <div key={po.name} className="border border-border rounded-lg p-4">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-lg truncate">{po.name}</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 mt-2">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Supplier</p>
                          <p className="text-sm truncate">{getSupplierName(po)}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Total Items</p>
                          <p className="text-sm">{getItemCount(po)} items</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Required By</p>
                          <p className="text-sm">{getPORequiredDate(po)}</p>
                        </div>
                      </div>
                      <div className="mt-2">
                        <p className="text-sm text-muted-foreground">
                          Total Value: <span className="font-medium">₹{getTotalValue(po).toLocaleString()}</span>
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-row sm:flex-col items-center sm:items-end gap-2">
                      <StatusBadge status={po.status || 'Unknown'} />
                      <Button size="sm" onClick={() => onSelectPO(po)} className="whitespace-nowrap">
                        Receive
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              {filteredPOs.length === 0 && poSearchTerm && (
                <div className="text-center py-4 text-muted-foreground">
                  No purchase orders found matching "{poSearchTerm}"
                </div>
              )}
              {purchaseOrders.length === 0 && !poSearchTerm && (
                <div className="text-center py-4 text-muted-foreground">
                  No purchase orders to receive
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Draft Purchase Receipts */}
      {draftReceipts.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle>Draft Purchase Receipts</CardTitle>
              {!draftSearchTerm && (
                <p className="text-sm text-muted-foreground mt-1">
                  Showing last 5 records - use search to find more
                </p>
              )}
            </div>
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search draft receipts..."
                  value={draftSearchTerm}
                  onChange={(e) => setDraftSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredDrafts.map((receipt) => (
                <div key={receipt.name} className="border border-border rounded-lg p-4">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-lg truncate">{receipt.name}</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 mt-2">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Supplier</p>
                          <p className="text-sm truncate">{getSupplierName(receipt)}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Total Items</p>
                          <p className="text-sm">{getItemCount(receipt)} items</p>
                        </div>
                         <div>
                           <p className="text-sm font-medium text-muted-foreground">Created On</p>
                           <p className="text-sm">{getReceiptCreatedDate(receipt)}</p>
                         </div>
                      </div>
                      <div className="mt-2">
                        <p className="text-sm text-muted-foreground">
                          Total Value: <span className="font-medium">₹{getTotalValue(receipt).toLocaleString()}</span>
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-row sm:flex-col items-center sm:items-end gap-2">
                      <StatusBadge status={receipt.status || 'Draft'} />
                      <Button size="sm" onClick={() => onSelectDraftReceipt(receipt.name)} className="whitespace-nowrap">
                        Continue
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              {filteredDrafts.length === 0 && draftSearchTerm && (
                <div className="text-center py-4 text-muted-foreground">
                  No draft receipts found matching "{draftSearchTerm}"
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ReceiveDashboard;

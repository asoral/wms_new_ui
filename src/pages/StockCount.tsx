
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import WarehouseSelector from "@/components/bin-enquiry/WarehouseSelector";
import WarehouseScanner from "@/components/stock-count/WarehouseScanner";
import { StockRecoCard } from "@/components/stock-count/StockRecoCard";
import { createERPNextAPI, getUserDefaultCompany } from "@/services/erpnextApi";
import { useToast } from "@/hooks/use-toast";
import { Plus, CheckCircle, AlertTriangle, Loader2, BarChart3, Building2, Search, ScanBarcode, Package } from "lucide-react";
import { format } from 'date-fns';
import { StockCountSession } from "@/types";

const StockCount = () => {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<StockCountSession[]>([]);
  const [filteredSessions, setFilteredSessions] = useState<StockCountSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>("");
  const [selectedPurpose, setSelectedPurpose] = useState<string>("Stock Reconciliation");
  const [isMultiWarehouse, setIsMultiWarehouse] = useState(false);
  const [warehouseTab, setWarehouseTab] = useState<string>("select");
  const [filterWarehouse, setFilterWarehouse] = useState<string>("");
  const { toast } = useToast();

  useEffect(() => {
    loadStockCountSessions();
  }, []);

  useEffect(() => {
    if (searchTerm.trim()) {
      // Perform real-time search when search term is provided
      performSearch(searchTerm.trim());
    } else {
      // Filter by warehouse and show only last 5 sessions when not searching
      let filtered = sessions;
      if (filterWarehouse) {
        filtered = sessions.filter(session => 
          session.warehouse.toLowerCase().includes(filterWarehouse.toLowerCase()) ||
          session.warehouse === filterWarehouse
        );
      }
      setFilteredSessions(filtered.slice(0, 5));
    }
  }, [sessions, searchTerm, filterWarehouse]);

  const performSearch = async (searchQuery: string) => {
    try {
      setLoading(true);
      const erpnextAPI = await createERPNextAPI();
      if (!erpnextAPI) return;

      // Search with broader filters to find records containing the search term
      const filters = [
        ['docstatus', 'in', [0, 1]], // Only Draft and Submitted
        ['name', 'like', `%${searchQuery}%`] // Search by name/ID
      ];

      const response = await erpnextAPI.getStockReconciliations(filters, 50); // Get more records for search
      console.log('Search response:', response);

      if (response?.data) {
        // For each found record, fetch detailed data
        const detailedSessions = await Promise.all(
          response.data.map(async (session: any) => {
            try {
              const detailResponse = await erpnextAPI.getStockReconciliation(session.name);
              const detailData = detailResponse?.data || session;
              
              return {
                id: session.name,
                name: session.name,
                warehouse: detailData.warehouse || 'Multiple',
                purpose: session.purpose || 'Stock Reconciliation',
                status: session.docstatus === 0 ? 'Draft' : session.docstatus === 1 ? 'Submitted' : 'Cancelled',
                startedAt: session.posting_date ? new Date(session.posting_date) : new Date(),
                postingTime: session.posting_time || '',
                completedAt: session.docstatus === 1 ? new Date(session.posting_date) : undefined,
                totalItems: detailData.items?.length || 0,
                matchedItems: 0,
                varianceItems: detailData.items?.length || 0,
                differenceAmount: session.difference_amount || 0,
                createdBy: detailData.creation || session.creation,
                owner: detailData.owner,
                entries: detailData.items || []
              };
            } catch (error) {
              console.error(`Failed to fetch details for ${session.name}:`, error);
              return {
                id: session.name,
                name: session.name,
                warehouse: 'Multiple',
                purpose: session.purpose || 'Stock Reconciliation',
                status: session.docstatus === 0 ? 'Draft' : session.docstatus === 1 ? 'Submitted' : 'Cancelled',
                startedAt: session.posting_date ? new Date(session.posting_date) : new Date(),
                postingTime: session.posting_time || '',
                completedAt: session.docstatus === 1 ? new Date(session.posting_date) : undefined,
                totalItems: 0,
                matchedItems: 0,
                varianceItems: 0,
                differenceAmount: session.difference_amount || 0,
                createdBy: session.creation,
                owner: session.owner,
                entries: []
              };
            }
          })
        );

        const searchResults = detailedSessions
          .sort((a: any, b: any) => {
            // Sort by creation date descending (most recent first) 
            const dateA = new Date(a.createdBy || a.startedAt);
            const dateB = new Date(b.createdBy || b.startedAt);
            return dateB.getTime() - dateA.getTime();
          });

        // Apply warehouse filter if set
        let finalResults = searchResults;
        if (filterWarehouse) {
          finalResults = searchResults.filter(session => 
            session.warehouse.toLowerCase().includes(filterWarehouse.toLowerCase()) ||
            session.warehouse === filterWarehouse
          );
        }

        setFilteredSessions(finalResults);
      } else {
        setFilteredSessions([]);
      }
    } catch (error) {
      console.error('Search failed:', error);
      toast({
        title: "Search Error",
        description: "Failed to search stock reconciliations",
        variant: "destructive"
      });
      setFilteredSessions([]);
    } finally {
      setLoading(false);
    }
  };

  const loadStockCountSessions = async () => {
    try {
      setLoading(true);
      const erpnextAPI = await createERPNextAPI();
      if (!erpnextAPI) {
        toast({
          title: "ERPNext Not Configured",
          description: "Please configure your ERPNext settings in the Profile page.",
          variant: "destructive"
        });
        return;
      }

      // Add filters to get recent records and order by creation date
      const filters = [
        ['docstatus', 'in', [0, 1]] // Only Draft and Submitted
      ];
      const response = await erpnextAPI.getStockReconciliations(filters, 20); // Get last 20 records
      console.log('Stock count sessions response:', response);

      if (response?.data) {
        // For each stock reconciliation, fetch detailed data including items
        const detailedSessions = await Promise.all(
          response.data.map(async (session: any) => {
            try {
              const detailResponse = await erpnextAPI.getStockReconciliation(session.name);
              const detailData = detailResponse?.data || session;
              
              return {
                id: session.name,
                name: session.name,
                warehouse: detailData.warehouse || 'Multiple',
                purpose: session.purpose || 'Stock Reconciliation',
                status: session.docstatus === 0 ? 'Draft' : session.docstatus === 1 ? 'Submitted' : 'Cancelled',
                startedAt: session.posting_date ? new Date(session.posting_date) : new Date(),
                postingTime: session.posting_time || '',
                completedAt: session.docstatus === 1 ? new Date(session.posting_date) : undefined,
                totalItems: detailData.items?.length || 0,
                matchedItems: 0,
                varianceItems: detailData.items?.length || 0,
                differenceAmount: session.difference_amount || 0,
                createdBy: detailData.creation || session.creation,
                owner: detailData.owner,
                entries: detailData.items || []
              };
            } catch (error) {
              console.error(`Failed to fetch details for ${session.name}:`, error);
              // Return basic data if detailed fetch fails
              return {
                id: session.name,
                name: session.name,
                warehouse: 'Multiple',
                purpose: session.purpose || 'Stock Reconciliation',
                status: session.docstatus === 0 ? 'Draft' : session.docstatus === 1 ? 'Submitted' : 'Cancelled',
                startedAt: session.posting_date ? new Date(session.posting_date) : new Date(),
                postingTime: session.posting_time || '',
                completedAt: session.docstatus === 1 ? new Date(session.posting_date) : undefined,
                totalItems: 0,
                matchedItems: 0,
                varianceItems: 0,
                differenceAmount: session.difference_amount || 0,
                createdBy: session.creation,
                owner: session.owner,
                entries: []
              };
            }
          })
        );

        const transformedSessions: StockCountSession[] = detailedSessions
          .sort((a: any, b: any) => {
            // Sort by creation date descending (most recent first)
            const dateA = new Date(a.createdBy || a.startedAt);
            const dateB = new Date(b.createdBy || b.startedAt);
            return dateB.getTime() - dateA.getTime();
          });

        setSessions(transformedSessions);
      } else {
        setSessions([]);
      }

    } catch (error) {
      console.error('Failed to load stock count sessions:', error);
      toast({
        title: "Error",
        description: "Failed to load stock count sessions from ERPNext",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleWarehouseFound = (warehouse: any) => {
    setSelectedWarehouse(warehouse.name);
    setWarehouseTab("select"); // Switch back to select tab to show selection
  };

  const handleStartSession = () => {
    if (!isMultiWarehouse && !selectedWarehouse) {
      toast({
        title: "Warehouse Required",
        description: "Please select a warehouse to start the stock count session.",
        variant: "destructive"
      });
      return;
    }

    // Navigate to stock count session with parameters
    const warehouseParam = isMultiWarehouse ? 'multi' : encodeURIComponent(selectedWarehouse);
    navigate(`/app/stock-count/session?warehouse=${warehouseParam}&purpose=${encodeURIComponent(selectedPurpose)}&multiWarehouse=${isMultiWarehouse}`);
  };

  const handleEditSession = async (sessionId: string) => {
    try {
      const erpnextAPI = await createERPNextAPI();
      if (!erpnextAPI) return;
      
      const sessionDetails = await erpnextAPI.getStockReconciliation(sessionId);
      if (sessionDetails?.data) {
        // Navigate to edit session with the session data
        navigate(`/app/stock-count/session?sessionId=${sessionId}&mode=edit`);
      }
    } catch (error) {
      console.error('Failed to load session details:', error);
      toast({
        title: "Error",
        description: "Failed to load session details",
        variant: "destructive"
      });
    }
  };

  const handleViewSession = (sessionId: string) => {
    navigate(`/app/stock-count/session?sessionId=${sessionId}&mode=view`);
  };

  return (
    <div className="w-full max-w-7xl mx-auto py-4 md:py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Stock Count Management</h1>
        <p className="text-muted-foreground">Manage stock reconciliation and counting sessions</p>
      </div>

      {/* Dashboard Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm text-blue-600 mb-1">Total Sessions</p>
                <p className="text-xl md:text-2xl font-bold text-blue-600">{sessions.length}</p>
              </div>
              <CheckCircle className="w-6 h-6 md:w-8 md:h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm text-green-600 mb-1">Completed</p>
                <p className="text-xl md:text-2xl font-bold text-green-600">{sessions.filter(s => s.status === 'Submitted').length}</p>
              </div>
              <CheckCircle className="w-6 h-6 md:w-8 md:h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm text-yellow-600 mb-1">Draft</p>
                <p className="text-xl md:text-2xl font-bold text-yellow-600">{sessions.filter(s => s.status === 'Draft').length}</p>
              </div>
              <AlertTriangle className="w-6 h-6 md:w-8 md:h-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm text-red-600 mb-1">Cancelled</p>
                <p className="text-xl md:text-2xl font-bold text-red-600">{sessions.filter(s => s.status === 'Cancelled').length}</p>
              </div>
              <AlertTriangle className="w-6 h-6 md:w-8 md:h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Start New Session Card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="w-5 h-5" />
            <span>Start Stock Count Session</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Multi-warehouse option */}
          <div className="flex items-center space-x-3 p-4 border rounded-lg bg-muted/50">
            <Checkbox 
              id="multi-warehouse" 
              checked={isMultiWarehouse}
              onCheckedChange={(checked) => {
                setIsMultiWarehouse(checked as boolean);
                if (checked) setSelectedWarehouse("");
              }}
            />
            <div className="flex-1">
              <Label htmlFor="multi-warehouse" className="text-sm font-medium cursor-pointer">
                Multi Warehouse Stock Count
              </Label>
              <p className="text-xs text-muted-foreground">
                Count items across multiple warehouses. Select warehouse for each item individually.
              </p>
            </div>
            <Package className="w-5 h-5 text-muted-foreground" />
          </div>

          {/* Warehouse Selection - only show if not multi-warehouse */}
          {!isMultiWarehouse && (
            <div className="space-y-4">
              <Label>Select Warehouse *</Label>
              <Tabs value={warehouseTab} onValueChange={setWarehouseTab}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="select">
                    <Building2 className="w-4 h-4 mr-2" />
                    Select Warehouse
                  </TabsTrigger>
                  <TabsTrigger value="scan">
                    <ScanBarcode className="w-4 h-4 mr-2" />
                    Scan Barcode
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="select" className="mt-4">
                  <WarehouseSelector
                    onWarehouseSelected={setSelectedWarehouse}
                    isLoading={loading}
                  />
                </TabsContent>

                <TabsContent value="scan" className="mt-4">
                  <WarehouseScanner onWarehouseFound={handleWarehouseFound} />
                </TabsContent>
              </Tabs>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="purpose">Select Count Purpose *</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Card 
                className={`cursor-pointer transition-all ${selectedPurpose === 'Stock Reconciliation' ? 'bg-blue-50 border-blue-500 dark:bg-blue-900/20' : 'hover:bg-accent'}`}
                onClick={() => setSelectedPurpose('Stock Reconciliation')}
              >
                <CardContent className="p-6 text-center">
                  <BarChart3 className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                  <h3 className="font-semibold">Stock Reconciliation</h3>
                </CardContent>
              </Card>

              <Card 
                className={`cursor-pointer transition-all ${selectedPurpose === 'Opening Stock' ? 'bg-blue-50 border-blue-500 dark:bg-blue-900/20' : 'hover:bg-accent'}`}
                onClick={() => setSelectedPurpose('Opening Stock')}
              >
                <CardContent className="p-6 text-center">
                  <Building2 className="w-8 h-8 mx-auto mb-2 text-green-600" />
                  <h3 className="font-semibold">Opening Stock</h3>
                </CardContent>
              </Card>
            </div>
          </div>

          <Button 
            onClick={handleStartSession}
            className="w-full py-3"
            disabled={(!isMultiWarehouse && !selectedWarehouse)}
          >
            <Plus className="w-4 h-4 mr-2" />
            {isMultiWarehouse ? 'Start Multi-Warehouse Count' : 'Start Count Session'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between space-y-4 md:space-y-0">
            <CardTitle>Stock Reco List</CardTitle>
            <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-2">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search sessions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-64">
                  <WarehouseSelector
                    onWarehouseSelected={setFilterWarehouse}
                    isLoading={loading}
                  />
                </div>
                {filterWarehouse && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setFilterWarehouse("")}
                    className="px-3 py-2 h-10"
                    title="Clear warehouse filter"
                  >
                    ✕
                  </Button>
                )}
              </div>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            {searchTerm ? `Showing search results for "${searchTerm}"` : 
             filterWarehouse ? `Showing last 5 stock reconciliations for warehouse: ${filterWarehouse}` : 
             "Showing last 5 stock reconciliations"}
          </p>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <Loader2 className="w-6 h-6 mx-auto animate-spin text-muted-foreground mb-2" />
              <p className="text-muted-foreground">Loading stock reconciliations...</p>
            </div>
          ) : filteredSessions.length > 0 ? (
            <div className="grid gap-4">
              {filteredSessions.map((session) => (
                <StockRecoCard
                  key={session.id}
                  session={session}
                  onEdit={session.status === 'Draft' ? handleEditSession : undefined}
                  onView={handleViewSession}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <AlertTriangle className="w-10 h-10 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {searchTerm ? "No stock reconciliations found matching your search." : "No stock reconciliations found."}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default StockCount;

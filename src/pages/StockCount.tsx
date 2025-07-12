
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import WarehouseSelector from "@/components/bin-enquiry/WarehouseSelector";
import { StockRecoCard } from "@/components/stock-count/StockRecoCard";
import { createERPNextAPI, getUserDefaultCompany } from "@/services/erpnextApi";
import { useToast } from "@/hooks/use-toast";
import { Plus, CheckCircle, AlertTriangle, Loader2, BarChart3, Building2, Search } from "lucide-react";
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
  const { toast } = useToast();

  useEffect(() => {
    loadStockCountSessions();
  }, []);

  useEffect(() => {
    // Filter sessions based on search term
    let filtered = sessions;
    if (searchTerm) {
      filtered = sessions.filter(session => 
        session.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        session.purpose.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    // Show only last 5 sessions unless searching
    if (!searchTerm) {
      filtered = filtered.slice(0, 5);
    }
    setFilteredSessions(filtered);
  }, [sessions, searchTerm]);

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
        // Transform the data to match our StockCountSession interface
        const transformedSessions: StockCountSession[] = response.data
          .sort((a: any, b: any) => new Date(b.posting_date).getTime() - new Date(a.posting_date).getTime()) // Sort by newest first
          .map((session: any) => ({
            id: session.name,
            name: session.name,
            warehouse: session.warehouse || 'Multiple', // Remove Unknown, show Multiple if no specific warehouse
            purpose: session.purpose || 'Stock Reconciliation',
            status: session.docstatus === 0 ? 'Draft' : session.docstatus === 1 ? 'Submitted' : 'Cancelled',
            startedAt: session.posting_date ? new Date(session.posting_date) : new Date(),
            postingTime: session.posting_time || '',
            completedAt: session.docstatus === 1 ? new Date(session.posting_date) : undefined,
            totalItems: session.items?.length || 0,
            matchedItems: 0,
            varianceItems: session.items?.length || 0,
            differenceAmount: session.difference_amount || 0,
            entries: session.items || []
          }));

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

  const handleStartSession = () => {
    if (!selectedWarehouse) {
      toast({
        title: "Warehouse Required",
        description: "Please select a warehouse to start the stock count session.",
        variant: "destructive"
      });
      return;
    }

    // Navigate to stock count session with parameters
    navigate(`/stock-count/session?warehouse=${encodeURIComponent(selectedWarehouse)}&purpose=${encodeURIComponent(selectedPurpose)}`);
  };

  const handleEditSession = async (sessionId: string) => {
    try {
      const erpnextAPI = await createERPNextAPI();
      if (!erpnextAPI) return;
      
      const sessionDetails = await erpnextAPI.getStockReconciliation(sessionId);
      if (sessionDetails?.data) {
        // Navigate to edit session with the session data
        navigate(`/stock-count/session?sessionId=${sessionId}&mode=edit`);
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
    navigate(`/stock-count/session?sessionId=${sessionId}&mode=view`);
  };

  return (
    <div className="container mx-auto py-4 px-4 md:py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Stock Count Management</h1>
        <p className="text-gray-500">Manage stock reconciliation and counting sessions</p>
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
          <div className="grid grid-cols-1 gap-4">
            <WarehouseSelector
              onWarehouseSelected={setSelectedWarehouse}
              isLoading={loading}
            />

          </div>

          <div className="space-y-2">
            <Label htmlFor="purpose">Select Count Purpose *</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card 
                className={`cursor-pointer transition-all ${selectedPurpose === 'Stock Reconciliation' ? 'bg-blue-50 border-blue-500' : 'hover:bg-gray-50'}`}
                onClick={() => setSelectedPurpose('Stock Reconciliation')}
              >
                <CardContent className="p-6 text-center">
                  <BarChart3 className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                  <h3 className="font-semibold">Stock Reconciliation</h3>
                </CardContent>
              </Card>

              <Card 
                className={`cursor-pointer transition-all ${selectedPurpose === 'Opening Stock' ? 'bg-blue-50 border-blue-500' : 'hover:bg-gray-50'}`}
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
            disabled={!selectedWarehouse}
          >
            <Plus className="w-4 h-4 mr-2" />
            Start Count Session
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between space-y-4 md:space-y-0">
            <CardTitle>Stock Reco List</CardTitle>
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search sessions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
            </div>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            {searchTerm ? `Showing search results for "${searchTerm}"` : "Showing last 5 stock reconciliations"}
          </p>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <Loader2 className="w-6 h-6 mx-auto animate-spin text-gray-500 mb-2" />
              <p className="text-gray-500">Loading stock reconciliations...</p>
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
              <AlertTriangle className="w-10 h-10 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">
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


import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Database, RefreshCw, FileText, Clock, CheckCircle, XCircle, Plus, Search, TrendingUp, TrendingDown, ArrowRightLeft, Eye } from "lucide-react";
import { createERPNextAPI, getUserDefaultCompany } from "@/services/erpnextApi";
import { useToast } from "@/hooks/use-toast";
import { StockEntryType } from "@/pages/StockEntry";
import { Input } from "@/components/ui/input";
import StockEntryDetailDialog from "./StockEntryDetailDialog";

interface StockEntryDashboardProps {
  onCreateNew: (type: StockEntryType) => void;
  onViewList: () => void;
  onEditDraft?: (draft: any) => void;
}

const StockEntryDashboard = ({ onCreateNew, onViewList, onEditDraft }: StockEntryDashboardProps) => {
  const [stats, setStats] = useState({
    totalEntries: 0,
    draftEntries: 0,
    submittedEntries: 0,
    cancelledEntries: 0
  });
  const [recentEntries, setRecentEntries] = useState<any[]>([]);
  const [draftEntries, setDraftEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResult, setSearchResult] = useState<any>(null);
  const [recentSearchTerm, setRecentSearchTerm] = useState("");
  const [filteredRecentEntries, setFilteredRecentEntries] = useState<any[]>([]);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedEntryName, setSelectedEntryName] = useState<string | null>(null);
  const { toast } = useToast();

  // Filter recent entries based on search
  useEffect(() => {
    if (!recentSearchTerm.trim()) {
      setFilteredRecentEntries(recentEntries);
    } else {
      const term = recentSearchTerm.toLowerCase();
      const filtered = recentEntries.filter(
        (entry) =>
          entry.name?.toLowerCase().includes(term) ||
          entry.stock_entry_type?.toLowerCase().includes(term) ||
          entry.owner?.toLowerCase().includes(term)
      );
      setFilteredRecentEntries(filtered);
    }
  }, [recentSearchTerm, recentEntries]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const erpnextAPI = await createERPNextAPI();
      if (!erpnextAPI) {
        console.warn('ERPNext API not configured');
        setLoading(false);
        return;
      }

      const company = await getUserDefaultCompany();
      
      // Get recent entries (last 5) with proper sorting
      const entriesResult = await erpnextAPI.getStockEntries(
        undefined,
        company || undefined,
        5,
        'creation desc'
      );

      if (entriesResult.data) {
        console.log('Fetched recent stock entries:', entriesResult.data);
        setRecentEntries(entriesResult.data);
        
        const drafts = entriesResult.data.filter((entry: any) => entry.docstatus === 0);
        setDraftEntries(drafts);
        
        // Get full stats by fetching more entries
        const allEntriesResult = await erpnextAPI.getStockEntries(
          undefined,
          company || undefined,
          100,
          'creation desc'
        );
        
        if (allEntriesResult.data) {
          const total = allEntriesResult.data.length;
          const draft = allEntriesResult.data.filter((entry: any) => entry.docstatus === 0).length;
          const submitted = allEntriesResult.data.filter((entry: any) => entry.docstatus === 1).length;
          const cancelled = allEntriesResult.data.filter((entry: any) => entry.docstatus === 2).length;

          setStats({
            totalEntries: total,
            draftEntries: draft,
            submittedEntries: submitted,
            cancelledEntries: cancelled
          });
        }
      }

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

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    try {
      const erpnextAPI = await createERPNextAPI();
      if (!erpnextAPI) return;

      const result = await erpnextAPI.getStockEntry(searchQuery.trim());
      
      if (result.data) {
        setSearchResult(result.data);
        toast({
          title: "Stock Entry Found",
          description: `Found ${result.data.name} - ${result.data.stock_entry_type}`,
        });
      } else {
        setSearchResult(null);
        toast({
          title: "Not Found",
          description: `Stock entry ${searchQuery} not found`,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error searching stock entry:', error);
      setSearchResult(null);
      toast({
        title: "Error",
        description: "Failed to search stock entry",
        variant: "destructive"
      });
    }
  };

  const getStatusColor = (docstatus: number) => {
    switch (docstatus) {
      case 0: return "bg-gray-100 text-gray-800";
      case 1: return "bg-green-100 text-green-800";
      case 2: return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (docstatus: number) => {
    switch (docstatus) {
      case 0: return "Draft";
      case 1: return "Submitted";
      case 2: return "Cancelled";
      default: return "Unknown";
    }
  };

  const getStatusIcon = (docstatus: number) => {
    switch (docstatus) {
      case 0: return FileText;
      case 1: return CheckCircle;
      case 2: return XCircle;
      default: return FileText;
    }
  };

  const getEntryTypeIcon = (type: string) => {
    switch (type) {
      case "Material Issue": return TrendingDown;
      case "Material Receipt": return TrendingUp;
      case "Material Transfer": return ArrowRightLeft;
      default: return Database;
    }
  };

  const entryTypes: StockEntryType[] = [
    "Material Issue",
    "Material Receipt",
    "Material Transfer",
    "Manufacture",
    "Repack",
    "Send to Subcontractor"
  ];

  return (
    <div className="space-y-6">
      {/* Search Stock Entry */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Search className="w-5 h-5" />
            <span>Search Stock Entry</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex space-x-2">
            <Input
              placeholder="Enter stock entry number (e.g., MAT-STE-2025-00001)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <Button onClick={handleSearch}>
              <Search className="w-4 h-4 mr-2" />
              Search
            </Button>
          </div>

          {searchResult && (
            <div className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Database className="w-4 h-4 text-blue-600" />
                  <span className="font-medium">{searchResult.name}</span>
                </div>
                <Badge className={getStatusColor(searchResult.docstatus)}>
                  {getStatusText(searchResult.docstatus)}
                </Badge>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Type:</span>
                  <p className="font-medium">{searchResult.stock_entry_type}</p>
                </div>
                <div>
                  <span className="text-gray-500">Date:</span>
                  <p className="font-medium">{new Date(searchResult.posting_date).toLocaleDateString()}</p>
                </div>
                <div>
                  <span className="text-gray-500">From Warehouse:</span>
                  <p className="font-medium">{searchResult.from_warehouse || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-gray-500">To Warehouse:</span>
                  <p className="font-medium">{searchResult.to_warehouse || 'N/A'}</p>
                </div>
              </div>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {entryTypes.map((type) => {
              const Icon = getEntryTypeIcon(type);
              return (
                <Button
                  key={type}
                  variant="outline"
                  onClick={() => onCreateNew(type)}
                  className="h-16 flex-col text-center p-2"
                >
                  <Icon className="w-4 h-4 mb-1" />
                  <span className="text-xs">{type}</span>
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="flex items-center p-4">
            <div className="p-2 bg-blue-100 rounded-lg mr-3">
              <Database className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xl font-bold">{stats.totalEntries}</p>
              <p className="text-xs text-gray-600">Total</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center p-4">
            <div className="p-2 bg-gray-100 rounded-lg mr-3">
              <FileText className="w-5 h-5 text-gray-600" />
            </div>
            <div>
              <p className="text-xl font-bold">{stats.draftEntries}</p>
              <p className="text-xs text-gray-600">Draft</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center p-4">
            <div className="p-2 bg-green-100 rounded-lg mr-3">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-xl font-bold">{stats.submittedEntries}</p>
              <p className="text-xs text-gray-600">Submitted</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center p-4">
            <div className="p-2 bg-red-100 rounded-lg mr-3">
              <XCircle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-xl font-bold">{stats.cancelledEntries}</p>
              <p className="text-xs text-gray-600">Cancelled</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Draft Entries */}
      {draftEntries.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Draft Stock Entries</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {draftEntries.map((entry, index) => {
                const StatusIcon = getStatusIcon(0);
                const TypeIcon = getEntryTypeIcon(entry.stock_entry_type);
                return (
                  <div 
                    key={index} 
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                    onClick={() => onEditDraft && onEditDraft(entry)}
                  >
                    <div className="flex items-center space-x-4">
                      <div className="p-2 bg-gray-50 rounded-lg">
                        <TypeIcon className="w-4 h-4 text-gray-600" />
                      </div>
                      <div>
                        <h4 className="font-medium">{entry.name}</h4>
                        <p className="text-sm text-gray-600">
                          {entry.stock_entry_type} • {entry.owner || 'Unknown User'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className="bg-gray-100 text-gray-800">
                        Draft
                      </Badge>
                      <span className="text-sm text-gray-500">
                        {entry.posting_date ? new Date(entry.posting_date).toLocaleDateString() : 
                         entry.creation ? new Date(entry.creation).toLocaleDateString() : 'Invalid Date'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Stock Entries */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <CardTitle>Recent Stock Entries</CardTitle>
            <Button variant="outline" onClick={onViewList}>
              View All
            </Button>
          </div>
          {/* Search within recent entries */}
          <div className="relative mt-3">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Filter recent entries..."
              value={recentSearchTerm}
              onChange={(e) => setRecentSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto text-gray-400" />
              <p className="text-gray-600 mt-2">Loading recent entries...</p>
            </div>
          ) : filteredRecentEntries.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Database className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p>{recentSearchTerm ? "No matching entries found" : "No stock entries found"}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredRecentEntries.map((entry, index) => {
                const StatusIcon = getStatusIcon(entry.docstatus);
                const TypeIcon = getEntryTypeIcon(entry.stock_entry_type);
                return (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-center space-x-4">
                      <div className="p-2 bg-blue-50 rounded-lg">
                        <TypeIcon className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-medium">{entry.name}</h4>
                        <p className="text-sm text-gray-600">
                          {entry.stock_entry_type} • {entry.owner || entry.modified_by || 'Unknown User'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={getStatusColor(entry.docstatus)}>
                        {getStatusText(entry.docstatus)}
                      </Badge>
                      <span className="text-sm text-gray-500">
                        {entry.posting_date ? new Date(entry.posting_date).toLocaleDateString() : 
                         entry.creation ? new Date(entry.creation).toLocaleDateString() : 'Invalid Date'}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedEntryName(entry.name);
                          setViewDialogOpen(true);
                        }}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Dialog */}
      <StockEntryDetailDialog
        open={viewDialogOpen}
        onOpenChange={setViewDialogOpen}
        stockEntryName={selectedEntryName}
      />
    </div>
  );
};

export default StockEntryDashboard;

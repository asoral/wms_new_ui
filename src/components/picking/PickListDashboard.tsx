import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Package, Clock, CheckCircle, RefreshCw, FileText } from "lucide-react";
import { usePickListAPI } from "@/hooks/useERPNextAPI";
import { useToast } from "@/hooks/use-toast";
import { getUserDefaultCompany } from "@/services/erpnextApi";

interface PickListDashboardProps {
  onCreateNew: () => void;
  onSelectPickList: (pickList: any) => void;
}

interface DashboardAnalytics {
  totalPickLists: number;
  pendingPickLists: number;
  inProgressPickLists: number;
  completedPickLists: number;
}

const PickListDashboard = ({ onCreateNew, onSelectPickList }: PickListDashboardProps) => {
  const [pickLists, setPickLists] = useState<any[]>([]);
  const [filteredPickLists, setFilteredPickLists] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [analytics, setAnalytics] = useState<DashboardAnalytics>({
    totalPickLists: 0,
    pendingPickLists: 0,
    inProgressPickLists: 0,
    completedPickLists: 0
  });
  const { getPickLists, deletePickList, loading } = usePickListAPI();
  const { toast } = useToast();

  useEffect(() => {
    fetchPickLists();
  }, []);

  useEffect(() => {
    // Update filtered list when pickLists changes (but not when searching)
    if (searchTerm.trim() === "") {
      setFilteredPickLists(pickLists); // Show all since API already limits to 5
    }
  }, [pickLists]);

  useEffect(() => {
    // Handle search - fetch from ERPNext when search term provided
    if (searchTerm.trim() === "") {
      // Show all since API already limits to 5 when no search
      setFilteredPickLists(pickLists);
    } else {
      // Search directly in ERPNext with higher limit
      fetchPickLists(searchTerm.trim());
    }
  }, [searchTerm]);

  const fetchPickLists = async (searchTerm?: string) => {
    try {
      const company = await getUserDefaultCompany();
      console.log('Fetching pick lists for company:', company);
      
      // Filter for draft pick lists (docstatus = 0) and open pick lists (docstatus = 1)  
      const filters: any[] = [
        ['docstatus', 'in', [0, 1]]  // Include both draft and submitted
      ];
      
      if (company) {
        filters.push(['company', '=', company]);
      }
      
      // Add search filter if search term provided and increase limit for search
      if (searchTerm) {
        filters.push(['name', 'like', `%${searchTerm}%`]);
      }
      
      console.log('Using filters:', filters);
      const response = await getPickLists(filters, company, searchTerm ? 50 : 5, 'creation desc');
      console.log('Pick lists API response:', response);
      
      // Check different response structure possibilities
      let pickListsData = [];
      if ((response as any)?.data?.data && Array.isArray((response as any).data.data)) {
        console.log('Found data in response.data.data');
        pickListsData = (response as any).data.data;
      } else if ((response as any)?.data && Array.isArray((response as any).data)) {
        console.log('Found data in response.data');
        pickListsData = (response as any).data;
      } else if (response && Array.isArray(response)) {
        console.log('Found data in response directly');
        pickListsData = response;
      } else {
        console.log('No pick lists found in response structure:', response);
      }
      
      if (pickListsData.length > 0) {
        // Data is already sorted by ERPNext with 'creation desc'
        const processedPickLists = pickListsData.map((pl: any) => ({
          ...pl,
          status: pl.status || (pl.docstatus === 0 ? 'Draft' : pl.docstatus === 1 ? 'Open' : 'Completed')
        }));
        
        console.log('Processed pick lists data:', processedPickLists);
        
        if (searchTerm) {
          // When searching with higher limit, show all results 
          setFilteredPickLists(processedPickLists);
          setPickLists(processedPickLists); // Update the full list for analytics
        } else {
          // When not searching, data is already limited to 5 by API
          setPickLists(processedPickLists);
          setFilteredPickLists(processedPickLists);
        }
        
        // Calculate analytics
        const pending = processedPickLists.filter((pl: any) => pl.status === 'Draft').length;
        const inProgress = processedPickLists.filter((pl: any) => pl.status === 'Open').length; 
        const completed = processedPickLists.filter((pl: any) => pl.status === 'Completed').length;
        
        console.log('Analytics:', { pending, inProgress, completed });
        setAnalytics({
          totalPickLists: processedPickLists.length,
          pendingPickLists: pending,
          inProgressPickLists: inProgress,
          completedPickLists: completed
        });
      } else {
        console.log('No pick lists data found in response');
        setPickLists([]);
        setFilteredPickLists([]);
        setAnalytics({
          totalPickLists: 0,
          pendingPickLists: 0,
          inProgressPickLists: 0,
          completedPickLists: 0
        });
      }
    } catch (error) {
      console.error('Error fetching pick lists:', error);
      toast({
        title: "Error",
        description: "Failed to fetch pick lists",
        variant: "destructive"
      });
    }
  };

  const handleRefreshPickList = async (pickList: any) => {
    try {
      const { createERPNextAPI } = await import('@/services/erpnextApi');
      const api = await createERPNextAPI();
      
      if (!api) {
        toast({
          title: "Error",
          description: "Failed to connect to ERPNext",
          variant: "destructive"
        });
        return;
      }
      
      // Fetch fresh pick list details from ERPNext
      const response = await api.getPickList(pickList.name);
      
      if (response?.data) {
        toast({
          title: "Pick List Refreshed",
          description: "Pick list data has been updated from ERPNext",
        });
        
        fetchPickLists(); // Refresh the list
      } else {
        throw new Error('Failed to fetch pick list details');
      }
    } catch (error) {
      console.error('Error refreshing pick list:', error);
      toast({
        title: "Error",
        description: "Failed to refresh pick list",
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Draft':
        return <Badge variant="secondary" className="bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300">Draft</Badge>;
      case 'Open':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300">In Progress</Badge>;
      case 'Completed':
        return <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300">Completed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ', ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-3 md:p-6 space-y-6">
      {/* Header with stepper */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Package className="w-6 h-6 text-primary" />
          <h1 className="text-xl md:text-2xl font-bold text-foreground">Pick List</h1>
          <RefreshCw className="w-4 h-4 text-muted-foreground" />
        </div>
      </div>

      {/* Progress Steps - Center Aligned */}
      <div className="flex justify-center">
        <div className="flex items-center space-x-2 md:space-x-4">
          <div className="flex items-center space-x-1 md:space-x-2">
            <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs md:text-sm font-medium">
              1
            </div>
            <span className="text-primary font-medium text-sm md:text-base">Select</span>
          </div>
          <div className="w-4 md:w-8 h-px bg-border"></div>
          <div className="flex items-center space-x-1 md:space-x-2">
            <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-xs md:text-sm font-medium">
              2
            </div>
            <span className="text-muted-foreground text-sm md:text-base">Details</span>
          </div>
          <div className="w-4 md:w-8 h-px bg-border"></div>
          <div className="flex items-center space-x-1 md:space-x-2">
            <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-xs md:text-sm font-medium">
              3
            </div>
            <span className="text-muted-foreground text-sm md:text-base">Pick</span>
          </div>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
        <Card className="text-center">
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <Package className="w-4 h-4 md:w-5 md:h-5 text-orange-600" />
              <span className="text-xl md:text-2xl font-bold text-foreground">{analytics.pendingPickLists}</span>
            </div>
            <p className="text-xs md:text-sm text-muted-foreground">Pending ({analytics.pendingPickLists})</p>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <Clock className="w-4 h-4 md:w-5 md:h-5 text-blue-600" />
              <span className="text-xl md:text-2xl font-bold text-foreground">{analytics.inProgressPickLists}</span>
            </div>
            <p className="text-xs md:text-sm text-muted-foreground">In Progress ({analytics.inProgressPickLists})</p>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-green-600" />
              <span className="text-xl md:text-2xl font-bold text-foreground">{analytics.completedPickLists}</span>
            </div>
            <p className="text-xs md:text-sm text-muted-foreground">Completed ({analytics.completedPickLists})</p>
          </CardContent>
        </Card>
      </div>

      {/* Search - Placed above the list */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search pick lists..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button onClick={onCreateNew} className="whitespace-nowrap">
          <Plus className="w-4 h-4 mr-2" />
          Create New
        </Button>
      </div>


      {/* Pick Lists */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">
            {searchTerm ? `Search Results (${filteredPickLists.length})` : `Recent Pick Lists (${filteredPickLists.length})`}
          </h2>
          {!searchTerm && (
            <p className="text-sm text-muted-foreground">
              Showing last 5 records - use search to find more
            </p>
          )}
        </div>
        
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">Loading pick lists...</div>
        ) : filteredPickLists.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {searchTerm ? "No pick lists found matching your search" : "No pick lists found"}
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredPickLists.map((pickList) => (
              <Card key={pickList.name} className="border-l-4 border-l-blue-500 hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center space-x-3">
                        <FileText className="w-5 h-5 text-blue-600" />
                        <h3 className="font-semibold text-lg">{pickList.name}</h3>
                        {getStatusBadge(pickList.status)}
                      </div>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          <div>
                            <p><span className="font-medium">Purpose:</span> {pickList.purpose || 'Material Transfer'}</p>
                            <p><span className="font-medium">Company:</span> {pickList.company}</p>
                            {pickList.material_request && (
                              <p><span className="font-medium">Material Request:</span> {pickList.material_request}</p>
                            )}
                          </div>
                          <div>
                            <p><span className="font-medium">Created:</span> {formatDate(pickList.creation)}</p>
                            {pickList.owner && (
                              <p><span className="font-medium">Created by:</span> 
                                <span className="ml-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium dark:bg-blue-900/20 dark:text-blue-300">
                                  {pickList.owner.includes('@') ? pickList.owner.split('@')[0] : pickList.owner}
                                </span>
                              </p>
                            )}
                            {pickList.modified_by && pickList.modified_by !== pickList.owner && (
                              <p><span className="font-medium">Last modified by:</span> 
                                <span className="ml-1 px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium dark:bg-gray-900/20 dark:text-gray-300">
                                  {pickList.modified_by.includes('@') ? pickList.modified_by.split('@')[0] : pickList.modified_by}
                                </span>
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col space-y-2">
                      <Button 
                        variant="outline" 
                        onClick={() => onSelectPickList(pickList)}
                        disabled={loading}
                        className="min-w-20"
                      >
                        <FileText className="w-4 h-4 mr-2" />
                        {pickList.status === 'Draft' ? 'Start' : 'View'}
                      </Button>
                      {pickList.status === 'Draft' && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleRefreshPickList(pickList)}
                          disabled={loading}
                          className="min-w-20"
                        >
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Refresh
                        </Button>
                      )}
                      {pickList.status === 'Draft' && (
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={async () => {
                            try {
                              await deletePickList(pickList.name);
                              toast({
                                title: "Success",
                                description: "Pick List deleted successfully",
                              });
                              fetchPickLists(); // Refresh the list
                            } catch (error) {
                              toast({
                                title: "Error",
                                description: "Failed to delete pick list",
                                variant: "destructive"
                              });
                            }
                          }}
                          className="min-w-20"
                        >
                          Delete
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PickListDashboard;
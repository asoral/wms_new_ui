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
    // Filter pick lists based on search term
    if (searchTerm.trim() === "") {
      // Show only last 5 pick lists if no search term
      setFilteredPickLists(pickLists.slice(0, 5));
    } else {
      const filtered = pickLists.filter(pl => 
        pl.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pl.purpose?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pl.material_request?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredPickLists(filtered);
    }
  }, [searchTerm, pickLists]);

  const fetchPickLists = async () => {
    try {
      const company = await getUserDefaultCompany();
      console.log('Fetching pick lists for company:', company);
      
      // Fetch with filters for the company, ordered by creation date
      const response = await getPickLists(company ? [['company', '=', company]] : undefined);
      console.log('Pick lists API response:', response);
      
      if (response?.data && Array.isArray(response.data)) {
        // Sort by creation date descending (newest first)
        const sortedData = response.data.sort((a: any, b: any) => 
          new Date(b.creation).getTime() - new Date(a.creation).getTime()
        );
        
        const pickListsData = sortedData.map((pl: any) => ({
          ...pl,
          status: pl.docstatus === 0 ? 'Draft' : pl.docstatus === 1 ? 'Open' : 'Completed'
        }));
        
        console.log('Processed pick lists data:', pickListsData);
        setPickLists(pickListsData);
        
        // Calculate analytics
        const pending = pickListsData.filter((pl: any) => pl.status === 'Draft').length;
        const inProgress = pickListsData.filter((pl: any) => pl.status === 'Open').length; 
        const completed = pickListsData.filter((pl: any) => pl.status === 'Completed').length;
        
        console.log('Analytics:', { pending, inProgress, completed });
        setAnalytics({
          totalPickLists: pickListsData.length,
          pendingPickLists: pending,
          inProgressPickLists: inProgress,
          completedPickLists: completed
        });
      } else {
        console.log('No pick lists data found in response');
        setPickLists([]);
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Draft':
        return <Badge variant="secondary" className="bg-orange-100 text-orange-800">Draft</Badge>;
      case 'Open':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800">In Progress</Badge>;
      case 'Completed':
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Completed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ', ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header with stepper */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Package className="w-6 h-6 text-blue-600" />
          <h1 className="text-2xl font-bold">Pick List</h1>
          <RefreshCw className="w-4 h-4 text-gray-400" />
        </div>
      </div>

      {/* Progress Steps - Center Aligned */}
      <div className="flex justify-center">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-medium">
              1
            </div>
            <span className="text-blue-600 font-medium">Select</span>
          </div>
          <div className="w-8 h-px bg-gray-200"></div>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-400 flex items-center justify-center text-sm font-medium">
              2
            </div>
            <span className="text-gray-400">Details</span>
          </div>
          <div className="w-8 h-px bg-gray-200"></div>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-400 flex items-center justify-center text-sm font-medium">
              3
            </div>
            <span className="text-gray-400">Pick</span>
          </div>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="text-center">
          <CardContent className="p-4">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <Package className="w-5 h-5 text-orange-600" />
              <span className="text-2xl font-bold">{analytics.pendingPickLists}</span>
            </div>
            <p className="text-sm text-gray-600">Pending ({analytics.pendingPickLists})</p>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="p-4">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <Clock className="w-5 h-5 text-blue-600" />
              <span className="text-2xl font-bold">{analytics.inProgressPickLists}</span>
            </div>
            <p className="text-sm text-gray-600">In Progress ({analytics.inProgressPickLists})</p>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="p-4">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="text-2xl font-bold">{analytics.completedPickLists}</span>
            </div>
            <p className="text-sm text-gray-600">Completed ({analytics.completedPickLists})</p>
          </CardContent>
        </Card>
      </div>

      {/* Search - Placed above the list */}
      <div className="flex items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search pick lists..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button onClick={onCreateNew} className="ml-4">
          <Plus className="w-4 h-4 mr-2" />
          Create New
        </Button>
      </div>


      {/* Pick Lists */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-8">Loading pick lists...</div>
        ) : filteredPickLists.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {searchTerm ? "No pick lists found matching your search" : "No pick lists found"}
          </div>
        ) : (
          <div className="grid gap-4">
            {!searchTerm && (
              <p className="text-sm text-gray-500 mb-2">
                Showing last 5 pick lists. Use search to find more.
              </p>
            )}
            {filteredPickLists.map((pickList) => (
              <Card key={pickList.name} className="border-l-4 border-l-blue-500 hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-3">
                        <FileText className="w-5 h-5 text-blue-600" />
                        <h3 className="font-semibold text-lg">{pickList.name}</h3>
                        {getStatusBadge(pickList.status)}
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p><span className="font-medium">Purpose:</span> {pickList.purpose || 'Material Transfer'}</p>
                        <p><span className="font-medium">Company:</span> {pickList.company}</p>
                        {pickList.material_request && (
                          <p><span className="font-medium">Material Request:</span> {pickList.material_request}</p>
                        )}
                        <p><span className="font-medium">Created:</span> {formatDate(pickList.creation)}</p>
                        {pickList.owner && (
                          <p><span className="font-medium">Owner:</span> {pickList.owner}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col space-y-2">
                      <Button 
                        variant="outline" 
                        onClick={() => onSelectPickList(pickList)}
                        disabled={loading}
                        className="min-w-20"
                      >
                        {pickList.status === 'Draft' ? 'Start' : 'View'}
                      </Button>
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
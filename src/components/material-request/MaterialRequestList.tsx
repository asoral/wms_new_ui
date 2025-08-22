import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, Plus, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { createERPNextAPI, getUserDefaultCompany } from "@/services/erpnextApi";
import { useIsMobile } from "@/hooks/use-mobile";
import MobileMaterialRequestCard from "./MobileMaterialRequestCard";

interface MaterialRequestListProps {
  onBack: () => void;
  onEdit: (request: any) => void;
  onView: (request: any) => void;
}

const MaterialRequestList = ({ onBack, onEdit, onView }: MaterialRequestListProps) => {
  const [requests, setRequests] = useState<any[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const { toast } = useToast();
  const isMobile = useIsMobile();

  useEffect(() => {
    fetchRequests();
  }, []);

  // Update filtered list when requests change (but not when searching)
  useEffect(() => {
    if (searchTerm.trim() === "") {
      applyStatusFilter(requests);
    }
  }, [requests, filterStatus]);

  // Handle search - fetch from ERPNext when search term provided
  useEffect(() => {
    if (searchTerm.trim() === "") {
      applyStatusFilter(requests);
    } else {
      fetchRequests(searchTerm.trim());
    }
  }, [searchTerm]);

  const applyStatusFilter = (requestsList: any[]) => {
    if (filterStatus === "all") {
      setFilteredRequests(requestsList);
    } else {
      const filtered = requestsList.filter(request => 
        (request.status || '').toLowerCase() === filterStatus.toLowerCase()
      );
      setFilteredRequests(filtered);
    }
  };

  const fetchRequests = async (searchTerm?: string) => {
    setIsLoading(true);
    try {
      const api = await createERPNextAPI();
      const company = await getUserDefaultCompany();
      
      if (!api) {
        toast({
          title: "ERPNext Connection Error",
          description: "Please configure ERPNext settings",
          variant: "destructive"
        });
        return;
      }

      const filters: any[] = [];
      
      // Add search filter if search term provided
      if (searchTerm) {
        filters.push(['name', 'like', `%${searchTerm}%`]);
      }

      const result = await api.getMaterialRequests(filters.length > 0 ? filters : undefined, company || undefined, 50);
      if (result && result.data) {
        const sortedData = result.data.sort((a: any, b: any) => 
          new Date(b.creation).getTime() - new Date(a.creation).getTime()
        );
        
        if (searchTerm) {
          // When searching, show all results and apply status filter
          setRequests(sortedData);
          applyStatusFilter(sortedData);
        } else {
          // When not searching, load full list and apply status filter
          setRequests(sortedData);
          applyStatusFilter(sortedData);
        }
      } else {
        setRequests([]);
        setFilteredRequests([]);
      }
    } catch (error) {
      console.error('Error fetching material requests:', error);
      toast({
        title: "Error",
        description: "Failed to fetch material requests from ERPNext",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { variant: any, color: string }> = {
      'Draft': { variant: 'secondary', color: 'gray' },
      'Submitted': { variant: 'default', color: 'blue' },
      'Stopped': { variant: 'destructive', color: 'red' },
      'Cancelled': { variant: 'destructive', color: 'red' },
      'Pending': { variant: 'outline', color: 'orange' },
      'Partially Ordered': { variant: 'outline', color: 'yellow' },
      'Ordered': { variant: 'default', color: 'green' },
      'Issued': { variant: 'default', color: 'green' },
      'Transferred': { variant: 'default', color: 'green' },
      'Received': { variant: 'default', color: 'green' }
    };

    const statusInfo = statusMap[status] || { variant: 'outline', color: 'gray' };
    return <Badge variant={statusInfo.variant}>{status}</Badge>;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin" />
        <span className="ml-2">Loading material requests...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Material Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search material requests..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border rounded-md text-sm"
              >
                <option value="all">All Status</option>
                <option value="draft">Draft</option>
                <option value="submitted">Submitted</option>
                <option value="pending">Pending</option>
                <option value="ordered">Ordered</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <Button onClick={() => fetchRequests()} variant="outline" size="icon">
                <Filter className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Material Requests List */}
      {filteredRequests.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Material Requests ({filteredRequests.length})</span>
              <Button onClick={onBack} variant="outline" size="sm">
                Back to Dashboard
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isMobile ? (
              <div className="space-y-4">
                {filteredRequests.map((request, index) => (
                  <MobileMaterialRequestCard
                    key={index}
                    request={request}
                    onView={(request) => console.log('View request:', request)}
                    onEdit={(request) => console.log('Edit request:', request)}
                  />
                ))}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="text-left p-3 border">Request Number</th>
                      <th className="text-left p-3 border">Type</th>
                      <th className="text-left p-3 border">Date</th>
                      <th className="text-left p-3 border">Status</th>
                      <th className="text-left p-3 border">Company</th>
                      <th className="text-left p-3 border">Created By</th>
                      <th className="text-left p-3 border">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRequests.map((request, index) => (
                      <tr key={index} className="border-b hover:bg-gray-50">
                        <td className="p-3 border font-medium">{request.name}</td>
                        <td className="p-3 border">{request.material_request_type}</td>
                        <td className="p-3 border">
                          {new Date(request.transaction_date).toLocaleDateString()}
                        </td>
                        <td className="p-3 border">
                          {getStatusBadge(request.status)}
                        </td>
                        <td className="p-3 border">{request.company}</td>
                        <td className="p-3 border">{request.owner}</td>
                        <td className="p-3 border">
                          <div className="flex space-x-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => onView(request)}
                            >
                              View
                            </Button>
                            {request.status === 'Draft' && (
                              <Button 
                                size="sm"
                                onClick={() => onEdit(request)}
                              >
                                Edit
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-gray-500 mb-4">No material requests found</p>
            <Button onClick={onBack} variant="outline">
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MaterialRequestList;

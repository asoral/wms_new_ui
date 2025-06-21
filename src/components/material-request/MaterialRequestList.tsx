import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Plus, 
  Search, 
  MoreHorizontal,
  FileText,
  Eye,
  Edit,
  Trash2,
  RefreshCw
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MaterialRequest, MaterialRequestPurpose, MaterialRequestStatus } from "@/pages/MaterialRequest";
import { createERPNextAPI, getUserDefaultCompany } from "@/services/erpnextApi";
import { useToast } from "@/hooks/use-toast";

interface MaterialRequestListProps {
  onCreateNew: (MaterialRequestPurpose) => void;
  onEditRequest: (request: MaterialRequest) => void;
  onBackToDashboard: () => void;
}

const MaterialRequestList = ({ onCreateNew, onEditRequest, onBackToDashboard }: MaterialRequestListProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [purposeFilter, setPurposeFilter] = useState<string>("all");
  const [requests, setRequests] = useState<MaterialRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchMaterialRequests();
  }, []);

  const fetchMaterialRequests = async () => {
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
      
      const result = await erpnextAPI.getMaterialRequests(
        undefined,
        company || undefined,
        100
      );

      if (result.data) {
        // Transform ERPNext data to our MaterialRequest format
        const transformedData: MaterialRequest[] = result.data.map((req: any) => ({
          id: req.name,
          name: req.name,
          title: req.title || req.name,
          purpose: req.material_request_type as MaterialRequestPurpose,
          status: req.status as MaterialRequestStatus,
          transactionDate: req.transaction_date,
          requiredBy: req.required_by,
          requestedBy: req.requested_by,
          company: req.company,
          priority: "Medium", // Default since ERPNext might not have this field
          items: [], // Will be loaded when needed
          remarks: req.remarks
        }));
        
        setRequests(transformedData);
      }

    } catch (error) {
      console.error('Error fetching material requests:', error);
      toast({
        title: "Error",
        description: "Failed to fetch material requests",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: MaterialRequestStatus) => {
    switch (status) {
      case "Draft": return "bg-gray-100 text-gray-800";
      case "Submitted": 
      case "Pending": return "bg-blue-100 text-blue-800";
      case "Partially Ordered": 
      case "Partially Received": return "bg-yellow-100 text-yellow-800";
      case "Ordered":
      case "Issued":
      case "Transferred":
      case "Received": return "bg-green-100 text-green-800";
      case "Cancelled":
      case "Stopped": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const filteredRequests = requests.filter(request => {
    const matchesSearch = request.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         request.requestedBy.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || request.status === statusFilter;
    const matchesPurpose = purposeFilter === "all" || request.purpose === purposeFilter;
    
    return matchesSearch && matchesStatus && matchesPurpose;
  });

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex-1 space-y-4 sm:space-y-0 sm:flex sm:gap-4">
          {/* Search */}
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search material requests..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filters */}
          <div className="flex gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Draft">Draft</SelectItem>
                <SelectItem value="Submitted">Submitted</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="Ordered">Ordered</SelectItem>
                <SelectItem value="Issued">Issued</SelectItem>
                <SelectItem value="Transferred">Transferred</SelectItem>
                <SelectItem value="Received">Received</SelectItem>
                <SelectItem value="Cancelled">Cancelled</SelectItem>
                <SelectItem value="Stopped">Stopped</SelectItem>
              </SelectContent>
            </Select>

            <Select value={purposeFilter} onValueChange={setPurposeFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Purpose" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Purpose</SelectItem>
                <SelectItem value="Purchase">Purchase</SelectItem>
                <SelectItem value="Material Transfer">Transfer</SelectItem>
                <SelectItem value="Material Issue">Issue</SelectItem>
                <SelectItem value="Manufacture">Manufacture</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" size="icon" onClick={fetchMaterialRequests} disabled={loading}>
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        {/* Create New Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create New
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onCreateNew("Purchase")}>
              Purchase Request
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onCreateNew("Material Transfer")}>
              Material Transfer
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onCreateNew("Material Issue")}>
              Material Issue
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onCreateNew("Manufacture")}>
              Manufacturing Request
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Material Requests List */}
      <div className="grid gap-4">
        {loading ? (
          <Card>
            <CardContent className="py-8 text-center">
              <div className="flex items-center justify-center space-x-2">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Loading material requests...</span>
              </div>
            </CardContent>
          </Card>
        ) : filteredRequests.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No material requests found</p>
              <Button className="mt-4" onClick={() => onCreateNew("Purchase")}>
                <Plus className="w-4 h-4 mr-2" />
                Create First Request
              </Button>
            </CardContent>
          </Card>
        ) : (
          filteredRequests.map((request) => (
            <Card key={request.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <FileText className="w-5 h-5 text-blue-600" />
                    <div>
                      <h3 className="font-medium">{request.name}</h3>
                      <p className="text-sm text-gray-500">{request.purpose}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className={getStatusColor(request.status)}>
                      {request.status}
                    </Badge>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Eye className="w-4 h-4 mr-2" />
                          View
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onEditRequest(request)}>
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600">
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Requested By:</span>
                    <p className="font-medium">{request.requestedBy}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Date:</span>
                    <p className="font-medium">{new Date(request.transactionDate).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Required By:</span>
                    <p className="font-medium">
                      {request.requiredBy ? new Date(request.requiredBy).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500">Company:</span>
                    <p className="font-medium">{request.company}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default MaterialRequestList;

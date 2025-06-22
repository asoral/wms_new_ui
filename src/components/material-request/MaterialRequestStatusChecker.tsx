
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, FileText } from "lucide-react";
import { createERPNextAPI } from "@/services/erpnextApi";
import { useToast } from "@/hooks/use-toast";

interface MaterialRequestStatus {
  name: string;
  status: string;
  material_request_type: string;
  transaction_date: string;
  requested_by: string;
  company: string;
  owner: string;
  modified_by: string;
  docstatus: number;
}

const MaterialRequestStatusChecker = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [requestStatus, setRequestStatus] = useState<MaterialRequestStatus | null>(null);
  const { toast } = useToast();

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast({
        title: "Error",
        description: "Please enter a material request number",
        variant: "destructive"
      });
      return;
    }

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

      const result = await erpnextAPI.getMaterialRequest(searchQuery.trim());
      
      if (result.data) {
        setRequestStatus({
          name: result.data.name,
          status: result.data.docstatus === 0 ? 'Draft' : result.data.status,
          material_request_type: result.data.material_request_type,
          transaction_date: result.data.transaction_date,
          requested_by: result.data.requested_by || result.data.owner || result.data.modified_by || 'Unknown User',
          company: result.data.company,
          owner: result.data.owner,
          modified_by: result.data.modified_by,
          docstatus: result.data.docstatus
        });
      } else {
        setRequestStatus(null);
        toast({
          title: "Not Found",
          description: `Material request ${searchQuery} not found`,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error fetching material request:', error);
      setRequestStatus(null);
      toast({
        title: "Error",
        description: "Failed to fetch material request status",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Draft": return "bg-gray-100 text-gray-800";
      case "Submitted": 
      case "Pending": return "bg-blue-100 text-blue-800";
      case "Partially Ordered": return "bg-yellow-100 text-yellow-800";
      case "Ordered": return "bg-green-100 text-green-800";
      case "Issued": return "bg-green-100 text-green-800";
      case "Transferred": return "bg-green-100 text-green-800";
      case "Received": return "bg-green-100 text-green-800";
      case "Partially Received": return "bg-lime-100 text-lime-800";
      case "Cancelled": return "bg-red-100 text-red-800";
      case "Stopped": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Search className="w-5 h-5" />
          <span>Check Material Request Status</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex space-x-2">
          <Input
            placeholder="Enter material request number (e.g., MAT-REQ-2025-00001)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <Button onClick={handleSearch} disabled={loading}>
            <Search className="w-4 h-4 mr-2" />
            {loading ? 'Searching...' : 'Search'}
          </Button>
        </div>

        {requestStatus && (
          <div className="border rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FileText className="w-4 h-4 text-blue-600" />
                <span className="font-medium">{requestStatus.name}</span>
              </div>
              <Badge className={getStatusColor(requestStatus.status)}>
                {requestStatus.status}
              </Badge>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Type:</span>
                <p className="font-medium">{requestStatus.material_request_type}</p>
              </div>
              <div>
                <span className="text-gray-500">Date:</span>
                <p className="font-medium">{new Date(requestStatus.transaction_date).toLocaleDateString()}</p>
              </div>
              <div>
                <span className="text-gray-500">Requested By:</span>
                <p className="font-medium">{requestStatus.requested_by}</p>
              </div>
              <div>
                <span className="text-gray-500">Company:</span>
                <p className="font-medium">{requestStatus.company}</p>
              </div>
              {requestStatus.owner && requestStatus.owner !== requestStatus.requested_by && (
                <div>
                  <span className="text-gray-500">Created By:</span>
                  <p className="font-medium">{requestStatus.owner}</p>
                </div>
              )}
              <div>
                <span className="text-gray-500">Document Status:</span>
                <p className="font-medium">
                  {requestStatus.docstatus === 0 ? 'Draft' : 
                   requestStatus.docstatus === 1 ? 'Submitted' : 'Cancelled'}
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MaterialRequestStatusChecker;

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  FileText, 
  Plus, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  TrendingUp,
  Package
} from "lucide-react";
import { createERPNextAPI, getUserDefaultCompany } from "@/services/erpnextApi";
import { useToast } from "@/hooks/use-toast";
import MaterialRequestStatusChecker from "./MaterialRequestStatusChecker";

interface MaterialRequestDashboardProps {
  onCreateNew: (purpose: string) => void;
  onViewList: () => void;
}

interface MaterialRequestSummary {
  name: string;
  title?: string;
  material_request_type: string;
  status: string;
  transaction_date: string;
  requested_by: string;
}

const MaterialRequestDashboard = ({ onCreateNew, onViewList }: MaterialRequestDashboardProps) => {
  const [stats, setStats] = useState({
    draft: 0,
    submitted: 0,
    partiallyOrdered: 0,
    ordered: 0,
    cancelled: 0
  });
  const [recentRequests, setRecentRequests] = useState<MaterialRequestSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const erpnextAPI = await createERPNextAPI();
      if (!erpnextAPI) {
        console.warn('ERPNext API not configured');
        return;
      }

      const company = await getUserDefaultCompany();
      
      // Fetch recent material requests (last 5)
      const recentResult = await erpnextAPI.getMaterialRequests(
        [['docstatus', '!=', 2]], // Exclude cancelled
        company || undefined,
        5
      );

      if (recentResult.data) {
        // Transform the data to match MaterialRequestSummary interface
        const transformedRequests: MaterialRequestSummary[] = recentResult.data.map(req => ({
          name: req.name,
          title: req.title || req.name,
          material_request_type: req.material_request_type || 'Purchase',
          status: req.status,
          transaction_date: req.transaction_date,
          requested_by: req.requested_by || 'System'
        }));
        setRecentRequests(transformedRequests);
      }

      // Fetch all material requests for stats
      const allResult = await erpnextAPI.getMaterialRequests(
        undefined,
        company || undefined,
        1000
      );

      if (allResult.data) {
        const statsData = allResult.data.reduce((acc, req) => {
          switch (req.status) {
            case 'Draft':
              acc.draft++;
              break;
            case 'Submitted':
            case 'Pending':
              acc.submitted++;
              break;
            case 'Partially Ordered':
              acc.partiallyOrdered++;
              break;
            case 'Ordered':
              acc.ordered++;
              break;
            case 'Cancelled':
              acc.cancelled++;
              break;
          }
          return acc;
        }, { draft: 0, submitted: 0, partiallyOrdered: 0, ordered: 0, cancelled: 0 });

        setStats(statsData);
      }

    } catch (error) {
      console.error('Error fetching material request data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch material request data",
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
      case "Cancelled": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <FileText className="w-6 h-6 text-gray-600 mx-auto mb-2" />
            <div className="text-2xl font-bold">{stats.draft}</div>
            <div className="text-sm text-gray-600">Draft</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <Clock className="w-6 h-6 text-blue-600 mx-auto mb-2" />
            <div className="text-2xl font-bold">{stats.submitted}</div>
            <div className="text-sm text-gray-600">Submitted</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <AlertCircle className="w-6 h-6 text-yellow-600 mx-auto mb-2" />
            <div className="text-2xl font-bold">{stats.partiallyOrdered}</div>
            <div className="text-sm text-gray-600">Partially Ordered</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <CheckCircle className="w-6 h-6 text-green-600 mx-auto mb-2" />
            <div className="text-2xl font-bold">{stats.ordered}</div>
            <div className="text-sm text-gray-600">Ordered</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <XCircle className="w-6 h-6 text-red-600 mx-auto mb-2" />
            <div className="text-2xl font-bold">{stats.cancelled}</div>
            <div className="text-sm text-gray-600">Cancelled</div>
          </CardContent>
        </Card>
      </div>

      {/* Status Checker */}
      <MaterialRequestStatusChecker />

      {/* Create New Material Request */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Plus className="w-5 h-5" />
            <span>Create Material Request</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button 
              className="h-20 flex-col space-y-2"
              variant="outline"
              onClick={() => onCreateNew("Purchase")}
            >
              <Package className="w-6 h-6" />
              <span>Purchase Request</span>
            </Button>
            
            <Button 
              className="h-20 flex-col space-y-2"
              variant="outline"
              onClick={() => onCreateNew("Material Transfer")}
            >
              <TrendingUp className="w-6 h-6" />
              <span>Material Transfer</span>
            </Button>
            
            <Button 
              className="h-20 flex-col space-y-2"
              variant="outline"
              onClick={() => onCreateNew("Material Issue")}
            >
              <FileText className="w-6 h-6" />
              <span>Material Issue</span>
            </Button>
            
            <Button 
              className="h-20 flex-col space-y-2"
              variant="outline"
              onClick={() => onCreateNew("Manufacture")}
            >
              <CheckCircle className="w-6 h-6" />
              <span>Manufacturing</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Requests */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Material Requests</CardTitle>
          <Button variant="outline" size="sm" onClick={onViewList}>
            View All
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-4">Loading recent requests...</div>
          ) : recentRequests.length === 0 ? (
            <div className="text-center py-4 text-gray-500">No recent material requests found</div>
          ) : (
            <div className="space-y-3">
              {recentRequests.map((request) => (
                <div key={request.name} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <FileText className="w-4 h-4 text-blue-600" />
                    <div>
                      <div className="font-medium">{request.name}</div>
                      <div className="text-sm text-gray-500">
                        {request.material_request_type} • {request.requested_by}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className={getStatusColor(request.status)}>
                      {request.status}
                    </Badge>
                    <span className="text-sm text-gray-500">
                      {new Date(request.transaction_date).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MaterialRequestDashboard;

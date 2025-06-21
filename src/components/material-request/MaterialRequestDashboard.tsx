
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Clock, CheckCircle, XCircle, ShoppingCart, ArrowRightLeft, Package, RefreshCw, Wrench } from "lucide-react";
import MaterialRequestStatusChecker from "@/components/material-request/MaterialRequestStatusChecker";
import { createERPNextAPI, getUserDefaultCompany } from "@/services/erpnextApi";
import { useToast } from "@/hooks/use-toast";

interface MaterialRequestDashboardProps {
  onCreateNew: (purpose: string) => void;
  onViewList: () => void;
}

const MaterialRequestDashboard = ({ onCreateNew, onViewList }: MaterialRequestDashboardProps) => {
  const [stats, setStats] = useState({
    totalRequests: 0,
    pendingRequests: 0,
    approvedRequests: 0,
    rejectedRequests: 0,
    draftRequests: 0
  });
  const [recentRequests, setRecentRequests] = useState<any[]>([]);
  const [draftRequests, setDraftRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

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
      
      // Fetch recent material requests
      const recentRequestsResult = await erpnextAPI.getMaterialRequests(
        undefined,
        company || undefined,
        20
      );

      if (recentRequestsResult.data) {
        setRecentRequests(recentRequestsResult.data);
        
        // Separate draft requests
        const drafts = recentRequestsResult.data.filter((req: any) => req.docstatus === 0);
        setDraftRequests(drafts);
        
        // Calculate stats
        const total = recentRequestsResult.data.length;
        const pending = recentRequestsResult.data.filter((req: any) => req.status === 'Pending' || req.status === 'Submitted').length;
        const approved = recentRequestsResult.data.filter((req: any) => req.status === 'Ordered' || req.status === 'Issued').length;
        const rejected = recentRequestsResult.data.filter((req: any) => req.status === 'Cancelled').length;
        const draft = drafts.length;

        setStats({
          totalRequests: total,
          pendingRequests: pending,
          approvedRequests: approved,
          rejectedRequests: rejected,
          draftRequests: draft
        });
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
      {/* Header with Status Checker */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <MaterialRequestStatusChecker />
        </div>
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button 
                onClick={() => onCreateNew("Purchase")} 
                className="w-full justify-start" 
                variant="outline"
              >
                <ShoppingCart className="w-4 h-4 mr-2" />
                Purchase Request
              </Button>
              <Button 
                onClick={() => onCreateNew("Material Transfer")} 
                className="w-full justify-start" 
                variant="outline"
              >
                <ArrowRightLeft className="w-4 h-4 mr-2" />
                Transfer Request
              </Button>
              <Button 
                onClick={() => onCreateNew("Material Issue")} 
                className="w-full justify-start" 
                variant="outline"
              >
                <Package className="w-4 h-4 mr-2" />
                Issue Request
              </Button>
              <Button 
                onClick={() => onCreateNew("Manufacture")} 
                className="w-full justify-start" 
                variant="outline"
              >
                <Wrench className="w-4 h-4 mr-2" />
                Manufacture Request
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="flex items-center p-6">
            <div className="p-2 bg-blue-100 rounded-lg mr-4">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.totalRequests}</p>
              <p className="text-sm text-gray-600">Total Requests</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center p-6">
            <div className="p-2 bg-gray-100 rounded-lg mr-4">
              <FileText className="w-6 h-6 text-gray-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.draftRequests}</p>
              <p className="text-sm text-gray-600">Drafts</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center p-6">
            <div className="p-2 bg-yellow-100 rounded-lg mr-4">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.pendingRequests}</p>
              <p className="text-sm text-gray-600">Pending</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center p-6">
            <div className="p-2 bg-green-100 rounded-lg mr-4">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.approvedRequests}</p>
              <p className="text-sm text-gray-600">Approved</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center p-6">
            <div className="p-2 bg-red-100 rounded-lg mr-4">
              <XCircle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.rejectedRequests}</p>
              <p className="text-sm text-gray-600">Rejected</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Draft Requests */}
      {draftRequests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Draft Material Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {draftRequests.map((request, index) => (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                  <div className="flex items-center space-x-4">
                    <div className="p-2 bg-gray-50 rounded-lg">
                      <FileText className="w-4 h-4 text-gray-600" />
                    </div>
                    <div>
                      <h4 className="font-medium">{request.name}</h4>
                      <p className="text-sm text-gray-600">
                        {request.material_request_type} • {request.owner || 'Unknown'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className="bg-gray-100 text-gray-800">
                      Draft
                    </Badge>
                    <span className="text-sm text-gray-500">
                      {new Date(request.transaction_date).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Material Requests */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Material Requests</CardTitle>
          <Button variant="outline" onClick={onViewList}>
            View All
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto text-gray-400" />
              <p className="text-gray-600 mt-2">Loading recent requests...</p>
            </div>
          ) : recentRequests.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p>No material requests found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentRequests.slice(0, 5).map((request, index) => (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                  <div className="flex items-center space-x-4">
                    <div className="p-2 bg-blue-50 rounded-lg">
                      <FileText className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-medium">{request.name}</h4>
                      <p className="text-sm text-gray-600">
                        {request.material_request_type} • {request.owner || 'Unknown'}
                      </p>
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

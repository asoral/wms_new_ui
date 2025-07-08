import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Database, FileText, Package, CheckCircle, AlertTriangle, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { createERPNextAPI, getUserDefaultCompany } from "@/services/erpnextApi";
import MaterialRequestStatusChecker from "@/components/material-request/MaterialRequestStatusChecker";
import MaterialRequestForm from "@/components/material-request/MaterialRequestForm";

const MaterialRequest = () => {
  const [currentView, setCurrentView] = useState<'dashboard' | 'create' | 'list'>('dashboard');
  const [selectedPurpose, setSelectedPurpose] = useState<string>('');
  const [materialRequests, setMaterialRequests] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState({
    total: 0,
    draft: 0,
    pending: 0,
    completed: 0,
    partial: 0,
    cancelled: 0
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchMaterialRequests();
  }, []);

  const fetchMaterialRequests = async () => {
    setLoading(true);
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

      const result = await api.getMaterialRequests(undefined, company || undefined, 50);
      if (result && result.data) {
        setMaterialRequests(result.data);
        
        // Calculate analytics
        const requests = result.data;
        setAnalytics({
          total: requests.length,
          draft: requests.filter((mr: any) => mr.status === 'Draft').length,
          pending: requests.filter((mr: any) => mr.status === 'Pending').length,
          completed: requests.filter((mr: any) => mr.status === 'Stopped').length,
          partial: requests.filter((mr: any) => mr.status === 'Partially Ordered').length,
          cancelled: requests.filter((mr: any) => mr.status === 'Cancelled').length
        });
      }
    } catch (error) {
      console.error('Error fetching material requests:', error);
      toast({
        title: "Error",
        description: "Failed to fetch material requests from ERPNext",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNew = (purpose: string) => {
    setSelectedPurpose(purpose);
    setCurrentView('create');
  };

  const handleBackToDashboard = () => {
    setCurrentView('dashboard');
    setSelectedPurpose('');
  };

  const handleFormSubmit = (data: any) => {
    toast({
      title: "Material Request Created",
      description: `Material request ${data.name} created successfully!`,
    });
    handleBackToDashboard();
    fetchMaterialRequests(); // Refresh the list
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

  if (currentView === 'create' && selectedPurpose) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-6">
        <MaterialRequestForm
          purpose={selectedPurpose as any}
          onDraftCreated={handleFormSubmit}
          onReviewAndSubmit={() => {
            // Handle review and submit logic
            toast({
              title: "Ready for Review",
              description: "Material request is ready for review and submission.",
            });
          }}
          onBack={handleBackToDashboard}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Database className="w-6 h-6 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Material Request</h1>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Status Checker */}
          <MaterialRequestStatusChecker />

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <Button
                  onClick={() => handleCreateNew("Purchase")}
                  variant="outline"
                  className="h-16 flex flex-col items-center justify-center space-y-2 hover:bg-blue-50 hover:border-blue-200"
                >
                  <FileText className="w-5 h-5 text-blue-600" />
                  <span className="text-sm font-medium">Purchase Request</span>
                </Button>
                <Button
                  onClick={() => handleCreateNew("Material Transfer")}
                  variant="outline"
                  className="h-16 flex flex-col items-center justify-center space-y-2 hover:bg-green-50 hover:border-green-200"
                >
                  <Package className="w-5 h-5 text-green-600" />
                  <span className="text-sm font-medium">Transfer Request</span>
                </Button>
                <Button
                  onClick={() => handleCreateNew("Material Issue")}
                  variant="outline"
                  className="h-16 flex flex-col items-center justify-center space-y-2 hover:bg-red-50 hover:border-red-200"
                >
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                  <span className="text-sm font-medium">Issue Request</span>
                </Button>
                <Button
                  onClick={() => handleCreateNew("Manufacture")}
                  variant="outline"
                  className="h-16 flex flex-col items-center justify-center space-y-2 hover:bg-purple-50 hover:border-purple-200"
                >
                  <CheckCircle className="w-5 h-5 text-purple-600" />
                  <span className="text-sm font-medium">Manufacture Request</span>
                </Button>
                <Button
                  onClick={() => handleCreateNew("Customer Provided")}
                  variant="outline"
                  className="h-16 flex flex-col items-center justify-center space-y-2 hover:bg-orange-50 hover:border-orange-200"
                >
                  <Database className="w-5 h-5 text-orange-600" />
                  <span className="text-sm font-medium">Customer Provided</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Dashboard Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-2xl font-bold text-blue-600">{analytics.total}</div>
                <div className="text-sm text-gray-600">Total</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-2xl font-bold text-gray-600">{analytics.draft}</div>
                <div className="text-sm text-gray-600">Draft</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-2xl font-bold text-orange-600">{analytics.pending}</div>
                <div className="text-sm text-gray-600">Pending</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-2xl font-bold text-green-600">{analytics.completed}</div>
                <div className="text-sm text-gray-600">Completed</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-2xl font-bold text-yellow-600">{analytics.partial}</div>
                <div className="text-sm text-gray-600">Partial</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-2xl font-bold text-red-600">{analytics.cancelled}</div>
                <div className="text-sm text-gray-600">Cancelled</div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Material Requests */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Recent Material Requests</span>
                <Button variant="ghost" size="sm" onClick={fetchMaterialRequests}>
                  View All
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-4">Loading material requests...</div>
              ) : (
                <div className="space-y-4">
                  {materialRequests.slice(0, 5).map((request) => (
                    <div key={request.name} className="border rounded-lg p-4 flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">{request.name}</h3>
                        <p className="text-sm text-gray-600">
                          {request.material_request_type} • {request.creation}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getStatusBadge(request.status)}
                        <Button size="sm" variant="outline">
                          View
                        </Button>
                      </div>
                    </div>
                  ))}
                  {materialRequests.length === 0 && (
                    <div className="text-center py-4 text-gray-500">
                      No material requests found
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default MaterialRequest;
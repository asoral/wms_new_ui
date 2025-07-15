import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Database, FileText, Package, CheckCircle, AlertTriangle, Calendar, User, Eye, Edit3 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { createERPNextAPI, getUserDefaultCompany } from "@/services/erpnextApi";
import MaterialRequestStatusChecker from "@/components/material-request/MaterialRequestStatusChecker";
import MaterialRequestFormImproved from "@/components/material-request/MaterialRequestFormImproved";
import MaterialRequestReview from "@/components/material-request/MaterialRequestReview";
import MaterialRequestList from "@/components/material-request/MaterialRequestList";

const MaterialRequest = () => {
  const [currentView, setCurrentView] = useState<'dashboard' | 'create' | 'review' | 'list' | 'edit'>('dashboard');
  const [selectedPurpose, setSelectedPurpose] = useState<string>('');
  const [currentDraft, setCurrentDraft] = useState<any>(null);
  const [editingRequest, setEditingRequest] = useState<any>(null);
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

      // Fetch list of recent material requests first
      const result = await api.getMaterialRequests(undefined, company || undefined, 5);
      if (result && result.data) {
        // Fetch detailed data for each request to get items and proper fields
        const detailedRequests = await Promise.all(
          result.data.map(async (request: any) => {
            try {
              const detailResult = await api.getMaterialRequest(request.name);
              return detailResult.data || request;
            } catch (error) {
              console.error(`Error fetching details for ${request.name}:`, error);
              return request; // Return original data if detail fetch fails
            }
          })
        );
        
        setMaterialRequests(detailedRequests);
        
        // Fetch all requests for analytics (without details for performance)
        const allRequestsResult = await api.getMaterialRequests(undefined, company || undefined, 200);
        const allRequests = allRequestsResult?.data || [];
        
        // Calculate analytics
        console.log('Material Requests for analytics:', allRequests.map((mr: any) => ({ 
          name: mr.name, 
          status: mr.status, 
          docstatus: mr.docstatus 
        })));
        
        setAnalytics({
          total: allRequests.length,
          draft: allRequests.filter((mr: any) => 
            mr.docstatus === 0 || 
            mr.status === 'Draft' || 
            !mr.status
          ).length,
          pending: allRequests.filter((mr: any) => 
            mr.status === 'Pending' || 
            mr.status === 'Submitted' || 
            mr.status === 'Open' ||
            (mr.docstatus === 1 && mr.status !== 'Cancelled')
          ).length,
          completed: allRequests.filter((mr: any) => 
            ['Stopped', 'Ordered', 'Issued', 'Transferred', 'Received', 'Completed'].includes(mr.status)
          ).length,
          partial: allRequests.filter((mr: any) => 
            mr.status === 'Partially Ordered' || 
            mr.status === 'Partially Received'
          ).length,
          cancelled: allRequests.filter((mr: any) => 
            mr.status === 'Cancelled' || 
            mr.docstatus === 2
          ).length
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
    setCurrentDraft(null);
    setEditingRequest(null);
    setCurrentView('create');
  };

  const handleBackToDashboard = () => {
    setCurrentView('dashboard');
    setSelectedPurpose('');
    setCurrentDraft(null);
    setEditingRequest(null);
    fetchMaterialRequests(); // Refresh data when returning to dashboard
  };

  const handleDraftCreated = (draftData: any) => {
    setCurrentDraft(draftData);
    setCurrentView('review'); // Go to review after saving draft
    toast({
      title: "Draft Saved",
      description: `Material request draft ${draftData.name} has been saved.`,
    });
  };

  const handleReviewAndSubmit = () => {
    if (currentDraft) {
      setCurrentView('review');
    }
  };

  const handleEditRequest = () => {
    setCurrentView('create');
  };

  const handleRequestSubmitted = (submittedData: any) => {
    toast({
      title: "Request Submitted",
      description: `Material request ${submittedData.name} has been submitted successfully.`,
    });
    handleBackToDashboard();
  };

  const handleViewAll = () => {
    setCurrentView('list');
  };

  const handleEditFromList = async (request: any) => {
    try {
      // Ensure we have detailed request data with items
      let detailedRequest = request;
      if (!request.items || request.items.length === 0) {
        const api = await createERPNextAPI();
        if (api) {
          const detailResult = await api.getMaterialRequest(request.name);
          detailedRequest = detailResult.data || request;
        }
      }
      
      setEditingRequest(detailedRequest);
      setCurrentDraft(detailedRequest);
      setSelectedPurpose(detailedRequest.material_request_type);
      setCurrentView('create');
    } catch (error) {
      console.error('Error fetching request details:', error);
      toast({
        title: "Error",
        description: "Failed to fetch request details",
        variant: "destructive"
      });
    }
  };

  const handleViewFromList = (request: any) => {
    setCurrentDraft(request);
    setCurrentView('review');
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

  const getTypeBadge = (type: string) => {
    const typeMap: Record<string, string> = {
      'Purchase': 'bg-blue-100 text-blue-800',
      'Material Transfer': 'bg-green-100 text-green-800',
      'Material Issue': 'bg-red-100 text-red-800',
      'Manufacture': 'bg-purple-100 text-purple-800',
      'Customer Provided': 'bg-orange-100 text-orange-800'
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${typeMap[type] || 'bg-gray-100 text-gray-800'}`}>
        {type}
      </span>
    );
  };

  const getTotalItems = (request: any) => {
    return request.items?.length || 0;
  };

  const getTotalQty = (request: any) => {
    return request.items?.reduce((total: number, item: any) => total + (item.qty || 0), 0) || 0;
  };

  // Render different views based on currentView state
  if (currentView === 'create') {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-6">
        <MaterialRequestFormImproved
          purpose={selectedPurpose as any}
          editData={editingRequest || currentDraft}
          onSubmit={handleDraftCreated}
          onCancel={handleBackToDashboard}
        />
      </div>
    );
  }

  if (currentView === 'review' && currentDraft) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-6">
        <MaterialRequestReview
          draftData={currentDraft}
          onBack={() => setCurrentView('create')}
          onEdit={handleEditRequest}
          onSubmitted={handleRequestSubmitted}
        />
      </div>
    );
  }

  if (currentView === 'list') {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-6">
        <MaterialRequestList
          onBack={handleBackToDashboard}
          onEdit={handleEditFromList}
          onView={handleViewFromList}
        />
      </div>
    );
  }

  // Dashboard view
  return (
    <div className="w-full max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Database className="w-6 h-6 text-blue-600" />
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900">Material Request</h1>
            <p className="text-sm md:text-base text-muted-foreground">Create and manage material requests</p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {/* Status Checker */}
        <MaterialRequestStatusChecker onEdit={handleEditFromList} />

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 md:gap-4">
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
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
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
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle>Recent Material Requests</CardTitle>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setCurrentView('list')}
                >
                  Search All
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-4">Loading material requests...</div>
              ) : (
                <div className="space-y-4">
                  {materialRequests.slice(0, 5).map((request) => (
                    <Card key={request.name} className="hover:bg-muted/20 transition-colors">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className="font-semibold text-gray-900">{request.name}</h3>
                            <p className="text-sm text-muted-foreground">{request.title || 'Material Request'}</p>
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleViewFromList(request)}
                              title="View"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            {request.status === 'Draft' && (
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleEditFromList(request)}
                                title="Edit"
                              >
                                <Edit3 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Type:</span>
                            <div className="mt-1">{getTypeBadge(request.material_request_type)}</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Status:</span>
                            <div className="mt-1">{getStatusBadge(request.status)}</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground"># Items:</span>
                            <div className="mt-1 font-medium">{getTotalItems(request)}</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Total Qty:</span>
                            <div className="mt-1 font-medium">{getTotalQty(request)}</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Required By:</span>
                            <div className="mt-1">
                              {request.schedule_date ? new Date(request.schedule_date).toLocaleDateString() : 'Not set'}
                            </div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Requested By:</span>
                            <div className="mt-1">{request.owner || 'Not specified'}</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Created:</span>
                            <div className="mt-1">{new Date(request.creation).toLocaleDateString()}</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Company:</span>
                            <div className="mt-1">{request.company || 'Not specified'}</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  
                  {materialRequests.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No material requests found</p>
                      <p className="text-sm mt-2">Create your first material request to get started</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
      </div>
    </div>
  );
};

export default MaterialRequest;
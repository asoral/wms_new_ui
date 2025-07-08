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

  const handleEditFromList = (request: any) => {
    setEditingRequest(request);
    setCurrentDraft(request);
    setSelectedPurpose(request.material_request_type);
    setCurrentView('create');
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
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Database className="w-6 h-6 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Material Request</h1>
              <p className="text-muted-foreground">Create and manage material requests</p>
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
                <Button variant="outline" size="sm" onClick={handleViewAll}>
                  View All
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-4">Loading material requests...</div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Request ID</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead># Items</TableHead>
                        <TableHead>Total Qty</TableHead>
                        <TableHead>Required By</TableHead>
                        <TableHead>Requested By</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {materialRequests.slice(0, 5).map((request) => (
                        <TableRow key={request.name} className="hover:bg-muted/50">
                          <TableCell className="font-medium">
                            <div>
                              <div className="font-semibold">{request.name}</div>
                              {request.title && (
                                <div className="text-sm text-muted-foreground">{request.title}</div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {getTypeBadge(request.material_request_type)}
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(request.status)}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-1">
                              <Package className="w-4 h-4 text-muted-foreground" />
                              <span>{getTotalItems(request)}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="font-medium">{getTotalQty(request)}</span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-1">
                              <Calendar className="w-4 h-4 text-muted-foreground" />
                              <span>
                                {request.schedule_date 
                                  ? new Date(request.schedule_date).toLocaleDateString()
                                  : 'Not set'
                                }
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-1">
                              <User className="w-4 h-4 text-muted-foreground" />
                              <span>{request.requested_by || 'Not specified'}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {new Date(request.creation).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex space-x-1">
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleViewFromList(request)}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              {request.status === 'Draft' && (
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => handleEditFromList(request)}
                                >
                                  <Edit3 className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  
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
    </div>
  );
};

export default MaterialRequest;
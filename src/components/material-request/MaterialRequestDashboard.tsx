
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Clock, CheckCircle, XCircle, ShoppingCart, ArrowRightLeft, Package, RefreshCw, Wrench, AlertTriangle, Pause, Truck, Archive } from "lucide-react";
import MaterialRequestStatusChecker from "@/components/material-request/MaterialRequestStatusChecker";
import { createERPNextAPI, getUserDefaultCompany } from "@/services/erpnextApi";
import { useToast } from "@/hooks/use-toast";
import { MaterialRequest, MaterialRequestPurpose } from "@/pages/MaterialRequest";

interface MaterialRequestDashboardProps {
  onCreateNew: (purpose: MaterialRequestPurpose) => void;
  onViewList: () => void;
  onEditDraft?: (draft: MaterialRequest) => void;
}

const MaterialRequestDashboard = ({ onCreateNew, onViewList, onEditDraft }: MaterialRequestDashboardProps) => {
  const [stats, setStats] = useState({
    totalRequests: 0,
    draftRequests: 0,
    submittedRequests: 0,
    pendingRequests: 0,
    partiallyOrderedRequests: 0,
    orderedRequests: 0,
    issuedRequests: 0,
    transferredRequests: 0,
    receivedRequests: 0,
    cancelledRequests: 0,
    stoppedRequests: 0,
    partiallyReceivedRequests: 0
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
      
      // Fetch recent material requests with more fields
      const recentRequestsResult = await erpnextAPI.getMaterialRequests(
        undefined,
        company || undefined,
        50
      );

      if (recentRequestsResult.data) {
        console.log('Fetched material requests:', recentRequestsResult.data);
        setRecentRequests(recentRequestsResult.data);
        
        // Separate draft requests (docstatus = 0)
        const drafts = recentRequestsResult.data.filter((req: any) => req.docstatus === 0);
        setDraftRequests(drafts);
        
        // Calculate stats based on correct ERPNext statuses and docstatus
        const total = recentRequestsResult.data.length;
        const draft = drafts.length;
        const submitted = recentRequestsResult.data.filter((req: any) => req.docstatus === 1 && req.status === 'Submitted').length;
        const pending = recentRequestsResult.data.filter((req: any) => req.docstatus === 1 && req.status === 'Pending').length;
        const partiallyOrdered = recentRequestsResult.data.filter((req: any) => req.docstatus === 1 && req.status === 'Partially Ordered').length;
        const ordered = recentRequestsResult.data.filter((req: any) => req.docstatus === 1 && req.status === 'Ordered').length;
        const issued = recentRequestsResult.data.filter((req: any) => req.docstatus === 1 && req.status === 'Issued').length;
        const transferred = recentRequestsResult.data.filter((req: any) => req.docstatus === 1 && req.status === 'Transferred').length;
        const received = recentRequestsResult.data.filter((req: any) => req.docstatus === 1 && req.status === 'Received').length;
        const cancelled = recentRequestsResult.data.filter((req: any) => req.docstatus === 2 || req.status === 'Cancelled').length;
        const stopped = recentRequestsResult.data.filter((req: any) => req.docstatus === 1 && req.status === 'Stopped').length;
        const partiallyReceived = recentRequestsResult.data.filter((req: any) => req.docstatus === 1 && req.status === 'Partially Received').length;

        console.log('Status counts:', {
          total, draft, submitted, pending, partiallyOrdered, ordered, 
          issued, transferred, received, cancelled, stopped, partiallyReceived
        });

        setStats({
          totalRequests: total,
          draftRequests: draft,
          submittedRequests: submitted,
          pendingRequests: pending,
          partiallyOrderedRequests: partiallyOrdered,
          orderedRequests: ordered,
          issuedRequests: issued,
          transferredRequests: transferred,
          receivedRequests: received,
          cancelledRequests: cancelled,
          stoppedRequests: stopped,
          partiallyReceivedRequests: partiallyReceived
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

  const handleDraftClick = async (draftName: string, draftType: string) => {
    try {
      const erpnextAPI = await createERPNextAPI();
      if (!erpnextAPI || !onEditDraft) return;

      // Fetch full draft details
      const draftDetails = await erpnextAPI.getMaterialRequest(draftName);
      
      if (draftDetails.data) {
        const draft: MaterialRequest = {
          id: draftDetails.data.name,
          name: draftDetails.data.name,
          purpose: draftDetails.data.material_request_type as MaterialRequestPurpose,
          status: "Draft",
          transactionDate: draftDetails.data.transaction_date,
          requestedBy: draftDetails.data.owner || draftDetails.data.requested_by || draftDetails.data.modified_by || "Unknown User",
          company: draftDetails.data.company,
          items: draftDetails.data.items?.map((item: any) => ({
            itemCode: item.item_code,
            itemName: item.item_name || item.item_code,
            qty: item.qty,
            uom: item.uom,
            description: item.description || '',
            warehouse: item.warehouse,
            rate: item.rate,
            requiredBy: item.schedule_date
          })) || [],
          remarks: draftDetails.data.remarks || ''
        };

        onEditDraft(draft);
      }
    } catch (error) {
      console.error('Error fetching draft details:', error);
      toast({
        title: "Error",
        description: "Failed to load draft details",
        variant: "destructive"
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Draft": return "bg-gray-100 text-gray-800";
      case "Submitted": return "bg-blue-100 text-blue-800";
      case "Pending": return "bg-yellow-100 text-yellow-800";
      case "Partially Ordered": return "bg-orange-100 text-orange-800";
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Draft": return FileText;
      case "Submitted": return Clock;
      case "Pending": return Clock;
      case "Partially Ordered": return ShoppingCart;
      case "Ordered": return CheckCircle;
      case "Issued": return Package;
      case "Transferred": return ArrowRightLeft;
      case "Received": return Archive;
      case "Partially Received": return Truck;
      case "Cancelled": return XCircle;
      case "Stopped": return Pause;
      default: return FileText;
    }
  };

  const formatRequestInfo = (request: any) => {
    const itemCount = request.items?.length || 0;
    const requestedBy = request.owner || request.requested_by || request.modified_by || 'Unknown User';
    const date = new Date(request.transaction_date).toLocaleDateString();
    const actualStatus = request.docstatus === 0 ? 'Draft' : request.status;
    
    return {
      itemCount,
      requestedBy,
      date,
      actualStatus,
      subtitle: `${request.material_request_type} • ${itemCount} item${itemCount !== 1 ? 's' : ''} • ${requestedBy}`
    };
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
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="flex items-center p-4">
            <div className="p-2 bg-blue-100 rounded-lg mr-3">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xl font-bold">{stats.totalRequests}</p>
              <p className="text-xs text-gray-600">Total</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center p-4">
            <div className="p-2 bg-gray-100 rounded-lg mr-3">
              <FileText className="w-5 h-5 text-gray-600" />
            </div>
            <div>
              <p className="text-xl font-bold">{stats.draftRequests}</p>
              <p className="text-xs text-gray-600">Draft</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center p-4">
            <div className="p-2 bg-yellow-100 rounded-lg mr-3">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-xl font-bold">{stats.pendingRequests}</p>
              <p className="text-xs text-gray-600">Pending</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center p-4">
            <div className="p-2 bg-green-100 rounded-lg mr-3">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-xl font-bold">{stats.orderedRequests + stats.issuedRequests + stats.transferredRequests + stats.receivedRequests}</p>
              <p className="text-xs text-gray-600">Completed</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center p-4">
            <div className="p-2 bg-orange-100 rounded-lg mr-3">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-xl font-bold">{stats.partiallyOrderedRequests + stats.partiallyReceivedRequests}</p>
              <p className="text-xs text-gray-600">Partial</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center p-4">
            <div className="p-2 bg-red-100 rounded-lg mr-3">
              <XCircle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-xl font-bold">{stats.cancelledRequests + stats.stoppedRequests}</p>
              <p className="text-xs text-gray-600">Cancelled</p>
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
              {draftRequests.map((request, index) => {
                const info = formatRequestInfo(request);
                const StatusIcon = getStatusIcon("Draft");
                return (
                  <div 
                    key={index} 
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                    onClick={() => handleDraftClick(request.name, request.material_request_type)}
                  >
                    <div className="flex items-center space-x-4">
                      <div className="p-2 bg-gray-50 rounded-lg">
                        <StatusIcon className="w-4 h-4 text-gray-600" />
                      </div>
                      <div>
                        <h4 className="font-medium">{request.name}</h4>
                        <p className="text-sm text-gray-600">{info.subtitle}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className="bg-gray-100 text-gray-800">
                        Draft
                      </Badge>
                      <span className="text-sm text-gray-500">{info.date}</span>
                    </div>
                  </div>
                );
              })}
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
              {recentRequests.slice(0, 8).map((request, index) => {
                const info = formatRequestInfo(request);
                const StatusIcon = getStatusIcon(info.actualStatus);
                return (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-center space-x-4">
                      <div className="p-2 bg-blue-50 rounded-lg">
                        <StatusIcon className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-medium">{request.name}</h4>
                        <p className="text-sm text-gray-600">{info.subtitle}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={getStatusColor(info.actualStatus)}>
                        {info.actualStatus}
                      </Badge>
                      <span className="text-sm text-gray-500">{info.date}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MaterialRequestDashboard;

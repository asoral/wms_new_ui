import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, FileText, Clock, CheckCircle, AlertTriangle } from "lucide-react";
import { MetricCard } from "@/components/ui/metric-card";
import { useMaterialRequestAPI } from "@/hooks/useERPNextAPI";
import { useToast } from "@/hooks/use-toast";

interface MaterialRequestDashboardProps {
  onCreateNew: () => void;
  onSelectMaterialRequest: (materialRequest: any) => void;
}

const MaterialRequestDashboard = ({ onCreateNew, onSelectMaterialRequest }: MaterialRequestDashboardProps) => {
  const [materialRequests, setMaterialRequests] = useState<any[]>([]);
  const [dashboardData, setDashboardData] = useState({
    draft: 0,
    submitted: 0,
    ordered: 0,
    received: 0
  });
  
  const { getMaterialRequests, getMaterialRequest, loading } = useMaterialRequestAPI();
  const { toast } = useToast();

  useEffect(() => {
    fetchMaterialRequests();
  }, []);

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { variant: "default" | "destructive" | "outline" | "secondary", icon: any }> = {
      'Draft': { variant: 'secondary', icon: Clock },
      'Submitted': { variant: 'default', icon: Clock },
      'Ordered': { variant: 'outline', icon: CheckCircle },
      'Received': { variant: 'outline', icon: CheckCircle },
      'Closed': { variant: 'outline', icon: CheckCircle },
      'Cancelled': { variant: 'destructive', icon: AlertTriangle },
      'Stopped': { variant: 'destructive', icon: AlertTriangle }
    };
    
    const statusInfo = statusMap[status] || { variant: 'secondary', icon: AlertTriangle };
    const IconComponent = statusInfo.icon;
    
    return (
      <Badge variant={statusInfo.variant} className="flex items-center space-x-1">
        <IconComponent className="w-3 h-3" />
        <span>{status}</span>
      </Badge>
    );
  };

  const fetchMaterialRequests = async () => {
    try {
      const response = await getMaterialRequests([
        ['docstatus', 'in', [0, 1]],
        ['status', 'not in', ['Cancelled', 'Stopped']]
      ]);

      if (response && typeof response === 'object' && 'data' in response) {
        const materialRequestsData = (response as any).data;
        setMaterialRequests(materialRequestsData);
        
        // Calculate dashboard metrics
        const draft = materialRequestsData.filter((mr: any) => mr.docstatus === 0).length;
        const submitted = materialRequestsData.filter((mr: any) => mr.docstatus === 1 && mr.status === 'Submitted').length;
        const ordered = materialRequestsData.filter((mr: any) => mr.status === 'Ordered').length;
        const received = materialRequestsData.filter((mr: any) => mr.status === 'Received').length;
        
        setDashboardData({ draft, submitted, ordered, received });
      }
    } catch (error) {
      console.error('Error fetching material requests:', error);
      toast({
        title: "Error",
        description: "Failed to fetch material requests",
        variant: "destructive"
      });
    }
  };

  const handleSelectMaterialRequest = async (materialRequest: any) => {
    try {
      const response = await getMaterialRequest(materialRequest.name);
      if (response && typeof response === 'object' && 'data' in response) {
        onSelectMaterialRequest((response as any).data);
      }
    } catch (error) {
      console.error('Error fetching material request details:', error);
      toast({
        title: "Error",
        description: "Failed to fetch material request details",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Dashboard Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Draft Requests"
          value={dashboardData.draft.toString()}
          icon={FileText}
        />
        <MetricCard
          title="Submitted Requests"
          value={dashboardData.submitted.toString()}
          icon={Clock}
        />
        <MetricCard
          title="Ordered Items"
          value={dashboardData.ordered.toString()}
          icon={CheckCircle}
        />
        <MetricCard
          title="Received Items"
          value={dashboardData.received.toString()}
          icon={AlertTriangle}
        />
      </div>

      {/* Material Requests List */}
      <Card>
        <CardHeader>
          <CardTitle>Material Requests</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-4">Loading material requests...</div>
          ) : (
            <div className="space-y-4">
              {materialRequests.map((mr) => (
                <div key={mr.name} className="border rounded-lg p-4 flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">{mr.name}</h3>
                    <p className="text-sm text-gray-600">
                      {mr.company} - {mr.transaction_date}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getStatusBadge(mr.status)}
                    <Button size="sm" onClick={() => handleSelectMaterialRequest(mr)}>
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

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button
              onClick={onCreateNew}
              variant="outline"
              className="h-16 flex flex-col items-center justify-center space-y-2 hover:bg-blue-50 hover:border-blue-200"
            >
              <Plus className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-medium">Create New Request</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MaterialRequestDashboard;


import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, FileText, Package, CheckCircle, AlertTriangle } from "lucide-react";
import { MetricCard } from "@/components/ui/metric-card";
import { useMaterialRequestAPI } from "@/hooks/useERPNextAPI";
import { useToast } from "@/hooks/use-toast";
import { getUserDefaultCompany } from "@/services/erpnextApi";
import StatusBadge from "@/components/ui/status-badge";

export interface MaterialRequestDashboardProps {
  onCreateNew: (purpose: string) => void;
  onEditDraft?: (draft: any) => void;
}

interface DashboardAnalytics {
  totalRequests: number;
  pendingRequests: number;
  completedRequests: number;
  totalItems: number;
}

const MaterialRequestDashboard = ({ onCreateNew, onEditDraft }: MaterialRequestDashboardProps) => {
  const [materialRequests, setMaterialRequests] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<DashboardAnalytics>({
    totalRequests: 0,
    pendingRequests: 0,
    completedRequests: 0,
    totalItems: 0
  });
  const { getMaterialRequests, loading } = useMaterialRequestAPI();
  const { toast } = useToast();

  useEffect(() => {
    fetchMaterialRequests();
  }, []);

  const fetchMaterialRequests = async () => {
    try {
      const company = await getUserDefaultCompany();
      const response = await getMaterialRequests(company ? [['company', '=', company]] : undefined);
      
      if (response?.data && Array.isArray(response.data)) {
        const requestsData = response.data;
        setMaterialRequests(requestsData);
        
        setAnalytics({
          totalRequests: requestsData.length,
          pendingRequests: requestsData.filter((mr: any) => mr.status === 'Draft').length,
          completedRequests: requestsData.filter((mr: any) => mr.status === 'Stopped').length,
          totalItems: 0
        });
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

  const handleSelectMaterialRequest = (materialRequest: any) => {
    if (onEditDraft) {
      onEditDraft(materialRequest);
    }
  };

  return (
    <div className="space-y-6">
      {/* Dashboard Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Requests"
          value={analytics.totalRequests.toString()}
          icon={FileText}
        />
        <MetricCard
          title="Pending Requests"
          value={analytics.pendingRequests.toString()}
          icon={Package}
        />
        <MetricCard
          title="Completed Requests"
          value={analytics.completedRequests.toString()}
          icon={CheckCircle}
        />
        <MetricCard
          title="Total Items"
          value={analytics.totalItems.toString()}
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
            <div className="text-center py-4 text-muted-foreground">Loading material requests...</div>
          ) : (
            <div className="space-y-4">
              {materialRequests.map((materialRequest) => (
                <div key={materialRequest.name} className="border border-border rounded-lg p-4 flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">{materialRequest.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {materialRequest.company} - {materialRequest.creation}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <StatusBadge status={materialRequest.status} />
                    <Button size="sm" onClick={() => handleSelectMaterialRequest(materialRequest)}>
                      View
                    </Button>
                  </div>
                </div>
              ))}
              {materialRequests.length === 0 && (
                <div className="text-center py-4 text-muted-foreground">
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              onClick={() => onCreateNew("Purchase")}
              variant="outline"
              className="h-16 flex flex-col items-center justify-center space-y-2 hover:bg-blue-50 hover:border-blue-200"
            >
              <Plus className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-medium">Purchase Request</span>
            </Button>
            <Button
              onClick={() => onCreateNew("Material Transfer")}
              variant="outline"
              className="h-16 flex flex-col items-center justify-center space-y-2 hover:bg-green-50 hover:border-green-200"
            >
              <Plus className="w-5 h-5 text-green-600" />
              <span className="text-sm font-medium">Transfer Request</span>
            </Button>
            <Button
              onClick={() => onCreateNew("Material Issue")}
              variant="outline"
              className="h-16 flex flex-col items-center justify-center space-y-2 hover:bg-red-50 hover:border-red-200"
            >
              <Plus className="w-5 h-5 text-red-600" />
              <span className="text-sm font-medium">Issue Request</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MaterialRequestDashboard;

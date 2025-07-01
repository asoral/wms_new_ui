import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, FileText, Package, CheckCircle, AlertTriangle } from "lucide-react";
import { MetricCard } from "@/components/ui/metric-card";
import { usePickListAPI } from "@/hooks/useERPNextAPI";
import { useToast } from "@/hooks/use-toast";
import { getUserDefaultCompany } from "@/services/erpnextApi";

interface PickListDashboardProps {
  onCreateNew: () => void;
  onSelectPickList: (pickList: any) => void;
}

interface DashboardAnalytics {
  totalPickLists: number;
  pendingPickLists: number;
  completedPickLists: number;
  totalItems: number;
}

const PickListDashboard = ({ onCreateNew, onSelectPickList }: PickListDashboardProps) => {
  const [pickLists, setPickLists] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<DashboardAnalytics>({
    totalPickLists: 0,
    pendingPickLists: 0,
    completedPickLists: 0,
    totalItems: 0
  });
  const { getPickLists, getPickListAnalytics, loading } = usePickListAPI();
  const { toast } = useToast();

  useEffect(() => {
    fetchPickLists();
  }, []);

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { variant: "default" | "destructive" | "outline" | "secondary", icon: any }> = {
      'Draft': { variant: 'secondary', icon: AlertTriangle },
      'Open': { variant: 'default', icon: Package },
      'Completed': { variant: 'outline', icon: CheckCircle },
    };
    
    const statusInfo = statusMap[status] || { variant: 'secondary', icon: AlertTriangle };
    const IconComponent = statusInfo.icon;
    
    return (
      <Button variant={statusInfo.variant} size="sm" className="gap-x-2">
        <IconComponent className="w-4 h-4" />
        {status}
      </Button>
    );
  };

  const fetchPickLists = async () => {
    try {
      const company = await getUserDefaultCompany();
      const response = await getPickLists(company ? [['company', '=', company]] : undefined);
      
      if (response && typeof response === 'object' && 'data' in response) {
        const pickListsData = (response as any).data;
        setPickLists(pickListsData);
        
        // Get analytics data
        const analyticsResponse = await getPickListAnalytics(company);
        if (analyticsResponse && typeof analyticsResponse === 'object' && 'data' in analyticsResponse) {
          const analyticsData = (analyticsResponse as any).data;
          setAnalytics({
            totalPickLists: pickListsData.length,
            pendingPickLists: pickListsData.filter((pl: any) => pl.status === 'Draft').length,
            completedPickLists: pickListsData.filter((pl: any) => pl.status === 'Completed').length,
            totalItems: analyticsData.total_items || 0
          });
        }
      }
    } catch (error) {
      console.error('Error fetching pick lists:', error);
      toast({
        title: "Error",
        description: "Failed to fetch pick lists",
        variant: "destructive"
      });
    }
  };

  const handleSelectPickList = (pickList: any) => {
    onSelectPickList(pickList);
  };

  return (
    <div className="space-y-6">
      {/* Dashboard Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Pick Lists"
          value={analytics.totalPickLists.toString()}
          icon={FileText}
        />
        <MetricCard
          title="Pending Pick Lists"
          value={analytics.pendingPickLists.toString()}
          icon={Package}
        />
        <MetricCard
          title="Completed Pick Lists"
          value={analytics.completedPickLists.toString()}
          icon={CheckCircle}
        />
         <MetricCard
          title="Total Items"
          value={analytics.totalItems.toString()}
          icon={AlertTriangle}
        />
      </div>

      {/* Pick Lists List */}
      <Card>
        <CardHeader>
          <CardTitle>Pick Lists</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-4">Loading pick lists...</div>
          ) : (
            <div className="space-y-4">
              {pickLists.map((pickList) => (
                <div key={pickList.name} className="border rounded-lg p-4 flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">{pickList.name}</h3>
                    <p className="text-sm text-gray-600">
                      {pickList.company} - {pickList.creation}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getStatusBadge(pickList.status)}
                    <Button size="sm" onClick={() => handleSelectPickList(pickList)}>
                      View
                    </Button>
                  </div>
                </div>
              ))}
              {pickLists.length === 0 && (
                <div className="text-center py-4 text-gray-500">
                  No pick lists found
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
              <span className="text-sm font-medium">Create New Pick List</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PickListDashboard;

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge"; 
import { Package, Plus, TrendingUp, Clock, CheckCircle } from "lucide-react";
import { MetricCard } from "@/components/ui/metric-card";
import { usePickListAPI } from "@/hooks/useERPNextAPI";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import MobilePickListCard from "./MobilePickListCard";

interface PickListDashboardProps {
  onCreateNew: () => void;
  onSelectPickList: (pickList: any) => void;
}

const PickListDashboard = ({ onCreateNew, onSelectPickList }: PickListDashboardProps) => {
  const [pickLists, setPickLists] = useState<any[]>([]);
  const [dashboardData, setDashboardData] = useState({
    draft: 0,
    open: 0,
    completed: 0,
    totalItems: 0
  });

  const { getPickLists, getPickListAnalytics, loading } = usePickListAPI();
  const { toast } = useToast();
  const isMobile = useIsMobile();

  useEffect(() => {
    fetchPickLists();
    fetchAnalytics();
  }, []);

  const fetchPickLists = async () => {
    try {
      const response = await getPickLists([
        ['docstatus', 'in', [0, 1]],
        ['status', '!=', 'Cancelled']
      ]);

      if (response?.data) {
        setPickLists(response.data);
        
        // Calculate metrics
        const draft = response.data.filter((pl: any) => pl.docstatus === 0).length;
        const open = response.data.filter((pl: any) => pl.status === 'Open').length;
        const completed = response.data.filter((pl: any) => pl.status === 'Completed').length;
        const totalItems = response.data.reduce((acc: number, pl: any) => acc + (pl.locations?.length || 0), 0);
        
        setDashboardData({ draft, open, completed, totalItems });
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

  const fetchAnalytics = async () => {
    try {
      await getPickListAnalytics();
    } catch (error) {
      console.error('Error fetching pick list analytics:', error);
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
          title="Draft Pick Lists"
          value={dashboardData.draft.toString()}
          icon={FileText}
        />
        <MetricCard
          title="Open Pick Lists"
          value={dashboardData.open.toString()}
          icon={Clock}
        />
        <MetricCard
          title="Completed Pick Lists"
          value={dashboardData.completed.toString()}
          icon={CheckCircle}
        />
        <MetricCard
          title="Total Items to Pick"
          value={dashboardData.totalItems.toString()}
          icon={Package}
        />
      </div>

      {/* Pick Lists */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Pick Lists</span>
            <Button onClick={fetchPickLists} variant="outline" size="sm">
              Refresh
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Clock className="w-6 h-6 animate-spin text-gray-400" />
              <span className="ml-2 text-gray-600">Loading pick lists...</span>
            </div>
          ) : (
            <>
              {isMobile ? (
                <div className="space-y-4">
                  {pickLists.map((pickList, index) => (
                    <MobilePickListCard
                      key={index}
                      pickList={pickList}
                      onSelect={handleSelectPickList}
                    />
                  ))}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">Pick List</th>
                        <th className="text-left py-2">Purpose</th>
                        <th className="text-left py-2">Status</th>
                        <th className="text-left py-2">Items</th>
                        <th className="text-left py-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pickLists.map((pickList, index) => (
                        <tr key={index} className="border-b hover:bg-gray-50">
                          <td className="py-3 font-medium text-blue-600">{pickList.name}</td>
                          <td className="py-3">{pickList.purpose}</td>
                          <td className="py-3">
                            <Badge variant="secondary">{pickList.status}</Badge>
                          </td>
                          <td className="py-3">{pickList.locations?.length || 0}</td>
                          <td className="py-3">
                            <Button
                              size="sm"
                              onClick={() => handleSelectPickList(pickList)}
                            >
                              Select
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {pickLists.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No pick lists found
                </div>
              )}
            </>
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

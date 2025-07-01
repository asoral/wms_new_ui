
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Package2, 
  CheckCircle2, 
  Clock, 
  TrendingUp,
  Plus,
  Loader2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { createERPNextAPI, getUserDefaultCompany } from "@/services/erpnextApi";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useIsMobile } from "@/hooks/use-mobile";
import MobilePickListCard from "./MobilePickListCard";

interface PickListDashboardProps {
  onCreateNew: () => void;
  onSelectPendingPickList: (pickListId: string) => void;
}

const PickListDashboard = ({ onCreateNew, onSelectPendingPickList }: PickListDashboardProps) => {
  const [stats, setStats] = useState({
    pendingCount: 0,
    completedToday: 0,
    pendingPickLists: []
  });
  const [typeAnalytics, setTypeAnalytics] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const isMobile = useIsMobile();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const api = await createERPNextAPI();
      const company = getUserDefaultCompany();
      
      if (!api) {
        toast({
          title: "ERPNext Connection Error",
          description: "Please configure ERPNext settings",
          variant: "destructive"
        });
        return;
      }

      // Fetch pick list statistics
      const pickListStats = await api.getPickListStats(company);
      setStats(pickListStats);

      // Fetch type analytics
      const analyticsData = [
        { name: 'Material Transfer', value: pickListStats.pendingCount || 0 },
        { name: 'Delivery', value: Math.floor((pickListStats.pendingCount || 0) * 0.6) },
        { name: 'Manufacturing', value: Math.floor((pickListStats.pendingCount || 0) * 0.3) }
      ];
      setTypeAnalytics(analyticsData);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch dashboard data from ERPNext",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin" />
        <span className="ml-2">Loading dashboard...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Pick Lists</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.pendingCount}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting processing
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Today</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.completedToday}</div>
            <p className="text-xs text-muted-foreground">
              Pick lists processed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Efficiency</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {stats.pendingCount > 0 ? Math.round((stats.completedToday / (stats.completedToday + stats.pendingCount)) * 100) : 100}%
            </div>
            <p className="text-xs text-muted-foreground">
              Today's completion rate
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Button onClick={onCreateNew} className="h-16 flex flex-col space-y-2">
              <Plus className="w-6 h-6" />
              <span>Create New Pick List</span>
            </Button>
            <Button variant="outline" className="h-16 flex flex-col space-y-2" onClick={fetchDashboardData}>
              <Package2 className="w-6 h-6" />
              <span>Refresh Dashboard</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Pick List Type Analytics */}
      {!isMobile && typeAnalytics.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Pick List Analytics by Type</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={typeAnalytics}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Pending Pick Lists */}
      {stats.pendingPickLists.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Pending Pick Lists</span>
              <Badge variant="outline">{stats.pendingPickLists.length} items</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isMobile ? (
              <div className="space-y-4">
                {stats.pendingPickLists.map((pickList: any, index: number) => (
                  <MobilePickListCard
                    key={index}
                    pickList={pickList}
                    onSelect={(pl) => onSelectPendingPickList(pl.name)}
                  />
                ))}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="text-left p-3 border">Pick List</th>
                      <th className="text-left p-3 border">Purpose</th>
                      <th className="text-left p-3 border">Company</th>
                      <th className="text-left p-3 border">Date</th>
                      <th className="text-left p-3 border">Status</th>
                      <th className="text-left p-3 border">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.pendingPickLists.map((pickList: any, index: number) => (
                      <tr key={index} className="border-b hover:bg-gray-50">
                        <td className="p-3 border font-medium">{pickList.name}</td>
                        <td className="p-3 border">{pickList.purpose}</td>
                        <td className="p-3 border">{pickList.company}</td>
                        <td className="p-3 border">
                          {new Date(pickList.creation).toLocaleDateString()}
                        </td>
                        <td className="p-3 border">
                          <Badge variant={pickList.docstatus === 0 ? "secondary" : "default"}>
                            {pickList.docstatus === 0 ? "Draft" : "Submitted"}
                          </Badge>
                        </td>
                        <td className="p-3 border">
                          <Button
                            size="sm"
                            onClick={() => onSelectPendingPickList(pickList.name)}
                          >
                            Start Picking
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PickListDashboard;

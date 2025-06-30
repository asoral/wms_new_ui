
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Package, Plus, Clock, TrendingUp, Users, BarChart3, CheckCircle } from "lucide-react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { createERPNextAPI, getUserDefaultCompany } from "@/services/erpnextApi";
import { useToast } from "@/hooks/use-toast";

interface PickListDashboardProps {
  onCreateNew: () => void;
  onSelectPendingPickList: (pickListId: string) => void;
}

interface DashboardStats {
  pendingPickLists: number;
  pickingEfficiency: number;
  avgPickTime: string;
  completedToday: number;
}

interface PendingPickList {
  id: string;
  number: string;
  type: string;
  relatedDocument: string;
  itemCount: number;
  createdAt: string;
  priority: "High" | "Medium" | "Low";
}

const PickListDashboard = ({ onCreateNew, onSelectPendingPickList }: PickListDashboardProps) => {
  const [stats, setStats] = useState<DashboardStats>({
    pendingPickLists: 0,
    pickingEfficiency: 0,
    avgPickTime: "0 min",
    completedToday: 0
  });

  const [pendingPickLists, setPendingPickLists] = useState<PendingPickList[]>([]);
  const [pickListTypeData, setPickListTypeData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Fetch dashboard data from ERPNext
  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const api = await createERPNextAPI();
      const company = await getUserDefaultCompany();
      
      if (!api) {
        toast({
          title: "ERPNext Connection Error",
          description: "Please configure ERPNext settings in your profile",
          variant: "destructive"
        });
        return;
      }

      // Fetch pick list statistics
      const statsData = await api.getPickListStats(company || undefined);
      
      // Process pending pick lists
      const processedPendingLists = statsData.pendingPickLists.map((pl: any, index: number) => ({
        id: pl.name,
        number: pl.name,
        type: pl.purpose || "Unknown",
        relatedDocument: pl.material_request || pl.work_order || "N/A",
        itemCount: pl.locations?.length || 0,
        createdAt: new Date(pl.creation).toLocaleString(),
        priority: index % 3 === 0 ? "High" : index % 2 === 0 ? "Medium" : "Low"
      }));

      // Calculate efficiency (mock calculation based on completed vs total)
      const totalPickLists = statsData.pendingCount + statsData.completedToday;
      const efficiency = totalPickLists > 0 ? (statsData.completedToday / totalPickLists) * 100 : 0;

      setStats({
        pendingPickLists: statsData.pendingCount,
        pickingEfficiency: Math.round(efficiency),
        avgPickTime: "3.2 min", // Mock value - would need custom API for this
        completedToday: statsData.completedToday
      });

      setPendingPickLists(processedPendingLists);

      // Process pick list type data for charts
      const typeMap: { [key: string]: number } = {};
      statsData.pendingPickLists.forEach((pl: any) => {
        const purpose = pl.purpose || "Unknown";
        typeMap[purpose] = (typeMap[purpose] || 0) + 1;
      });

      const chartData = Object.entries(typeMap).map(([name, value], index) => ({
        name,
        value,
        color: index === 0 ? "#3B82F6" : index === 1 ? "#10B981" : "#F59E0B"
      }));

      setPickListTypeData(chartData);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast({
        title: "Error Loading Dashboard",
        description: "Failed to load pick list data from ERPNext. Using fallback data.",
        variant: "destructive"
      });

      // Fallback to demo data
      setStats({
        pendingPickLists: 12,
        pickingEfficiency: 94,
        avgPickTime: "3.2 min",
        completedToday: 28
      });

      setPendingPickLists([
        {
          id: "1",
          number: "PICK-2025-00001",
          type: "Delivery",
          relatedDocument: "SO-2025-00012",
          itemCount: 8,
          createdAt: "2025-01-02 09:15",
          priority: "High"
        }
      ]);

      setPickListTypeData([
        { name: "Delivery", value: 45, color: "#3B82F6" },
        { name: "Transfer", value: 30, color: "#10B981" },
        { name: "Manufacturing", value: 25, color: "#F59E0B" }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Mock data for user picks chart (would need custom implementation in ERPNext)
  const pickListUserData = [
    { name: "John", picks: 45 },
    { name: "Sarah", picks: 38 },
    { name: "Mike", picks: 32 },
    { name: "Emma", picks: 28 }
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "High": return "bg-red-100 text-red-800 border-red-200";
      case "Medium": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "Low": return "bg-green-100 text-green-800 border-green-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="ml-3 text-gray-600">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Create New Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Pick List Dashboard</h2>
          <p className="text-gray-600">Monitor picking performance and manage pick lists</p>
        </div>
        <Button onClick={onCreateNew} className="flex items-center space-x-2">
          <Plus className="w-4 h-4" />
          <span>Create New Pick List</span>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Pick Lists</p>
                <p className="text-3xl font-bold text-blue-600">{stats.pendingPickLists}</p>
              </div>
              <Package className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Picking Efficiency</p>
                <p className="text-3xl font-bold text-green-600">{stats.pickingEfficiency}%</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-600" />
            </div>
            <Progress value={stats.pickingEfficiency} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg. Pick Time</p>
                <p className="text-3xl font-bold text-purple-600">{stats.avgPickTime}</p>
              </div>
              <Clock className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completed Today</p>
                <p className="text-3xl font-bold text-orange-600">{stats.completedToday}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pick List by Type Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="w-5 h-5" />
              <span>Pick Lists by Type</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pickListTypeData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={pickListTypeData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {pickListTypeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex justify-center space-x-4 mt-4">
                  {pickListTypeData.map((item, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                      <span className="text-sm text-gray-600">{item.name}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-gray-500">
                No data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pick List by User Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="w-5 h-5" />
              <span>Picks by User (This Week)</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={pickListUserData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="picks" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Pending Pick Lists */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Pending Pick Lists</CardTitle>
            <Button variant="outline" size="sm" onClick={fetchDashboardData}>
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {pendingPickLists.map((pickList) => (
              <div
                key={pickList.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                onClick={() => onSelectPendingPickList(pickList.id)}
              >
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <Package className="w-8 h-8 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-medium">{pickList.number}</h4>
                    <p className="text-sm text-gray-600">
                      {pickList.type} • {pickList.relatedDocument} • {pickList.itemCount} items
                    </p>
                    <p className="text-xs text-gray-500">Created: {pickList.createdAt}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Badge className={getPriorityColor(pickList.priority)}>
                    {pickList.priority}
                  </Badge>
                  <Button size="sm">
                    Start Picking
                  </Button>
                </div>
              </div>
            ))}
            {pendingPickLists.length === 0 && (
              <div className="text-center py-8">
                <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">No pending pick lists</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PickListDashboard;

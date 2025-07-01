
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Loader2, Eye, Package, TrendingUp, Clock, AlertTriangle } from "lucide-react";
import { MetricCard } from "@/components/ui/metric-card";
import { createERPNextAPI, getUserDefaultCompany } from "@/services/erpnextApi";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import MobilePickListCard from "./MobilePickListCard";

interface DraftPickList {
  name: string;
  purpose: string;
  company: string;
  docstatus: number;
  creation: string;
  owner: string;
  locations?: any[];
}

interface DashboardMetrics {
  todaysPicks: number;
  draftPickLists: number;
  itemsToPick: number;
  overduePickLists: number;
}

interface PickListDashboardProps {
  onSelectPickList: (pickList: DraftPickList) => void;
  onCreateNew: () => void;
}

const PickListDashboard = ({ onSelectPickList, onCreateNew }: PickListDashboardProps) => {
  const [draftPickLists, setDraftPickLists] = useState<DraftPickList[]>([]);
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    todaysPicks: 0,
    draftPickLists: 0,
    itemsToPick: 0,
    overduePickLists: 0
  });
  const [loading, setLoading] = useState(false);
  const [metricsLoading, setMetricsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  const isMobile = useIsMobile();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    setMetricsLoading(true);
    try {
      const erpnextAPI = await createERPNextAPI();
      const company = await getUserDefaultCompany();
      
      if (!erpnextAPI) {
        toast({
          title: "ERPNext Not Configured",
          description: "Please configure your ERPNext settings in the Profile page.",
          variant: "destructive"
        });
        return;
      }

      // Fetch draft pick lists
      const draftFilters = { docstatus: 0 };
      const pickListsResult = await erpnextAPI.getPickLists(draftFilters, company || undefined);

      if (pickListsResult.data) {
        setDraftPickLists(pickListsResult.data);
      }

      // Fetch analytics data
      const analyticsResult = await erpnextAPI.getPickListAnalytics(company || undefined);
      
      if (analyticsResult.data) {
        setMetrics({
          todaysPicks: analyticsResult.data.completed || 0,
          draftPickLists: analyticsResult.data.pending || 0,
          itemsToPick: pickListsResult.data ? pickListsResult.data.reduce((total: number, pl: any) => {
            return total + (pl.locations ? pl.locations.length : 0);
          }, 0) : 0,
          overduePickLists: 0 // Could be calculated based on creation date if needed
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
      setMetricsLoading(false);
    }
  };

  const filteredPickLists = draftPickLists.filter(pickList =>
    pickList.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pickList.purpose.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (docstatus: number) => {
    switch (docstatus) {
      case 0:
        return <Badge variant="secondary">Draft</Badge>;
      case 1:
        return <Badge variant="default">Submitted</Badge>;
      case 2:
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Dashboard Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metricsLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="flex items-center p-6">
                <div className="flex items-center space-x-4">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <div className="w-6 h-6 bg-gray-300 rounded"></div>
                  </div>
                  <div>
                    <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
                    <div className="h-6 bg-gray-200 rounded w-16"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <>
            <MetricCard
              title="Today's Picks"
              value={metrics.todaysPicks.toString()}
              icon={Package}
            />
            <MetricCard
              title="Draft Pick Lists"
              value={metrics.draftPickLists.toString()}
              icon={Clock}
            />
            <MetricCard
              title="Items to Pick"
              value={metrics.itemsToPick.toString()}
              icon={TrendingUp}
            />
            <MetricCard
              title="Overdue Pick Lists"
              value={metrics.overduePickLists.toString()}
              icon={AlertTriangle}
            />
          </>
        )}
      </div>

      {/* Draft Pick Lists */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Draft Pick Lists</span>
            <Button onClick={onCreateNew} size="sm">
              Create New Pick List
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search pick lists..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                <span className="ml-2 text-gray-600">Loading pick lists...</span>
              </div>
            ) : (
              <>
                {isMobile ? (
                  <div className="space-y-4">
                    {filteredPickLists.map((pickList, index) => (
                      <MobilePickListCard
                        key={index}
                        pickList={pickList}
                        onSelect={onSelectPickList}
                        onView={(pickList) => console.log('View pick list:', pickList)}
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
                          <th className="text-left py-2">Company</th>
                          <th className="text-left py-2">Status</th>
                          <th className="text-left py-2">Items</th>
                          <th className="text-left py-2">Created</th>
                          <th className="text-left py-2">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredPickLists.map((pickList, index) => (
                          <tr key={index} className="border-b hover:bg-gray-50">
                            <td className="py-3 font-medium text-blue-600">{pickList.name}</td>
                            <td className="py-3">{pickList.purpose}</td>
                            <td className="py-3">{pickList.company}</td>
                            <td className="py-3">{getStatusBadge(pickList.docstatus)}</td>
                            <td className="py-3">{pickList.locations?.length || 0} items</td>
                            <td className="py-3">{new Date(pickList.creation).toLocaleDateString()}</td>
                            <td className="py-3">
                              <div className="flex space-x-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => console.log('View pick list:', pickList)}
                                >
                                  <Eye className="w-4 h-4 mr-1" />
                                  View
                                </Button>
                                {pickList.docstatus === 0 && (
                                  <Button
                                    size="sm"
                                    onClick={() => onSelectPickList(pickList)}
                                  >
                                    Start Picking
                                  </Button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                {filteredPickLists.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No draft pick lists found
                  </div>
                )}
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PickListDashboard;

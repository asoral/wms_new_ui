
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  TrendingUp, 
  Package, 
  AlertTriangle,
  Plus,
  Eye
} from "lucide-react";

interface QualityDashboardProps {
  onViewList: () => void;
  onCreateNew: () => void;
}

// Mock dashboard data
const dashboardStats = {
  qcWaiting: 12,
  qcFailed: 3,
  qcCompleted: 145,
  qcTesting: 8,
  successRate: 92.5,
  mostTestedItem: "Steel Rod 10mm",
  mostRejectedItem: "Chemical B",
};

const recentActivities = [
  { id: 1, action: "QC Passed", item: "Steel Rod 10mm", batch: "B001", time: "2 hours ago" },
  { id: 2, action: "QC Failed", item: "Chemical B", batch: "B002", time: "3 hours ago" },
  { id: 3, action: "QC Started", item: "Raw Material A", batch: "B003", time: "4 hours ago" },
  { id: 4, action: "QC Passed", item: "Finished Product X", batch: "B004", time: "5 hours ago" },
];

const QualityDashboard = ({ onViewList, onCreateNew }: QualityDashboardProps) => {
  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={onViewList}>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-orange-500" />
              <div>
                <p className="text-sm font-medium text-gray-600">QC Waiting</p>
                <p className="text-2xl font-bold text-orange-600">{dashboardStats.qcWaiting}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={onViewList}>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <XCircle className="w-5 h-5 text-red-500" />
              <div>
                <p className="text-sm font-medium text-gray-600">Failed</p>
                <p className="text-2xl font-bold text-red-600">{dashboardStats.qcFailed}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={onViewList}>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-green-600">{dashboardStats.qcCompleted}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={onViewList}>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Package className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-sm font-medium text-gray-600">Testing</p>
                <p className="text-2xl font-bold text-blue-600">{dashboardStats.qcTesting}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quality Statistics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5" />
              <span>Quality Statistics</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
              <span className="font-medium">QC Success Rate</span>
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                {dashboardStats.successRate}%
              </Badge>
            </div>
            
            <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
              <span className="font-medium">Most Tested Item</span>
              <span className="text-sm font-medium">{dashboardStats.mostTestedItem}</span>
            </div>
            
            <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
              <span className="font-medium">Most Rejected Item</span>
              <span className="text-sm font-medium text-red-700">{dashboardStats.mostRejectedItem}</span>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activities */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded">
                  {activity.action === "QC Passed" && <CheckCircle className="w-4 h-4 text-green-500" />}
                  {activity.action === "QC Failed" && <XCircle className="w-4 h-4 text-red-500" />}
                  {activity.action === "QC Started" && <Clock className="w-4 h-4 text-blue-500" />}
                  
                  <div className="flex-1">
                    <p className="text-sm font-medium">{activity.action}</p>
                    <p className="text-xs text-gray-600">
                      {activity.item} - Batch: {activity.batch}
                    </p>
                  </div>
                  
                  <span className="text-xs text-gray-500">{activity.time}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button onClick={onCreateNew} className="h-20 flex flex-col space-y-2">
              <Plus className="w-6 h-6" />
              <span className="text-sm">New Inspection</span>
            </Button>
            
            <Button variant="outline" onClick={onViewList} className="h-20 flex flex-col space-y-2">
              <Eye className="w-6 h-6" />
              <span className="text-sm">View All</span>
            </Button>
            
            <Button variant="outline" className="h-20 flex flex-col space-y-2">
              <AlertTriangle className="w-6 h-6" />
              <span className="text-sm">Failed Items</span>
            </Button>
            
            <Button variant="outline" className="h-20 flex flex-col space-y-2">
              <Clock className="w-6 h-6" />
              <span className="text-sm">Pending QC</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default QualityDashboard;

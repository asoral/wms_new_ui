
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TestTube, CheckCircle, XCircle, Clock, BarChart3, Plus, Eye } from "lucide-react";

interface QualityDashboardProps {
  data: {
    qcWaiting: number;
    qcFailed: number;
    qcCompleted: number;
    qcTesting: number;
    successRate: number;
    mostTestedItem: string;
    mostRejectedItem: string;
  };
  onViewInspections: () => void;
  onCreateInspection: () => void;
}

const QualityDashboard = ({ data, onViewInspections, onCreateInspection }: QualityDashboardProps) => {
  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-yellow-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">QC Waiting</p>
                <p className="text-2xl font-bold text-yellow-600">{data.qcWaiting}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">QC Failed</p>
                <p className="text-2xl font-bold text-red-600">{data.qcFailed}</p>
              </div>
              <XCircle className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">QC Completed</p>
                <p className="text-2xl font-bold text-green-600">{data.qcCompleted}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">QC Testing</p>
                <p className="text-2xl font-bold text-blue-600">{data.qcTesting}</p>
              </div>
              <TestTube className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Success Rate */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="w-5 h-5" />
            <span>Quality Metrics</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-3xl font-bold text-green-600">{data.successRate}%</div>
              <div className="text-sm text-gray-600">Success Rate</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-lg font-medium text-blue-600">{data.mostTestedItem}</div>
              <div className="text-sm text-gray-600">Most Tested Item</div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-lg font-medium text-red-600">{data.mostRejectedItem}</div>
              <div className="text-sm text-gray-600">Most Rejected Item</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Button onClick={onCreateInspection} className="flex items-center justify-center space-x-2">
              <Plus className="w-4 h-4" />
              <span>Create Inspection</span>
            </Button>
            <Button variant="outline" onClick={onViewInspections} className="flex items-center justify-center space-x-2">
              <Eye className="w-4 h-4" />
              <span>View All Inspections</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default QualityDashboard;

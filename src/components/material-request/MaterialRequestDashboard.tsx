
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  FileText, 
  Plus, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  TrendingUp,
  Package
} from "lucide-react";

interface MaterialRequestDashboardProps {
  onCreateNew: (purpose: string) => void;
  onViewList: () => void;
}

const MaterialRequestDashboard = ({ onCreateNew, onViewList }: MaterialRequestDashboardProps) => {
  // Mock statistics - in real app, fetch from ERPNext
  const stats = {
    draft: 5,
    submitted: 12,
    partiallyOrdered: 3,
    ordered: 8,
    cancelled: 2
  };

  const recentRequests = [
    {
      name: "MAT-REQ-2024-001",
      purpose: "Purchase",
      status: "Draft",
      requestedBy: "John Doe",
      date: "2024-01-15"
    },
    {
      name: "MAT-REQ-2024-002", 
      purpose: "Material Transfer",
      status: "Submitted",
      requestedBy: "Jane Smith",
      date: "2024-01-14"
    },
    {
      name: "MAT-REQ-2024-003",
      purpose: "Material Issue",
      status: "Partially Ordered",
      requestedBy: "Mike Johnson",
      date: "2024-01-13"
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Draft": return "bg-gray-100 text-gray-800";
      case "Submitted": return "bg-blue-100 text-blue-800";
      case "Partially Ordered": return "bg-yellow-100 text-yellow-800";
      case "Ordered": return "bg-green-100 text-green-800";
      case "Cancelled": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <FileText className="w-6 h-6 text-gray-600 mx-auto mb-2" />
            <div className="text-2xl font-bold">{stats.draft}</div>
            <div className="text-sm text-gray-600">Draft</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <Clock className="w-6 h-6 text-blue-600 mx-auto mb-2" />
            <div className="text-2xl font-bold">{stats.submitted}</div>
            <div className="text-sm text-gray-600">Submitted</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <AlertCircle className="w-6 h-6 text-yellow-600 mx-auto mb-2" />
            <div className="text-2xl font-bold">{stats.partiallyOrdered}</div>
            <div className="text-sm text-gray-600">Partially Ordered</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <CheckCircle className="w-6 h-6 text-green-600 mx-auto mb-2" />
            <div className="text-2xl font-bold">{stats.ordered}</div>
            <div className="text-sm text-gray-600">Ordered</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <XCircle className="w-6 h-6 text-red-600 mx-auto mb-2" />
            <div className="text-2xl font-bold">{stats.cancelled}</div>
            <div className="text-sm text-gray-600">Cancelled</div>
          </CardContent>
        </Card>
      </div>

      {/* Create New Material Request */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Plus className="w-5 h-5" />
            <span>Create Material Request</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button 
              className="h-20 flex-col space-y-2"
              variant="outline"
              onClick={() => onCreateNew("Purchase")}
            >
              <Package className="w-6 h-6" />
              <span>Purchase Request</span>
            </Button>
            
            <Button 
              className="h-20 flex-col space-y-2"
              variant="outline"
              onClick={() => onCreateNew("Material Transfer")}
            >
              <TrendingUp className="w-6 h-6" />
              <span>Material Transfer</span>
            </Button>
            
            <Button 
              className="h-20 flex-col space-y-2"
              variant="outline"
              onClick={() => onCreateNew("Material Issue")}
            >
              <FileText className="w-6 h-6" />
              <span>Material Issue</span>
            </Button>
            
            <Button 
              className="h-20 flex-col space-y-2"
              variant="outline"
              onClick={() => onCreateNew("Manufacture")}
            >
              <CheckCircle className="w-6 h-6" />
              <span>Manufacturing</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Requests */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Material Requests</CardTitle>
          <Button variant="outline" size="sm" onClick={onViewList}>
            View All
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentRequests.map((request) => (
              <div key={request.name} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <FileText className="w-4 h-4 text-blue-600" />
                  <div>
                    <div className="font-medium">{request.name}</div>
                    <div className="text-sm text-gray-500">{request.purpose} • {request.requestedBy}</div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge className={getStatusColor(request.status)}>
                    {request.status}
                  </Badge>
                  <span className="text-sm text-gray-500">{request.date}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MaterialRequestDashboard;

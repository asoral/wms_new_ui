
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Plus, Eye, Clock, CheckCircle, AlertCircle } from "lucide-react";
import MaterialRequestForm from "../components/material-request/MaterialRequestForm";
import MaterialRequestList from "../components/material-request/MaterialRequestList";

export interface MaterialRequestItem {
  itemCode: string;
  itemName: string;
  requestedQty: number;
  availableQty: number;
  uom: string;
  warehouse: string;
  purpose: string;
}

export interface MaterialRequest {
  id: string;
  requestNumber: string;
  department: string;
  requestedBy: string;
  date: string;
  status: 'draft' | 'pending' | 'approved' | 'rejected' | 'completed';
  items: MaterialRequestItem[];
  remarks?: string;
}

const MaterialRequest = () => {
  const [activeTab, setActiveTab] = useState("list");
  const [selectedRequest, setSelectedRequest] = useState<MaterialRequest | null>(null);
  const [materialRequests, setMaterialRequests] = useState<MaterialRequest[]>([
    {
      id: '1',
      requestNumber: 'MR-2024-001',
      department: 'Production',
      requestedBy: 'John Doe',
      date: '2024-01-15',
      status: 'pending',
      items: [
        {
          itemCode: 'ITM-001',
          itemName: 'Raw Material A',
          requestedQty: 100,
          availableQty: 150,
          uom: 'Kg',
          warehouse: 'Main Store',
          purpose: 'Production Order PO-001'
        }
      ]
    }
  ]);

  const handleCreateRequest = (request: MaterialRequest) => {
    const newRequest = {
      ...request,
      id: Date.now().toString(),
      requestNumber: `MR-2024-${String(materialRequests.length + 1).padStart(3, '0')}`,
      date: new Date().toISOString().split('T')[0],
      status: 'pending' as const
    };
    
    setMaterialRequests(prev => [newRequest, ...prev]);
    setActiveTab("list");
  };

  const handleViewDetails = (request: MaterialRequest) => {
    setSelectedRequest(request);
    setActiveTab("view");
  };

  const pendingCount = materialRequests.filter(req => req.status === 'pending').length;
  const draftCount = materialRequests.filter(req => req.status === 'draft').length;

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
          <div className="flex items-center space-x-3">
            <FileText className="w-6 h-6 text-teal-600" />
            <h1 className="text-2xl font-bold text-gray-900">Material Request</h1>
          </div>
          <Button onClick={() => setActiveTab("create")}>
            <Plus className="w-4 h-4 mr-2" />
            New Request
          </Button>
        </div>

        {/* Dashboard Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Clock className="w-5 h-5 text-orange-500" />
                <div>
                  <p className="text-sm text-gray-600">Pending Requests</p>
                  <p className="text-xl font-bold text-orange-600">{pendingCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-blue-500" />
                <div>
                  <p className="text-sm text-gray-600">Draft Requests</p>
                  <p className="text-xl font-bold text-blue-600">{draftCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <div>
                  <p className="text-sm text-gray-600">Approved Today</p>
                  <p className="text-xl font-bold text-green-600">5</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-5 h-5 text-red-500" />
                <div>
                  <p className="text-sm text-gray-600">Urgent Requests</p>
                  <p className="text-xl font-bold text-red-600">2</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="list">Requests</TabsTrigger>
            <TabsTrigger value="create">Create New</TabsTrigger>
            <TabsTrigger value="view" disabled={!selectedRequest}>View Details</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>

          <TabsContent value="list">
            <MaterialRequestList 
              requests={materialRequests}
              onViewDetails={handleViewDetails}
            />
          </TabsContent>

          <TabsContent value="create">
            <Card>
              <CardHeader>
                <CardTitle>Create Material Request</CardTitle>
              </CardHeader>
              <CardContent>
                <MaterialRequestForm onSubmit={handleCreateRequest} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="view">
            {selectedRequest && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    Material Request Details
                    <Badge variant={
                      selectedRequest.status === 'approved' ? 'default' :
                      selectedRequest.status === 'pending' ? 'secondary' :
                      selectedRequest.status === 'rejected' ? 'destructive' : 'outline'
                    }>
                      {selectedRequest.status}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Request Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Request Number</p>
                        <p className="font-medium">{selectedRequest.requestNumber}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Department</p>
                        <p className="font-medium">{selectedRequest.department}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Requested By</p>
                        <p className="font-medium">{selectedRequest.requestedBy}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Date</p>
                        <p className="font-medium">{selectedRequest.date}</p>
                      </div>
                    </div>

                    {/* Items */}
                    <div>
                      <h3 className="text-lg font-medium mb-4">Requested Items</h3>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left p-2">Item Code</th>
                              <th className="text-left p-2">Item Name</th>
                              <th className="text-left p-2">Requested Qty</th>
                              <th className="text-left p-2">Available Qty</th>
                              <th className="text-left p-2">UOM</th>
                              <th className="text-left p-2">Purpose</th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedRequest.items.map((item, index) => (
                              <tr key={index} className="border-b">
                                <td className="p-2">{item.itemCode}</td>
                                <td className="p-2">{item.itemName}</td>
                                <td className="p-2">{item.requestedQty}</td>
                                <td className="p-2">{item.availableQty}</td>
                                <td className="p-2">{item.uom}</td>
                                <td className="p-2">{item.purpose}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {selectedRequest.remarks && (
                      <div>
                        <h3 className="text-lg font-medium mb-2">Remarks</h3>
                        <p className="text-gray-700 bg-gray-50 p-3 rounded">{selectedRequest.remarks}</p>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button variant="outline" onClick={() => setActiveTab("list")}>
                        Back to List
                      </Button>
                      {selectedRequest.status === 'pending' && (
                        <>
                          <Button variant="default">Approve</Button>
                          <Button variant="destructive">Reject</Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="reports">
            <Card>
              <CardHeader>
                <CardTitle>Material Request Reports</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Reports functionality coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default MaterialRequest;

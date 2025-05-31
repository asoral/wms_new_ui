
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, Search, Plus } from "lucide-react";
import { MaterialRequest, MaterialRequestPurpose, MaterialRequestStatus } from "../../pages/MaterialRequest";

interface MaterialRequestListProps {
  onCreateNew: (purpose: MaterialRequestPurpose) => void;
}

const MaterialRequestList = ({ onCreateNew }: MaterialRequestListProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});

  const purposes: MaterialRequestPurpose[] = ["Purchase", "Material Transfer", "Material Issue", "Manufacture", "Customer Provided"];
  
  const statuses: MaterialRequestStatus[] = ["Draft", "Submitted", "Stopped", "Cancelled", "Pending", "Partially Ordered", "Partially Received", "Ordered", "Issued", "Transferred", "Received"];

  const mockRequests: MaterialRequest[] = [
    {
      id: "1",
      number: "MR-2024-001",
      purpose: "Purchase",
      status: "Draft",
      createdDate: "2024-01-15",
      requestedBy: "John Doe",
      items: [],
      totalValue: 125000
    },
    {
      id: "2",
      number: "MR-2024-002",
      purpose: "Material Transfer",
      status: "Submitted",
      createdDate: "2024-01-14",
      requestedBy: "Jane Smith",
      items: [],
      totalValue: 89000
    }
  ];

  const filteredRequests = mockRequests.filter(request =>
    request.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    request.requestedBy.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: MaterialRequestStatus) => {
    const colors: Record<MaterialRequestStatus, string> = {
      "Draft": "bg-gray-100 text-gray-800",
      "Submitted": "bg-blue-100 text-blue-800",
      "Stopped": "bg-red-100 text-red-800",
      "Cancelled": "bg-red-100 text-red-800",
      "Pending": "bg-yellow-100 text-yellow-800",
      "Partially Ordered": "bg-orange-100 text-orange-800",
      "Partially Received": "bg-purple-100 text-purple-800",
      "Ordered": "bg-green-100 text-green-800",
      "Issued": "bg-green-100 text-green-800",
      "Transferred": "bg-green-100 text-green-800",
      "Received": "bg-green-100 text-green-800"
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const toggleSection = (section: string) => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const getRequestsByPurposeAndStatus = (purpose: MaterialRequestPurpose, status: MaterialRequestStatus) => {
    return filteredRequests.filter(request => request.purpose === purpose && request.status === status);
  };

  return (
    <div className="space-y-6">
      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Search className="w-5 h-5" />
            <span>Search Material Requests</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Enter material request number or requester name..."
          />
        </CardContent>
      </Card>

      {/* Quick Create Buttons */}
      <Card>
        <CardHeader>
          <CardTitle>Create New Material Request</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {purposes.map((purpose) => (
              <Button
                key={purpose}
                variant="outline"
                onClick={() => onCreateNew(purpose)}
                className="h-20 flex-col"
              >
                <Plus className="w-5 h-5 mb-2" />
                {purpose}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Material Requests by Purpose */}
      <div className="space-y-4">
        {purposes.map((purpose) => (
          <Card key={purpose}>
            <Collapsible
              open={openSections[purpose]}
              onOpenChange={() => toggleSection(purpose)}
            >
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-gray-50">
                  <CardTitle className="flex items-center justify-between">
                    <span>{purpose}</span>
                    <div className="flex items-center space-x-2">
                      <Badge variant="secondary">
                        {filteredRequests.filter(r => r.purpose === purpose).length}
                      </Badge>
                      <ChevronDown className={`w-4 h-4 transition-transform ${openSections[purpose] ? 'rotate-180' : ''}`} />
                    </div>
                  </CardTitle>
                </CardHeader>
              </CollapsibleTrigger>
              
              <CollapsibleContent>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    {statuses.map((status) => {
                      const requests = getRequestsByPurposeAndStatus(purpose, status);
                      if (requests.length === 0) return null;

                      return (
                        <Collapsible key={status}>
                          <CollapsibleTrigger asChild>
                            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
                              <div className="flex items-center space-x-2">
                                <Badge className={getStatusColor(status)}>
                                  {status}
                                </Badge>
                                <span className="text-sm font-medium">{requests.length} requests</span>
                              </div>
                              <ChevronDown className="w-4 h-4" />
                            </div>
                          </CollapsibleTrigger>
                          
                          <CollapsibleContent>
                            <div className="mt-2 space-y-2">
                              {requests.map((request) => (
                                <div key={request.id} className="p-3 bg-white border rounded-lg">
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <h4 className="font-medium">{request.number}</h4>
                                      <p className="text-sm text-gray-600">Requested by: {request.requestedBy}</p>
                                      <p className="text-sm text-gray-600">Date: {new Date(request.createdDate).toLocaleDateString()}</p>
                                    </div>
                                    <div className="text-right">
                                      {request.totalValue && (
                                        <p className="font-semibold">₹{request.totalValue.toLocaleString()}</p>
                                      )}
                                      <Button size="sm" variant="outline">
                                        View Details
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      );
                    })}
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Collapsible>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default MaterialRequestList;

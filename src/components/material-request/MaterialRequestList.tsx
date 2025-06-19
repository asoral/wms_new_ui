
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Plus, 
  Search, 
  Filter, 
  MoreHorizontal,
  FileText,
  Eye,
  Edit,
  Trash2
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MaterialRequest, MaterialRequestPurpose, MaterialRequestStatus } from "@/pages/MaterialRequest";

interface MaterialRequestListProps {
  onCreateNew: (purpose: MaterialRequestPurpose) => void;
  onEditRequest: (request: MaterialRequest) => void;
  onBackToDashboard: () => void;
}

const MaterialRequestList = ({ onCreateNew, onEditRequest, onBackToDashboard }: MaterialRequestListProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [purposeFilter, setPurposeFilter] = useState<string>("all");

  // Mock data - using correct property names from MaterialRequest interface
  const mockRequests: MaterialRequest[] = [
    {
      id: "1",
      name: "MAT-REQ-2024-001",
      purpose: "Purchase",
      status: "Draft",
      transactionDate: "2024-01-15",
      requestedBy: "John Doe",
      company: "Test Company",
      priority: "Medium",
      items: [
        {
          itemCode: "ITM-001",
          itemName: "Steel Rod 12mm",
          qty: 100,
          uom: "Nos",
          rate: 50
        }
      ],
      totalValue: 5000
    },
    {
      id: "2",
      name: "MAT-REQ-2024-002",
      purpose: "Material Transfer",
      status: "Submitted",
      transactionDate: "2024-01-14",
      requestedBy: "Jane Smith",
      company: "Test Company",
      priority: "High",
      items: [
        {
          itemCode: "ITM-002",
          itemName: "Cement 50kg",
          qty: 50,
          uom: "Bags",
          fromWarehouse: "Main Store",
          toWarehouse: "Site Store"
        }
      ]
    }
  ];

  const getStatusColor = (status: MaterialRequestStatus) => {
    switch (status) {
      case "Draft": return "bg-gray-100 text-gray-800";
      case "Submitted": return "bg-blue-100 text-blue-800";
      case "Pending": return "bg-yellow-100 text-yellow-800";
      case "Ordered": return "bg-green-100 text-green-800";
      case "Cancelled": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const filteredRequests = mockRequests.filter(request => {
    const matchesSearch = request.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         request.requestedBy.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || request.status === statusFilter;
    const matchesPurpose = purposeFilter === "all" || request.purpose === purposeFilter;
    
    return matchesSearch && matchesStatus && matchesPurpose;
  });

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex-1 space-y-4 sm:space-y-0 sm:flex sm:gap-4">
          {/* Search */}
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search material requests..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filters */}
          <div className="flex gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Draft">Draft</SelectItem>
                <SelectItem value="Submitted">Submitted</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="Ordered">Ordered</SelectItem>
                <SelectItem value="Cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>

            <Select value={purposeFilter} onValueChange={setPurposeFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Purpose" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Purpose</SelectItem>
                <SelectItem value="Purchase">Purchase</SelectItem>
                <SelectItem value="Material Transfer">Transfer</SelectItem>
                <SelectItem value="Material Issue">Issue</SelectItem>
                <SelectItem value="Manufacture">Manufacture</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Create New Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create New
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onCreateNew("Purchase")}>
              Purchase Request
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onCreateNew("Material Transfer")}>
              Material Transfer
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onCreateNew("Material Issue")}>
              Material Issue
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onCreateNew("Manufacture")}>
              Manufacturing Request
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Material Requests List */}
      <div className="grid gap-4">
        {filteredRequests.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No material requests found</p>
              <Button className="mt-4" onClick={() => onCreateNew("Purchase")}>
                <Plus className="w-4 h-4 mr-2" />
                Create First Request
              </Button>
            </CardContent>
          </Card>
        ) : (
          filteredRequests.map((request) => (
            <Card key={request.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <FileText className="w-5 h-5 text-blue-600" />
                    <div>
                      <h3 className="font-medium">{request.name}</h3>
                      <p className="text-sm text-gray-500">{request.purpose}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className={getStatusColor(request.status)}>
                      {request.status}
                    </Badge>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Eye className="w-4 h-4 mr-2" />
                          View
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onEditRequest(request)}>
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600">
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Requested By:</span>
                    <p className="font-medium">{request.requestedBy}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Date:</span>
                    <p className="font-medium">{request.transactionDate}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Items:</span>
                    <p className="font-medium">{request.items.length} item(s)</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Total Value:</span>
                    <p className="font-medium">
                      {request.totalValue ? `₹${request.totalValue.toLocaleString()}` : 'N/A'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default MaterialRequestList;


import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight, Edit, Eye, Search } from "lucide-react";
import { QualityInspection, InspectionType } from "../../pages/QualityCheck";

interface QualityInspectionListProps {
  onCreateNew: () => void;
  onEditInspection: (inspection: QualityInspection) => void;
}

// Mock data
const mockInspections: QualityInspection[] = [
  {
    id: "1",
    number: "QI-001",
    itemCode: "ITEM-001",
    itemName: "Steel Rod 10mm",
    batchSerial: "B001",
    inspectionType: "Incoming",
    status: "Draft",
    inspectionDate: "2024-01-15",
    parameters: [
      { id: "1", parameter: "Length", specification: "10mm ± 0.1", acceptanceCriteria: "9.9-10.1mm" },
      { id: "2", parameter: "Diameter", specification: "10mm ± 0.05", acceptanceCriteria: "9.95-10.05mm" },
    ]
  },
  {
    id: "2",
    number: "QI-002",
    itemCode: "ITEM-002",
    itemName: "Chemical B",
    batchSerial: "B002",
    inspectionType: "Incoming",
    status: "Submitted",
    inspectedBy: "John Doe",
    inspectionDate: "2024-01-14",
    overallResult: "Pass",
    parameters: [
      { id: "1", parameter: "Purity", specification: "≥95%", acceptanceCriteria: "≥95%", reading: "96.5%", status: "Pass" },
      { id: "2", parameter: "pH Level", specification: "7.0 ± 0.2", acceptanceCriteria: "6.8-7.2", reading: "7.1", status: "Pass" },
    ]
  },
  {
    id: "3",
    number: "QI-003",
    itemCode: "ITEM-003",
    itemName: "Finished Product X",
    inspectionType: "Outgoing",
    status: "Rejected",
    inspectedBy: "Jane Smith",
    inspectionDate: "2024-01-13",
    overallResult: "Fail",
    parameters: [
      { id: "1", parameter: "Dimensions", specification: "100x50x25mm", acceptanceCriteria: "±0.5mm", reading: "101x50.8x25mm", status: "Fail" },
    ]
  },
];

const QualityInspectionList = ({ onCreateNew, onEditInspection }: QualityInspectionListProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState<InspectionType>("Incoming");
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    "Draft": true,
    "Submitted": true,
    "Rejected": true,
  });

  const filteredInspections = mockInspections.filter(inspection => 
    inspection.inspectionType === selectedType &&
    (inspection.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
     inspection.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
     inspection.itemCode.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const groupedInspections = filteredInspections.reduce((groups, inspection) => {
    const status = inspection.status;
    if (!groups[status]) {
      groups[status] = [];
    }
    groups[status].push(inspection);
    return groups;
  }, {} as Record<string, QualityInspection[]>);

  const toggleGroup = (status: string) => {
    setOpenGroups(prev => ({
      ...prev,
      [status]: !prev[status]
    }));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Draft": return "bg-gray-100 text-gray-800";
      case "Submitted": return "bg-blue-100 text-blue-800";
      case "Accepted": return "bg-green-100 text-green-800";
      case "Rejected": return "bg-red-100 text-red-800";
      case "Cancelled": return "bg-gray-100 text-gray-600";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getResultColor = (result?: string) => {
    switch (result) {
      case "Pass": return "text-green-600";
      case "Fail": return "text-red-600";
      default: return "text-gray-600";
    }
  };

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search inspections..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Tabs value={selectedType} onValueChange={(value) => setSelectedType(value as InspectionType)}>
              <TabsList>
                <TabsTrigger value="Incoming">Incoming</TabsTrigger>
                <TabsTrigger value="Outgoing">Outgoing</TabsTrigger>
                <TabsTrigger value="In Process">In Process</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardContent>
      </Card>

      {/* Inspections List */}
      <div className="space-y-4">
        {Object.entries(groupedInspections).map(([status, inspections]) => (
          <Card key={status}>
            <Collapsible
              open={openGroups[status]}
              onOpenChange={() => toggleGroup(status)}
            >
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {openGroups[status] ? 
                        <ChevronDown className="w-4 h-4" /> : 
                        <ChevronRight className="w-4 h-4" />
                      }
                      <CardTitle className="text-lg">{status}</CardTitle>
                      <Badge className={getStatusColor(status)}>
                        {inspections.length}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              
              <CollapsibleContent>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    {inspections.map((inspection) => (
                      <div
                        key={inspection.id}
                        className="border rounded-lg p-4 hover:bg-gray-50"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h4 className="font-medium">{inspection.number}</h4>
                              <Badge className={getStatusColor(inspection.status)}>
                                {inspection.status}
                              </Badge>
                              {inspection.overallResult && (
                                <Badge variant="outline" className={getResultColor(inspection.overallResult)}>
                                  {inspection.overallResult}
                                </Badge>
                              )}
                            </div>
                            
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-gray-600">
                              <div>
                                <span className="font-medium">Item:</span> {inspection.itemName}
                              </div>
                              <div>
                                <span className="font-medium">Code:</span> {inspection.itemCode}
                              </div>
                              {inspection.batchSerial && (
                                <div>
                                  <span className="font-medium">Batch/Serial:</span> {inspection.batchSerial}
                                </div>
                              )}
                              <div>
                                <span className="font-medium">Date:</span> {new Date(inspection.inspectionDate).toLocaleDateString()}
                              </div>
                              {inspection.inspectedBy && (
                                <div>
                                  <span className="font-medium">Inspector:</span> {inspection.inspectedBy}
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onEditInspection(inspection)}
                            >
                              {inspection.status === "Draft" ? (
                                <>
                                  <Edit className="w-4 h-4 mr-1" />
                                  Edit
                                </>
                              ) : (
                                <>
                                  <Eye className="w-4 h-4 mr-1" />
                                  View
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Collapsible>
          </Card>
        ))}
      </div>

      {Object.keys(groupedInspections).length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-gray-500">No inspections found for the selected criteria.</p>
            <Button onClick={onCreateNew} className="mt-4">
              Create New Inspection
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default QualityInspectionList;

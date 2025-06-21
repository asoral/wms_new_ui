
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, Plus, CheckCircle, AlertTriangle, Clock } from "lucide-react";
import { QualityInspection, InspectionStatus, InspectionType } from "../../pages/QualityCheck";

interface QualityInspectionListProps {
  onCreateNew: () => void;
  onEditInspection: (inspection: QualityInspection) => void;
}

const QualityInspectionList = ({ onCreateNew, onEditInspection }: QualityInspectionListProps) => {
  const [searchQuery, setSearchQuery] = useState("");

  // Mock data with corrected types
  const mockInspections: QualityInspection[] = [
    {
      id: "1",
      name: "QC-001",
      itemCode: "ITM-001",
      itemName: "Test Item 1",
      inspectionType: "Incoming" as InspectionType,
      status: "Pass" as InspectionStatus,
      inspectedBy: "John Doe",
      inspectionDate: "2024-01-15",
      batchSerial: "BATCH-001",
      parameters: [
        {
          parameter: "Weight",
          specification: "100g ± 5g",
          acceptanceValue: "95-105",
          reading: "102",
          value: "102g",
          status: "Pass" as InspectionStatus
        }
      ]
    },
    {
      id: "2", 
      name: "QC-002",
      itemCode: "ITM-002",
      itemName: "Test Item 2",
      inspectionType: "In-Process" as InspectionType,
      status: "Fail" as InspectionStatus,
      inspectedBy: "Jane Smith",
      inspectionDate: "2024-01-14",
      batchSerial: "BATCH-002",
      parameters: [
        {
          parameter: "Dimension",
          specification: "10cm ± 0.5cm",
          acceptanceValue: "9.5-10.5",
          reading: "11.2",
          value: "11.2cm",
          status: "Fail" as InspectionStatus
        }
      ]
    }
  ];

  const filteredInspections = mockInspections.filter(inspection =>
    inspection.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    inspection.itemCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
    inspection.itemName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusIcon = (status: InspectionStatus) => {
    switch (status) {
      case 'Pass': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'Fail': return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case 'Pending': return <Clock className="w-4 h-4 text-yellow-600" />;
      default: return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: InspectionStatus) => {
    switch (status) {
      case 'Pass': return 'bg-green-100 text-green-800';
      case 'Fail': return 'bg-red-100 text-red-800';
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Quality Inspections</h2>
        <Button onClick={onCreateNew}>
          <Plus className="w-4 h-4 mr-2" />
          New Inspection
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input
          placeholder="Search inspections..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Inspections List */}
      <div className="grid gap-4">
        {filteredInspections.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <CheckCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">
                {searchQuery ? 'No inspections found matching your search' : 'No quality inspections found'}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredInspections.map((inspection) => (
            <Card key={inspection.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(inspection.status)}
                    <div>
                      <h3 className="font-semibold text-lg">{inspection.name}</h3>
                      <p className="text-gray-600">{inspection.itemCode} - {inspection.itemName}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className={getStatusColor(inspection.status)}>
                      {inspection.status}
                    </Badge>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => onEditInspection(inspection)}
                    >
                      View Details
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Type:</span>
                    <p className="font-medium">{inspection.inspectionType}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Batch/Serial:</span>
                    <p className="font-medium">{inspection.batchSerial}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Inspected By:</span>
                    <p className="font-medium">{inspection.inspectedBy}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Date:</span>
                    <p className="font-medium">{new Date(inspection.inspectionDate).toLocaleDateString()}</p>
                  </div>
                </div>

                {/* Parameters Summary */}
                <div className="mt-4 pt-4 border-t">
                  <p className="text-sm text-gray-600 mb-2">Parameters ({inspection.parameters.length})</p>
                  <div className="flex flex-wrap gap-2">
                    {inspection.parameters.map((param, index) => (
                      <Badge key={index} variant="outline" className={getStatusColor(param.status)}>
                        {param.parameter}: {param.status}
                      </Badge>
                    ))}
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

export default QualityInspectionList;

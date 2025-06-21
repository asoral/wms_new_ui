
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Trash2, Plus, Save } from "lucide-react";
import { QualityInspection, QualityParameter, InspectionType, InspectionStatus } from "../../pages/QualityCheck";

interface QualityInspectionFormProps {
  initialData?: QualityInspection | null;
  onSave: (inspection: QualityInspection) => void;
  onCancel: () => void;
}

const QualityInspectionForm = ({ initialData, onSave, onCancel }: QualityInspectionFormProps) => {
  const [formData, setFormData] = useState({
    itemCode: initialData?.itemCode || "",
    itemName: initialData?.itemName || "",
    inspectionType: initialData?.inspectionType || "Incoming" as In

SpectionType,
    inspectedBy: initialData?.inspectedBy || "",
    batchNo: initialData?.batchNo || "",
    remarks: initialData?.remarks || ""
  });

  const [parameters, setParameters] = useState<QualityParameter[]>(
    initialData?.parameters || [
      {
        parameter: "Dimension",
        specification: "10mm ± 0.1",
        acceptanceValue: "9.9-10.1mm",
        reading: "",
        value: "",
        status: "Pending" as InspectionStatus
      }
    ]
  );

  const updateParameter = (index: number, field: keyof QualityParameter, value: string) => {
    const updated = [...parameters];
    updated[index] = { ...updated[index], [field]: value };
    
    // Auto-update status based on reading
    if (field === 'reading' && value) {
      const reading = parseFloat(value);
      if (!isNaN(reading)) {
        updated[index].status = reading >= 9.9 && reading <= 10.1 ? "Pass" : "Fail";
      }
    }
    
    setParameters(updated);
  };

  const addParameter = () => {
    setParameters([
      ...parameters,
      {
        parameter: "",
        specification: "",
        acceptanceValue: "",
        reading: "",
        value: "",
        status: "Pending" as InspectionStatus
      }
    ]);
  };

  const removeParameter = (index: number) => {
    setParameters(parameters.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    const inspection: QualityInspection = {
      id: initialData?.id || `QI-${Date.now()}`,
      name: `Quality Inspection - ${formData.itemCode}`,
      itemCode: formData.itemCode,
      itemName: formData.itemName,
      inspectionType: formData.inspectionType,
      status: parameters.every(p => p.status === "Pass") ? "Pass" : 
              parameters.some(p => p.status === "Fail") ? "Fail" : "Pending",
      inspectedBy: formData.inspectedBy,
      inspectionDate: new Date().toISOString(),
      batchNo: formData.batchNo,
      parameters: parameters,
      remarks: formData.remarks
    };

    onSave(inspection);
  };

  const getStatusColor = (status: InspectionStatus) => {
    switch (status) {
      case "Pass": return "bg-green-100 text-green-800";
      case "Fail": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>Inspection Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="itemCode">Item Code</Label>
              <Input
                id="itemCode"
                value={formData.itemCode}
                onChange={(e) => setFormData({ ...formData, itemCode: e.target.value })}
                placeholder="Enter item code"
              />
            </div>

            <div>
              <Label htmlFor="itemName">Item Name</Label>
              <Input
                id="itemName"
                value={formData.itemName}
                onChange={(e) => setFormData({ ...formData, itemName: e.target.value })}
                placeholder="Enter item name"
              />
            </div>

            <div>
              <Label htmlFor="inspectionType">Inspection Type</Label>
              <Select 
                value={formData.inspectionType} 
                onValueChange={(value: InspectionType) => setFormData({ ...formData, inspectionType: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Incoming">Incoming</SelectItem>
                  <SelectItem value="In-Process">In-Process</SelectItem>
                  <SelectItem value="Outgoing">Outgoing</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="inspectedBy">Inspected By</Label>
              <Input
                id="inspectedBy"
                value={formData.inspectedBy}
                onChange={(e) => setFormData({ ...formData, inspectedBy: e.target.value })}
                placeholder="Inspector name"
              />
            </div>

            <div>
              <Label htmlFor="batchNo">Batch/Serial No</Label>
              <Input
                id="batchNo"
                value={formData.batchNo}
                onChange={(e) => setFormData({ ...formData, batchNo: e.target.value })}
                placeholder="Enter batch or serial number"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quality Parameters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Quality Parameters</span>
            <Button onClick={addParameter} size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Add Parameter
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {parameters.map((param, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium">Parameter {index + 1}</h4>
                  <div className="flex items-center space-x-2">
                    <Badge className={getStatusColor(param.status)}>
                      {param.status}
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeParameter(index)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <Label>Parameter</Label>
                    <Input
                      value={param.parameter}
                      onChange={(e) => updateParameter(index, 'parameter', e.target.value)}
                      placeholder="e.g., Dimension"
                    />
                  </div>

                  <div>
                    <Label>Specification</Label>
                    <Input
                      value={param.specification}
                      onChange={(e) => updateParameter(index, 'specification', e.target.value)}
                      placeholder="e.g., 10mm ± 0.1"
                    />
                  </div>

                  <div>
                    <Label>Acceptance Value</Label>
                    <Input
                      value={param.acceptanceValue}
                      onChange={(e) => updateParameter(index, 'acceptanceValue', e.target.value)}
                      placeholder="e.g., 9.9-10.1mm"
                    />
                  </div>

                  <div>
                    <Label>Reading</Label>
                    <Input
                      value={param.reading}
                      onChange={(e) => updateParameter(index, 'reading', e.target.value)}
                      placeholder="Actual measurement"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Remarks */}
      <Card>
        <CardHeader>
          <CardTitle>Remarks</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={formData.remarks}
            onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
            placeholder="Add any additional remarks or observations..."
            rows={3}
          />
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end space-x-4">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={handleSave}>
          <Save className="w-4 h-4 mr-2" />
          Save Inspection
        </Button>
      </div>
    </div>
  );
};

export default QualityInspectionForm;

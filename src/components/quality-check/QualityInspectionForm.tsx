
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Scan, Plus, Trash2, Save, Send } from "lucide-react";
import { QualityInspection, QualityParameter, InspectionType } from "../../pages/QualityCheck";

interface QualityInspectionFormProps {
  inspection?: QualityInspection | null;
  onBack: () => void;
}

// Mock data
const mockItems = [
  { code: "ITEM-001", name: "Steel Rod 10mm", group: "Raw Materials" },
  { code: "ITEM-002", name: "Chemical B", group: "Chemicals" },
  { code: "ITEM-003", name: "Finished Product X", group: "Finished Goods" },
];

const mockParameterTemplates = {
  "ITEM-001": [
    { parameter: "Length", specification: "10mm ± 0.1", acceptanceCriteria: "9.9-10.1mm" },
    { parameter: "Diameter", specification: "10mm ± 0.05", acceptanceCriteria: "9.95-10.05mm" },
    { parameter: "Surface Finish", specification: "Smooth", acceptanceCriteria: "No visible defects" },
  ],
  "ITEM-002": [
    { parameter: "Purity", specification: "≥95%", acceptanceCriteria: "≥95%" },
    { parameter: "pH Level", specification: "7.0 ± 0.2", acceptanceCriteria: "6.8-7.2" },
    { parameter: "Color", specification: "Clear", acceptanceCriteria: "No discoloration" },
  ],
  "ITEM-003": [
    { parameter: "Dimensions", specification: "100x50x25mm", acceptanceCriteria: "±0.5mm" },
    { parameter: "Weight", specification: "500g ± 10g", acceptanceCriteria: "490-510g" },
    { parameter: "Finish Quality", specification: "Grade A", acceptanceCriteria: "No scratches or dents" },
  ],
};

const QualityInspectionForm = ({ inspection, onBack }: QualityInspectionFormProps) => {
  const [formData, setFormData] = useState({
    itemCode: inspection?.itemCode || "",
    batchSerial: inspection?.batchSerial || "",
    inspectionType: inspection?.inspectionType || "Incoming" as InspectionType,
    remarks: inspection?.remarks || "",
  });

  const [parameters, setParameters] = useState<QualityParameter[]>(
    inspection?.parameters || []
  );

  const [scannedItem, setScannedItem] = useState("");

  const handleScanItem = () => {
    if (scannedItem) {
      const item = mockItems.find(i => i.code === scannedItem);
      if (item) {
        setFormData(prev => ({ ...prev, itemCode: item.code }));
        loadParameterTemplate(item.code);
      }
    }
  };

  const loadParameterTemplate = (itemCode: string) => {
    const templates = mockParameterTemplates[itemCode as keyof typeof mockParameterTemplates];
    if (templates) {
      const newParameters = templates.map((template, index) => ({
        id: Date.now().toString() + index,
        parameter: template.parameter,
        specification: template.specification,
        acceptanceCriteria: template.acceptanceCriteria,
        reading: "",
        status: "Pending" as const,
      }));
      setParameters(newParameters);
    }
  };

  const handleItemSelect = (itemCode: string) => {
    setFormData(prev => ({ ...prev, itemCode }));
    loadParameterTemplate(itemCode);
  };

  const updateParameterReading = (id: string, reading: string) => {
    setParameters(prev => prev.map(param => {
      if (param.id === id) {
        // Simple validation logic - you can make this more sophisticated
        const status = reading ? (Math.random() > 0.3 ? "Pass" : "Fail") : "Pending";
        return { ...param, reading, status };
      }
      return param;
    }));
  };

  const addCustomParameter = () => {
    const newParameter: QualityParameter = {
      id: Date.now().toString(),
      parameter: "Custom Parameter",
      specification: "",
      acceptanceCriteria: "",
      reading: "",
      status: "Pending",
    };
    setParameters(prev => [...prev, newParameter]);
  };

  const removeParameter = (id: string) => {
    setParameters(prev => prev.filter(param => param.id !== id));
  };

  const updateParameter = (id: string, field: keyof QualityParameter, value: string) => {
    setParameters(prev => prev.map(param => 
      param.id === id ? { ...param, [field]: value } : param
    ));
  };

  const handleSave = () => {
    console.log("Saving inspection as draft...", { formData, parameters });
    onBack();
  };

  const handleSubmit = () => {
    console.log("Submitting inspection...", { formData, parameters });
    onBack();
  };

  const selectedItem = mockItems.find(item => item.code === formData.itemCode);
  const overallResult = parameters.length > 0 ? 
    (parameters.every(p => p.status === "Pass") ? "Pass" : 
     parameters.some(p => p.status === "Fail") ? "Fail" : "Pending") : "Pending";

  return (
    <div className="space-y-6">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Item Scanner */}
          <div className="space-y-2">
            <Label htmlFor="item-scan">Scan Item Code</Label>
            <div className="flex space-x-2">
              <Input
                id="item-scan"
                placeholder="Scan or type item code..."
                value={scannedItem}
                onChange={(e) => setScannedItem(e.target.value)}
              />
              <Button variant="outline" size="icon" onClick={handleScanItem}>
                <Scan className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Item Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Item</Label>
              <Select value={formData.itemCode} onValueChange={handleItemSelect}>
                <SelectTrigger>
                  <SelectValue placeholder="Select item..." />
                </SelectTrigger>
                <SelectContent>
                  {mockItems.map((item) => (
                    <SelectItem key={item.code} value={item.code}>
                      {item.name} ({item.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="batch-serial">Batch/Serial Number</Label>
              <Input
                id="batch-serial"
                placeholder="Enter batch/serial..."
                value={formData.batchSerial}
                onChange={(e) => setFormData(prev => ({ ...prev, batchSerial: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Inspection Type</Label>
            <Select 
              value={formData.inspectionType} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, inspectionType: value as InspectionType }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Incoming">Incoming</SelectItem>
                <SelectItem value="Outgoing">Outgoing</SelectItem>
                <SelectItem value="In Process">In Process</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {selectedItem && (
            <div className="p-3 bg-blue-50 rounded-lg">
              <div className="text-sm">
                <span className="font-medium">Selected Item:</span> {selectedItem.name} - {selectedItem.group}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quality Parameters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Quality Parameters</CardTitle>
            <Button variant="outline" size="sm" onClick={addCustomParameter}>
              <Plus className="w-4 h-4 mr-2" />
              Add Parameter
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {parameters.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>Select an item to load quality parameters or add custom parameters.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {parameters.map((parameter) => (
                <div key={parameter.id} className="border rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs">Parameter</Label>
                      <Input
                        value={parameter.parameter}
                        onChange={(e) => updateParameter(parameter.id, "parameter", e.target.value)}
                        placeholder="Parameter name"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs">Specification</Label>
                      <Input
                        value={parameter.specification}
                        onChange={(e) => updateParameter(parameter.id, "specification", e.target.value)}
                        placeholder="Specification"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs">Acceptance Criteria</Label>
                      <Input
                        value={parameter.acceptanceCriteria}
                        onChange={(e) => updateParameter(parameter.id, "acceptanceCriteria", e.target.value)}
                        placeholder="Criteria"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs">Reading</Label>
                      <Input
                        value={parameter.reading || ""}
                        onChange={(e) => updateParameterReading(parameter.id, e.target.value)}
                        placeholder="Enter reading"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs">Status</Label>
                      <div className="flex items-center justify-between">
                        <Badge 
                          className={
                            parameter.status === "Pass" ? "bg-green-100 text-green-800" :
                            parameter.status === "Fail" ? "bg-red-100 text-red-800" :
                            "bg-gray-100 text-gray-800"
                          }
                        >
                          {parameter.status}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeParameter(parameter.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Overall Result & Remarks */}
      {parameters.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Inspection Result</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-4">
              <span className="font-medium">Overall Result:</span>
              <Badge 
                className={
                  overallResult === "Pass" ? "bg-green-100 text-green-800" :
                  overallResult === "Fail" ? "bg-red-100 text-red-800" :
                  "bg-gray-100 text-gray-800"
                }
              >
                {overallResult}
              </Badge>
            </div>

            <div className="space-y-2">
              <Label htmlFor="remarks">Remarks</Label>
              <Textarea
                id="remarks"
                placeholder="Add inspection remarks..."
                value={formData.remarks}
                onChange={(e) => setFormData(prev => ({ ...prev, remarks: e.target.value }))}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={onBack}>
          Cancel
        </Button>
        
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={handleSave}>
            <Save className="w-4 h-4 mr-2" />
            Save Draft
          </Button>
          <Button onClick={handleSubmit} disabled={!formData.itemCode || parameters.length === 0}>
            <Send className="w-4 h-4 mr-2" />
            Submit Inspection
          </Button>
        </div>
      </div>
    </div>
  );
};

export default QualityInspectionForm;

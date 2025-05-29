
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Package, Play, ChevronDown } from "lucide-react";
import { PickList, PickListPurpose } from "../../pages/PickList";

interface PickListDetailsProps {
  pickList: PickList | null;
  isCreatingNew: boolean;
  onStartPicking: (pickList: PickList) => void;
  onBack: () => void;
}

const PickListDetails = ({ pickList, isCreatingNew, onStartPicking, onBack }: PickListDetailsProps) => {
  const [purpose, setPurpose] = useState<PickListPurpose>(pickList?.purpose || "Material Transfer");
  const [relatedDocument, setRelatedDocument] = useState(pickList?.relatedDocument || "");

  const purposeOptions: PickListPurpose[] = ["Material Transfer", "Delivery", "Transfer for Manufacturing"];
  
  const getRelatedDocumentOptions = (purpose: PickListPurpose) => {
    switch (purpose) {
      case "Material Transfer":
        return ["MAT-MR-2025-00005", "MAT-MR-2025-00006", "MAT-MR-2025-00007"];
      case "Delivery":
        return ["SO-2025-00012", "SO-2025-00013", "SO-2025-00014"];
      case "Transfer for Manufacturing":
        return ["WO-2025-00003", "WO-2025-00004", "WO-2025-00005"];
      default:
        return [];
    }
  };

  const getRelatedDocumentLabel = (purpose: PickListPurpose) => {
    switch (purpose) {
      case "Material Transfer":
        return "Material Request";
      case "Delivery":
        return "Sales Order";
      case "Transfer for Manufacturing":
        return "Work Order";
      default:
        return "Related Document";
    }
  };

  const handleStartPicking = () => {
    if (isCreatingNew) {
      // Create new pick list with the selected purpose and related document
      const newPickList: PickList = {
        id: Date.now().toString(),
        number: `STO-PICK-2025-${String(Math.floor(Math.random() * 10000)).padStart(5, '0')}`,
        purpose,
        relatedDocument,
        status: "draft",
        createdDate: new Date().toISOString(),
        items: [
          {
            id: "1",
            code: "7",
            name: "Finished Metal Chair",
            warehouse: "Main Store",
            bin: "A-001",
            batch: "BATCH-001",
            requiredQty: 5,
            pickedQty: 0,
            status: "pending"
          },
          {
            id: "2",
            code: "8",
            name: "Office Desk",
            warehouse: "Main Store", 
            bin: "B-002",
            serial: "SN-12345",
            requiredQty: 2,
            pickedQty: 0,
            status: "pending"
          }
        ]
      };
      onStartPicking(newPickList);
    } else if (pickList) {
      onStartPicking(pickList);
    }
  };

  const canStartPicking = purpose && relatedDocument;

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Button variant="outline" onClick={onBack} className="flex items-center space-x-2">
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Selection</span>
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Package className="w-5 h-5 text-blue-600" />
            <span>{isCreatingNew ? "Create New Pick List" : "Pick List Details"}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {!isCreatingNew && pickList && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-600">Pick List Number:</span>
                  <p className="text-gray-900">{pickList.number}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Created Date:</span>
                  <p className="text-gray-900">{new Date(pickList.createdDate).toLocaleString()}</p>
                </div>
              </div>
            </div>
          )}

          {/* Purpose Selection */}
          <div className="space-y-2">
            <Label htmlFor="purpose">Purpose</Label>
            <Select 
              value={purpose} 
              onValueChange={(value: PickListPurpose) => setPurpose(value)}
              disabled={!isCreatingNew}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select purpose" />
              </SelectTrigger>
              <SelectContent>
                {purposeOptions.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Related Document Selection */}
          <div className="space-y-2">
            <Label htmlFor="relatedDocument">{getRelatedDocumentLabel(purpose)}</Label>
            <Select 
              value={relatedDocument} 
              onValueChange={setRelatedDocument}
              disabled={!isCreatingNew}
            >
              <SelectTrigger>
                <SelectValue placeholder={`Select ${getRelatedDocumentLabel(purpose).toLowerCase()}`} />
              </SelectTrigger>
              <SelectContent>
                {getRelatedDocumentOptions(purpose).map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Summary */}
          {purpose && relatedDocument && (
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Summary</h4>
              <div className="text-sm text-blue-800 space-y-1">
                <p><span className="font-medium">Purpose:</span> {purpose}</p>
                <p><span className="font-medium">{getRelatedDocumentLabel(purpose)}:</span> {relatedDocument}</p>
              </div>
            </div>
          )}

          {/* Start Picking Button */}
          <div className="flex justify-end pt-4">
            <Button 
              onClick={handleStartPicking}
              disabled={!canStartPicking}
              className="flex items-center space-x-2"
            >
              <Play className="w-4 h-4" />
              <span>Start Picking</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PickListDetails;

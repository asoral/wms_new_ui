import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Package, Play } from "lucide-react";
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

  const purposeOptions: PickListPurpose[] = ["Material Transfer", "Delivery", "Manufacturing"];
  
  const getRelatedDocumentOptions = (purpose: PickListPurpose) => {
    switch (purpose) {
      case "Material Transfer":
        return ["MAT-MR-2025-00005", "MAT-MR-2025-00006", "MAT-MR-2025-00007"];
      case "Delivery":
        return ["SO-2025-00012", "SO-2025-00013", "SO-2025-00014"];
      case "Manufacturing":
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
      case "Manufacturing":
        return "Work Order";
      default:
        return "Related Document";
    }
  };

  const handleStartPicking = () => {
    if (isCreatingNew) {
      // Create new pick list with the selected purpose and related document
      const newPickList: PickList = {
        name: `STO-PICK-2025-${String(Math.floor(Math.random() * 10000)).padStart(5, '0')}`,
        number: `STO-PICK-2025-${String(Math.floor(Math.random() * 10000)).padStart(5, '0')}`,
        purpose,
        relatedDocument,
        status: "Draft",
        company: "Default Company",
        docstatus: 0,
        creation: new Date().toISOString(),
        createdDate: new Date().toISOString(),
        owner: "Administrator",
        items: [
          {
            id: "1",
            item_code: "7",
            code: "7",
            item_name: "Finished Metal Chair",
            name: "Finished Metal Chair",
            warehouse: "Main Store",
            bin: "A-001",
            batch_no: "BATCH-001",
            batch: "BATCH-001",
            qty: 5,
            requiredQty: 5,
            picked_qty: 0,
            pickedQty: 0,
            status: "pending"
          },
          {
            id: "2",
            item_code: "8",
            code: "8",
            item_name: "Office Desk",
            name: "Office Desk",
            warehouse: "Main Store", 
            bin: "B-002",
            serial_no: "SN-12345",
            serial: "SN-12345",
            qty: 2,
            requiredQty: 2,
            picked_qty: 0,
            pickedQty: 0,
            status: "pending"
          }
        ]
      };
      onStartPicking(newPickList);
    } else if (pickList) {
      // Map existing pick list to proper format
      const formattedPickList: PickList = {
        ...pickList,
        items: pickList.locations?.map((item, index) => ({
          ...item,
          id: (index + 1).toString(),
          code: item.item_code,
          name: item.item_name,
          requiredQty: item.qty,
          pickedQty: item.picked_qty || 0,
          bin: item.warehouse,
          batch: item.batch_no,
          serial: item.serial_no,
          status: (item.picked_qty || 0) === 0 ? "pending" : 
                  (item.picked_qty || 0) < item.qty ? "partial" : "completed"
        })) || []
      };
      onStartPicking(formattedPickList);
    }
  };

  const canStartPicking = purpose && (isCreatingNew ? relatedDocument : true);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ', ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header with stepper */}
      <div className="flex items-center space-x-2 mb-6">
        <Package className="w-6 h-6 text-blue-600" />
        <h1 className="text-2xl font-bold">Pick List</h1>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center space-x-4 mb-6">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-400 flex items-center justify-center text-sm font-medium">
            1
          </div>
          <span className="text-gray-400">Select</span>
        </div>
        <div className="w-8 h-px bg-gray-200"></div>
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-medium">
            2
          </div>
          <span className="text-blue-600 font-medium">Details</span>
        </div>
        <div className="w-8 h-px bg-gray-200"></div>
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-400 flex items-center justify-center text-sm font-medium">
            3
          </div>
          <span className="text-gray-400">Pick</span>
        </div>
      </div>

      {/* Back Button */}
      <Button variant="ghost" onClick={onBack} className="flex items-center space-x-2">
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
                  <p className="text-gray-900">{pickList.number || pickList.name}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Created Date:</span>
                  <p className="text-gray-900">{formatDate(pickList.createdDate || pickList.creation)}</p>
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
              value={relatedDocument || (pickList?.relatedDocument || getRelatedDocumentOptions(purpose)[0] || "")} 
              onValueChange={setRelatedDocument}
              disabled={!isCreatingNew}
            >
              <SelectTrigger>
                <SelectValue placeholder={`Select ${getRelatedDocumentLabel(purpose).toLowerCase()}`} />
              </SelectTrigger>
              <SelectContent>
                {isCreatingNew ? (
                  getRelatedDocumentOptions(purpose).map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value={pickList?.relatedDocument || "MAT-MR-2025-00005"}>
                    {pickList?.relatedDocument || "MAT-MR-2025-00005"}
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Summary */}
          <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Summary</h4>
            <div className="text-sm text-blue-800 space-y-1">
              <p><span className="font-medium">Purpose:</span> {purpose}</p>
              <p><span className="font-medium">{getRelatedDocumentLabel(purpose)}:</span> {relatedDocument || pickList?.relatedDocument || "MAT-MR-2025-00005"}</p>
            </div>
          </div>

          {/* Start Picking Button */}
          <div className="flex justify-end pt-4">
            <Button 
              onClick={handleStartPicking}
              disabled={!canStartPicking}
              className="flex items-center space-x-2 bg-gray-800 hover:bg-gray-900"
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
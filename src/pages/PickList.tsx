
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Package, Plus, RefreshCcw } from "lucide-react";
import PickListSelection from "../components/picking/PickListSelection";
import PickListDetails from "../components/picking/PickListDetails";
import PickingProcess from "../components/picking/PickingProcess";

export type PickListStatus = "draft" | "in-progress" | "completed";
export type PickListPurpose = "Material Transfer" | "Delivery" | "Transfer for Manufacturing";

export interface PickListItem {
  id: string;
  code: string;
  name: string;
  warehouse: string;
  bin: string;
  batch?: string;
  serial?: string;
  requiredQty: number;
  pickedQty: number;
  status: "pending" | "partial" | "completed";
}

export interface PickList {
  id: string;
  number: string;
  purpose: PickListPurpose;
  relatedDocument: string;
  status: PickListStatus;
  createdDate: string;
  items: PickListItem[];
}

const PickListPage = () => {
  const [currentStep, setCurrentStep] = useState<"selection" | "details" | "picking">("selection");
  const [selectedPickList, setSelectedPickList] = useState<PickList | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  const handleSelectPickList = (pickList: PickList) => {
    setSelectedPickList(pickList);
    setCurrentStep("details");
  };

  const handleCreateNew = () => {
    setIsCreatingNew(true);
    setCurrentStep("details");
  };

  const handleStartPicking = (pickList: PickList) => {
    setSelectedPickList(pickList);
    setCurrentStep("picking");
  };

  const handleBackToSelection = () => {
    setCurrentStep("selection");
    setSelectedPickList(null);
    setIsCreatingNew(false);
  };

  const handleBackToDetails = () => {
    setCurrentStep("details");
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center space-x-4 mb-6">
      <div className={`flex items-center ${currentStep === "selection" ? "text-blue-600" : "text-gray-400"}`}>
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
          currentStep === "selection" ? "bg-blue-600 text-white" : "bg-gray-200"
        }`}>
          1
        </div>
        <span className="ml-2 text-sm font-medium">Select</span>
      </div>
      
      <ArrowRight className="w-4 h-4 text-gray-400" />
      
      <div className={`flex items-center ${currentStep === "details" ? "text-blue-600" : "text-gray-400"}`}>
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
          currentStep === "details" ? "bg-blue-600 text-white" : "bg-gray-200"
        }`}>
          2
        </div>
        <span className="ml-2 text-sm font-medium">Details</span>
      </div>
      
      <ArrowRight className="w-4 h-4 text-gray-400" />
      
      <div className={`flex items-center ${currentStep === "picking" ? "text-blue-600" : "text-gray-400"}`}>
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
          currentStep === "picking" ? "bg-blue-600 text-white" : "bg-gray-200"
        }`}>
          3
        </div>
        <span className="ml-2 text-sm font-medium">Pick</span>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Package className="w-6 h-6 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">Pick List</h1>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="icon">
              <RefreshCcw className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Step Indicator */}
        {renderStepIndicator()}

        {/* Content */}
        {currentStep === "selection" && (
          <PickListSelection 
            onSelectPickList={handleSelectPickList}
            onCreateNew={handleCreateNew}
          />
        )}

        {currentStep === "details" && (
          <PickListDetails
            pickList={selectedPickList}
            isCreatingNew={isCreatingNew}
            onStartPicking={handleStartPicking}
            onBack={handleBackToSelection}
          />
        )}

        {currentStep === "picking" && selectedPickList && (
          <PickingProcess
            pickList={selectedPickList}
            onBack={handleBackToDetails}
          />
        )}
      </div>
    </div>
  );
};

export default PickListPage;

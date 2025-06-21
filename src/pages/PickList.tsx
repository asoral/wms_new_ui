
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Clipboard, ArrowLeft } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PickListSelection from "@/components/picking/PickListSelection";
import PickingProcess from "@/components/picking/PickingProcess";
import PickListDetails from "@/components/picking/PickListDetails";
import HelpSection from "@/components/ui/help-section";

export type PickListPurpose = "Material Transfer" | "Delivery" | "Manufacturing";
export type PickListStatus = "Draft" | "Open" | "Completed" | "Cancelled";

export interface PickListItem {
  itemCode: string;
  itemName: string;
  qty: number;
  requiredQty: number;
  uom: string;
  warehouse: string;
  batchNo?: string;
  serialNo?: string;
  status: "pending" | "picked" | "partially_picked";
}

export interface PickList {
  id: string;
  name: string;
  purpose: PickListPurpose;
  relatedDocument: string;
  status: PickListStatus;
  createdDate: string;
  createdBy: string;
  company: string;
  items: PickListItem[];
}

const PickListPage = () => {
  const [currentView, setCurrentView] = useState<"selection" | "picking" | "details">("selection");
  const [selectedPickList, setSelectedPickList] = useState<PickList | null>(null);

  const handleSelectPickList = (pickList: PickList) => {
    setSelectedPickList(pickList);
    setCurrentView("details");
  };

  const handleStartPicking = (pickList: PickList) => {
    setSelectedPickList(pickList);
    setCurrentView("picking");
  };

  const handleBackToSelection = () => {
    setCurrentView("selection");
    setSelectedPickList(null);
  };

  const showHelp = currentView === "selection" && !selectedPickList;

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            {currentView !== "selection" && (
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleBackToSelection}
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
            )}
            <Clipboard className="w-6 h-6 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">Pick List</h1>
          </div>
        </div>

        {/* Content */}
        {currentView === "selection" && (
          <PickListSelection onSelectPickList={handleSelectPickList} />
        )}

        {currentView === "details" && selectedPickList && (
          <PickListDetails 
            pickList={selectedPickList} 
            onStartPicking={() => handleStartPicking(selectedPickList)}
            onBack={handleBackToSelection}
          />
        )}

        {currentView === "picking" && selectedPickList && (
          <PickingProcess 
            pickList={selectedPickList}
            onComplete={handleBackToSelection}
            onBack={handleBackToSelection}
          />
        )}

        {/* Help Section - moved to bottom */}
        <div className="mt-8">
          <HelpSection
            show={showHelp}
            icon={<Clipboard className="w-12 h-12" />}
            title="Pick List Management"
            description="Select and process pick lists for efficient order fulfillment."
            steps={[
              "Select a pick list from pending or in-progress items",
              "Review items and quantities to pick",
              "Start the picking process",
              "Scan or confirm picked quantities"
            ]}
          />
        </div>
      </div>
    </div>
  );
};

export default PickListPage;

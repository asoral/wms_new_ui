
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ClipboardList, ArrowLeft } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PickListSelection from "@/components/picking/PickListSelection";
import PickingProcess from "@/components/picking/PickingProcess";
import PickListDetails from "@/components/picking/PickListDetails";
import HelpSection from "@/components/ui/help-section";

export interface PickListItem {
  itemCode: string;
  itemName: string;
  qty: number;
  pickedQty: number;
  uom: string;
  warehouse: string;
  binLocation?: string;
  serialNo?: string;
  batchNo?: string;
}

export interface PickList {
  id: string;
  number: string;
  customer?: string;
  salesOrder?: string;
  status: "Draft" | "Open" | "Completed" | "Cancelled";
  createdDate: string;
  items: PickListItem[];
  totalItems: number;
  pickedItems: number;
  completionPercentage: number;
}

const PickListPage = () => {
  const [currentView, setCurrentView] = useState<"selection" | "picking" | "details">("selection");
  const [selectedPickList, setSelectedPickList] = useState<PickList | null>(null);
  const [pickLists, setPickLists] = useState<PickList[]>([]);

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

  const showHelp = currentView === "selection" && pickLists.length === 0;

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
            <ClipboardList className="w-6 h-6 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Pick List</h1>
              {selectedPickList && (
                <p className="text-sm text-gray-600">
                  {selectedPickList.number} - {selectedPickList.customer}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Help Section */}
        <div className="mb-6">
          <HelpSection
            show={showHelp}
            icon={<ClipboardList className="w-12 h-12" />}
            title="Manage Picking Operations"
            description="Organize and execute warehouse picking tasks efficiently."
            steps={[
              "View available pick lists from sales orders",
              "Select a pick list to view item details",
              "Start picking process with guided workflow",
              "Update quantities and complete the pick list"
            ]}
          />
        </div>

        {/* Content */}
        {currentView === "selection" && (
          <PickListSelection 
            onSelectPickList={handleSelectPickList}
            onStartPicking={handleStartPicking}
          />
        )}

        {currentView === "details" && selectedPickList && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Pick List Details</h2>
              <div className="flex space-x-2">
                <Button 
                  onClick={() => handleStartPicking(selectedPickList)}
                  disabled={selectedPickList.status === "Completed"}
                >
                  Start Picking
                </Button>
                <Button variant="outline" onClick={handleBackToSelection}>
                  Back to List
                </Button>
              </div>
            </div>
            <PickListDetails pickList={selectedPickList} />
          </div>
        )}

        {currentView === "picking" && selectedPickList && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Picking Process</h2>
              <Button variant="outline" onClick={handleBackToSelection}>
                Back to List
              </Button>
            </div>
            <PickingProcess 
              pickList={selectedPickList}
              onComplete={handleBackToSelection}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default PickListPage;

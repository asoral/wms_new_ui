
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Package, RefreshCcw } from "lucide-react";
import PickListDashboard from "../components/picking/PickListDashboard";
import PickListCreationWizard from "../components/picking/PickListCreationWizard";
import PickListItemProcessor from "../components/picking/PickListItemProcessor";
import PickListReviewSubmit from "../components/picking/PickListReviewSubmit";

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

type CurrentView = "dashboard" | "create" | "pick" | "review";

const PickListPage = () => {
  const [currentView, setCurrentView] = useState<CurrentView>("dashboard");
  const [currentPickList, setCurrentPickList] = useState<any>(null);
  const [processedItems, setProcessedItems] = useState<any[]>([]);

  const handleCreateNew = () => {
    setCurrentView("create");
  };

  const handleSelectPendingPickList = (pickListId: string) => {
    // In a real implementation, fetch the pick list details from API
    const mockPickList = {
      number: `PICK-2025-${pickListId.padStart(5, '0')}`,
      items: [
        {
          item_code: "ITEM-001",
          item_name: "Metal Chair",
          qty: 5,
          uom: "Nos",
          warehouse: "Main Store",
          bin: "A-001"
        },
        {
          item_code: "ITEM-002", 
          item_name: "Office Table",
          qty: 2,
          uom: "Nos",
          warehouse: "Main Store",
          bin: "B-002"
        }
      ]
    };
    setCurrentPickList(mockPickList);
    setCurrentView("pick");
  };

  const handleCreatePickList = (pickListData: any) => {
    // In a real implementation, create the pick list via API and fetch items
    const mockPickList = {
      number: `PICK-2025-${Date.now().toString().slice(-5)}`,
      items: [
        {
          item_code: "ITEM-003",
          item_name: "Wooden Desk",
          qty: 3,
          uom: "Nos",
          warehouse: "Store A",
          bin: "C-003"
        },
        {
          item_code: "ITEM-004",
          item_name: "Office Chair",
          qty: 4,
          uom: "Nos", 
          warehouse: "Store A",
          bin: "D-004"
        }
      ]
    };
    setCurrentPickList(mockPickList);
    setCurrentView("pick");
  };

  const handleItemsProcessed = (items: any[]) => {
    setProcessedItems(items);
    setCurrentView("review");
  };

  const handleBackToDashboard = () => {
    setCurrentView("dashboard");
    setCurrentPickList(null);
    setProcessedItems([]);
  };

  const handleBackToCreate = () => {
    setCurrentView("create");
  };

  const handleBackToPicking = () => {
    setCurrentView("pick");
  };

  const handleSubmitPickList = () => {
    // In a real implementation, submit the pick list via API
    handleBackToDashboard();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Package className="w-6 h-6 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Pick List</h1>
              {currentPickList && (
                <p className="text-sm text-gray-600">
                  {currentPickList.number}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {currentView !== "dashboard" && (
              <Button variant="outline" onClick={handleBackToDashboard}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            )}
            <Button variant="outline" size="icon">
              <RefreshCcw className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        {currentView === "dashboard" && (
          <PickListDashboard 
            onCreateNew={handleCreateNew}
            onSelectPendingPickList={handleSelectPendingPickList}
          />
        )}

        {currentView === "create" && (
          <PickListCreationWizard
            onBack={handleBackToDashboard}
            onComplete={handleCreatePickList}
          />
        )}

        {currentView === "pick" && currentPickList && (
          <PickListItemProcessor
            pickListNumber={currentPickList.number}
            pickListItems={currentPickList.items}
            onItemsProcessed={handleItemsProcessed}
            onBack={handleBackToCreate}
          />
        )}

        {currentView === "review" && currentPickList && (
          <PickListReviewSubmit
            pickListNumber={currentPickList.number}
            processedItems={processedItems}
            onBack={handleBackToPicking}
            onSubmit={handleSubmitPickList}
          />
        )}
      </div>
    </div>
  );
};

export default PickListPage;

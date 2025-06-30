
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Package, RefreshCcw } from "lucide-react";
import PickListDashboard from "../components/picking/PickListDashboard";
import PickListCreationWizard from "../components/picking/PickListCreationWizard";
import PickListItemProcessor from "../components/picking/PickListItemProcessor";
import PickListReviewSubmit from "../components/picking/PickListReviewSubmit";
import { createERPNextAPI } from "@/services/erpnextApi";
import { useToast } from "@/hooks/use-toast";

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
  const { toast } = useToast();

  const handleCreateNew = () => {
    setCurrentView("create");
  };

  const handleSelectPendingPickList = async (pickListId: string) => {
    try {
      const api = await createERPNextAPI();
      if (!api) {
        toast({
          title: "ERPNext Connection Error",
          description: "Please configure ERPNext settings",
          variant: "destructive"
        });
        return;
      }

      // Fetch the actual pick list from ERPNext
      const pickListData = await api.getPickList(pickListId);
      
      if (pickListData && pickListData.data) {
        const pickList = pickListData.data;
        setCurrentPickList({
          number: pickList.name,
          name: pickList.name,
          items: pickList.locations || []
        });
        setCurrentView("pick");
      } else {
        toast({
          title: "Error",
          description: "Failed to load pick list details",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error fetching pick list:', error);
      toast({
        title: "Error",
        description: "Failed to load pick list from ERPNext",
        variant: "destructive"
      });
    }
  };

  const handleCreatePickList = (pickListData: any) => {
    // The creation wizard will handle the ERPNext API call
    // and return the created pick list with items
    setCurrentPickList(pickListData);
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

  const handleSubmitPickList = async () => {
    try {
      const api = await createERPNextAPI();
      if (!api && currentPickList) {
        // Update the pick list with processed items
        const updateData = {
          locations: processedItems.map(item => ({
            item_code: item.item_code,
            item_name: item.item_name,
            qty: item.qty,
            picked_qty: item.picked_qty,
            warehouse: item.warehouse,
            bin: item.bin,
            batch_no: item.batch_no,
            serial_no: item.serial_no
          }))
        };

        await api.updatePickList(currentPickList.number, updateData);
        
        toast({
          title: "Pick List Updated",
          description: `${currentPickList.number} has been updated successfully`,
        });
      }
      
      handleBackToDashboard();
    } catch (error) {
      console.error('Error updating pick list:', error);
      toast({
        title: "Error",
        description: "Failed to update pick list in ERPNext",
        variant: "destructive"
      });
    }
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
                  {currentPickList.number || currentPickList.name}
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
            pickListNumber={currentPickList.number || currentPickList.name}
            pickListItems={currentPickList.items || []}
            onItemsProcessed={handleItemsProcessed}
            onBack={handleBackToCreate}
          />
        )}

        {currentView === "review" && currentPickList && (
          <PickListReviewSubmit
            pickListNumber={currentPickList.number || currentPickList.name}
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

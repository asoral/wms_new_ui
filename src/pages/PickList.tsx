
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ClipboardList } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PickListSelection from "@/components/picking/PickListSelection";
import PickingProcess from "@/components/picking/PickingProcess";
import HelpSection from "@/components/ui/help-section";

export type PickListStatus = "Draft" | "Open" | "Completed" | "Cancelled";
export type PickListPurpose = "Delivery" | "Material Issue" | "Material Transfer";

export interface PickListItem {
  itemCode: string;
  itemName: string;
  qty: number;
  pickedQty?: number;
  uom: string;
  warehouse: string;
  bin?: string;
  batchNo?: string;
  serialNo?: string;
  status?: "pending" | "picked" | "partially_picked";
}

export interface PickList {
  id: string;
  name: string;
  status: PickListStatus;
  createdDate: string;
  createdBy: string;
  items: PickListItem[];
  company: string;
  purpose?: PickListPurpose;
  relatedDocument?: string;
}

const PickListPage = () => {
  const [activeTab, setActiveTab] = useState<"selection" | "process">("selection");
  const [selectedPickList, setSelectedPickList] = useState<PickList | null>(null);
  const [pickLists, setPickLists] = useState<PickList[]>([]);

  const handleSelectPickList = (pickList: PickList) => {
    setSelectedPickList(pickList);
    setActiveTab("process");
  };

  const handleBackToSelection = () => {
    setSelectedPickList(null);
    setActiveTab("selection");
  };

  const showHelp = activeTab === "selection" && pickLists.length === 0;

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <ClipboardList className="w-6 h-6 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">Pick Lists</h1>
          </div>
        </div>

        {/* Help Section */}
        <div className="mb-6">
          <HelpSection
            show={showHelp}
            icon={<ClipboardList className="w-12 h-12" />}
            title="Manage Pick Lists"
            description="Select and process pick lists for efficient order fulfillment."
            steps={[
              "Select a pick list from available orders",
              "Review items and their locations",
              "Pick items using barcode scanning",
              "Mark items as picked and complete the process"
            ]}
          />
        </div>

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "selection" | "process")} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="selection">Pick List Selection</TabsTrigger>
            <TabsTrigger value="process" disabled={!selectedPickList}>Picking Process</TabsTrigger>
          </TabsList>
          
          <TabsContent value="selection">
            <PickListSelection onSelectPickList={handleSelectPickList} />
          </TabsContent>

          <TabsContent value="process">
            {selectedPickList && (
              <PickingProcess pickList={selectedPickList} onBack={handleBackToSelection} />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default PickListPage;

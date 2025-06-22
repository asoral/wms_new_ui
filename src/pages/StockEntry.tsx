
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Database } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Import components
import StockEntryDashboard from "@/components/stock-entry/StockEntryDashboard";
import StockEntryList from "@/components/stock-entry/StockEntryList";
import StockEntryFormImproved from "@/components/stock-entry/StockEntryFormImproved";
import StockEntryReview from "@/components/stock-entry/StockEntryReview";

export type StockEntryType = 
  | "Material Issue"
  | "Material Receipt" 
  | "Material Transfer"
  | "Manufacture"
  | "Repack"
  | "Send to Subcontractor"
  | "Material Transfer for Manufacture"
  | "Material Consumption for Manufacture"
  | "Receive at Warehouse"
  | "Send to Warehouse"
  | "Stock Reconciliation";

export type StockEntryStatus = "draft" | "submitted" | "cancelled";

export interface StockEntryItem {
  itemCode: string;
  itemName: string;
  qty: number;
  uom: string;
  rate?: number;
  warehouse?: string;
  fromWarehouse?: string;
  toWarehouse?: string;
  batch?: string;
  serial?: string;
}

export interface StockEntry {
  id: string;
  number: string;
  type: StockEntryType;
  status: StockEntryStatus;
  createdDate: string;
  createdBy: string;
  items: StockEntryItem[];
  totalValue?: number;
  purpose?: string;
}

const StockEntry = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [selectedType, setSelectedType] = useState<StockEntryType | null>(null);
  const [draftEntry, setDraftEntry] = useState<any | null>(null);

  const handleCreateNew = (type: StockEntryType) => {
    setSelectedType(type);
    setDraftEntry(null);
    setActiveTab("create");
  };

  const handleEditDraft = (draft: any) => {
    setSelectedType(draft.stock_entry_type as StockEntryType);
    setDraftEntry(draft);
    setActiveTab("create");
  };

  const handleDraftCreated = (draft: any) => {
    setDraftEntry(draft);
  };

  const handleReviewAndSubmit = () => {
    if (draftEntry) {
      setActiveTab("review");
    }
  };

  const handleBackToDashboard = () => {
    setActiveTab("dashboard");
    setSelectedType(null);
    setDraftEntry(null);
  };

  const handleSubmitComplete = () => {
    setActiveTab("dashboard");
    setSelectedType(null);
    setDraftEntry(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Database className="w-6 h-6 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Stock Entry</h1>
              {selectedType && (
                <p className="text-sm text-gray-600">
                  {selectedType}
                </p>
              )}
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="list">Entry List</TabsTrigger>
            <TabsTrigger value="create" disabled={!selectedType}>Create Entry</TabsTrigger>
            <TabsTrigger value="review" disabled={!draftEntry}>Review & Submit</TabsTrigger>
          </TabsList>
          
          <TabsContent value="dashboard">
            <StockEntryDashboard 
              onCreateNew={handleCreateNew} 
              onViewList={() => setActiveTab("list")}
              onEditDraft={handleEditDraft}
            />
          </TabsContent>

          <TabsContent value="list">
            <StockEntryList onCreateNew={handleCreateNew} />
          </TabsContent>

          <TabsContent value="create">
            {selectedType && (
              <StockEntryFormImproved
                type={selectedType}
                draftEntry={draftEntry}
                onDraftCreated={handleDraftCreated}
                onReviewAndSubmit={handleReviewAndSubmit}
                onBack={handleBackToDashboard}
              />
            )}
          </TabsContent>

          <TabsContent value="review">
            {draftEntry && (
              <StockEntryReview
                draftEntry={draftEntry}
                onSubmitComplete={handleSubmitComplete}
                onBack={() => setActiveTab("create")}
              />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default StockEntry;

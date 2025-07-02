
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Database } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Import components
import MaterialRequestDashboard from "@/components/material-request/MaterialRequestDashboard";
import MaterialRequestList from "@/components/material-request/MaterialRequestList";
import MaterialRequestForm from "@/components/material-request/MaterialRequestForm";
import MaterialRequestReview from "@/components/material-request/MaterialRequestReview";

export type MaterialRequestPurpose = "Purchase" | "Material Transfer" | "Material Issue" | "Manufacture";
export type MaterialRequestStatus = "draft" | "submitted" | "stopped" | "cancelled";

export interface MaterialRequestItem {
  itemCode: string;
  itemName: string;
  qty: number;
  uom: string;
  warehouse?: string;
  requiredDate?: string;
  description?: string;
}

export interface MaterialRequest {
  id: string;
  number: string;
  purpose: MaterialRequestPurpose;
  status: MaterialRequestStatus;
  createdDate: string;
  createdBy: string;
  items: MaterialRequestItem[];
  totalValue?: number;
  warehouse?: string;
}

const MaterialRequest = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [selectedPurpose, setSelectedPurpose] = useState<MaterialRequestPurpose | null>(null);
  const [draftRequest, setDraftRequest] = useState<any | null>(null);

  const handleCreateNew = (purpose: MaterialRequestPurpose) => {
    setSelectedPurpose(purpose);
    setDraftRequest(null);
    setActiveTab("create");
  };

  const handleEditDraft = (draft: any) => {
    setSelectedPurpose(draft.material_request_type as MaterialRequestPurpose);
    setDraftRequest(draft);
    setActiveTab("create");
  };

  const handleDraftCreated = (draft: any) => {
    setDraftRequest(draft);
  };

  const handleReviewAndSubmit = () => {
    if (draftRequest) {
      setActiveTab("review");
    }
  };

  const handleBackToDashboard = () => {
    setActiveTab("dashboard");
    setSelectedPurpose(null);
    setDraftRequest(null);
  };

  const handleSubmitComplete = () => {
    setActiveTab("dashboard");
    setSelectedPurpose(null);
    setDraftRequest(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Database className="w-6 h-6 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Material Request</h1>
              {selectedPurpose && (
                <p className="text-sm text-gray-600">
                  {selectedPurpose}
                </p>
              )}
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="list">Request List</TabsTrigger>
            <TabsTrigger value="create" disabled={!selectedPurpose}>Create Request</TabsTrigger>
            <TabsTrigger value="review" disabled={!draftRequest}>Review & Submit</TabsTrigger>
          </TabsList>
          
          <TabsContent value="dashboard">
            <MaterialRequestDashboard 
              onCreateNew={handleCreateNew}
              onEditDraft={handleEditDraft}
            />
          </TabsContent>

          <TabsContent value="list">
            <MaterialRequestList onCreateNew={handleCreateNew} />
          </TabsContent>

          <TabsContent value="create">
            {selectedPurpose && (
              <MaterialRequestForm
                draftRequest={draftRequest}
                onDraftCreated={handleDraftCreated}
                onReviewAndSubmit={handleReviewAndSubmit}
                onBack={handleBackToDashboard}
              />
            )}
          </TabsContent>

          <TabsContent value="review">
            {draftRequest && (
              <MaterialRequestReview
                draftRequest={draftRequest}
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

export default MaterialRequest;

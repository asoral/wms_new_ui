
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FileText, ArrowLeft } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Import components
import MaterialRequestDashboard from "@/components/material-request/MaterialRequestDashboard";
import MaterialRequestList from "@/components/material-request/MaterialRequestList";
// Import the new improved form
import MaterialRequestFormImproved from "@/components/material-request/MaterialRequestFormImproved";
import MaterialRequestReview from "@/components/material-request/MaterialRequestReview";

export type MaterialRequestPurpose = "Purchase" | "Material Transfer" | "Material Issue" | "Manufacture" | "Customer Provided";
export type MaterialRequestStatus = "Draft" | "Submitted" | "Stopped" | "Cancelled" | "Pending" | "Partially Ordered" | "Partially Received" | "Ordered" | "Issued" | "Transferred" | "Received";

export interface MaterialRequestItem {
  itemCode: string;
  itemName: string;
  qty: number;
  uom: string;
  warehouse?: string;
  fromWarehouse?: string;
  toWarehouse?: string;
  rate?: number;
  requiredBy?: string;
  description?: string;
  brand?: string;
  itemGroup?: string;
}

export interface MaterialRequest {
  id: string;
  name: string;
  purpose: MaterialRequestPurpose;
  status: MaterialRequestStatus;
  transactionDate: string;
  requiredBy?: string;
  requestedBy: string;
  company: string;
  costCenter?: string;
  project?: string;
  items: MaterialRequestItem[];
  totalValue?: number;
  remarks?: string;
  printHeading?: string;
}

const MaterialRequest = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [selectedPurpose, setSelectedPurpose] = useState<MaterialRequestPurpose | null>(null);
  const [draftRequest, setDraftRequest] = useState<MaterialRequest | null>(null);

  const handleCreateNew = (purpose: MaterialRequestPurpose) => {
    setSelectedPurpose(purpose);
    setDraftRequest(null);
    setActiveTab("create");
  };

  const handleDraftCreated = (draft: MaterialRequest) => {
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
            <FileText className="w-6 h-6 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Material Request</h1>
              {selectedPurpose && (
                <p className="text-sm text-gray-600">
                  {selectedPurpose} Request
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="create" disabled={!selectedPurpose}>
              Create MR
            </TabsTrigger>
            <TabsTrigger value="review" disabled={!draftRequest}>
              Review & Submit
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <MaterialRequestDashboard
              onCreateNew={handleCreateNew}
              onViewList={() => {}}
            />
          </TabsContent>

          <TabsContent value="create">
            {selectedPurpose && (
              <MaterialRequestFormImproved
                purpose={selectedPurpose}
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

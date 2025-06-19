
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FileText, ArrowLeft } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Import components
import MaterialRequestDashboard from "@/components/material-request/MaterialRequestDashboard";
import MaterialRequestList from "@/components/material-request/MaterialRequestList";
import MaterialRequestForm from "@/components/material-request/MaterialRequestForm";

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
  title?: string;
  purpose: MaterialRequestPurpose;
  status: MaterialRequestStatus;
  transactionDate: string;
  requiredBy?: string;
  requestedBy: string;
  company: string;
  costCenter?: string;
  project?: string;
  priority: "Low" | "Medium" | "High" | "Urgent";
  items: MaterialRequestItem[];
  totalValue?: number;
  remarks?: string;
  printHeading?: string;
}

const MaterialRequest = () => {
  const [currentView, setCurrentView] = useState<"dashboard" | "list" | "form">("dashboard");
  const [selectedPurpose, setSelectedPurpose] = useState<MaterialRequestPurpose | null>(null);
  const [editingRequest, setEditingRequest] = useState<MaterialRequest | null>(null);

  const handleCreateNew = (purpose: MaterialRequestPurpose) => {
    setSelectedPurpose(purpose);
    setEditingRequest(null);
    setCurrentView("form");
  };

  const handleEditRequest = (request: MaterialRequest) => {
    setEditingRequest(request);
    setSelectedPurpose(request.purpose);
    setCurrentView("form");
  };

  const handleBackToDashboard = () => {
    setCurrentView("dashboard");
    setSelectedPurpose(null);
    setEditingRequest(null);
  };

  const handleBackToList = () => {
    setCurrentView("list");
    setSelectedPurpose(null);
    setEditingRequest(null);
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case "dashboard":
        return (
          <MaterialRequestDashboard
            onCreateNew={handleCreateNew}
            onViewList={() => setCurrentView("list")}
          />
        );
      
      case "list":
        return (
          <MaterialRequestList
            onCreateNew={handleCreateNew}
            onEditRequest={handleEditRequest}
            onBackToDashboard={handleBackToDashboard}
          />
        );
      
      case "form":
        return selectedPurpose ? (
          <MaterialRequestForm
            purpose={selectedPurpose}
            editingRequest={editingRequest}
            onBack={currentView === "list" ? handleBackToList : handleBackToDashboard}
            onSave={() => {
              // After saving, go back to appropriate view
              if (editingRequest) {
                handleBackToList();
              } else {
                handleBackToDashboard();
              }
            }}
          />
        ) : null;
      
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            {currentView !== "dashboard" && (
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={currentView === "form" ? 
                  (editingRequest ? handleBackToList : handleBackToDashboard) : 
                  handleBackToDashboard
                }
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
            )}
            <FileText className="w-6 h-6 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Material Request</h1>
              {currentView === "form" && selectedPurpose && (
                <p className="text-sm text-gray-600">
                  {editingRequest ? `Edit ${selectedPurpose} Request` : `Create ${selectedPurpose} Request`}
                </p>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          {currentView === "dashboard" && (
            <div className="flex space-x-2">
              <Button variant="outline" onClick={() => setCurrentView("list")}>
                View All Requests
              </Button>
            </div>
          )}
        </div>

        {/* Main Content */}
        {renderCurrentView()}
      </div>
    </div>
  );
};

export default MaterialRequest;

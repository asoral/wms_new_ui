
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Plus, RefreshCcw } from "lucide-react";
import MaterialRequestList from "../components/material-request/MaterialRequestList";
import MaterialRequestForm from "../components/material-request/MaterialRequestForm";

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
}

export interface MaterialRequest {
  id: string;
  number: string;
  purpose: MaterialRequestPurpose;
  status: MaterialRequestStatus;
  createdDate: string;
  requestedBy: string;
  items: MaterialRequestItem[];
  totalValue?: number;
}

const MaterialRequestPage = () => {
  const [currentView, setCurrentView] = useState<"list" | "create">("list");
  const [selectedPurpose, setSelectedPurpose] = useState<MaterialRequestPurpose>("Purchase");

  const handleCreateNew = (purpose: MaterialRequestPurpose) => {
    setSelectedPurpose(purpose);
    setCurrentView("create");
  };

  const handleBackToList = () => {
    setCurrentView("list");
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <FileText className="w-6 h-6 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">Material Request</h1>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="icon">
              <RefreshCcw className="w-4 h-4" />
            </Button>
            {currentView === "list" && (
              <Button onClick={() => setCurrentView("create")}>
                <Plus className="w-4 h-4 mr-2" />
                Create New
              </Button>
            )}
          </div>
        </div>

        {/* Content */}
        {currentView === "list" && (
          <MaterialRequestList onCreateNew={handleCreateNew} />
        )}

        {currentView === "create" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Create Material Request</h2>
              <Button variant="outline" onClick={handleBackToList}>
                Back to List
              </Button>
            </div>
            <MaterialRequestForm 
              purpose={selectedPurpose}
              onBack={handleBackToList}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default MaterialRequestPage;

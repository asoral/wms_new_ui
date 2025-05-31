
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, RefreshCcw, Plus, TrendingUp, AlertTriangle } from "lucide-react";
import QualityDashboard from "../components/quality-check/QualityDashboard";
import QualityInspectionList from "../components/quality-check/QualityInspectionList";
import QualityInspectionForm from "../components/quality-check/QualityInspectionForm";

export type QualityInspectionStatus = "Draft" | "Submitted" | "Accepted" | "Rejected" | "Cancelled";
export type InspectionType = "Incoming" | "Outgoing" | "In Process";

export interface QualityParameter {
  id: string;
  parameter: string;
  specification: string;
  acceptanceCriteria: string;
  reading?: string;
  status?: "Pass" | "Fail" | "Pending";
}

export interface QualityInspection {
  id: string;
  number: string;
  itemCode: string;
  itemName: string;
  batchSerial?: string;
  inspectionType: InspectionType;
  status: QualityInspectionStatus;
  inspectedBy?: string;
  inspectionDate: string;
  parameters: QualityParameter[];
  remarks?: string;
  overallResult?: "Pass" | "Fail";
}

const QualityCheckPage = () => {
  const [currentView, setCurrentView] = useState<"dashboard" | "list" | "create">("dashboard");
  const [selectedInspection, setSelectedInspection] = useState<QualityInspection | null>(null);

  const handleCreateNew = () => {
    setSelectedInspection(null);
    setCurrentView("create");
  };

  const handleEditInspection = (inspection: QualityInspection) => {
    setSelectedInspection(inspection);
    setCurrentView("create");
  };

  const handleBackToDashboard = () => {
    setCurrentView("dashboard");
    setSelectedInspection(null);
  };

  const handleViewList = () => {
    setCurrentView("list");
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <CheckCircle className="w-6 h-6 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">Quality Check</h1>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="icon">
              <RefreshCcw className="w-4 h-4" />
            </Button>
            {currentView !== "create" && (
              <Button onClick={handleCreateNew}>
                <Plus className="w-4 h-4 mr-2" />
                New Inspection
              </Button>
            )}
          </div>
        </div>

        {/* Navigation */}
        {currentView !== "dashboard" && (
          <div className="flex items-center space-x-2 mb-6">
            <Button 
              variant={currentView === "dashboard" ? "default" : "outline"}
              onClick={handleBackToDashboard}
            >
              Dashboard
            </Button>
            <Button 
              variant={currentView === "list" ? "default" : "outline"}
              onClick={handleViewList}
            >
              Inspections
            </Button>
          </div>
        )}

        {/* Content */}
        {currentView === "dashboard" && (
          <QualityDashboard 
            onViewList={handleViewList}
            onCreateNew={handleCreateNew}
          />
        )}

        {currentView === "list" && (
          <QualityInspectionList 
            onCreateNew={handleCreateNew}
            onEditInspection={handleEditInspection}
          />
        )}

        {currentView === "create" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">
                {selectedInspection ? "Edit Quality Inspection" : "Create Quality Inspection"}
              </h2>
              <Button variant="outline" onClick={handleBackToDashboard}>
                Back to Dashboard
              </Button>
            </div>
            <QualityInspectionForm 
              inspection={selectedInspection}
              onBack={handleBackToDashboard}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default QualityCheckPage;

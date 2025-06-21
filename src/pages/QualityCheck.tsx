
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Shield, ArrowLeft } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import QualityDashboard from "@/components/quality-check/QualityDashboard";
import QualityInspectionForm from "@/components/quality-check/QualityInspectionForm";
import QualityInspectionList from "@/components/quality-check/QualityInspectionList";
import HelpSection from "@/components/ui/help-section";

export type QualityStatus = "Draft" | "Submitted" | "Accepted" | "Rejected" | "Cancelled";

export interface QualityParameter {
  parameter: string;
  specification: string;
  actualValue?: string;
  status: "Pass" | "Fail" | "Pending";
  remarks?: string;
}

export interface QualityInspection {
  id: string;
  number: string;
  itemCode: string;
  itemName: string;
  batchNo?: string;
  status: QualityStatus;
  inspectionDate: string;
  inspector: string;
  supplier?: string;
  purchaseReceipt?: string;
  parameters: QualityParameter[];
  overallResult: "Pass" | "Fail" | "Pending";
  remarks?: string;
}

const QualityCheck = () => {
  const [currentView, setCurrentView] = useState<"dashboard" | "list" | "form">("dashboard");
  const [selectedInspection, setSelectedInspection] = useState<QualityInspection | null>(null);
  const [qualityInspections, setQualityInspections] = useState<QualityInspection[]>([]);

  const handleCreateNew = () => {
    setSelectedInspection(null);
    setCurrentView("form");
  };

  const handleEditInspection = (inspection: QualityInspection) => {
    setSelectedInspection(inspection);
    setCurrentView("form");
  };

  const handleBackToDashboard = () => {
    setCurrentView("dashboard");
    setSelectedInspection(null);
  };

  const handleViewList = () => {
    setCurrentView("list");
  };

  const showHelp = currentView === "dashboard";

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
                onClick={handleBackToDashboard}
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
            )}
            <Shield className="w-6 h-6 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Quality Check</h1>
              {selectedInspection && (
                <p className="text-sm text-gray-600">
                  {selectedInspection.number} - {selectedInspection.itemName}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Help Section */}
        <div className="mb-6">
          <HelpSection
            show={showHelp}
            icon={<Shield className="w-12 h-12" />}
            title="Quality Control Management"
            description="Perform quality inspections to ensure product standards."
            steps={[
              "Create quality inspections for incoming materials",
              "Define inspection parameters and specifications",
              "Record actual measurements and test results",
              "Approve or reject materials based on quality standards"
            ]}
          />
        </div>

        {/* Content */}
        {currentView === "dashboard" && (
          <QualityDashboard
            onCreateNew={handleCreateNew}
            onViewList={handleViewList}
          />
        )}

        {currentView === "list" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Quality Inspections</h2>
              <div className="flex space-x-2">
                <Button onClick={handleCreateNew}>
                  Create Inspection
                </Button>
                <Button variant="outline" onClick={handleBackToDashboard}>
                  Back to Dashboard
                </Button>
              </div>
            </div>
            <QualityInspectionList 
              onEditInspection={handleEditInspection}
            />
          </div>
        )}

        {currentView === "form" && (
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
              onSave={() => {
                // Handle save logic
                handleBackToDashboard();
              }}
              onCancel={handleBackToDashboard}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default QualityCheck;


import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle, ArrowLeft } from "lucide-react";
import QualityDashboard from "@/components/quality-check/QualityDashboard";
import QualityInspectionList from "@/components/quality-check/QualityInspectionList";
import QualityInspectionForm from "@/components/quality-check/QualityInspectionForm";
import HelpSection from "@/components/ui/help-section";

export type InspectionType = "Incoming" | "In-Process" | "Outgoing";
export type InspectionStatus = "Pending" | "Pass" | "Fail";

export interface QualityParameter {
  parameter: string;
  specification: string;
  acceptanceValue: string;
  reading: string;
  value: string;
  status: InspectionStatus;
}

export interface QualityInspection {
  id: string;
  name: string;
  itemCode: string;
  itemName: string;
  inspectionType: InspectionType;
  status: InspectionStatus;
  inspectedBy: string;
  inspectionDate: string;
  batchNo?: string;
  parameters: QualityParameter[];
  remarks?: string;
}

const QualityCheck = () => {
  const [currentView, setCurrentView] = useState<"dashboard" | "list" | "form">("dashboard");
  const [selectedInspection, setSelectedInspection] = useState<QualityInspection | null>(null);

  const handleCreateNew = () => {
    setSelectedInspection(null);
    setCurrentView("form");
  };

  const handleViewList = () => {
    setCurrentView("list");
  };

  const handleEditInspection = (inspection: QualityInspection) => {
    setSelectedInspection(inspection);
    setCurrentView("form");
  };

  const handleBackToDashboard = () => {
    setCurrentView("dashboard");
    setSelectedInspection(null);
  };

  const handleBackToList = () => {
    setCurrentView("list");
    setSelectedInspection(null);
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
                onClick={currentView === "form" ? 
                  (selectedInspection ? handleBackToList : handleBackToDashboard) : 
                  handleBackToDashboard
                }
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
            )}
            <CheckCircle className="w-6 h-6 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">Quality Check</h1>
          </div>
        </div>

        {/* Content */}
        {currentView === "dashboard" && (
          <QualityDashboard onCreateNew={handleCreateNew} />
        )}

        {currentView === "list" && (
          <QualityInspectionList
            onCreateNew={handleCreateNew}
            onEditInspection={handleEditInspection} 
          />
        )}

        {currentView === "form" && (
          <QualityInspectionForm
            initialData={selectedInspection}
            onSave={() => selectedInspection ? handleBackToList() : handleBackToDashboard()}
            onCancel={() => selectedInspection ? handleBackToList() : handleBackToDashboard()}
          />
        )}

        {/* Help Section - moved to bottom */}
        <div className="mt-8">
          <HelpSection
            show={showHelp}
            icon={<CheckCircle className="w-12 h-12" />}
            title="Quality Inspections"
            description="Perform quality checks and inspections to ensure product standards."
            steps={[
              "Create new quality inspections",
              "Define inspection parameters",
              "Record measurements and readings",
              "Submit inspection results"
            ]}
          />
        </div>
      </div>
    </div>
  );
};

export default QualityCheck;


import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TestTube, RefreshCcw, CheckCircle, XCircle, Clock, BarChart3 } from "lucide-react";
import QualityDashboard from "../components/quality-check/QualityDashboard";
import QualityInspectionList from "../components/quality-check/QualityInspectionList";
import QualityInspectionForm from "../components/quality-check/QualityInspectionForm";

export interface QualityParameter {
  id: string;
  parameter: string;
  specification: string;
  acceptanceCriteria: string;
  reading?: string;
  value: string;
  numericValue?: number;
  status: "Accepted" | "Rejected" | "Pending";
  remarks?: string;
}

export interface QualityInspection {
  id: string;
  number: string;
  itemCode: string;
  itemName: string;
  batchSerial?: string;
  warehouse: string;
  inspectionType: "Incoming" | "In-Process" | "Final" | "Customer Return";
  status: "Draft" | "Submitted" | "Cancelled";
  createdDate: string;
  inspectedBy?: string;
  inspectionDate: string;
  overallResult?: "Pass" | "Fail" | "Pending";
  remarks?: string;
  parameters: QualityParameter[];
}

export type InspectionType = "Incoming" | "In-Process" | "Final" | "Customer Return";

const QualityCheckPage = () => {
  const [currentView, setCurrentView] = useState<"dashboard" | "list" | "create">("dashboard");
  const [selectedInspection, setSelectedInspection] = useState<QualityInspection | null>(null);

  const dashboardData = {
    qcWaiting: 8,
    qcFailed: 3,
    qcCompleted: 45,
    qcTesting: 12,
    successRate: 92.5,
    mostTestedItem: "Raw Material A",
    mostRejectedItem: "Component B"
  };

  const handleBackToDashboard = () => {
    setCurrentView("dashboard");
    setSelectedInspection(null);
  };

  const handleBackToList = () => {
    setCurrentView("list");
    setSelectedInspection(null);
  };

  const handleViewInspections = () => {
    setCurrentView("list");
  };

  const handleCreateInspection = () => {
    setCurrentView("create");
    setSelectedInspection(null);
  };

  const handleEditInspection = (inspection: QualityInspection) => {
    setSelectedInspection(inspection);
    setCurrentView("create");
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
          <div className="flex items-center space-x-3">
            <TestTube className="w-6 h-6 text-purple-600" />
            <h1 className="text-2xl font-bold text-gray-900">Quality Check</h1>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="icon">
              <RefreshCcw className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        {currentView === "dashboard" && (
          <div className="space-y-6">
            <QualityDashboard 
              data={dashboardData}
              onViewInspections={handleViewInspections}
              onCreateInspection={handleCreateInspection}
            />
          </div>
        )}

        {currentView === "list" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <h2 className="text-xl font-semibold">Quality Inspections</h2>
              <div className="flex space-x-2">
                <Button onClick={handleCreateInspection}>
                  New Inspection
                </Button>
                <Button variant="outline" onClick={handleBackToDashboard}>
                  Back to Dashboard
                </Button>
              </div>
            </div>
            <QualityInspectionList 
              onCreateNew={handleCreateInspection}
              onEditInspection={handleEditInspection} 
            />
          </div>
        )}

        {currentView === "create" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <h2 className="text-xl font-semibold">
                {selectedInspection ? "Edit Inspection" : "Create Quality Inspection"}
              </h2>
              <Button variant="outline" onClick={handleBackToList}>
                Back to List
              </Button>
            </div>
            <QualityInspectionForm 
              inspection={selectedInspection}
              onBack={() => handleBackToList()}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default QualityCheckPage;

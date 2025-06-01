
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClipboardCheck, RefreshCcw, Plus } from "lucide-react";
import QualityDashboard from "../components/quality-check/QualityDashboard";
import QualityInspectionList from "../components/quality-check/QualityInspectionList";
import QualityInspectionForm from "../components/quality-check/QualityInspectionForm";

export interface QualityInspection {
  id: string;
  inspectionType: string;
  referenceType: "Item" | "Job Card" | "Batch" | "Serial No";
  referenceName: string;
  itemCode: string;
  itemName: string;
  status: "Draft" | "Submitted" | "Cancelled";
  inspectionDate: string;
  inspector: string;
  parameters: QualityParameter[];
}

export interface QualityParameter {
  specification: string;
  value: string;
  numericValue?: number;
  status: "Accepted" | "Rejected" | "Pending";
  remarks?: string;
}

const QualityCheck = () => {
  const [currentView, setCurrentView] = useState<"dashboard" | "list" | "create">("dashboard");
  const [selectedInspection, setSelectedInspection] = useState<QualityInspection | null>(null);

  const dashboardData = {
    qcWaiting: 8,
    qcFailed: 3,
    qcCompleted: 156,
    qcTesting: 5,
    successRate: 94.2,
    mostTestedItem: "Laptop Dell Inspiron",
    mostRejectedItem: "USB Cable Type-C"
  };

  const handleSelectInspection = (inspection: QualityInspection) => {
    setSelectedInspection(inspection);
    setCurrentView("create");
  };

  const handleCreateNew = () => {
    setSelectedInspection(null);
    setCurrentView("create");
  };

  const handleBackToDashboard = () => {
    setCurrentView("dashboard");
    setSelectedInspection(null);
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
            <ClipboardCheck className="w-6 h-6 text-green-600" />
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
              onViewInspections={() => setCurrentView("list")}
              onCreateInspection={handleCreateNew}
            />
          </div>
        )}

        {currentView === "list" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h2 className="text-xl font-semibold">Quality Inspections</h2>
              <div className="flex flex-col sm:flex-row gap-2">
                <Button variant="outline" onClick={handleBackToDashboard}>
                  Back to Dashboard
                </Button>
                <Button onClick={handleCreateNew} className="flex items-center space-x-2">
                  <Plus className="w-4 h-4" />
                  <span>Create New</span>
                </Button>
              </div>
            </div>
            <QualityInspectionList onSelectInspection={handleSelectInspection} />
          </div>
        )}

        {currentView === "create" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h2 className="text-xl font-semibold">
                {selectedInspection ? "Edit Inspection" : "Create Quality Inspection"}
              </h2>
              <Button variant="outline" onClick={handleBackToList}>
                Back to List
              </Button>
            </div>
            <QualityInspectionForm 
              inspection={selectedInspection}
              onBack={handleBackToList}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default QualityCheck;

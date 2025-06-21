
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Shield } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import QualityDashboard from "@/components/quality-check/QualityDashboard";
import QualityInspectionList from "@/components/quality-check/QualityInspectionList";
import QualityInspectionForm from "@/components/quality-check/QualityInspectionForm";
import HelpSection from "@/components/ui/help-section";

export type InspectionType = "Incoming" | "Outgoing" | "In Process";
export type InspectionStatus = "Draft" | "Submitted" | "Accepted" | "Rejected";

export interface QualityParameter {
  id: string;
  parameter: string;
  specification: string;
  acceptanceValue: string;
  acceptanceCriteria: string;
  status: "Pass" | "Fail" | "Pending";
  actualValue?: string;
  reading?: string;
  value?: string;
  remarks?: string;
}

export interface QualityInspection {
  id: string;
  name: string;
  inspectionType: InspectionType;
  itemCode: string;
  itemName: string;
  batchNo?: string;
  batchSerial?: string;
  serialNo?: string;
  qty: number;
  uom: string;
  inspectionDate: string;
  inspector: string;
  inspectedBy: string;
  status: InspectionStatus;
  parameters: QualityParameter[];
  overallResult: "Accepted" | "Rejected" | "Pending";
  remarks?: string;
}

const QualityCheckPage = () => {
  const [activeTab, setActiveTab] = useState<"dashboard" | "list" | "form">("dashboard");
  const [selectedInspection, setSelectedInspection] = useState<QualityInspection | null>(null);
  const [inspections, setInspections] = useState<QualityInspection[]>([]);

  const handleCreateNew = () => {
    setSelectedInspection(null);
    setActiveTab("form");
  };

  const handleEditInspection = (inspection: QualityInspection) => {
    setSelectedInspection(inspection);
    setActiveTab("form");
  };

  const handleBackToDashboard = () => {
    setActiveTab("dashboard");
    setSelectedInspection(null);
  };

  const handleBackToList = () => {
    setActiveTab("list");
    setSelectedInspection(null);
  };

  const showHelp = activeTab === "dashboard" && inspections.length === 0;

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Shield className="w-6 h-6 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">Quality Check</h1>
          </div>
        </div>

        {/* Help Section */}
        <div className="mb-6">
          <HelpSection
            show={showHelp}
            icon={<Shield className="w-12 h-12" />}
            title="Manage Quality Inspections"
            description="Perform quality checks and inspections for incoming and outgoing materials."
            steps={[
              "Create quality inspection templates",
              "Select items for inspection",
              "Record measurement values",
              "Accept or reject based on criteria"
            ]}
          />
        </div>

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "dashboard" | "list" | "form")} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="list">Inspections</TabsTrigger>
            <TabsTrigger value="form">New Inspection</TabsTrigger>
          </TabsList>
          
          <TabsContent value="dashboard">
            <QualityDashboard 
              onCreateNew={handleCreateNew}
              onViewList={() => setActiveTab("list")}
            />
          </TabsContent>

          <TabsContent value="list">
            <QualityInspectionList 
              onCreateNew={handleCreateNew}
              onEditInspection={handleEditInspection}
              onBackToDashboard={handleBackToDashboard}
            />
          </TabsContent>

          <TabsContent value="form">
            <QualityInspectionForm 
              editingInspection={selectedInspection}
              onBack={selectedInspection ? handleBackToList : handleBackToDashboard}
              onSave={() => {
                if (selectedInspection) {
                  handleBackToList();
                } else {
                  handleBackToDashboard();
                }
              }}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default QualityCheckPage;

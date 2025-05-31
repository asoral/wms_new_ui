
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Database, RefreshCcw, Plus } from "lucide-react";
import StockEntryList from "../components/stock-entry/StockEntryList";
import StockEntryForm from "../components/stock-entry/StockEntryForm";

export type StockEntryType = "Material Issue" | "Material Receipt" | "Material Transfer" | "Manufacture" | "Repack" | "Send to Subcontractor" | "Material Transfer for Manufacture" | "Material Consumption for Manufacture" | "Receive at Warehouse" | "Send to Warehouse";

export type StockEntryStatus = "Draft" | "Submitted" | "Cancelled";

export interface StockEntryItem {
  itemCode: string;
  itemName: string;
  fromWarehouse?: string;
  toWarehouse?: string;
  qty: number;
  uom: string;
  rate?: number;
  batch?: string;
  serial?: string;
}

export interface StockEntry {
  id: string;
  number: string;
  type: StockEntryType;
  status: StockEntryStatus;
  createdDate: string;
  createdBy: string;
  items: StockEntryItem[];
  totalValue?: number;
  purpose?: string;
}

const StockEntryPage = () => {
  const [currentView, setCurrentView] = useState<"list" | "create">("list");
  const [selectedType, setSelectedType] = useState<StockEntryType>("Material Issue");

  const handleCreateNew = (type: StockEntryType) => {
    setSelectedType(type);
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
            <Database className="w-6 h-6 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">Stock Entry</h1>
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
          <StockEntryList onCreateNew={handleCreateNew} />
        )}

        {currentView === "create" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Create Stock Entry</h2>
              <Button variant="outline" onClick={handleBackToList}>
                Back to List
              </Button>
            </div>
            <StockEntryForm 
              type={selectedType}
              onBack={handleBackToList}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default StockEntryPage;

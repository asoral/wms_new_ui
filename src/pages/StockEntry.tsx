import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Database, Plus, TrendingUp, TrendingDown, ArrowRightLeft, Eye } from "lucide-react";
import StockEntryForm from "../components/stock-entry/StockEntryForm";
import StockEntryList from "../components/stock-entry/StockEntryList";

export type StockEntryType = 
  | "Material Issue"
  | "Material Receipt" 
  | "Material Transfer"
  | "Manufacture"
  | "Repack"
  | "Send to Subcontractor"
  | "Material Transfer for Manufacture"
  | "Material Consumption for Manufacture"
  | "Receive at Warehouse"
  | "Send to Warehouse"
  | "Stock Reconciliation";

export type StockEntryStatus = "draft" | "submitted" | "cancelled";

export interface StockEntryItem {
  itemCode: string;
  itemName: string;
  qty: number;
  uom: string;
  rate?: number;
  warehouse?: string;
  fromWarehouse?: string;
  toWarehouse?: string;
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

const StockEntry = () => {
  const [activeTab, setActiveTab] = useState<"list" | "form">("list");
  const [selectedType, setSelectedType] = useState<StockEntryType | null>(null);

  const handleCreateNew = (type: StockEntryType) => {
    setSelectedType(type);
    setActiveTab("form");
  };

  const handleBackToList = () => {
    setSelectedType(null);
    setActiveTab("list");
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
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="list">
              <TrendingUp className="w-4 h-4 mr-2" />
              Stock Entry List
            </TabsTrigger>
            <TabsTrigger value="form" disabled={!selectedType}>
              <Plus className="w-4 h-4 mr-2" />
              Create New Entry
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="list">
            <StockEntryList onCreateNew={handleCreateNew} />
          </TabsContent>

          <TabsContent value="form">
            {selectedType && (
              <StockEntryForm type={selectedType} onBack={handleBackToList} />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default StockEntry;

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Plus, TrendingUp, TrendingDown, ArrowRightLeft } from "lucide-react";
import MaterialRequestForm from "../components/material-request/MaterialRequestForm";
import MaterialRequestList from "../components/material-request/MaterialRequestList";

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

const MaterialRequest = () => {
  const [showForm, setShowForm] = useState(false);
  const [selectedPurpose, setSelectedPurpose] = useState<MaterialRequestPurpose | null>(null);

  const handleCreateNew = (purpose: MaterialRequestPurpose) => {
    setSelectedPurpose(purpose);
    setShowForm(true);
  };

  const handleBackToList = () => {
    setShowForm(false);
    setSelectedPurpose(null);
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
        </div>

        {!showForm ? (
          <MaterialRequestList onCreateNew={handleCreateNew} />
        ) : (
          <MaterialRequestForm purpose={selectedPurpose!} onBack={handleBackToList} />
        )}
      </div>
    </div>
  );
};

export default MaterialRequest;

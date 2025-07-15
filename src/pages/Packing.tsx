
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package2, RefreshCcw, Plus } from "lucide-react";
import PackingSlipList from "../components/packing/PackingSlipList";
import PackingSlipForm from "../components/packing/PackingSlipForm";

export interface PackingSlipItem {
  itemCode: string;
  itemName: string;
  qty: number;
  uom: string;
  description?: string;
  netWeight?: number;
  grossWeight?: number;
}

export interface PackingSlip {
  id: string;
  number: string;
  deliveryNote: string;
  customer: string;
  createdDate: string;
  status: "Draft" | "Submitted";
  items: PackingSlipItem[];
  totalPackages: number;
  totalWeight: number;
  shippingAddress: string;
}

const PackingPage = () => {
  const [currentView, setCurrentView] = useState<"list" | "create">("list");
  const [selectedDeliveryNote, setSelectedDeliveryNote] = useState<string>("");

  const handleCreateNew = (deliveryNote?: string) => {
    if (deliveryNote) {
      setSelectedDeliveryNote(deliveryNote);
    }
    setCurrentView("create");
  };

  const handleBackToList = () => {
    setCurrentView("list");
    setSelectedDeliveryNote("");
  };

  return (
    <div className="w-full max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div className="flex items-center space-x-3">
          <Package2 className="w-6 h-6 text-blue-600" />
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">Packing</h1>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="icon">
            <RefreshCcw className="w-4 h-4" />
          </Button>
          {currentView === "list" && (
            <Button onClick={() => handleCreateNew()}>
              <Plus className="w-4 h-4 mr-2" />
              Create Packing Slip
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      {currentView === "list" && (
        <PackingSlipList onCreateNew={handleCreateNew} />
      )}

      {currentView === "create" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="text-lg md:text-xl font-semibold">Create Packing Slip</h2>
            <Button variant="outline" onClick={handleBackToList}>
              Back to List
            </Button>
          </div>
          <PackingSlipForm 
            deliveryNote={selectedDeliveryNote}
            onBack={handleBackToList}
          />
        </div>
      )}
    </div>
  );
};

export default PackingPage;

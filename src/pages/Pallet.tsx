
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Package } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PalletCreator from "@/components/pallet/PalletCreator";
import PalletDepalletizer from "@/components/pallet/PalletDepalletizer";
import PalletMover from "@/components/pallet/PalletMover";
import PalletScanner from "@/components/pallet/PalletScanner";
import HelpSection from "@/components/ui/help-section";

export interface PalletItem {
  itemCode: string;
  itemName: string;
  qty: number;
  uom: string;
  batchNo?: string;
  serialNo?: string;
  warehouse?: string;
}

export interface Pallet {
  id: string;
  name: string;
  status: "Active" | "Moved" | "Depalletized";
  createdDate: string;
  location: string;
  items: PalletItem[];
}

const PalletPage = () => {
  const [activeTab, setActiveTab] = useState<"creator" | "scanner" | "mover" | "depalletizer">("creator");
  const [pallets, setPallets] = useState<Pallet[]>([]);
  const [selectedPallet, setSelectedPallet] = useState<Pallet | null>(null);

  const handlePalletScanned = (palletCode: string) => {
    // Mock pallet lookup - in real app this would fetch from API
    const mockPallet: Pallet = {
      id: palletCode,
      name: palletCode,
      status: "Active",
      createdDate: new Date().toISOString(),
      location: "Warehouse A",
      items: []
    };
    setSelectedPallet(mockPallet);
  };

  const showHelp = activeTab === "creator" && pallets.length === 0;

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Package className="w-6 h-6 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">Pallet Management</h1>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "creator" | "scanner" | "mover" | "depalletizer")} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="creator">Create Pallet</TabsTrigger>
            <TabsTrigger value="scanner">Scan Pallet</TabsTrigger>
            <TabsTrigger value="mover">Move Pallet</TabsTrigger>
            <TabsTrigger value="depalletizer">Depalletize</TabsTrigger>
          </TabsList>
          
          <TabsContent value="creator">
            <PalletCreator />
          </TabsContent>

          <TabsContent value="scanner">
            <PalletScanner onPalletScanned={handlePalletScanned} />
          </TabsContent>

          <TabsContent value="mover">
            <PalletMover pallet={selectedPallet} />
          </TabsContent>

          <TabsContent value="depalletizer">
            <PalletDepalletizer pallet={selectedPallet} />
          </TabsContent>
        </Tabs>

        {/* Help Section - moved to bottom */}
        <div className="mt-8">
          <HelpSection
            show={showHelp}
            icon={<Package className="w-12 h-12" />}
            title="Manage Pallets"
            description="Create, move, and manage pallets for efficient warehouse operations."
            steps={[
              "Create new pallets by adding items",
              "Scan pallets to view contents",
              "Move pallets between locations",
              "Depalletize to break down pallets"
            ]}
          />
        </div>
      </div>
    </div>
  );
};

export default PalletPage;


import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Package, ArrowLeft } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PalletCreator from "@/components/pallet/PalletCreator";
import PalletMover from "@/components/pallet/PalletMover";
import PalletDepalletizer from "@/components/pallet/PalletDepalletizer";
import PalletScanner from "@/components/pallet/PalletScanner";
import HelpSection from "@/components/ui/help-section";

export interface PalletItem {
  itemCode: string;
  itemName: string;
  qty: number;
  uom: string;
  warehouse: string;
  batchNo?: string;
  serialNo?: string;
}

export interface Pallet {
  id: string;
  palletId: string;
  barcode: string;
  location: string;
  status: "Active" | "Moved" | "Depalletized";
  createdDate: string;
  items: PalletItem[];
  totalWeight?: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
}

const PalletPage = () => {
  const [activeTab, setActiveTab] = useState<"create" | "move" | "depalletize" | "scan">("create");
  const [pallets, setPallets] = useState<Pallet[]>([]);

  const showHelp = pallets.length === 0 && activeTab === "create";

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

        {/* Help Section */}
        <div className="mb-6">
          <HelpSection
            show={showHelp}
            icon={<Package className="w-12 h-12" />}
            title="Manage Pallet Operations"
            description="Create, move, and organize pallets for efficient warehouse operations."
            steps={[
              "Create new pallets and add items to them",
              "Move pallets between warehouse locations",
              "Depalletize to break down pallet contents",
              "Scan existing pallets to view details"
            ]}
          />
        </div>

        {/* Content */}
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="create">Create Pallet</TabsTrigger>
            <TabsTrigger value="move">Move Pallet</TabsTrigger>
            <TabsTrigger value="depalletize">Depalletize</TabsTrigger>
            <TabsTrigger value="scan">Scan Pallet</TabsTrigger>
          </TabsList>
          
          <TabsContent value="create" className="mt-6">
            <PalletCreator />
          </TabsContent>

          <TabsContent value="move" className="mt-6">
            <PalletMover />
          </TabsContent>

          <TabsContent value="depalletize" className="mt-6">
            <PalletDepalletizer />
          </TabsContent>

          <TabsContent value="scan" className="mt-6">
            <PalletScanner />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default PalletPage;

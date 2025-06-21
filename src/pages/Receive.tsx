
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Truck, ArrowLeft, FileText } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ReceiveDashboard from "@/components/receive/ReceiveDashboard";
import ReceiveForm from "@/components/receive/ReceiveForm";
import POSelector from "@/components/receive/POSelector";
import HelpSection from "@/components/ui/help-section";
import { createERPNextAPI, getUserDefaultCompany } from "@/services/erpnextApi";
import { useToast } from "@/hooks/use-toast";

export interface PurchaseOrderOption {
  value: string;
  label: string;
  supplier: string;
  supplier_name: string;
  transaction_date: string;
  delivery_date: string;
  grand_total: number;
  status: string;
}

export interface POItem {
  itemCode: string;
  itemName: string;
  orderedQty: number;
  receivedQty: number;
  pendingQty: number;
  rate: number;
  uom: string;
  warehouse: string;
}

export interface ReceiveItem {
  itemCode: string;
  itemName: string;
  orderedQty: number;
  receivedQty: number;
  pendingQty: number;
  qtyToReceive: number;
  rate: number;
  uom: string;
  warehouse: string;
  serialNo?: string;
  batchNo?: string;
}

export interface ReceiveEntry {
  itemCode: string;
  itemName: string;
  warehouse: string;
  batch?: string;
  serial?: string;
  qtyToReceive: number;
  actualQty: number;
  rate: number;
  uom: string;
}

const Receive = () => {
  const [currentView, setCurrentView] = useState<"dashboard" | "poSelector" | "receiveForm">("dashboard");
  const [selectedPO, setSelectedPO] = useState<PurchaseOrderOption | null>(null);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrderOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (currentView === "poSelector") {
      fetchPurchaseOrders();
    }
  }, [currentView]);

  const fetchPurchaseOrders = async () => {
    setIsLoading(true);
    try {
      const erpnextAPI = await createERPNextAPI();
      if (!erpnextAPI) {
        toast({
          title: "ERPNext Not Configured",
          description: "Please configure your ERPNext settings in the Profile page.",
          variant: "destructive"
        });
        return;
      }

      const company = await getUserDefaultCompany();
      const response = await erpnextAPI.purchase.getPurchaseOrders(
        [['docstatus', '=', 1], ['status', 'in', ['To Receive', 'To Receive and Bill', 'Partially Received']]],
        company || undefined
      );

      if (response?.data) {
        const formattedPOs: PurchaseOrderOption[] = response.data.map((po: any) => ({
          value: po.name,
          label: `${po.name} - ${po.supplier_name || po.supplier}`,
          supplier: po.supplier,
          supplier_name: po.supplier_name || po.supplier,
          transaction_date: po.transaction_date,
          delivery_date: po.schedule_date || po.transaction_date,
          grand_total: po.grand_total,
          status: po.status
        }));
        
        setPurchaseOrders(formattedPOs);
      }
    } catch (error) {
      console.error('Error fetching purchase orders:', error);
      toast({
        title: "Error",
        description: "Failed to fetch purchase orders",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectPO = (po: PurchaseOrderOption) => {
    setSelectedPO(po);
    setCurrentView("receiveForm");
  };

  const handleBackToDashboard = () => {
    setCurrentView("dashboard");
    setSelectedPO(null);
  };

  const handleBackToPOSelector = () => {
    setCurrentView("poSelector");
    setSelectedPO(null);
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
                onClick={currentView === "receiveForm" ? handleBackToPOSelector : handleBackToDashboard}
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
            )}
            <Truck className="w-6 h-6 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Receive</h1>
              {selectedPO && (
                <p className="text-sm text-gray-600">
                  Receiving: {selectedPO.label}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        {currentView === "dashboard" && (
          <ReceiveDashboard 
            onSelectPO={() => setCurrentView("poSelector")} 
            shortcuts={[]}
          />
        )}

        {currentView === "poSelector" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Select Purchase Order</h2>
              <Button variant="outline" onClick={handleBackToDashboard}>
                Back to Dashboard
              </Button>
            </div>
            <POSelector
              onSelectPO={(poNumber: string) => {
                const po = purchaseOrders.find(p => p.value === poNumber);
                if (po) handleSelectPO(po);
              }}
              isLoading={isLoading}
            />
          </div>
        )}

        {currentView === "receiveForm" && selectedPO && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Receive Items</h2>
              <Button variant="outline" onClick={handleBackToPOSelector}>
                Back to PO Selection
              </Button>
            </div>
            <ReceiveForm
              onBack={handleBackToPOSelector}
            />
          </div>
        )}

        {/* Help Section - moved to bottom */}
        <div className="mt-8">
          <HelpSection
            show={showHelp}
            icon={<Truck className="w-12 h-12" />}
            title="Receive Materials"
            description="Process incoming deliveries against purchase orders."
            steps={[
              "View pending purchase orders ready for receiving",
              "Select a purchase order to process",
              "Scan or enter received quantities",
              "Update inventory and complete the receipt"
            ]}
          />
        </div>
      </div>
    </div>
  );
};

export default Receive;

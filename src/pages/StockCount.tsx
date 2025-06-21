
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clipboard, RefreshCcw, Plus } from "lucide-react";
import StockCountForm from "../components/stock-count/StockCountForm";
import StockCountTable from "../components/stock-count/StockCountTable";
import StockCountSummary from "../components/stock-count/StockCountSummary";
import HelpSection from "@/components/ui/help-section";
import { createERPNextAPI, getUserDefaultCompany } from "@/services/erpnextApi";
import { useToast } from "@/hooks/use-toast";

export type StockCountStatus = "draft" | "in_progress" | "completed" | "cancelled";

export interface StockCountEntry {
  itemCode: string;
  itemName: string;
  warehouse: string;
  currentQty: number;
  actualQty: number;
  difference: number;
  uom: string;
  status: 'matched' | 'variance' | 'new';
  batch?: string;
  serial?: string;
}

export interface StockCountItem {
  itemCode: string;
  itemName: string;
  warehouse: string;
  currentQty: number;
  countedQty: number;
  difference: number;
  uom: string;
  valuationRate?: number;
  serialBatchBundle?: string;
}

export interface StockCount {
  id: string;
  number: string;
  warehouse: string;
  status: StockCountStatus;
  countDate: string;
  countedBy: string;
  items: StockCountItem[];
  totalItems: number;
  completionPercentage: number;
}

const StockCount = () => {
  const [currentView, setCurrentView] = useState<"list" | "form" | "summary">("list");
  const [stockCounts, setStockCounts] = useState<StockCount[]>([]);
  const [selectedCount, setSelectedCount] = useState<StockCount | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchStockCounts();
  }, []);

  const fetchStockCounts = async () => {
    setIsLoading(true);
    try {
      const erpnextAPI = await createERPNextAPI();
      if (!erpnextAPI) {
        console.warn('ERPNext API not configured');
        setStockCounts([]);
        return;
      }

      const company = await getUserDefaultCompany();
      
      // Fetch stock reconciliation documents
      const result = await erpnextAPI.stock.getStockReconciliations(
        [], // no filters for now
        company || undefined
      );

      if (result && result.data && Array.isArray(result.data)) {
        const mappedCounts: StockCount[] = result.data.map((reconciliation: any, index: number) => ({
          id: reconciliation.name || `SC-${index + 1}`,
          number: reconciliation.name || `Stock-Count-${index + 1}`,
          warehouse: reconciliation.set_warehouse || "All Warehouses",
          status: getStatusFromDocStatus(reconciliation.docstatus),
          countDate: reconciliation.posting_date || new Date().toISOString().split('T')[0],
          countedBy: reconciliation.owner || "Unknown",
          items: [], // Items would be loaded separately if needed
          totalItems: reconciliation.items?.length || 0,
          completionPercentage: reconciliation.docstatus === 1 ? 100 : 0
        }));
        
        setStockCounts(mappedCounts);
      } else {
        console.warn('No stock reconciliation data received or data is not an array');
        setStockCounts([]);
      }

    } catch (error) {
      console.error('Failed to fetch stock counts:', error);
      toast({
        title: "Error",
        description: "Failed to fetch stock counts from ERPNext",
        variant: "destructive"
      });
      setStockCounts([]);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusFromDocStatus = (docstatus: number): StockCountStatus => {
    switch (docstatus) {
      case 0: return "draft";
      case 1: return "completed";
      case 2: return "cancelled";
      default: return "draft";
    }
  };

  const handleCreateNew = () => {
    setSelectedCount(null);
    setCurrentView("form");
  };

  const handleEditCount = (count: StockCount) => {
    setSelectedCount(count);
    setCurrentView("form");
  };

  const handleViewSummary = (count: StockCount) => {
    setSelectedCount(count);
    setCurrentView("summary");
  };

  const handleBackToList = () => {
    setCurrentView("list");
    setSelectedCount(null);
  };

  const handleSaveCount = (count: StockCount) => {
    if (selectedCount) {
      // Update existing
      setStockCounts(prev => prev.map(sc => sc.id === count.id ? count : sc));
    } else {
      // Add new
      setStockCounts(prev => [...prev, count]);
    }
    handleBackToList();
  };

  const showHelp = currentView === "list" && stockCounts.length === 0 && !isLoading;

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Clipboard className="w-6 h-6 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">Stock Count</h1>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="icon" onClick={fetchStockCounts}>
              <RefreshCcw className="w-4 h-4" />
            </Button>
            {currentView === "list" && (
              <Button onClick={handleCreateNew}>
                <Plus className="w-4 h-4 mr-2" />
                Create Stock Count
              </Button>
            )}
          </div>
        </div>

        {/* Help Section */}
        <div className="mb-6">
          <HelpSection
            show={showHelp}
            icon={<Clipboard className="w-12 h-12" />}
            title="Start a Stock Count"
            description="Perform accurate inventory counts to maintain stock accuracy."
            steps={[
              "Click 'Create Stock Count' to start a new count",
              "Select warehouse and items to count",
              "Enter actual quantities found during physical count",
              "Review differences and submit the count"
            ]}
          />
        </div>

        {/* Content */}
        {currentView === "list" && (
          <StockCountTable
            stockCounts={stockCounts}
            onEdit={handleEditCount}
            onViewSummary={handleViewSummary}
            isLoading={isLoading}
          />
        )}

        {currentView === "form" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">
                {selectedCount ? "Edit Stock Count" : "Create Stock Count"}
              </h2>
              <Button variant="outline" onClick={handleBackToList}>
                Back to List
              </Button>
            </div>
            <StockCountForm
              stockCount={selectedCount}
              onSave={handleSaveCount}
              onCancel={handleBackToList}
            />
          </div>
        )}

        {currentView === "summary" && selectedCount && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Stock Count Summary</h2>
              <Button variant="outline" onClick={handleBackToList}>
                Back to List
              </Button>
            </div>
            <StockCountSummary stockCount={selectedCount} />
          </div>
        )}
      </div>
    </div>
  );
};

export default StockCount;

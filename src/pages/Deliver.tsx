
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Truck, ArrowLeft } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Import components
import DeliverDashboard from "@/components/deliver/DeliverDashboard";
import SalesOrderList from "@/components/deliver/SalesOrderList";
import DeliveryProcess from "@/components/deliver/DeliveryProcess";
import DraftDeliveryNotes from "@/components/deliver/DraftDeliveryNotes";

// Export types that other components need
export interface SalesOrder {
  name: string;
  customer: string;
  status: string;
  transaction_date: string;
  grand_total: number;
  currency: string;
  items?: any[];
}

export interface SOItem {
  itemCode: string;
  itemName: string;
  orderedQty: number;
  deliveredQty: number;
  pendingQty: number;
  rate: number;
  uom: string;
  warehouse: string;
}

export interface DeliveryEntry {
  id: string;
  salesOrder: string;
  items: SOItem[];
  status: string;
  createdDate: string;
}

const Deliver = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [selectedSalesOrder, setSelectedSalesOrder] = useState<any>(null);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [dashboardData] = useState({
    todaysDelivery: 0,
    totalDeliveries: 0
  });
  const [isLoading] = useState(false);

  const handleSalesOrderSelect = (salesOrder: any) => {
    setSelectedSalesOrder(salesOrder);
    setActiveTab("process");
  };

  const handleItemsSelect = (items: string[]) => {
    setSelectedItems(items);
  };

  const handleBackToDashboard = () => {
    setActiveTab("dashboard");
    setSelectedSalesOrder(null);
    setSelectedItems([]);
  };

  const handleDeliveryComplete = () => {
    setActiveTab("dashboard");
    setSelectedSalesOrder(null);
    setSelectedItems([]);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Truck className="w-6 h-6 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Deliver</h1>
              {selectedSalesOrder && (
                <p className="text-sm text-gray-600">
                  Sales Order: {selectedSalesOrder.name}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="orders">Sales Orders</TabsTrigger>
            <TabsTrigger value="process" disabled={!selectedSalesOrder}>
              Delivery Process
            </TabsTrigger>
            <TabsTrigger value="drafts">Draft Deliveries</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <DeliverDashboard
              onSelectSalesOrder={handleSalesOrderSelect}
              onViewSalesOrders={() => setActiveTab("orders")}
              dashboardData={dashboardData}
              isLoading={isLoading}
            />
          </TabsContent>

          <TabsContent value="orders">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Sales Orders</h2>
                <Button
                  variant="outline"
                  onClick={() => setActiveTab("dashboard")}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Dashboard
                </Button>
              </div>
              <SalesOrderList
                onSalesOrderSelect={handleSalesOrderSelect}
                onItemsSelect={handleItemsSelect}
              />
            </div>
          </TabsContent>

          <TabsContent value="process">
            {selectedSalesOrder && (
              <DeliveryProcess
                salesOrder={selectedSalesOrder}
                onBack={handleBackToDashboard}
                onDeliveryComplete={handleDeliveryComplete}
              />
            )}
          </TabsContent>

          <TabsContent value="drafts">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Draft Delivery Notes</h2>
                <Button
                  variant="outline"
                  onClick={() => setActiveTab("dashboard")}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Dashboard
                </Button>
              </div>
              <DraftDeliveryNotes onSelectDraft={() => {}} />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Deliver;

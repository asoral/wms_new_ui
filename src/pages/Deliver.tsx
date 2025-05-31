
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Truck, Package, FileText, Calendar, RefreshCcw } from "lucide-react";
import DeliverDashboard from "../components/deliver/DeliverDashboard";
import SalesOrderList from "../components/deliver/SalesOrderList";
import DeliveryProcess from "../components/deliver/DeliveryProcess";

export interface SalesOrder {
  id: string;
  number: string;
  customer: string;
  totalItems: number;
  totalValue: number;
  expectedDelivery: string;
  status: "To Deliver" | "To Deliver and Bill";
  percentDelivered: number;
  items: SalesOrderItem[];
}

export interface SalesOrderItem {
  itemCode: string;
  itemName: string;
  warehouse: string;
  batch?: string;
  serial?: string;
  qtyToDeliver: number;
  deliveredQty: number;
  rate: number;
  uom: string;
}

export interface DeliveryEntry {
  itemCode: string;
  itemName: string;
  warehouse: string;
  batch?: string;
  serial?: string;
  qtyToDeliver: number;
  actualQty: number;
  rate: number;
  uom: string;
}

const DeliverPage = () => {
  const [currentView, setCurrentView] = useState<"dashboard" | "orders" | "delivery">("dashboard");
  const [selectedOrder, setSelectedOrder] = useState<SalesOrder | null>(null);

  const dashboardData = {
    todaysDelivery: 12,
    totalDeliveries: 156,
    fgStockValue: 2450000,
    averageAge: 18
  };

  const shortcuts = [
    { label: "Print Label", icon: FileText, action: () => console.log("Print Label") },
    { label: "Request QC", icon: Package, action: () => console.log("Request QC") },
    { label: "Create Picklist", icon: FileText, action: () => console.log("Create Picklist") },
    { label: "Create Packing List", icon: Package, action: () => console.log("Create Packing List") }
  ];

  const handleSelectOrder = (order: SalesOrder) => {
    setSelectedOrder(order);
    setCurrentView("delivery");
  };

  const handleBackToDashboard = () => {
    setCurrentView("dashboard");
    setSelectedOrder(null);
  };

  const handleBackToOrders = () => {
    setCurrentView("orders");
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Truck className="w-6 h-6 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">Deliver</h1>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="icon">
              <RefreshCcw className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        {currentView === "dashboard" && (
          <div className="space-y-6">
            <DeliverDashboard 
              data={dashboardData}
              shortcuts={shortcuts}
              onViewOrders={() => setCurrentView("orders")}
            />
          </div>
        )}

        {currentView === "orders" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Sales Orders</h2>
              <Button variant="outline" onClick={handleBackToDashboard}>
                Back to Dashboard
              </Button>
            </div>
            <SalesOrderList onSelectOrder={handleSelectOrder} />
          </div>
        )}

        {currentView === "delivery" && selectedOrder && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Create Delivery Note</h2>
              <Button variant="outline" onClick={handleBackToOrders}>
                Back to Orders
              </Button>
            </div>
            <DeliveryProcess 
              salesOrder={selectedOrder}
              onBack={handleBackToOrders}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default DeliverPage;

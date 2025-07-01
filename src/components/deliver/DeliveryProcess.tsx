
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SalesOrder, DeliveryEntry } from "@/types";
import DeliveryForm from "./DeliveryForm";

interface DeliveryProcessProps {
  salesOrder: SalesOrder;
  onBack: () => void;
  onNext: () => void;
  onAddEntry: (entry: DeliveryEntry) => void;
}

const DeliveryProcess = ({ salesOrder, onBack, onNext, onAddEntry }: DeliveryProcessProps) => {
  const [deliveryEntries, setDeliveryEntries] = useState<DeliveryEntry[]>([]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handleAddEntry = (entry: DeliveryEntry) => {
    setDeliveryEntries([...deliveryEntries, entry]);
    onAddEntry(entry);
  };

  return (
    <div className="space-y-6">
      {/* Sales Order Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span>Sales Order Summary</span>
            <Badge>{salesOrder.status}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-xl md:text-2xl font-bold text-blue-600">{salesOrder.number}</div>
              <div className="text-sm text-gray-600">Order Number</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-lg md:text-2xl font-bold text-gray-900 break-words">{salesOrder.customer}</div>
              <div className="text-sm text-gray-600">Customer</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-xl md:text-2xl font-bold text-green-600">{salesOrder.totalItems}</div>
              <div className="text-sm text-gray-600">Total Items</div>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <div className="text-lg md:text-2xl font-bold text-purple-600">{formatCurrency(salesOrder.totalValue)}</div>
              <div className="text-sm text-gray-600">Total Value</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sales Order Items */}
      <Card>
        <CardHeader>
          <CardTitle>Sales Order Items</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left p-3 border">Item Code</th>
                  <th className="text-left p-3 border">Item Name</th>
                  <th className="text-left p-3 border">Ordered</th>
                  <th className="text-left p-3 border">Delivered</th>
                  <th className="text-left p-3 border">Pending</th>
                  <th className="text-left p-3 border">Rate</th>
                </tr>
              </thead>
              <tbody>
                {salesOrder.items.map((item, index) => (
                  <tr key={index} className="border-b">
                    <td className="p-3 border">{item.itemCode}</td>
                    <td className="p-3 border">{item.itemName}</td>
                    <td className="p-3 border">{item.orderedQty} {item.uom}</td>
                    <td className="p-3 border">{item.deliveredQty} {item.uom}</td>
                    <td className="p-3 border">{item.pendingQty} {item.uom}</td>
                    <td className="p-3 border">₹{item.rate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Delivery Items Form */}
      <DeliveryForm 
        soItems={salesOrder.items}
        onAddEntry={handleAddEntry}
      />

      {/* Navigation */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
        <Button variant="outline" onClick={onBack} className="order-2 sm:order-1">
          Back to Dashboard
        </Button>
        <Button onClick={onNext} size="lg" className="order-1 sm:order-2" disabled={deliveryEntries.length === 0}>
          Review & Submit ({deliveryEntries.length} items)
        </Button>
      </div>
    </div>
  );
};

export default DeliveryProcess;

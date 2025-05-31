
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SalesOrder, DeliveryEntry } from "../../pages/Deliver";
import DeliveryForm from "./DeliveryForm";
import DeliveryTable from "./DeliveryTable";

interface DeliveryProcessProps {
  salesOrder: SalesOrder;
  onBack: () => void;
}

const DeliveryProcess = ({ salesOrder, onBack }: DeliveryProcessProps) => {
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
  };

  const handleSubmitDelivery = () => {
    console.log("Submitting delivery note with entries:", deliveryEntries);
    // Here you would call the API to create the delivery note
  };

  return (
    <div className="space-y-6">
      {/* Sales Order Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Sales Order Summary
            <Badge>{salesOrder.status}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{salesOrder.number}</div>
              <div className="text-sm text-gray-600">Order Number</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{salesOrder.customer}</div>
              <div className="text-sm text-gray-600">Customer</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{salesOrder.totalItems}</div>
              <div className="text-sm text-gray-600">Total Items</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{formatCurrency(salesOrder.totalValue)}</div>
              <div className="text-sm text-gray-600">Total Value</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Delivery Process */}
      <Tabs defaultValue="scan" className="space-y-4">
        <TabsList className="grid grid-cols-2 w-full max-w-md">
          <TabsTrigger value="scan">Scan Items</TabsTrigger>
          <TabsTrigger value="review">Review & Submit</TabsTrigger>
        </TabsList>

        <TabsContent value="scan" className="space-y-4">
          <DeliveryForm onAddEntry={handleAddEntry} />
        </TabsContent>

        <TabsContent value="review" className="space-y-4">
          <DeliveryTable entries={deliveryEntries} />
          
          {deliveryEntries.length > 0 && (
            <div className="flex justify-between items-center">
              <Button variant="outline" onClick={onBack}>
                Cancel
              </Button>
              <Button onClick={handleSubmitDelivery} size="lg">
                Submit Delivery Note
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DeliveryProcess;

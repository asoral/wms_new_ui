
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Scan, Save, AlertTriangle } from "lucide-react";
import ReceiveTable from "./ReceiveTable";
import { ReceiveEntry, POItem } from "../../pages/Receive";

interface ReceiveFormProps {
  onBack: () => void;
}

const ReceiveForm = ({ onBack }: ReceiveFormProps) => {
  const [entries, setEntries] = useState<ReceiveEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Mock data - in real app this would come from props or API
  useEffect(() => {
    // Simulate loading PO items
    setTimeout(() => {
      const mockEntries: ReceiveEntry[] = [
        {
          itemCode: "ITM-001",
          itemName: "Sample Item 1",
          warehouse: "Main Store",
          qtyToReceive: 10,
          actualQty: 10,
          rate: 100,
          uom: "Nos"
        },
        {
          itemCode: "ITM-002", 
          itemName: "Sample Item 2",
          warehouse: "Main Store",
          qtyToReceive: 5,
          actualQty: 5,
          rate: 200,
          uom: "Nos"
        }
      ];
      setEntries(mockEntries);
      setIsLoading(false);
    }, 1000);
  }, []);

  const handleUpdateEntry = (index: number, entry: ReceiveEntry) => {
    const updated = [...entries];
    updated[index] = entry;
    setEntries(updated);
  };

  const handleScanSerial = (index: number) => {
    // Mock serial scanning
    const updated = [...entries];
    updated[index].serial = `SN-${Date.now()}`;
    setEntries(updated);
  };

  const handleSubmit = () => {
    console.log("Submitting receipt:", entries);
    // In real app, this would create a Purchase Receipt
    onBack();
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-gray-500">Loading purchase order items...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Receipt Header */}
      <Card>
        <CardHeader>
          <CardTitle>Purchase Receipt</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Supplier</Label>
              <p className="font-medium">Sample Supplier</p>
            </div>
            <div>
              <Label>PO Number</Label>
              <p className="font-medium">PO-2025-001</p>
            </div>
            <div>
              <Label>Receipt Date</Label>
              <p className="font-medium">{new Date().toLocaleDateString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Receive Items Table */}
      <ReceiveTable
        entries={entries}
        onUpdateEntry={handleUpdateEntry}
        onScanSerial={handleScanSerial}
      />

      {/* Actions */}
      <div className="flex justify-between space-x-4">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button onClick={handleSubmit}>
          <Save className="w-4 h-4 mr-2" />
          Submit Receipt
        </Button>
      </div>
    </div>
  );
};

export default ReceiveForm;

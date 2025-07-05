import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Plus, Package, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SerialBatchSelectorProps {
  itemCode: string;
  itemName: string;
  warehouse: string;
  requiredQty: number;
  uom: string;
  onSerialBatchSelected: (data: {
    batches: { batch_no: string; qty: number }[];
    serials: string[];
    totalQty: number;
  }) => void;
}

interface BatchEntry {
  batch_no: string;
  qty: number;
}

const SerialBatchSelector = ({
  itemCode,
  itemName,
  warehouse,
  requiredQty,
  uom,
  onSerialBatchSelected
}: SerialBatchSelectorProps) => {
  const [batches, setBatches] = useState<BatchEntry[]>([]);
  const [serials, setSerials] = useState<string[]>([]);
  const [newBatch, setNewBatch] = useState("");
  const [newBatchQty, setNewBatchQty] = useState<number>(0);
  const [newSerial, setNewSerial] = useState("");
  const { toast } = useToast();

  const totalBatchQty = batches.reduce((sum, batch) => sum + batch.qty, 0);
  const totalQty = totalBatchQty + serials.length;

  const addBatch = () => {
    if (!newBatch.trim()) {
      toast({
        title: "Batch Required",
        description: "Please enter a batch number.",
        variant: "destructive"
      });
      return;
    }

    if (newBatchQty <= 0) {
      toast({
        title: "Invalid Quantity",
        description: "Please enter a valid quantity for the batch.",
        variant: "destructive"
      });
      return;
    }

    if (batches.find(b => b.batch_no === newBatch)) {
      toast({
        title: "Duplicate Batch",
        description: "This batch number is already added.",
        variant: "destructive"
      });
      return;
    }

    setBatches([...batches, { batch_no: newBatch, qty: newBatchQty }]);
    setNewBatch("");
    setNewBatchQty(0);
  };

  const removeBatch = (batchToRemove: string) => {
    setBatches(batches.filter(b => b.batch_no !== batchToRemove));
  };

  const addSerial = () => {
    if (!newSerial.trim()) {
      toast({
        title: "Serial Required",
        description: "Please enter a serial number.",
        variant: "destructive"
      });
      return;
    }

    if (serials.includes(newSerial)) {
      toast({
        title: "Duplicate Serial",
        description: "This serial number is already added.",
        variant: "destructive"
      });
      return;
    }

    setSerials([...serials, newSerial]);
    setNewSerial("");
  };

  const removeSerial = (serialToRemove: string) => {
    setSerials(serials.filter(s => s !== serialToRemove));
  };

  const handleSubmit = () => {
    if (totalQty === 0) {
      toast({
        title: "No Items Selected",
        description: "Please add batch numbers or serial numbers.",
        variant: "destructive"
      });
      return;
    }

    if (totalQty !== requiredQty) {
      toast({
        title: "Quantity Mismatch",
        description: `Total quantity (${totalQty}) must equal required quantity (${requiredQty}).`,
        variant: "destructive"
      });
      return;
    }

    onSerialBatchSelected({
      batches,
      serials,
      totalQty
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Package className="w-5 h-5" />
          <span>Serial/Batch Selection</span>
        </CardTitle>
        <div className="text-sm text-gray-600">
          <p><strong>Item:</strong> {itemName} ({itemCode})</p>
          <p><strong>Warehouse:</strong> {warehouse}</p>
          <p><strong>Required Qty:</strong> {requiredQty} {uom}</p>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Batch Selection */}
        <div className="space-y-3">
          <Label>Batch Numbers</Label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <Input
              placeholder="Enter batch number"
              value={newBatch}
              onChange={(e) => setNewBatch(e.target.value)}
            />
            <Input
              type="number"
              placeholder="Quantity"
              value={newBatchQty || ""}
              onChange={(e) => setNewBatchQty(Number(e.target.value))}
              min="1"
            />
            <Button onClick={addBatch} size="sm">
              <Plus className="w-4 h-4 mr-1" />
              Add Batch
            </Button>
          </div>
          
          {batches.length > 0 && (
            <div className="space-y-2">
              {batches.map((batch, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span>
                    <Badge variant="outline">{batch.batch_no}</Badge>
                    <span className="ml-2 text-sm">{batch.qty} {uom}</span>
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeBatch(batch.batch_no)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        <Separator />

        {/* Serial Selection */}
        <div className="space-y-3">
          <Label>Serial Numbers</Label>
          <div className="flex space-x-2">
            <Input
              placeholder="Enter serial number"
              value={newSerial}
              onChange={(e) => setNewSerial(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addSerial()}
            />
            <Button onClick={addSerial} size="sm">
              <Plus className="w-4 h-4 mr-1" />
              Add Serial
            </Button>
          </div>
          
          {serials.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {serials.map((serial, index) => (
                <div key={index} className="flex items-center space-x-1 bg-gray-50 px-2 py-1 rounded">
                  <Badge variant="secondary">{serial}</Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-5 w-5 p-0"
                    onClick={() => removeSerial(serial)}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        <Separator />

        {/* Summary */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="font-medium">Total Selected:</span>
            <Badge variant={totalQty === requiredQty ? "default" : "destructive"}>
              {totalQty} / {requiredQty} {uom}
            </Badge>
          </div>
          
          <Button 
            onClick={handleSubmit} 
            className="w-full"
            disabled={totalQty !== requiredQty}
          >
            Confirm Selection
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default SerialBatchSelector;
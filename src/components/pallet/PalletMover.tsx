
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowRight, MapPin } from "lucide-react";
import { Pallet } from "../../pages/Pallet";

interface PalletMoverProps {
  pallet: Pallet;
}

const PalletMover = ({ pallet }: PalletMoverProps) => {
  const [targetWarehouse, setTargetWarehouse] = useState("");

  const warehouses = [
    "Main Store - A1",
    "Main Store - A2", 
    "Main Store - B1",
    "Raw Material Store - C1",
    "Finished Goods Store - D1",
    "Quality Store - Q1",
    "Packaging Store - P1"
  ];

  const availableWarehouses = warehouses.filter(w => w !== pallet.location);

  const handleMovePallet = () => {
    if (targetWarehouse) {
      console.log(`Moving pallet ${pallet.barcode} from ${pallet.location} to ${targetWarehouse}`);
      alert(`Pallet ${pallet.barcode} moved successfully to ${targetWarehouse}!`);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <ArrowRight className="w-5 h-5" />
          <span>Move Pallet</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Location */}
        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center space-x-2 mb-2">
            <MapPin className="w-4 h-4 text-blue-600" />
            <span className="font-medium text-blue-900">Current Location</span>
          </div>
          <p className="text-blue-800">{pallet.location}</p>
        </div>

        {/* Pallet Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
          <div>
            <Label className="text-sm text-gray-600">Pallet ID</Label>
            <p className="font-medium">{pallet.barcode}</p>
          </div>
          <div>
            <Label className="text-sm text-gray-600">Total Items</Label>
            <p className="font-medium">{pallet.items.length} types</p>
          </div>
          <div>
            <Label className="text-sm text-gray-600">Total Quantity</Label>
            <p className="font-medium">{pallet.items.reduce((total, item) => total + item.qty, 0)} units</p>
          </div>
        </div>

        {/* Target Location */}
        <div className="space-y-2">
          <Label htmlFor="targetWarehouse">Select Target Location</Label>
          <Select value={targetWarehouse} onValueChange={setTargetWarehouse}>
            <SelectTrigger>
              <SelectValue placeholder="Select new location..." />
            </SelectTrigger>
            <SelectContent>
              {availableWarehouses.map((warehouse) => (
                <SelectItem key={warehouse} value={warehouse}>
                  {warehouse}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Move Button */}
        <Button 
          onClick={handleMovePallet}
          disabled={!targetWarehouse}
          className="w-full"
          size="lg"
        >
          Move Pallet to {targetWarehouse || "Selected Location"}
        </Button>

        {/* Warning */}
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-sm text-amber-800">
            <strong>Note:</strong> This action will move the entire pallet and all its contents to the selected location.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default PalletMover;

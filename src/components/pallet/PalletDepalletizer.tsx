
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Minus, AlertTriangle } from "lucide-react";
import { Pallet } from "../../pages/Pallet";

interface PalletDepalletizerProps {
  pallet: Pallet;
}

const PalletDepalletizer = ({ pallet }: PalletDepalletizerProps) => {
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [targetWarehouse, setTargetWarehouse] = useState("");
  const [selectAll, setSelectAll] = useState(false);

  const warehouses = [
    "Main Store - A1",
    "Main Store - A2", 
    "Main Store - B1",
    "Raw Material Store - C1",
    "Finished Goods Store - D1",
    "Quality Store - Q1",
    "Packaging Store - P1"
  ];

  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked);
    if (checked) {
      setSelectedItems(pallet.items.map((_, index) => index));
    } else {
      setSelectedItems([]);
    }
  };

  const handleItemSelect = (index: number, checked: boolean) => {
    if (checked) {
      setSelectedItems([...selectedItems, index]);
    } else {
      setSelectedItems(selectedItems.filter(i => i !== index));
      setSelectAll(false);
    }
  };

  const handleDepalletize = () => {
    if (selectedItems.length > 0 && targetWarehouse) {
      const itemsToMove = selectedItems.map(index => pallet.items[index]);
      console.log(`De-palletizing ${selectedItems.length} items from pallet ${pallet.barcode} to ${targetWarehouse}`, itemsToMove);
      alert(`${selectedItems.length} items de-palletized successfully to ${targetWarehouse}!`);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Minus className="w-5 h-5" />
          <span>De-palletize Items</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Pallet Info */}
        <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm text-gray-600">Pallet ID</Label>
              <p className="font-medium">{pallet.barcode}</p>
            </div>
            <div>
              <Label className="text-sm text-gray-600">Current Location</Label>
              <p className="font-medium">{pallet.location}</p>
            </div>
          </div>
        </div>

        {/* Target Warehouse */}
        <div className="space-y-2">
          <Label htmlFor="targetWarehouse">Target Warehouse for Items</Label>
          <Select value={targetWarehouse} onValueChange={setTargetWarehouse}>
            <SelectTrigger>
              <SelectValue placeholder="Select destination warehouse..." />
            </SelectTrigger>
            <SelectContent>
              {warehouses.map((warehouse) => (
                <SelectItem key={warehouse} value={warehouse}>
                  {warehouse}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Item Selection */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Select Items to De-palletize</Label>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="selectAll"
                checked={selectAll}
                onCheckedChange={handleSelectAll}
              />
              <Label htmlFor="selectAll" className="text-sm">Select All</Label>
            </div>
          </div>

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {pallet.items.map((item, index) => (
              <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <Checkbox
                  checked={selectedItems.includes(index)}
                  onCheckedChange={(checked) => handleItemSelect(index, checked as boolean)}
                />
                <div className="flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <h4 className="font-medium">{item.itemCode}</h4>
                    <span className="text-sm text-gray-600">{item.itemName}</span>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-1">
                    <span className="text-sm font-medium">{item.qty} {item.uom}</span>
                    <span className="text-sm text-gray-600">{item.warehouse}</span>
                    {item.batchNo && (
                      <Badge variant="outline" className="text-xs">Batch: {item.batchNo}</Badge>
                    )}
                    {item.serialNo && (
                      <Badge variant="outline" className="text-xs">Serial: {item.serialNo}</Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Summary */}
        {selectedItems.length > 0 && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>{selectedItems.length}</strong> item(s) selected for de-palletization
            </p>
          </div>
        )}

        {/* Warning */}
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex items-start space-x-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
            <p className="text-sm text-amber-800">
              <strong>Warning:</strong> De-palletizing will remove selected items from this pallet and place them as individual items in the target warehouse.
            </p>
          </div>
        </div>

        {/* De-palletize Button */}
        <Button 
          onClick={handleDepalletize}
          disabled={selectedItems.length === 0 || !targetWarehouse}
          className="w-full"
          size="lg"
        >
          De-palletize {selectedItems.length} Item(s)
        </Button>
      </CardContent>
    </Card>
  );
};

export default PalletDepalletizer;

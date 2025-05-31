
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Scan } from "lucide-react";
import { BinLabelData } from "../../pages/PrintLabel";

interface BinLabelFormProps {
  onGenerateLabel: (data: BinLabelData) => void;
}

// Mock data for warehouses
const mockWarehouses = [
  { id: "WH-001", name: "Main Warehouse", group: 0 },
  { id: "WH-002", name: "Raw Materials", group: 0 },
  { id: "WH-003", name: "Finished Goods", group: 0 },
  { id: "WH-004", name: "Quality Control", group: 0 },
  { id: "WH-005", name: "Packaging", group: 0 },
];

// Mock items data for bin
const mockBinItems = {
  "WH-001": [
    { itemCode: "ITEM-001", itemName: "Steel Rod 10mm", qty: 150, uom: "Nos", batch: "B001" },
    { itemCode: "ITEM-002", itemName: "Cement Bag", qty: 50, uom: "Bags" },
  ],
  "WH-002": [
    { itemCode: "ITEM-003", itemName: "Raw Material A", qty: 200, uom: "Kg", batch: "B002" },
    { itemCode: "ITEM-004", itemName: "Chemical B", qty: 75, uom: "Litres", serial: "S001" },
  ],
  "WH-003": [
    { itemCode: "ITEM-005", itemName: "Finished Product X", qty: 100, uom: "Nos", batch: "B003" },
  ],
  "WH-004": [
    { itemCode: "ITEM-006", itemName: "Test Sample", qty: 25, uom: "Nos" },
  ],
  "WH-005": [
    { itemCode: "ITEM-007", itemName: "Packaging Material", qty: 300, uom: "Nos" },
  ],
};

const BinLabelForm = ({ onGenerateLabel }: BinLabelFormProps) => {
  const [selectedWarehouse, setSelectedWarehouse] = useState("");
  const [scannedWarehouse, setScannedWarehouse] = useState("");

  const handleWarehouseSelect = (warehouseId: string) => {
    setSelectedWarehouse(warehouseId);
  };

  const handleScanWarehouse = () => {
    if (scannedWarehouse) {
      const warehouse = mockWarehouses.find(w => w.id === scannedWarehouse);
      if (warehouse) {
        setSelectedWarehouse(warehouse.id);
      }
    }
  };

  const handleGenerateLabel = () => {
    const warehouse = mockWarehouses.find(w => w.id === selectedWarehouse);
    if (warehouse) {
      const items = mockBinItems[selectedWarehouse as keyof typeof mockBinItems] || [];
      
      const labelData: BinLabelData = {
        warehouseId: warehouse.id,
        warehouseName: warehouse.name,
        barcode: warehouse.id,
        items: items,
      };
      
      onGenerateLabel(labelData);
    }
  };

  const selectedWarehouseData = mockWarehouses.find(w => w.id === selectedWarehouse);
  const items = selectedWarehouse ? mockBinItems[selectedWarehouse as keyof typeof mockBinItems] || [] : [];

  return (
    <div className="space-y-6">
      {/* Warehouse Scanner */}
      <div className="space-y-2">
        <Label htmlFor="warehouse-scan">Scan Warehouse ID</Label>
        <div className="flex space-x-2">
          <Input
            id="warehouse-scan"
            placeholder="Scan or type warehouse ID..."
            value={scannedWarehouse}
            onChange={(e) => setScannedWarehouse(e.target.value)}
          />
          <Button variant="outline" size="icon" onClick={handleScanWarehouse}>
            <Scan className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Warehouse Selection */}
      <div className="space-y-2">
        <Label>Select Warehouse</Label>
        <Select value={selectedWarehouse} onValueChange={handleWarehouseSelect}>
          <SelectTrigger>
            <SelectValue placeholder="Choose warehouse..." />
          </SelectTrigger>
          <SelectContent>
            {mockWarehouses.map((warehouse) => (
              <SelectItem key={warehouse.id} value={warehouse.id}>
                {warehouse.name} ({warehouse.id})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Warehouse Info */}
      {selectedWarehouseData && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Warehouse Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="font-medium">ID:</span> {selectedWarehouseData.id}
              </div>
              <div>
                <span className="font-medium">Name:</span> {selectedWarehouseData.name}
              </div>
            </div>
            
            {items.length > 0 && (
              <div className="mt-4">
                <h4 className="font-medium text-sm mb-2">Items in Bin:</h4>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {items.map((item, index) => (
                    <div key={index} className="text-xs bg-gray-50 p-2 rounded">
                      <div className="font-medium">{item.itemName}</div>
                      <div className="text-gray-600">
                        {item.itemCode} | Qty: {item.qty} {item.uom}
                        {item.batch && ` | Batch: ${item.batch}`}
                        {item.serial && ` | Serial: ${item.serial}`}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Generate Button */}
      <Button 
        onClick={handleGenerateLabel}
        disabled={!selectedWarehouse}
        className="w-full"
      >
        Generate Bin Label
      </Button>
    </div>
  );
};

export default BinLabelForm;

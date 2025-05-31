
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Scan } from "lucide-react";
import { ItemLabelData } from "../../pages/PrintLabel";

interface ItemLabelFormProps {
  onGenerateLabel: (data: ItemLabelData) => void;
}

// Mock data for items
const mockItems = [
  { 
    code: "ITEM-001", 
    name: "Steel Rod 10mm", 
    group: "Raw Materials",
    tracked: true,
    uom: "Nos",
    batches: ["B001", "B002", "B003"],
    serials: ["S001", "S002", "S003"]
  },
  { 
    code: "ITEM-002", 
    name: "Cement Bag", 
    group: "Construction Materials",
    tracked: false,
    uom: "Bags",
    batches: [],
    serials: []
  },
  { 
    code: "ITEM-003", 
    name: "Raw Material A", 
    group: "Raw Materials",
    tracked: true,
    uom: "Kg",
    batches: ["B004", "B005"],
    serials: []
  },
  { 
    code: "ITEM-004", 
    name: "Chemical B", 
    group: "Chemicals",
    tracked: true,
    uom: "Litres",
    batches: [],
    serials: ["S004", "S005", "S006"]
  },
  { 
    code: "ITEM-005", 
    name: "Finished Product X", 
    group: "Finished Goods",
    tracked: true,
    uom: "Nos",
    batches: ["B006", "B007"],
    serials: []
  },
];

const ItemLabelForm = ({ onGenerateLabel }: ItemLabelFormProps) => {
  const [selectedItem, setSelectedItem] = useState("");
  const [scannedItem, setScannedItem] = useState("");
  const [batchSerial, setBatchSerial] = useState("");
  const [qty, setQty] = useState("");

  const handleItemSelect = (itemCode: string) => {
    setSelectedItem(itemCode);
    setBatchSerial(""); // Reset batch/serial when item changes
  };

  const handleScanItem = () => {
    if (scannedItem) {
      const item = mockItems.find(i => i.code === scannedItem);
      if (item) {
        setSelectedItem(item.code);
      }
    }
  };

  const handleGenerateLabel = () => {
    const item = mockItems.find(i => i.code === selectedItem);
    if (item && qty) {
      const labelData: ItemLabelData = {
        itemCode: item.code,
        itemName: item.name,
        itemGroup: item.group,
        batchSerial: batchSerial || undefined,
        qty: parseInt(qty),
        uom: item.uom,
        itemBarcode: item.code,
        batchSerialBarcode: batchSerial || undefined,
      };
      
      onGenerateLabel(labelData);
    }
  };

  const selectedItemData = mockItems.find(i => i.code === selectedItem);
  const availableBatchesSerials = selectedItemData ? 
    [...selectedItemData.batches, ...selectedItemData.serials] : [];

  return (
    <div className="space-y-6">
      {/* Item Scanner */}
      <div className="space-y-2">
        <Label htmlFor="item-scan">Scan Item Code</Label>
        <div className="flex space-x-2">
          <Input
            id="item-scan"
            placeholder="Scan or type item code..."
            value={scannedItem}
            onChange={(e) => setScannedItem(e.target.value)}
          />
          <Button variant="outline" size="icon" onClick={handleScanItem}>
            <Scan className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Item Selection */}
      <div className="space-y-2">
        <Label>Select Item</Label>
        <Select value={selectedItem} onValueChange={handleItemSelect}>
          <SelectTrigger>
            <SelectValue placeholder="Choose item..." />
          </SelectTrigger>
          <SelectContent>
            {mockItems.map((item) => (
              <SelectItem key={item.code} value={item.code}>
                {item.name} ({item.code})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Batch/Serial Selection */}
      {selectedItemData && selectedItemData.tracked && (
        <div className="space-y-2">
          <Label>Batch/Serial Number</Label>
          <Select value={batchSerial} onValueChange={setBatchSerial}>
            <SelectTrigger>
              <SelectValue placeholder="Select batch/serial..." />
            </SelectTrigger>
            <SelectContent>
              {availableBatchesSerials.map((bs) => (
                <SelectItem key={bs} value={bs}>
                  {bs}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Quantity */}
      <div className="space-y-2">
        <Label htmlFor="qty">Quantity</Label>
        <Input
          id="qty"
          type="number"
          placeholder="Enter quantity..."
          value={qty}
          onChange={(e) => setQty(e.target.value)}
        />
      </div>

      {/* Item Info */}
      {selectedItemData && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Item Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="font-medium">Code:</span> {selectedItemData.code}
              </div>
              <div>
                <span className="font-medium">Name:</span> {selectedItemData.name}
              </div>
              <div>
                <span className="font-medium">Group:</span> {selectedItemData.group}
              </div>
              <div>
                <span className="font-medium">UOM:</span> {selectedItemData.uom}
              </div>
              <div>
                <span className="font-medium">Tracked:</span> {selectedItemData.tracked ? "Yes" : "No"}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Generate Button */}
      <Button 
        onClick={handleGenerateLabel}
        disabled={!selectedItem || !qty || (selectedItemData?.tracked && !batchSerial)}
        className="w-full"
      >
        Generate Item Label
      </Button>
    </div>
  );
};

export default ItemLabelForm;

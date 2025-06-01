
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Scan, Package } from "lucide-react";
import { BinLabelData } from "../../pages/PrintLabel";

interface BinLabelFormProps {
  onGenerateLabel: (data: BinLabelData) => void;
}

const BinLabelForm = ({ onGenerateLabel }: BinLabelFormProps) => {
  const [warehouseId, setWarehouseId] = useState("");
  const [isScanning, setIsScanning] = useState(false);

  // Mock warehouses (group = 0 means bin-level warehouses)
  const warehouses = [
    { id: "WH-001", name: "Main Store - Bin A1", group: 0 },
    { id: "WH-002", name: "Main Store - Bin A2", group: 0 },
    { id: "WH-003", name: "Main Store - Bin B1", group: 0 },
    { id: "WH-004", name: "Raw Material - Bin C1", group: 0 },
    { id: "WH-005", name: "Finished Goods - Bin D1", group: 0 }
  ];

  // Mock items in bin
  const mockBinItems = [
    {
      itemCode: "ITM-001",
      itemName: "Laptop Dell Inspiron",
      qty: 5,
      uom: "Nos",
      batch: "BATCH-001",
      serial: ""
    },
    {
      itemCode: "ITM-002", 
      itemName: "Mouse Wireless",
      qty: 25,
      uom: "Nos",
      batch: "",
      serial: "SRL-001,SRL-002,SRL-003"
    },
    {
      itemCode: "ITM-003",
      itemName: "Keyboard Mechanical",
      qty: 10,
      uom: "Nos",
      batch: "BATCH-002",
      serial: ""
    }
  ];

  const handleScan = () => {
    setIsScanning(true);
    // Simulate barcode scan
    setTimeout(() => {
      setWarehouseId("WH-001");
      setIsScanning(false);
    }, 2000);
  };

  const handleGenerateLabel = () => {
    const selectedWarehouse = warehouses.find(w => w.id === warehouseId);
    if (!selectedWarehouse) return;

    const labelData: BinLabelData = {
      warehouseId: selectedWarehouse.id,
      warehouseName: selectedWarehouse.name,
      barcode: `BIN-${selectedWarehouse.id}-${Date.now()}`,
      items: mockBinItems.map(item => ({
        itemCode: item.itemCode,
        itemName: item.itemName,
        qty: item.qty,
        uom: item.uom,
        batch: item.batch || undefined,
        serial: item.serial || undefined
      }))
    };

    onGenerateLabel(labelData);
  };

  return (
    <div className="space-y-6">
      {/* Warehouse Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Select Warehouse/Bin</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={handleScan}
              disabled={isScanning}
              className="flex items-center space-x-2"
            >
              <Scan className="w-4 h-4" />
              <span>{isScanning ? "Scanning..." : "Scan Bin"}</span>
            </Button>
          </div>

          <div className="space-y-2">
            <Label htmlFor="warehouse">Or Select Warehouse</Label>
            <Select value={warehouseId} onValueChange={setWarehouseId}>
              <SelectTrigger>
                <SelectValue placeholder="Select warehouse/bin..." />
              </SelectTrigger>
              <SelectContent>
                {warehouses.map((warehouse) => (
                  <SelectItem key={warehouse.id} value={warehouse.id}>
                    {warehouse.name} ({warehouse.id})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Bin Items Preview */}
      {warehouseId && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center space-x-2">
              <Package className="w-5 h-5" />
              <span>Items in Bin</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {mockBinItems.map((item, index) => (
                <div key={index} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium">{item.itemCode}</h4>
                      <p className="text-sm text-gray-600">{item.itemName}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="font-medium">{item.qty} {item.uom}</span>
                        {item.batch && (
                          <Badge variant="outline">Batch: {item.batch}</Badge>
                        )}
                        {item.serial && (
                          <Badge variant="outline">Serial: {item.serial}</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Generate Button */}
      <Button 
        onClick={handleGenerateLabel}
        disabled={!warehouseId}
        className="w-full"
        size="lg"
      >
        Generate Bin Label
      </Button>
    </div>
  );
};

export default BinLabelForm;

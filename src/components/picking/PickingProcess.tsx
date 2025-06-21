
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Scan, Check, AlertTriangle, Package } from "lucide-react";
import { PickList, PickListItem } from "../../pages/PickList";

interface PickingProcessProps {
  pickList: PickList;
  onBack: () => void;
}

const PickingProcess = ({ pickList, onBack }: PickingProcessProps) => {
  const [items, setItems] = useState<PickListItem[]>(pickList.items);
  const [currentItemIndex, setCurrentItemIndex] = useState(0);
  const [scannedCode, setScannedCode] = useState("");

  const currentItem = items[currentItemIndex];
  const completedItems = items.filter(item => item.status === "picked").length;
  const progress = (completedItems / items.length) * 100;

  const updateItemStatus = (index: number, pickedQty: number) => {
    const updatedItems = [...items];
    const item = updatedItems[index];
    
    item.pickedQty = pickedQty;
    if (pickedQty >= item.requiredQty) {
      item.status = "picked";
    } else if (pickedQty > 0) {
      item.status = "partially_picked";
    } else {
      item.status = "pending";
    }
    
    setItems(updatedItems);
  };

  const handleScan = () => {
    if (scannedCode === currentItem.itemCode) {
      updateItemStatus(currentItemIndex, currentItem.requiredQty);
      if (currentItemIndex < items.length - 1) {
        setCurrentItemIndex(currentItemIndex + 1);
      }
      setScannedCode("");
    }
  };

  const handleManualPick = (quantity: number) => {
    updateItemStatus(currentItemIndex, quantity);
    if (currentItemIndex < items.length - 1) {
      setCurrentItemIndex(currentItemIndex + 1);
    }
  };

  const handleComplete = () => {
    console.log("Pick list completed:", pickList.name);
    onBack();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "picked": return "bg-green-100 text-green-800";
      case "partially_picked": return "bg-yellow-100 text-yellow-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      {/* Progress Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Picking Progress</span>
            <Badge variant="outline">{completedItems}/{items.length} Items</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Progress value={progress} className="mb-2" />
          <p className="text-sm text-gray-600">{progress.toFixed(0)}% Complete</p>
        </CardContent>
      </Card>

      {/* Current Item */}
      {currentItem && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Package className="w-5 h-5" />
              <span>Current Item ({currentItemIndex + 1} of {items.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-medium text-lg">{currentItem.itemCode}</h3>
                <p className="text-gray-600">{currentItem.itemName}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Required</p>
                <p className="text-2xl font-bold">{currentItem.requiredQty} {currentItem.uom}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Warehouse</p>
                <p className="font-medium">{currentItem.warehouse}</p>
              </div>
              {currentItem.bin && (
                <div>
                  <p className="text-sm text-gray-600">Bin</p>
                  <p className="font-medium">{currentItem.bin}</p>
                </div>
              )}
              {currentItem.batchNo && (
                <div>
                  <p className="text-sm text-gray-600">Batch</p>
                  <Badge variant="outline">{currentItem.batchNo}</Badge>
                </div>
              )}
              {currentItem.serialNo && (
                <div>
                  <p className="text-sm text-gray-600">Serial</p>
                  <Badge variant="outline">{currentItem.serialNo}</Badge>
                </div>
              )}
            </div>

            {/* Picking Actions */}
            <div className="space-y-4">
              <div className="flex space-x-2">
                <Input
                  placeholder="Scan item code"
                  value={scannedCode}
                  onChange={(e) => setScannedCode(e.target.value)}
                  className="flex-1"
                />
                <Button onClick={handleScan} disabled={!scannedCode}>
                  <Scan className="w-4 h-4 mr-2" />
                  Scan
                </Button>
              </div>

              <div className="flex space-x-2">
                <Input
                  type="number"
                  placeholder="Picked quantity"
                  className="flex-1"
                  id="pickedQty"
                />
                <Button 
                  onClick={() => {
                    const input = document.getElementById("pickedQty") as HTMLInputElement;
                    const qty = parseInt(input?.value || "0");
                    handleManualPick(qty);
                    if (input) input.value = "";
                  }}
                >
                  <Check className="w-4 h-4 mr-2" />
                  Confirm
                </Button>
              </div>

              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => handleManualPick(currentItem.requiredQty)}
              >
                Pick Full Quantity ({currentItem.requiredQty} {currentItem.uom})
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Items Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Picking Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {items.map((item, index) => (
              <div key={index} className={`flex items-center justify-between p-3 border rounded-lg ${
                index === currentItemIndex ? 'border-blue-500 bg-blue-50' : ''
              }`}>
                <div className="flex-1">
                  <h4 className="font-medium">{item.itemCode}</h4>
                  <p className="text-sm text-gray-600">{item.itemName}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm">
                    {item.pickedQty || 0}/{item.requiredQty} {item.uom}
                  </p>
                  <Badge className={getStatusColor(item.status)}>
                    {item.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-between space-x-4">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button 
          onClick={handleComplete}
          disabled={completedItems < items.length}
        >
          Complete Picking
        </Button>
      </div>
    </div>
  );
};

export default PickingProcess;

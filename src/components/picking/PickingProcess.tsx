
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Package, Scan, CheckCircle, AlertCircle, Camera, BarChart3 } from "lucide-react";
import { PickList, PickListItem } from "../../pages/PickList";

interface PickingProcessProps {
  pickList: PickList;
  onBack: () => void;
}

const PickingProcess = ({ pickList, onBack }: PickingProcessProps) => {
  const [currentItemIndex, setCurrentItemIndex] = useState(0);
  const [scannedCode, setScannedCode] = useState("");
  const [enteredQty, setEnteredQty] = useState("");
  const [items, setItems] = useState<PickListItem[]>(pickList.items);

  const currentItem = items[currentItemIndex];
  const totalItems = items.length;
  const completedItems = items.filter(item => item.status === "completed").length;

  const handleScanSubmit = () => {
    if (scannedCode === currentItem.code && enteredQty) {
      const qty = parseInt(enteredQty);
      if (qty > 0 && qty <= currentItem.requiredQty) {
        // Update item status
        const updatedItems = [...items];
        updatedItems[currentItemIndex] = {
          ...currentItem,
          pickedQty: qty,
          status: qty === currentItem.requiredQty ? "completed" : "partial"
        };
        setItems(updatedItems);
        
        // Move to next item if this one is completed
        if (qty === currentItem.requiredQty && currentItemIndex < totalItems - 1) {
          setCurrentItemIndex(currentItemIndex + 1);
          setScannedCode("");
          setEnteredQty("");
        }
      }
    }
  };

  const handlePrevious = () => {
    if (currentItemIndex > 0) {
      setCurrentItemIndex(currentItemIndex - 1);
      setScannedCode("");
      setEnteredQty("");
    }
  };

  const handleSkipItem = () => {
    if (currentItemIndex < totalItems - 1) {
      setCurrentItemIndex(currentItemIndex + 1);
      setScannedCode("");
      setEnteredQty("");
    }
  };

  const getItemStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'partial': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'pending': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const isCodeMatch = scannedCode === currentItem.code;
  const isValidQty = enteredQty && parseInt(enteredQty) > 0 && parseInt(enteredQty) <= currentItem.requiredQty;

  return (
    <div className="space-y-6">
      {/* Header with Back Button */}
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={onBack} className="flex items-center space-x-2">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Details</span>
        </Button>
        
        <div className="flex items-center space-x-4">
          <Badge variant="outline" className="text-sm">
            {pickList.number}
          </Badge>
          <Badge className="bg-blue-100 text-blue-800">
            {completedItems}/{totalItems} Items
          </Badge>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white p-4 rounded-lg border">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-600">Progress</span>
          <span className="text-sm text-gray-600">{Math.round((completedItems / totalItems) * 100)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(completedItems / totalItems) * 100}%` }}
          />
        </div>
      </div>

      {/* Current Item Card */}
      <Card className="border-l-4 border-l-blue-500">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Package className="w-5 h-5 text-blue-600" />
              <span>Item {currentItemIndex + 1} of {totalItems}</span>
            </div>
            <Badge className={getItemStatusColor(currentItem.status)}>
              {currentItem.status}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Item Details */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-600">Item Code:</span>
                <p className="text-lg font-mono text-gray-900">{currentItem.code}</p>
              </div>
              <div>
                <span className="font-medium text-gray-600">Item Name:</span>
                <p className="text-gray-900">{currentItem.name}</p>
              </div>
              <div>
                <span className="font-medium text-gray-600">Warehouse:</span>
                <p className="text-gray-900">{currentItem.warehouse}</p>
              </div>
              <div>
                <span className="font-medium text-gray-600">Bin:</span>
                <p className="text-gray-900">{currentItem.bin}</p>
              </div>
              {currentItem.batch && (
                <div>
                  <span className="font-medium text-gray-600">Batch:</span>
                  <p className="text-gray-900">{currentItem.batch}</p>
                </div>
              )}
              {currentItem.serial && (
                <div>
                  <span className="font-medium text-gray-600">Serial:</span>
                  <p className="text-gray-900">{currentItem.serial}</p>
                </div>
              )}
              <div>
                <span className="font-medium text-gray-600">Required Qty:</span>
                <p className="text-gray-900">{currentItem.requiredQty}</p>
              </div>
              <div>
                <span className="font-medium text-gray-600">Picked Qty:</span>
                <p className="text-gray-900">{currentItem.pickedQty}</p>
              </div>
            </div>
          </div>

          {/* Scanning Section */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="scan">Scan Item Code</Label>
              <div className="flex space-x-2">
                <div className="relative flex-1">
                  <Scan className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="scan"
                    value={scannedCode}
                    onChange={(e) => setScannedCode(e.target.value)}
                    placeholder="Scan or enter item code"
                    className={`pl-10 ${isCodeMatch ? 'border-green-500' : scannedCode ? 'border-red-500' : ''}`}
                  />
                </div>
                <Button variant="outline" size="icon">
                  <Camera className="w-4 h-4" />
                </Button>
              </div>
              {scannedCode && (
                <div className="flex items-center space-x-2 text-sm">
                  {isCodeMatch ? (
                    <>
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-green-600">Code matches!</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-4 h-4 text-red-600" />
                      <span className="text-red-600">Code doesn't match. Expected: {currentItem.code}</span>
                    </>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="qty">Enter Quantity</Label>
              <Input
                id="qty"
                type="number"
                value={enteredQty}
                onChange={(e) => setEnteredQty(e.target.value)}
                placeholder="Enter picked quantity"
                max={currentItem.requiredQty}
                min="1"
                className={isValidQty ? 'border-green-500' : enteredQty ? 'border-red-500' : ''}
              />
              {enteredQty && !isValidQty && (
                <p className="text-sm text-red-600">
                  Quantity must be between 1 and {currentItem.requiredQty}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
        <Button 
          variant="outline" 
          onClick={handlePrevious}
          disabled={currentItemIndex === 0}
          className="flex items-center space-x-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Previous</span>
        </Button>
        
        <Button 
          variant="outline" 
          onClick={handleSkipItem}
          disabled={currentItemIndex === totalItems - 1}
          className="flex items-center space-x-2"
        >
          <span>Skip Item</span>
        </Button>
        
        <Button 
          onClick={handleScanSubmit}
          disabled={!isCodeMatch || !isValidQty}
          className="flex items-center space-x-2 flex-1"
        >
          <CheckCircle className="w-4 h-4" />
          <span>Confirm Pick</span>
        </Button>
      </div>

      {/* Completion Check */}
      {completedItems === totalItems && (
        <Card className="border-green-500 bg-green-50">
          <CardContent className="p-6 text-center">
            <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-green-900 mb-2">Picking Complete!</h3>
            <p className="text-green-700 mb-4">All items have been successfully picked.</p>
            <Button className="bg-green-600 hover:bg-green-700">
              Complete Pick List
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PickingProcess;

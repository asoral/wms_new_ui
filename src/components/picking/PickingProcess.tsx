import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, ChevronLeft, Package, ScanLine, CheckCircle } from "lucide-react";
import { PickList, PickListItem } from "../../pages/PickList";
import { useToast } from "@/hooks/use-toast";

interface PickingProcessProps {
  pickList: PickList;
  onBack: () => void;
  onComplete: (items: PickListItem[]) => void;
}

const PickingProcess = ({ pickList, onBack, onComplete }: PickingProcessProps) => {
  const [currentItemIndex, setCurrentItemIndex] = useState(0);
  const [scannedCode, setScannedCode] = useState("");
  const [scannedQty, setScannedQty] = useState<string>("");
  const [items, setItems] = useState<PickListItem[]>(pickList.items || []);
  const { toast } = useToast();

  useEffect(() => {
    // Initialize items with proper status
    const initializedItems = (pickList.items || []).map(item => ({
      ...item,
      picked_qty: item.picked_qty || 0,
      pickedQty: item.pickedQty || 0,
      status: item.status || "pending"
    }));
    setItems(initializedItems);
  }, [pickList]);

  const handleScanSubmit = () => {
    const currentItem = getCurrentItem();
    const quantity = parseInt(scannedQty);

    if (!quantity || quantity <= 0) {
      toast({
        title: "Invalid Quantity",
        description: "Please enter a valid quantity",
        variant: "destructive"
      });
      return;
    }

    if (quantity > currentItem.qty) {
      toast({
        title: "Quantity Exceeded",
        description: "Cannot pick more than required quantity",
        variant: "destructive"
      });
      return;
    }

    // Update the current item
    const updatedItems = [...items];
    updatedItems[currentItemIndex] = {
      ...currentItem,
      picked_qty: quantity,
      pickedQty: quantity,
      status: quantity === currentItem.qty ? "completed" : "partial"
    };
    setItems(updatedItems);

    // Clear inputs
    setScannedCode("");
    setScannedQty("");

    // Check if all items are completed
    const allCompleted = updatedItems.every(item => (item.picked_qty || 0) === item.qty);
    
    if (allCompleted) {
      // Show completion state
      setTimeout(() => {
        onComplete(updatedItems);
      }, 2000);
    } else {
      // Move to next item if not the last one
      if (currentItemIndex < items.length - 1) {
        setCurrentItemIndex(currentItemIndex + 1);
      }
    }
  };

  const handlePrevious = () => {
    if (currentItemIndex > 0) {
      setCurrentItemIndex(currentItemIndex - 1);
      setScannedCode("");
      setScannedQty("");
    }
  };

  const handleSkipItem = () => {
    if (currentItemIndex < items.length - 1) {
      setCurrentItemIndex(currentItemIndex + 1);
      setScannedCode("");
      setScannedQty("");
    }
  };

  const getCurrentItem = () => {
    return items[currentItemIndex];
  };

  const getItemStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "partial":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getProgressPercentage = () => {
    const completedItems = items.filter(item => item.status === "completed").length;
    return items.length > 0 ? (completedItems / items.length) * 100 : 0;
  };

  const isAllCompleted = () => {
    return items.length > 0 && items.every(item => (item.picked_qty || 0) === item.qty);
  };

  // Early return if no items
  if (!items || items.length === 0) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center space-x-2 mb-6">
          <Package className="w-6 h-6 text-blue-600" />
          <h1 className="text-2xl font-bold">Pick List</h1>
        </div>
        <div className="text-center py-8">
          <p className="text-gray-500">No items to pick in this pick list.</p>
          <Button onClick={onBack} className="mt-4">
            Back to Pick List
          </Button>
        </div>
      </div>
    );
  }

  const currentItem = getCurrentItem();
  const codeMatches = currentItem && scannedCode === currentItem.item_code;

  if (isAllCompleted()) {
    return (
      <div className="p-6 space-y-6">
        {/* Header with stepper */}
        <div className="flex items-center space-x-2 mb-6">
          <Package className="w-6 h-6 text-blue-600" />
          <h1 className="text-2xl font-bold">Pick List</h1>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center space-x-4 mb-6">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-400 flex items-center justify-center text-sm font-medium">
              1
            </div>
            <span className="text-gray-400">Select</span>
          </div>
          <div className="w-8 h-px bg-gray-200"></div>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-400 flex items-center justify-center text-sm font-medium">
              2
            </div>
            <span className="text-gray-400">Details</span>
          </div>
          <div className="w-8 h-px bg-gray-200"></div>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-medium">
              3
            </div>
            <span className="text-blue-600 font-medium">Pick</span>
          </div>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={onBack} className="flex items-center space-x-2">
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Details</span>
          </Button>
          <div className="flex items-center space-x-4">
            <span className="font-semibold">{pickList.name}</span>
            <Badge className="bg-blue-100 text-blue-800">{items.length}/{items.length} Items</Badge>
          </div>
        </div>

        {/* Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Progress</span>
            <span>100%</span>
          </div>
          <Progress value={100} className="h-2" />
        </div>

        {/* Completion Card */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-8 text-center">
          <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-green-900 mb-2">Picking Complete!</h2>
          <p className="text-green-700 mb-6">All items have been successfully picked.</p>
          <Button 
            className="bg-green-600 hover:bg-green-700"
            onClick={() => onComplete(items)}
          >
            Complete Pick List
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header with stepper */}
      <div className="flex items-center space-x-2 mb-6">
        <Package className="w-6 h-6 text-blue-600" />
        <h1 className="text-2xl font-bold">Pick List</h1>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center space-x-4 mb-6">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-400 flex items-center justify-center text-sm font-medium">
            1
          </div>
          <span className="text-gray-400">Select</span>
        </div>
        <div className="w-8 h-px bg-gray-200"></div>
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-400 flex items-center justify-center text-sm font-medium">
            2
          </div>
          <span className="text-gray-400">Details</span>
        </div>
        <div className="w-8 h-px bg-gray-200"></div>
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-medium">
            3
          </div>
          <span className="text-blue-600 font-medium">Pick</span>
        </div>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onBack} className="flex items-center space-x-2">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Details</span>
        </Button>
        <div className="flex items-center space-x-4">
          <span className="font-semibold">{pickList.name}</span>
          <Badge className="bg-blue-100 text-blue-800">{Math.floor(getProgressPercentage() / (100 / items.length))}/{items.length} Items</Badge>
        </div>
      </div>

      {/* Progress */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>Progress</span>
          <span>{Math.round(getProgressPercentage())}%</span>
        </div>
        <Progress value={getProgressPercentage()} className="h-2" />
      </div>

      {/* Current Item Card */}
      <Card className="border-l-4 border-l-blue-500">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Package className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold">Item {currentItemIndex + 1} of {items.length}</h3>
            </div>
            <Badge className={getItemStatusColor(getCurrentItem().status || "pending")}>
              {getCurrentItem().status || "pending"}
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-6 mb-6">
            <div className="space-y-4">
              <div>
                <span className="text-sm font-medium text-gray-600">Item Code:</span>
                <p className="text-lg font-semibold">{getCurrentItem().item_code}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-600">Warehouse:</span>
                <p>{getCurrentItem().warehouse}</p>
              </div>
              {getCurrentItem().batch_no && (
                <div>
                  <span className="text-sm font-medium text-gray-600">Batch:</span>
                  <p>{getCurrentItem().batch_no}</p>
                </div>
              )}
              <div>
                <span className="text-sm font-medium text-gray-600">Picked Qty:</span>
                <p>{getCurrentItem().picked_qty || 0}</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <span className="text-sm font-medium text-gray-600">Item Name:</span>
                <p className="text-lg font-semibold">{getCurrentItem().item_name}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-600">Bin:</span>
                <p>{getCurrentItem().bin || "A-001"}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-600">Required Qty:</span>
                <p>{getCurrentItem().qty}</p>
              </div>
              {getCurrentItem().serial_no && (
                <div>
                  <span className="text-sm font-medium text-gray-600">Serial:</span>
                  <p>{getCurrentItem().serial_no}</p>
                </div>
              )}
            </div>
          </div>

          {/* Scanning Section */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="scanCode" className="text-sm font-medium">Scan Item Code</Label>
              <div className="relative mt-1">
                <Input
                  id="scanCode"
                  placeholder="Scan or enter item code"
                  value={scannedCode}
                  onChange={(e) => setScannedCode(e.target.value)}
                  className="pr-10"
                />
                <ScanLine className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              </div>
              {scannedCode && (
                <p className={`text-sm mt-1 ${codeMatches ? 'text-green-600' : 'text-red-600'}`}>
                  {codeMatches ? '✓ Code matches!' : '✗ Code does not match'}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="quantity" className="text-sm font-medium">Enter Quantity</Label>
              <Input
                id="quantity"
                type="number"
                placeholder="Enter picked quantity"
                value={scannedQty}
                onChange={(e) => setScannedQty(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentItemIndex === 0}
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          Previous
        </Button>

        <Button
          variant="outline"
          onClick={handleSkipItem}
          disabled={currentItemIndex === items.length - 1}
        >
          Skip Item
        </Button>

        <Button
          onClick={handleScanSubmit}
          disabled={!codeMatches || !scannedQty}
          className="bg-gray-800 hover:bg-gray-900"
        >
          <CheckCircle className="w-4 h-4 mr-2" />
          Confirm Pick
        </Button>
      </div>
    </div>
  );
};

export default PickingProcess;
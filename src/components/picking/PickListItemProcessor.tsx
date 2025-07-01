import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Package, ScanLine, CheckCircle } from "lucide-react";
import { createERPNextAPI } from "@/services/erpnextApi";
import { useToast } from "@/hooks/use-toast";

interface PickListItem {
  item_code: string;
  item_name: string;
  qty: number;
  picked_qty?: number;
  warehouse: string;
  batch_no?: string;
  serial_no?: string;
}

interface PickListItemProcessorProps {
  pickListNumber: string;
  pickListItems: PickListItem[];
  onItemsProcessed: (items: PickListItem[]) => void;
  onBack: () => void;
}

const PickListItemProcessor = ({
  pickListNumber,
  pickListItems = [],
  onItemsProcessed,
  onBack
}: PickListItemProcessorProps) => {
  const [items, setItems] = useState<PickListItem[]>([]);
  const [currentItemIndex, setCurrentItemIndex] = useState(0);
  const [scannedQty, setScannedQty] = useState<number>(0);
  const [processing, setProcessing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (pickListItems && pickListItems.length > 0) {
      setItems(pickListItems.map(item => ({
        ...item,
        picked_qty: item.picked_qty || 0
      })));
    } else {
      loadPickListItems();
    }
  }, [pickListNumber, pickListItems]);

  const loadPickListItems = async () => {
    try {
      const erpnextAPI = await createERPNextAPI();
      if (!erpnextAPI) return;

      const response = await erpnextAPI.getPickListItems(pickListNumber);
      
      if (response.data && Array.isArray(response.data)) {
        const loadedItems = response.data.map((item: any) => ({
          item_code: item.item_code,
          item_name: item.item_name,
          qty: item.qty || 0,
          picked_qty: item.picked_qty || 0,
          warehouse: item.warehouse,
          batch_no: item.batch_no,
          serial_no: item.serial_no
        }));
        setItems(loadedItems);
      }
    } catch (error) {
      console.error('Error loading pick list items:', error);
      toast({
        title: "Error",
        description: "Failed to load pick list items",
        variant: "destructive"
      });
    }
  };

  const handleItemPicked = (qty: number) => {
    if (qty <= 0) {
      toast({
        title: "Invalid Quantity",
        description: "Please enter a valid quantity greater than zero.",
        variant: "destructive"
      });
      return;
    }

    if (qty > getCurrentItem().qty) {
      toast({
        title: "Quantity Exceeded",
        description: "You cannot pick more than the required quantity.",
        variant: "destructive"
      });
      return;
    }

    setScannedQty(qty);
  };

  const handleNext = () => {
    const updatedItems = [...items];
    updatedItems[currentItemIndex].picked_qty = scannedQty;
    setItems(updatedItems);
    setScannedQty(0);

    if (currentItemIndex < items.length - 1) {
      setCurrentItemIndex(currentItemIndex + 1);
    }
  };

  const handleComplete = () => {
    setProcessing(true);
    const updatedItems = [...items];
    updatedItems[currentItemIndex].picked_qty = scannedQty;
    setItems(updatedItems);

    // Check if all items are picked
    const allItemsPicked = updatedItems.every(item => item.picked_qty === item.qty);

    if (!allItemsPicked) {
      toast({
        title: "Incomplete Picking",
        description: "Not all items have been picked. Please ensure all items are picked before completing.",
        variant: "destructive"
      });
      setProcessing(false);
      return;
    }

    toast({
      title: "Pick List Completed",
      description: "All items have been successfully picked.",
    });

    onItemsProcessed(updatedItems);
    setProcessing(false);
  };

  const getCurrentItem = (): PickListItem => {
    return items[currentItemIndex];
  };

  return (
    <div className="container mx-auto mt-8">
      <Button onClick={onBack} variant="ghost" className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Dashboard
      </Button>

      {items.length === 0 ? (
        <Card>
          <CardContent className="text-center p-6">
            Loading items...
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-2xl font-bold">
              <Package className="mr-2 h-5 w-5 inline-block align-middle" />
              Pick List Item
            </CardTitle>
            <Badge variant="secondary">
              Item {currentItemIndex + 1} of {items.length}
            </Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-lg font-semibold">Item Code</h3>
                <p>{getCurrentItem().item_code}</p>
              </div>
              <div>
                <h3 className="text-lg font-semibold">Item Name</h3>
                <p>{getCurrentItem().item_name}</p>
              </div>
              <div>
                <h3 className="text-lg font-semibold">Required Quantity</h3>
                <p>{getCurrentItem().qty}</p>
              </div>
              <div>
                <h3 className="text-lg font-semibold">Warehouse</h3>
                <p>{getCurrentItem().warehouse}</p>
              </div>
              {getCurrentItem().batch_no && (
                <div>
                  <h3 className="text-lg font-semibold">Batch No</h3>
                  <p>{getCurrentItem().batch_no}</p>
                </div>
              )}
              {getCurrentItem().serial_no && (
                <div>
                  <h3 className="text-lg font-semibold">Serial No</h3>
                  <p>{getCurrentItem().serial_no}</p>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="scan_qty">Scanned Quantity</Label>
              <Input
                id="scan_qty"
                type="number"
                placeholder="0"
                value={scannedQty}
                onChange={(e) => handleItemPicked(Number(e.target.value))}
              />
            </div>

            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={handleNext}
                disabled={scannedQty !== getCurrentItem().qty || currentItemIndex === items.length - 1 || processing}
              >
                Next
              </Button>
              <Button
                onClick={handleComplete}
                disabled={scannedQty !== getCurrentItem().qty || processing}
              >
                {processing ? (
                  <>
                    <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Complete
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PickListItemProcessor;

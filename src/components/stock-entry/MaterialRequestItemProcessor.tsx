import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Package, Plus, Minus, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import ItemScanner from "@/components/item-enquiry/ItemScanner";
import { Item } from "@/types";

interface MaterialRequestItem {
  item_code: string;
  item_name: string;
  qty: number;
  uom: string;
  warehouse?: string;
  rate?: number;
  amount?: number;
  schedule_date?: string;
  description?: string;
}

interface ProcessedItem {
  item_code: string;
  item_name: string;
  requested_qty: number;
  processed_qty: number;
  remaining_qty: number;
  uom: string;
  warehouse?: string;
  batch?: string;
  serial?: string;
}

interface MaterialRequestItemProcessorProps {
  mrItems: MaterialRequestItem[];
  onItemProcessed: (item: ProcessedItem) => void;
  isLoading?: boolean;
}

const MaterialRequestItemProcessor = ({ 
  mrItems, 
  onItemProcessed, 
  isLoading = false 
}: MaterialRequestItemProcessorProps) => {
  const [processedItems, setProcessedItems] = useState<ProcessedItem[]>([]);
  const [currentItem, setCurrentItem] = useState<MaterialRequestItem | null>(null);
  const [processQty, setProcessQty] = useState<number>(0);
  const [warehouse, setWarehouse] = useState<string>("");
  const [batch, setBatch] = useState<string>("");
  const [serial, setSerial] = useState<string>("");
  const { toast } = useToast();

  const handleItemSelected = (item: Item) => {
    const itemCode = item.item_code;
    
    const mrItem = mrItems.find(item => item.item_code === itemCode);
    
    if (mrItem) {
      setCurrentItem(mrItem);
      setProcessQty(mrItem.qty);
      setWarehouse(mrItem.warehouse || "");
      toast({
        title: "Item Found",
        description: `${item.item_name} is available in the material request.`,
      });
    } else {
      toast({
        title: "Item Not Found",
        description: `${item.item_name} is not in the selected material request.`,
        variant: "destructive"
      });
    }
  };

  const handleProcessItem = () => {
    if (!currentItem || processQty <= 0) {
      toast({
        title: "Invalid Input",
        description: "Please select an item and enter a valid quantity.",
        variant: "destructive"
      });
      return;
    }

    const existingProcessed = processedItems.find(item => item.item_code === currentItem.item_code);
    const totalProcessed = existingProcessed ? existingProcessed.processed_qty + processQty : processQty;

    if (totalProcessed > currentItem.qty) {
      toast({
        title: "Quantity Exceeded",
        description: "Processed quantity cannot exceed requested quantity.",
        variant: "destructive"
      });
      return;
    }

    const processedItem: ProcessedItem = {
      item_code: currentItem.item_code,
      item_name: currentItem.item_name,
      requested_qty: currentItem.qty,
      processed_qty: totalProcessed,
      remaining_qty: currentItem.qty - totalProcessed,
      uom: currentItem.uom,
      warehouse: warehouse,
      batch: batch || undefined,
      serial: serial || undefined
    };

    if (existingProcessed) {
      setProcessedItems(prev => 
        prev.map(item => 
          item.item_code === currentItem.item_code ? processedItem : item
        )
      );
    } else {
      setProcessedItems(prev => [...prev, processedItem]);
    }

    onItemProcessed(processedItem);

    // Reset form
    setCurrentItem(null);
    setProcessQty(0);
    setWarehouse("");
    setBatch("");
    setSerial("");

    toast({
      title: "Item Processed",
      description: `${currentItem.item_name} has been processed successfully.`,
    });
  };

  const handleRemoveProcessedItem = (itemCode: string) => {
    setProcessedItems(prev => prev.filter(item => item.item_code !== itemCode));
    toast({
      title: "Item Removed",
      description: "Item has been removed from processed list.",
    });
  };

  const getRemainingQty = (itemCode: string) => {
    const mrItem = mrItems.find(item => item.item_code === itemCode);
    const processedItem = processedItems.find(item => item.item_code === itemCode);
    
    if (!mrItem) return 0;
    return mrItem.qty - (processedItem?.processed_qty || 0);
  };

  return (
    <div className="space-y-6">
      {/* Item Scanner */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Package className="w-5 h-5" />
            <span>Scan Material Request Items</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ItemScanner 
            onItemScanned={handleItemSelected}
            isLoading={isLoading}
          />
        </CardContent>
      </Card>

      {/* Current Item Processing */}
      {currentItem && (
        <Card>
          <CardHeader>
            <CardTitle>Process Item: {currentItem.item_name}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Item Code</Label>
                <Input value={currentItem.item_code} disabled />
              </div>
              <div>
                <Label>Item Name</Label>
                <Input value={currentItem.item_name} disabled />
              </div>
              <div>
                <Label>Requested Quantity</Label>
                <Input value={`${currentItem.qty} ${currentItem.uom}`} disabled />
              </div>
              <div>
                <Label>Remaining Quantity</Label>
                <Input value={`${getRemainingQty(currentItem.item_code)} ${currentItem.uom}`} disabled />
              </div>
              <div>
                <Label>Process Quantity</Label>
                <Input
                  type="number"
                  value={processQty}
                  onChange={(e) => setProcessQty(Number(e.target.value))}
                  max={getRemainingQty(currentItem.item_code)}
                  min={1}
                />
              </div>
              <div>
                <Label>Warehouse</Label>
                <Input
                  value={warehouse}
                  onChange={(e) => setWarehouse(e.target.value)}
                  placeholder="Enter warehouse"
                />
              </div>
              <div>
                <Label>Batch (Optional)</Label>
                <Input
                  value={batch}
                  onChange={(e) => setBatch(e.target.value)}
                  placeholder="Enter batch number"
                />
              </div>
              <div>
                <Label>Serial (Optional)</Label>
                <Input
                  value={serial}
                  onChange={(e) => setSerial(e.target.value)}
                  placeholder="Enter serial number"
                />
              </div>
            </div>
            <Button 
              onClick={handleProcessItem}
              disabled={!currentItem || processQty <= 0 || processQty > getRemainingQty(currentItem.item_code)}
              className="w-full"
            >
              <Plus className="w-4 h-4 mr-2" />
              Process Item
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Processed Items List */}
      {processedItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Processed Items ({processedItems.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {processedItems.map((item) => (
                <div key={item.item_code} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-medium">{item.item_name}</span>
                      <Badge variant="outline">{item.item_code}</Badge>
                    </div>
                    <div className="text-sm text-gray-600 space-x-4">
                      <span>Processed: {item.processed_qty} {item.uom}</span>
                      <span>Remaining: {item.remaining_qty} {item.uom}</span>
                      {item.warehouse && <span>Warehouse: {item.warehouse}</span>}
                      {item.batch && <span>Batch: {item.batch}</span>}
                      {item.serial && <span>Serial: {item.serial}</span>}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRemoveProcessedItem(item.item_code)}
                  >
                    <Minus className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Material Request Items Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Material Request Items</CardTitle>
        </CardHeader>
        <CardContent>
          {mrItems.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p>No material request items available.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {mrItems.map((item) => {
                const processed = processedItems.find(p => p.item_code === item.item_code);
                const remaining = getRemainingQty(item.item_code);
                const isCompleted = remaining === 0;
                
                return (
                  <div key={item.item_code} className={`p-3 border rounded-lg ${isCompleted ? 'bg-green-50 border-green-200' : 'bg-gray-50'}`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-medium">{item.item_name}</span>
                        <span className="text-sm text-gray-600 ml-2">({item.item_code})</span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm">
                          <span className={isCompleted ? 'text-green-600 font-medium' : 'text-gray-600'}>
                            {processed?.processed_qty || 0} / {item.qty} {item.uom}
                          </span>
                        </div>
                        {isCompleted && (
                          <Badge className="bg-green-100 text-green-800">Completed</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MaterialRequestItemProcessor;

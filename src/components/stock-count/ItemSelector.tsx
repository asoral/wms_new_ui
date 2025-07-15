import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Package, ScanBarcode, Search, AlertCircle } from "lucide-react";
import StockCountItemSelector from "@/components/common/ItemSelector";
import SerialBatchBundleSelector from "@/components/stock-count/SerialBatchBundleSelector";
import { useToast } from "@/hooks/use-toast";
import { Item } from "@/types";

interface ItemSelectorProps {
  warehouse: string;
  onItemAdded: (item: {
    itemCode: string;
    itemName: string;
    warehouse: string;
    currentQty: number;
    actualQty: number;
    uom: string;
    batch?: string;
    serial?: string;
    serialBatchBundle?: string;
  }) => void;
}

const ItemSelector = ({ warehouse, onItemAdded }: ItemSelectorProps) => {
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [actualQty, setActualQty] = useState<number>(0);
  const [batch, setBatch] = useState<string>("");
  const [serial, setSerial] = useState<string>("");
  const [activeTab, setActiveTab] = useState<string>("manual");
  const [serialBatchBundle, setSerialBatchBundle] = useState<string>("");
  const [showBundleSelector, setShowBundleSelector] = useState(false);
  const { toast } = useToast();

  const handleItemSelect = (item: Item) => {
    setSelectedItem(item);
    setShowBundleSelector(false);
    setSerialBatchBundle("");
    setBatch("");
    setSerial("");
  };

  const isItemTracked = (item: Item | null) => {
    if (!item) return false;
    return item.has_serial_no === 1 || item.has_batch_no === 1;
  };

  const handleBundleCreated = (bundleName: string, totalQty: number) => {
    setSerialBatchBundle(bundleName);
    setActualQty(totalQty);
    setShowBundleSelector(false);
    toast({
      title: "Bundle Created",
      description: `Serial and Batch Bundle ${bundleName} created with ${totalQty} items.`,
    });
  };

  const handleAddItem = () => {
    if (!selectedItem) {
      toast({
        title: "No Item Selected",
        description: "Please select an item first.",
        variant: "destructive"
      });
      return;
    }

    // Check if item is tracked and requires bundle
    if (isItemTracked(selectedItem) && !serialBatchBundle) {
      toast({
        title: "Serial/Batch Bundle Required",
        description: "This item requires serial/batch tracking. Please create a bundle first.",
        variant: "destructive"
      });
      return;
    }

    if (actualQty <= 0) {
      toast({
        title: "Invalid Quantity", 
        description: "Quantity must be greater than zero.",
        variant: "destructive"
      });
      return;
    }

    const itemData = {
      itemCode: selectedItem.item_code,
      itemName: selectedItem.item_name,
      warehouse: warehouse,
      currentQty: 0, // Will be updated with actual stock
      actualQty: actualQty,
      uom: selectedItem.stock_uom || 'Nos',
      batch: batch || undefined,
      serial: serial || undefined,
      serialBatchBundle: serialBatchBundle || undefined
    };

    onItemAdded(itemData);

    // Reset form
    setSelectedItem(null);
    setActualQty(0);
    setBatch("");
    setSerial("");
    setSerialBatchBundle("");
    setShowBundleSelector(false);

    toast({
      title: "Item Added",
      description: `${selectedItem.item_name} added to stock count.`,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Package className="w-5 h-5" />
          <span>Add Items to Count</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="manual">
              <Search className="w-4 h-4 mr-2" />
              Manual Selection
            </TabsTrigger>
            <TabsTrigger value="scan">
              <ScanBarcode className="w-4 h-4 mr-2" />
              Scan Barcode
            </TabsTrigger>
          </TabsList>

          <TabsContent value="manual" className="space-y-4 mt-6">
            <div className="space-y-2">
              <Label>Select Item</Label>
              <StockCountItemSelector
                onItemSelect={handleItemSelect}
                selectedItem={selectedItem}
                placeholder="Search and select item..."
              />
            </div>

            {selectedItem && (
              <div className="p-4 bg-muted rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-3">
                  <div>
                    <p className="font-medium text-muted-foreground">Item Code</p>
                    <p className="text-foreground">{selectedItem.item_code}</p>
                  </div>
                  <div>
                    <p className="font-medium text-muted-foreground">UOM</p>
                    <p className="text-foreground">{selectedItem.stock_uom}</p>
                  </div>
                </div>
                
                {/* Item Tracking Info */}
                {isItemTracked(selectedItem) && (
                  <div className="flex flex-wrap items-center space-x-2 mb-2">
                    <AlertCircle className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-foreground">Item Tracking:</span>
                    {selectedItem.has_serial_no === 1 && (
                      <Badge variant="outline" className="text-xs">Serial Tracked</Badge>
                    )}
                    {selectedItem.has_batch_no === 1 && (
                      <Badge variant="outline" className="text-xs">Batch Tracked</Badge>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Serial/Batch Bundle for tracked items */}
            {selectedItem && isItemTracked(selectedItem) && (
              <div className="space-y-4">
                {!showBundleSelector ? (
                  <div className="p-4 border border-blue-200 bg-blue-50 rounded-lg">
                    <div className="flex flex-col md:flex-row md:items-center justify-between space-y-2 md:space-y-0">
                      <div className="flex items-center space-x-2">
                        <AlertCircle className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-700">
                          This item requires serial/batch tracking
                        </span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowBundleSelector(true)}
                        className="w-full md:w-auto"
                      >
                        Create Bundle
                      </Button>
                    </div>
                    {serialBatchBundle && (
                      <div className="mt-2 flex flex-wrap items-center space-x-2">
                        <Badge variant="secondary">Bundle: {serialBatchBundle}</Badge>
                        <span className="text-sm text-muted-foreground">Qty: {actualQty}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <SerialBatchBundleSelector
                    itemCode={selectedItem.item_code}
                    itemName={selectedItem.item_name}
                    itemGroup={selectedItem.item_group || ''}
                    hasSerial={selectedItem.has_serial_no === 1}
                    hasBatch={selectedItem.has_batch_no === 1}
                    warehouse={warehouse}
                    transactionType="Inward"
                    onBundleCreated={handleBundleCreated}
                    initialQuantity={1}
                  />
                )}
              </div>
            )}

            {/* Simple quantity input for non-tracked items */}
            {selectedItem && !isItemTracked(selectedItem) && (
              <div className="space-y-2">
                <Label htmlFor="actual-qty">Actual Quantity *</Label>
                  <Input
                    id="actual-qty"
                    type="number"
                    placeholder="0"
                    value={actualQty || ""}
                    onChange={(e) => setActualQty(Number(e.target.value))}
                    min="1"
                    step="0.01"
                    className="w-full"
                  />
              </div>
            )}

            <Button 
              onClick={handleAddItem} 
              className="w-full"
              disabled={!selectedItem || actualQty <= 0 || (isItemTracked(selectedItem) && !serialBatchBundle)}
            >
              Add Item to Count
            </Button>
          </TabsContent>

          <TabsContent value="scan" className="space-y-4 mt-6">
            <div className="text-center p-8 border-2 border-dashed border-border rounded-lg">
              <ScanBarcode className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">Scan Barcode</h3>
              <p className="text-muted-foreground mb-4">Use your device camera or barcode scanner</p>
              <p className="text-sm text-muted-foreground">Feature coming soon...</p>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default ItemSelector;
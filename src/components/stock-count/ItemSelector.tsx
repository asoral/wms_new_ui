import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Package, ScanBarcode, Search } from "lucide-react";
import ItemDropdown from "@/components/common/ItemDropdown";
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
  }) => void;
}

const ItemSelector = ({ warehouse, onItemAdded }: ItemSelectorProps) => {
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [actualQty, setActualQty] = useState<number>(0);
  const [batch, setBatch] = useState<string>("");
  const [serial, setSerial] = useState<string>("");
  const [activeTab, setActiveTab] = useState<string>("manual");
  const { toast } = useToast();

  const handleItemSelect = (item: Item) => {
    setSelectedItem(item);
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

    if (actualQty < 0) {
      toast({
        title: "Invalid Quantity", 
        description: "Quantity cannot be negative.",
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
      serial: serial || undefined
    };

    onItemAdded(itemData);

    // Reset form
    setSelectedItem(null);
    setActualQty(0);
    setBatch("");
    setSerial("");

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
              <ItemDropdown
                onItemSelect={handleItemSelect}
                selectedItem={selectedItem}
                placeholder="Search and select item..."
              />
            </div>

            {selectedItem && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-medium text-gray-600">Item Code</p>
                    <p className="text-gray-900">{selectedItem.item_code}</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-600">UOM</p>
                    <p className="text-gray-900">{selectedItem.stock_uom}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="actual-qty">Actual Quantity *</Label>
                <Input
                  id="actual-qty"
                  type="number"
                  placeholder="0"
                  value={actualQty || ""}
                  onChange={(e) => setActualQty(Number(e.target.value))}
                  min="0"
                  step="0.01"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="batch">Batch (Optional)</Label>
                <Input
                  id="batch"
                  placeholder="Enter batch number"
                  value={batch}
                  onChange={(e) => setBatch(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="serial">Serial (Optional)</Label>
                <Input
                  id="serial"
                  placeholder="Enter serial number"
                  value={serial}
                  onChange={(e) => setSerial(e.target.value)}
                />
              </div>
            </div>

            <Button 
              onClick={handleAddItem} 
              className="w-full"
              disabled={!selectedItem}
            >
              Add Item to Count
            </Button>
          </TabsContent>

          <TabsContent value="scan" className="space-y-4 mt-6">
            <div className="text-center p-8 border-2 border-dashed border-gray-300 rounded-lg">
              <ScanBarcode className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Scan Barcode</h3>
              <p className="text-gray-600 mb-4">Use your device camera or barcode scanner</p>
              <p className="text-sm text-gray-500">Feature coming soon...</p>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default ItemSelector;
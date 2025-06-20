
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Trash2, Plus, Search, Package, ScanLine, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import ItemSelector from "../item-enquiry/ItemSelector";

interface StockCountItem {
  item_code: string;
  item_name: string;
  current_qty: number;
  counted_qty: number;
  difference: number;
  uom: string;
  batch_no?: string;
  serial_no?: string;
}

interface StockCountFormProps {
  onSubmit: (items: StockCountItem[]) => void;
  isLoading?: boolean;
  warehouse?: string;
  onAddEntry?: (entry: any) => Promise<void>;
}

const StockCountForm = ({ onSubmit, isLoading = false, warehouse, onAddEntry }: StockCountFormProps) => {
  const [selectedItems, setSelectedItems] = useState<StockCountItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedItemCode, setSelectedItemCode] = useState("");
  const [countedQty, setCountedQty] = useState<number>(0);
  const [batchNo, setBatchNo] = useState("");
  const [serialNo, setSerialNo] = useState("");
  const { toast } = useToast();

  const handleItemSelected = (itemCode: string) => {
    setSelectedItemCode(itemCode);
    setSearchTerm(itemCode);
  };

  const addItemToCount = async () => {
    if (!selectedItemCode) {
      toast({
        title: "No Item Selected",
        description: "Please select an item to add to the count.",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Adding Item",
      description: "Item is being added to the count...",
    });

    try {
      if (onAddEntry) {
        await onAddEntry({
          itemCode: selectedItemCode,
          itemName: searchTerm,
          warehouse: warehouse || '',
          currentQty: 0,
          actualQty: countedQty,
          uom: "Nos",
          batch: batchNo || undefined,
          serial: serialNo || undefined,
        });
      } else {
        await new Promise(resolve => setTimeout(resolve, 1000));

        const newItem: StockCountItem = {
          item_code: selectedItemCode,
          item_name: searchTerm,
          current_qty: 0,
          counted_qty: countedQty,
          difference: countedQty - 0,
          uom: "Nos",
          batch_no: batchNo || undefined,
          serial_no: serialNo || undefined,
        };

        setSelectedItems(prev => [...prev, newItem]);
      }
      
      setSelectedItemCode("");
      setSearchTerm("");
      setCountedQty(0);
      setBatchNo("");
      setSerialNo("");

      toast({
        title: "Item Added",
        description: "Item has been successfully added to the count.",
        variant: "default"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add item to count.",
        variant: "destructive"
      });
    }
  };

  const removeItem = (index: number) => {
    setSelectedItems(prev => prev.filter((_, i) => i !== index));
    toast({
      title: "Item Removed",
      description: "Item has been removed from the count.",
    });
  };

  const updateCountedQty = (index: number, qty: number) => {
    setSelectedItems(prev => prev.map((item, i) => 
      i === index 
        ? { ...item, counted_qty: qty, difference: qty - item.current_qty }
        : item
    ));
  };

  const handleSubmit = () => {
    if (selectedItems.length === 0) {
      toast({
        title: "No Items",
        description: "Please add at least one item to the count.",
        variant: "destructive"
      });
      return;
    }

    onSubmit(selectedItems);
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="scan" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="scan" className="flex items-center space-x-2">
            <ScanLine className="w-4 h-4" />
            <span>Scan Item</span>
          </TabsTrigger>
          <TabsTrigger value="search" className="flex items-center space-x-2">
            <Search className="w-4 h-4" />
            <span>Search Item</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="scan" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <ScanLine className="w-5 h-5" />
                <span>Scan Item Barcode</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="barcode">Barcode</Label>
                <Input
                  id="barcode"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Scan or enter barcode"
                  className="text-lg"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="search" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Search className="w-5 h-5" />
                <span>Search Item</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ItemSelector
                onItemSelected={handleItemSelected}
                isLoading={false}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Item Details Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Package className="w-5 h-5" />
            <span>Item Details</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="counted_qty">Counted Quantity</Label>
              <Input
                id="counted_qty"
                type="number"
                value={countedQty}
                onChange={(e) => setCountedQty(Number(e.target.value))}
                placeholder="0"
                min="0"
                step="0.01"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="batch_no">Batch No (Optional)</Label>
              <Input
                id="batch_no"
                value={batchNo}
                onChange={(e) => setBatchNo(e.target.value)}
                placeholder="Enter batch number"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="serial_no">Serial No (Optional)</Label>
            <Input
              id="serial_no"
              value={serialNo}
              onChange={(e) => setSerialNo(e.target.value)}
              placeholder="Enter serial number"
            />
          </div>
          <Button 
            onClick={addItemToCount} 
            className="w-full"
            disabled={!selectedItemCode}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add to Count
          </Button>
        </CardContent>
      </Card>

      {/* Selected Items - Only show if not using onAddEntry */}
      {!onAddEntry && selectedItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5" />
              <span>Items to Count ({selectedItems.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {selectedItems.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h4 className="font-medium">{item.item_name}</h4>
                      <Badge variant="outline">{item.item_code}</Badge>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <span>Current: {item.current_qty}</span>
                      <span>Counted: 
                        <Input
                          type="number"
                          value={item.counted_qty}
                          onChange={(e) => updateCountedQty(index, Number(e.target.value))}
                          className="w-20 h-8 ml-2 inline-block"
                          min="0"
                          step="0.01"
                        />
                      </span>
                      <span className={`font-medium ${item.difference >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        Diff: {item.difference > 0 ? '+' : ''}{item.difference}
                      </span>
                    </div>
                    {(item.batch_no || item.serial_no) && (
                      <div className="flex items-center space-x-2 mt-2">
                        {item.batch_no && (
                          <Badge variant="secondary">Batch: {item.batch_no}</Badge>
                        )}
                        {item.serial_no && (
                          <Badge variant="secondary">Serial: {item.serial_no}</Badge>
                        )}
                      </div>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeItem(index)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Submit Button - Only show if not using onAddEntry */}
      {!onAddEntry && (
        <Button 
          onClick={handleSubmit} 
          className="w-full" 
          size="lg"
          disabled={selectedItems.length === 0 || isLoading}
        >
          {isLoading ? "Processing..." : `Submit Stock Count (${selectedItems.length} items)`}
        </Button>
      )}
    </div>
  );
};

export default StockCountForm;

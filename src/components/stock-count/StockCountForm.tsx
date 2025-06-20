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
import SerialBatchBundleSelector from "./SerialBatchBundleSelector";
import { createERPNextAPI } from "@/services/erpnextApi";
import { createSerialBatchBundleFromTraditionalEntry } from "@/services/serialBatchBundleApi";

interface StockCountItem {
  item_code: string;
  item_name: string;
  current_qty: number;
  counted_qty: number;
  difference: number;
  uom: string;
  batch_no?: string;
  serial_no?: string;
  serialBatchBundle?: string;
  useTraditionalEntry?: boolean;
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
  const [selectedBundle, setSelectedBundle] = useState("");
  const [useTraditionalEntry, setUseTraditionalEntry] = useState(true); // Default to true for manual entry
  const [itemDetails, setItemDetails] = useState<any>(null);
  const { toast } = useToast();

  const handleItemSelected = async (itemCode: string) => {
    setSelectedItemCode(itemCode);
    setSearchTerm(itemCode);
    
    // Fetch item details to check if it has serial/batch tracking
    try {
      const erpnextAPI = await createERPNextAPI();
      if (erpnextAPI) {
        const itemResult = await erpnextAPI.getItemDetails(itemCode);
        if (itemResult.data) {
          setItemDetails(itemResult.data);
          // Reset bundle selection when item changes
          setSelectedBundle("");
          setBatchNo("");
          setSerialNo("");
        }
      }
    } catch (error) {
      console.error('Error fetching item details:', error);
    }
  };

  const handleBundleCreated = (bundleName: string, totalQty: number) => {
    setSelectedBundle(bundleName);
    setCountedQty(totalQty);
    toast({
      title: "Bundle Created",
      description: `Serial and Batch Bundle created: ${bundleName}`,
    });
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
      let serialBatchBundle = selectedBundle;
      
      // If using traditional entry and item has serial/batch tracking, create bundle
      if (useTraditionalEntry && itemDetails && (itemDetails.has_serial_no || itemDetails.has_batch_no) && (batchNo || serialNo)) {
        try {
          serialBatchBundle = await createSerialBatchBundleFromTraditionalEntry(
            selectedItemCode,
            itemDetails.item_name || searchTerm,
            itemDetails.item_group || 'All Item Groups',
            itemDetails.has_serial_no || 0,
            itemDetails.has_batch_no || 0,
            warehouse || '',
            countedQty,
            itemDetails.stock_uom || 'Nos',
            batchNo || undefined,
            serialNo || undefined
          );
          
          if (!serialBatchBundle) {
            throw new Error('Failed to create Serial and Batch Bundle');
          }
          
          toast({
            title: "Bundle Created",
            description: `Serial and Batch Bundle created: ${serialBatchBundle}`,
          });
        } catch (bundleError) {
          console.error('Error creating bundle:', bundleError);
          toast({
            title: "Bundle Creation Failed",
            description: "Failed to create Serial and Batch Bundle. Item will be added without bundle.",
            variant: "destructive"
          });
        }
      }

      if (onAddEntry) {
        await onAddEntry({
          itemCode: selectedItemCode,
          itemName: itemDetails?.item_name || searchTerm,
          warehouse: warehouse || '',
          currentQty: 0,
          actualQty: countedQty,
          uom: itemDetails?.stock_uom || "Nos",
          batch: useTraditionalEntry ? batchNo || undefined : undefined,
          serial: useTraditionalEntry ? serialNo || undefined : undefined,
          serialBatchBundle: serialBatchBundle || undefined,
          useTraditionalEntry: useTraditionalEntry
        });
      } else {
        await new Promise(resolve => setTimeout(resolve, 1000));

        const newItem: StockCountItem = {
          item_code: selectedItemCode,
          item_name: itemDetails?.item_name || searchTerm,
          current_qty: 0,
          counted_qty: countedQty,
          difference: countedQty - 0,
          uom: itemDetails?.stock_uom || "Nos",
          batch_no: useTraditionalEntry ? batchNo || undefined : undefined,
          serial_no: useTraditionalEntry ? serialNo || undefined : undefined,
          serialBatchBundle: serialBatchBundle || undefined,
          useTraditionalEntry: useTraditionalEntry
        };

        setSelectedItems(prev => [...prev, newItem]);
      }
      
      setSelectedItemCode("");
      setSearchTerm("");
      setCountedQty(0);
      setBatchNo("");
      setSerialNo("");
      setSelectedBundle("");
      setItemDetails(null);

      toast({
        title: "Item Added",
        description: "Item has been successfully added to the count.",
        variant: "default"
      });
    } catch (error) {
      console.error('Error adding item:', error);
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

  const hasSerialBatchTracking = itemDetails && (itemDetails.has_serial_no || itemDetails.has_batch_no);

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
            {itemDetails && (
              <div className="space-y-2">
                <Label>Item Info</Label>
                <div className="text-sm text-muted-foreground">
                  <p>UOM: {itemDetails.stock_uom || 'Nos'}</p>
                  {hasSerialBatchTracking && (
                    <div className="flex gap-2 mt-1">
                      {itemDetails.has_serial_no && <Badge variant="outline">Serial Tracking</Badge>}
                      {itemDetails.has_batch_no && <Badge variant="outline">Batch Tracking</Badge>}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Serial and Batch Bundle Section */}
          {hasSerialBatchTracking && selectedItemCode && warehouse && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Serial/Batch Entry Method</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setUseTraditionalEntry(!useTraditionalEntry)}
                >
                  {useTraditionalEntry ? 'Use Bundle' : 'Manual Entry'}
                </Button>
              </div>

              {!useTraditionalEntry ? (
                <div className="space-y-2">
                  <Label>Create Serial and Batch Bundle</Label>
                  <SerialBatchBundleSelector
                    itemCode={selectedItemCode}
                    itemName={itemDetails.item_name || searchTerm}
                    itemGroup={itemDetails.item_group || 'All Item Groups'}
                    hasSerial={itemDetails.has_serial_no || false}
                    hasBatch={itemDetails.has_batch_no || false}
                    warehouse={warehouse}
                    transactionType="Inward"
                    onBundleCreated={handleBundleCreated}
                    initialQuantity={countedQty || 1}
                  />
                  {selectedBundle && (
                    <p className="text-sm text-muted-foreground">
                      Selected Bundle: {selectedBundle}
                    </p>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {itemDetails.has_batch_no && (
                    <div className="space-y-2">
                      <Label htmlFor="batch_no">Batch No</Label>
                      <Input
                        id="batch_no"
                        value={batchNo}
                        onChange={(e) => setBatchNo(e.target.value)}
                        placeholder="Enter batch number"
                      />
                    </div>
                  )}
                  {itemDetails.has_serial_no && (
                    <div className="space-y-2">
                      <Label htmlFor="serial_no">Serial No</Label>
                      <Input
                        id="serial_no"
                        value={serialNo}
                        onChange={(e) => setSerialNo(e.target.value)}
                        placeholder="Enter serial number"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

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
                    {(item.batch_no || item.serial_no || item.serialBatchBundle) && (
                      <div className="flex items-center space-x-2 mt-2">
                        {item.serialBatchBundle && (
                          <Badge variant="secondary">Bundle: {item.serialBatchBundle}</Badge>
                        )}
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

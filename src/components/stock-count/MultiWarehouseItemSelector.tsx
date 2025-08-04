import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Package, ScanBarcode, Search, AlertCircle, Building2 } from "lucide-react";
import StockCountItemSelector from "@/components/common/ItemSelector";
import SerialBatchBundleSelector from "@/components/stock-count/SerialBatchBundleSelector";
import BarcodeScanner from "@/components/common/BarcodeScanner";
import WarehouseScanner from "@/components/stock-count/WarehouseScanner";
import { useToast } from "@/hooks/use-toast";
import { useItemSearch } from "@/hooks/useItemSearch";
import { Item } from "@/types";
import { createERPNextAPI, getUserDefaultCompany } from "@/services/erpnextApi";

interface MultiWarehouseItemSelectorProps {
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

const MultiWarehouseItemSelector = ({ onItemAdded }: MultiWarehouseItemSelectorProps) => {
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>("");
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [actualQty, setActualQty] = useState<number>(0);
  const [batch, setBatch] = useState<string>("");
  const [serial, setSerial] = useState<string>("");
  const [activeTab, setActiveTab] = useState<string>("manual");
  const [warehouseTab, setWarehouseTab] = useState<string>("select");
  const [serialBatchBundle, setSerialBatchBundle] = useState<string>("");
  const [showBundleSelector, setShowBundleSelector] = useState(false);
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const [showWarehouseScanner, setShowWarehouseScanner] = useState(false);
  const { toast } = useToast();
  const { searchByBarcode, searching } = useItemSearch();

  // Load warehouses on component mount
  useEffect(() => {
    loadWarehouses();
  }, []);

  const loadWarehouses = async () => {
    try {
      const erpnextAPI = await createERPNextAPI();
      if (!erpnextAPI) return;

      const company = await getUserDefaultCompany();
      const filters = company ? [['company', '=', company]] : undefined;
      const response = await erpnextAPI.getWarehouses(filters);
      
      if (response?.data) {
        // Sort warehouses by warehouse_name
        const sortedWarehouses = response.data.sort((a: any, b: any) => 
          (a.warehouse_name || a.name).localeCompare(b.warehouse_name || b.name)
        );
        setWarehouses(sortedWarehouses);
      }
    } catch (error) {
      console.error('Failed to load warehouses:', error);
    }
  };

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

  const handleBarcodeScanned = async (barcode: string) => {
    try {
      setShowBarcodeScanner(false);
      toast({
        title: "Barcode Scanned",
        description: `Searching for item with barcode: ${barcode}`,
      });
      
      const erpnextAPI = await createERPNextAPI();
      if (!erpnextAPI) {
        throw new Error('ERPNext API not available');
      }

      const response = await erpnextAPI.searchItemsByBarcode(barcode);
      
      if (response?.data && Array.isArray(response.data) && response.data.length > 0) {
        const foundItem = response.data[0];
        setSelectedItem(foundItem);
        setActualQty(1);
        
        toast({
          title: "Item Found",
          description: `Found: ${foundItem.item_name}`,
        });
      } else {
        toast({
          title: "No Item Found",
          description: "No item found with the scanned barcode.",
          variant: "destructive"
        });
      }
      
    } catch (error) {
      console.error('Barcode search failed:', error);
      toast({
        title: "Search Failed",
        description: "Could not find item with the scanned barcode.",
        variant: "destructive"
      });
    }
  };

  const handleWarehouseFound = (warehouse: any) => {
    setSelectedWarehouse(warehouse.name);
    setWarehouseTab("select");
    setShowWarehouseScanner(false);
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

    if (!selectedWarehouse) {
      toast({
        title: "No Warehouse Selected",
        description: "Please select a warehouse for this item.",
        variant: "destructive"
      });
      return;
    }

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
      warehouse: selectedWarehouse,
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
    setSelectedWarehouse("");
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
          <span>Add Items to Multi-Warehouse Count</span>
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

            {/* Warehouse Selection */}
            <div className="space-y-4">
              <Label>Select Warehouse *</Label>
              <Tabs value={warehouseTab} onValueChange={setWarehouseTab}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="select">
                    <Building2 className="w-4 h-4 mr-2" />
                    Select
                  </TabsTrigger>
                  <TabsTrigger value="scanWarehouse">
                    <ScanBarcode className="w-4 h-4 mr-2" />
                    Scan
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="select" className="mt-2">
                  <Select value={selectedWarehouse} onValueChange={setSelectedWarehouse}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select warehouse..." />
                    </SelectTrigger>
                    <SelectContent>
                      {warehouses.map((warehouse) => (
                        <SelectItem key={warehouse.name} value={warehouse.name}>
                          <div className="flex items-center space-x-2">
                            <Building2 className="w-4 h-4" />
                            <span>{warehouse.warehouse_name || warehouse.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TabsContent>

                <TabsContent value="scanWarehouse" className="mt-2">
                  {!showWarehouseScanner ? (
                    <div className="text-center p-4 border-2 border-dashed border-border rounded-lg">
                      <Building2 className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                      <Button
                        onClick={() => setShowWarehouseScanner(true)}
                        className="w-full"
                        variant="outline"
                      >
                        <ScanBarcode className="w-4 h-4 mr-2" />
                        Scan Warehouse Barcode
                      </Button>
                    </div>
                  ) : (
                    <WarehouseScanner 
                      onWarehouseFound={handleWarehouseFound}
                    />
                  )}
                </TabsContent>
              </Tabs>
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
            {selectedItem && isItemTracked(selectedItem) && selectedWarehouse && (
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
                    warehouse={selectedWarehouse}
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
              disabled={!selectedItem || !selectedWarehouse || actualQty <= 0 || (isItemTracked(selectedItem) && !serialBatchBundle)}
            >
              Add Item to Count
            </Button>
          </TabsContent>

          <TabsContent value="scan" className="space-y-4 mt-6">
            {!showBarcodeScanner ? (
              <div className="text-center p-8 border-2 border-dashed border-border rounded-lg">
                <ScanBarcode className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">Scan Item Barcode</h3>
                <p className="text-muted-foreground mb-4">Use your device camera or barcode scanner</p>
                <Button
                  onClick={() => setShowBarcodeScanner(true)}
                  className="w-full"
                  disabled={searching}
                >
                  {searching ? 'Searching...' : 'Start Camera'}
                </Button>
              </div>
            ) : (
              <BarcodeScanner
                onBarcodeScanned={handleBarcodeScanned}
                onClose={() => setShowBarcodeScanner(false)}
                title="Scan Item Barcode"
                description="Position the barcode within the frame to scan automatically"
                isModal={false}
              />
            )}

            {/* Show selected item and warehouse selection for scan mode */}
            {selectedItem && activeTab === "scan" && (
              <div className="space-y-4">
                <div className="p-4 bg-muted rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-3">
                    <div>
                      <p className="font-medium text-muted-foreground">Item Code</p>
                      <p className="text-foreground">{selectedItem.item_code}</p>
                    </div>
                    <div>
                      <p className="font-medium text-muted-foreground">Item Name</p>
                      <p className="text-foreground">{selectedItem.item_name}</p>
                    </div>
                  </div>
                </div>

                {/* Warehouse Selection for scan mode */}
                <div className="space-y-2">
                  <Label>Select Warehouse *</Label>
                  <Select value={selectedWarehouse} onValueChange={setSelectedWarehouse}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select warehouse..." />
                    </SelectTrigger>
                    <SelectContent>
                      {warehouses.map((warehouse) => (
                        <SelectItem key={warehouse.name} value={warehouse.name}>
                          <div className="flex items-center space-x-2">
                            <Building2 className="w-4 h-4" />
                            <span>{warehouse.warehouse_name || warehouse.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Tracked item handling for scan mode */}
                {isItemTracked(selectedItem) && selectedWarehouse && (
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
                        warehouse={selectedWarehouse}
                        transactionType="Inward"
                        onBundleCreated={handleBundleCreated}
                        initialQuantity={1}
                      />
                    )}
                  </div>
                )}

                {/* Simple quantity input for non-tracked items in scan mode */}
                {!isItemTracked(selectedItem) && (
                  <div className="space-y-2">
                    <Label htmlFor="scan-actual-qty">Actual Quantity *</Label>
                      <Input
                        id="scan-actual-qty"
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
                  disabled={!selectedItem || !selectedWarehouse || actualQty <= 0 || (isItemTracked(selectedItem) && !serialBatchBundle)}
                >
                  Add Item to Count
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default MultiWarehouseItemSelector;
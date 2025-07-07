import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Package, Scan, Search } from "lucide-react";
import { DeliveryEntry, SOItem } from "@/types";
import { useToast } from "@/hooks/use-toast";
import ItemDropdown from "@/components/common/ItemDropdown";
import { createERPNextAPI } from "@/services/erpnextApi";

interface EnhancedDeliveryItemScannerProps {
  soItems: SOItem[];
  onAddEntry: (entry: DeliveryEntry) => void;
}

const EnhancedDeliveryItemScanner = ({ soItems, onAddEntry }: EnhancedDeliveryItemScannerProps) => {
  const [selectedItemCode, setSelectedItemCode] = useState("");
  const [activeTab, setActiveTab] = useState("manual");
  const [warehouse, setWarehouse] = useState("");
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [warehouseSearch, setWarehouseSearch] = useState("");
  const [quantity, setQuantity] = useState("");
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [availableBatches, setAvailableBatches] = useState<any[]>([]);
  const [selectedBatches, setSelectedBatches] = useState<any[]>([]);
  const [fetchBasedOn, setFetchBasedOn] = useState("FEFO (First Expiry, First Out) - Default");
  const [autoFetchQty, setAutoFetchQty] = useState("");
  const [batchSearch, setBatchSearch] = useState("");
  const { toast } = useToast();

  const selectedItem = soItems.find(item => item.itemCode === selectedItemCode);

  useEffect(() => {
    fetchWarehouses();
  }, []);

  const fetchWarehouses = async () => {
    try {
      const erpnextAPI = await createERPNextAPI();
      if (!erpnextAPI) return;

      const response = await erpnextAPI.getWarehouses();
      setWarehouses(response.data || []);
    } catch (error) {
      console.error('Error fetching warehouses:', error);
    }
  };

  const filteredWarehouses = warehouses.filter(wh => 
    wh.name.toLowerCase().includes(warehouseSearch.toLowerCase()) ||
    wh.warehouse_name?.toLowerCase().includes(warehouseSearch.toLowerCase())
  );

  const handleItemSelect = (item: any) => {
    setSelectedItemCode(item.item_code);
  };

  const handleWarehouseSelect = (warehouseCode: string) => {
    setWarehouse(warehouseCode);
    setWarehouseSearch("");
  };

  const handlePickBatchSerial = async () => {
    if (!selectedItem || !warehouse) {
      toast({
        title: "Missing Information",
        description: "Please select an item and warehouse first.",
        variant: "destructive"
      });
      return;
    }

    try {
      const erpnextAPI = await createERPNextAPI();
      if (!erpnextAPI) return;

      // Mock batch data for demo
      const mockBatches = [
        { batch_no: "B001", available_qty: 10, expiry_date: "9/6/2025" },
        { batch_no: "B8763518", available_qty: 10, expiry_date: "26/6/2025" },
        { batch_no: "BAGFD25484", available_qty: 10, expiry_date: "11/7/2025" },
      ];
      setAvailableBatches(mockBatches);
      setShowBatchModal(true);
      setAutoFetchQty(quantity || "5");
    } catch (error) {
      console.error('Error fetching batches:', error);
      toast({
        title: "Error",
        description: "Failed to fetch batch information.",
        variant: "destructive"
      });
    }
  };

  const handleAutoFetchBatches = () => {
    const qtyToFetch = parseInt(autoFetchQty);
    if (!qtyToFetch || qtyToFetch <= 0) {
      toast({
        title: "Invalid Quantity",
        description: "Please enter a valid quantity to fetch.",
        variant: "destructive"
      });
      return;
    }

    // Auto-select batches based on FEFO
    const sortedBatches = [...availableBatches].sort((a, b) => {
      if (fetchBasedOn.includes("FEFO")) {
        return new Date(a.expiry_date).getTime() - new Date(b.expiry_date).getTime();
      }
      return 0;
    });

    let remainingQty = qtyToFetch;
    const newSelectedBatches: any[] = [];

    for (const batch of sortedBatches) {
      if (remainingQty <= 0) break;
      
      const availableQty = batch.available_qty || 10;
      const qtyToTake = Math.min(remainingQty, availableQty);
      
      newSelectedBatches.push({
        ...batch,
        selected_qty: qtyToTake
      });
      
      remainingQty -= qtyToTake;
    }

    setSelectedBatches(newSelectedBatches);
  };

  const handleBatchSelection = (batch: any, selected: boolean) => {
    if (selected) {
      setSelectedBatches([...selectedBatches, { ...batch, selected_qty: 1 }]);
    } else {
      setSelectedBatches(selectedBatches.filter(b => b.batch_no !== batch.batch_no));
    }
  };

  const handleBatchQtyChange = (batchNo: string, qty: number) => {
    setSelectedBatches(selectedBatches.map(batch => 
      batch.batch_no === batchNo ? { ...batch, selected_qty: qty } : batch
    ));
  };

  const handleAddBatchNos = () => {
    const totalSelectedQty = selectedBatches.reduce((sum, batch) => sum + (batch.selected_qty || 0), 0);
    
    if (totalSelectedQty === 0) {
      toast({
        title: "No Batches Selected",
        description: "Please select at least one batch.",
        variant: "destructive"
      });
      return;
    }

    // Create delivery entry with batch information
    const entry: DeliveryEntry = {
      itemCode: selectedItem!.itemCode,
      itemName: selectedItem!.itemName,
      warehouse: warehouse,
      deliveredQty: totalSelectedQty,
      actualQty: totalSelectedQty,
      rate: selectedItem!.rate,
      uom: selectedItem!.uom,
      batches: selectedBatches.map(batch => ({
        batch_no: batch.batch_no,
        qty: batch.selected_qty
      }))
    };

    onAddEntry(entry);
    
    // Reset form
    setSelectedItemCode("");
    setWarehouse("");
    setQuantity("");
    setSelectedBatches([]);
    setShowBatchModal(false);
    
    toast({
      title: "Item Added",
      description: `Added ${totalSelectedQty} ${selectedItem!.uom} of ${selectedItem!.itemName} to delivery.`
    });
  };

  const handleAddItem = () => {
    if (!selectedItem || !warehouse || !quantity) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    const entry: DeliveryEntry = {
      itemCode: selectedItem.itemCode,
      itemName: selectedItem.itemName,
      warehouse: warehouse,
      deliveredQty: parseInt(quantity),
      actualQty: parseInt(quantity),
      rate: selectedItem.rate,
      uom: selectedItem.uom
    };

    onAddEntry(entry);
    
    // Reset form
    setSelectedItemCode("");
    setWarehouse("");
    setQuantity("");
    
    toast({
      title: "Item Added",
      description: `Added ${quantity} ${selectedItem.uom} of ${selectedItem.itemName} to delivery.`
    });
  };

  const filteredBatches = availableBatches.filter(batch =>
    batch.batch_no?.toLowerCase().includes(batchSearch.toLowerCase())
  );

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Package className="w-5 h-5" />
            <span>Scan & Add Items</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="manual">Manual Entry</TabsTrigger>
              <TabsTrigger value="scan">Scan Item</TabsTrigger>
            </TabsList>

            <TabsContent value="manual" className="space-y-4">
              {/* Item Code / Name */}
              <div>
                <label className="text-sm font-medium mb-2 block">Item Code / Name</label>
                <ItemDropdown
                  onItemSelect={handleItemSelect}
                  placeholder="Select an item to deliver..."
                />
                {selectedItem && (
                  <div className="mt-2 text-sm text-gray-600">
                    {selectedItem.itemCode} - {selectedItem.itemName}
                  </div>
                )}
              </div>

              {/* Warehouse Code / Name */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Warehouse Code / Name</label>
                  <div className="relative">
                    <Input
                      placeholder="Search warehouse by code or name..."
                      value={warehouse || warehouseSearch}
                      onChange={(e) => {
                        setWarehouseSearch(e.target.value);
                        if (!e.target.value) setWarehouse("");
                      }}
                    />
                    <Search className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
                    
                    {warehouseSearch && !warehouse && filteredWarehouses.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-y-auto">
                        {filteredWarehouses.slice(0, 10).map((wh) => (
                          <div
                            key={wh.name}
                            onClick={() => handleWarehouseSelect(wh.name)}
                            className="px-3 py-2 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                          >
                            <div className="font-medium text-sm">{wh.name}</div>
                            <div className="text-xs text-gray-500">{wh.warehouse_name}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Quantity to Deliver *</label>
                  <Input
                    type="number"
                    placeholder="Enter quantity"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    min="1"
                  />
                </div>
              </div>

              {/* Item Details */}
              {selectedItem && (
                <Card className="bg-gray-50">
                  <CardContent className="p-4">
                    <h4 className="font-medium mb-3">Item Details</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <div className="text-gray-600">Name:</div>
                        <div className="font-medium">{selectedItem.itemName}</div>
                      </div>
                      <div>
                        <div className="text-gray-600">Pending:</div>
                        <div className="font-medium text-orange-600">{selectedItem.pendingQty} {selectedItem.uom}</div>
                      </div>
                      <div>
                        <div className="text-gray-600">Rate:</div>
                        <div className="font-medium">₹{selectedItem.rate}</div>
                      </div>
                      <div>
                        <div className="text-gray-600">UOM:</div>
                        <div className="font-medium">{selectedItem.uom}</div>
                      </div>
                    </div>
                    
                    <div className="mt-4 flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600">Tracking Info:</span>
                        <Badge>Batch</Badge>
                      </div>
                      <Button 
                        onClick={handlePickBatchSerial}
                        variant="outline"
                        size="sm"
                        disabled={!warehouse}
                      >
                        Pick Serial / Batch No
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              <Button 
                onClick={handleAddItem}
                className="w-full bg-gray-900 hover:bg-gray-800 text-white"
                disabled={!selectedItem || !warehouse || !quantity}
              >
                Add Item to Delivery
              </Button>
            </TabsContent>

            <TabsContent value="scan" className="space-y-4">
              <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                <Scan className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600">Camera scanning not implemented yet</p>
                <p className="text-sm text-gray-500">Please use manual entry</p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Batch Selection Modal */}
      <Dialog open={showBatchModal} onOpenChange={setShowBatchModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Select Batch No - {selectedItem?.itemCode}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Auto Fetch Section */}
            <Card>
              <CardContent className="p-4">
                <h4 className="font-medium mb-3">Auto Fetch Batches</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Qty to Fetch</label>
                    <Input
                      type="number"
                      value={autoFetchQty}
                      onChange={(e) => setAutoFetchQty(e.target.value)}
                      placeholder="5"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Fetch Based On</label>
                    <select
                      value={fetchBasedOn}
                      onChange={(e) => setFetchBasedOn(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    >
                      <option>FEFO (First Expiry, First Out) - Default</option>
                      <option>FIFO (First In, First Out)</option>
                      <option>LIFO (Last In, First Out)</option>
                    </select>
                  </div>
                  <div className="flex items-end">
                    <Button onClick={handleAutoFetchBatches} className="w-full">
                      Auto Fetch Batches
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Warehouse Info */}
            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="text-sm">
                <strong>Warehouse</strong>
                <div>{warehouse}</div>
              </div>
            </div>

            {/* Search */}
            <div className="relative">
              <Input
                placeholder="Search batch numbers..."
                value={batchSearch}
                onChange={(e) => setBatchSearch(e.target.value)}
              />
              <Search className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
            </div>

            {/* Available Batches Table */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg">Available Batches (ERPNext v15+ Compatible)</CardTitle>
                  <span className="text-sm text-gray-600">
                    Selected Qty: {selectedBatches.reduce((sum, b) => sum + (b.selected_qty || 0), 0)} / {autoFetchQty || 0}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left p-3 border">Select</th>
                        <th className="text-left p-3 border">Batch No</th>
                        <th className="text-left p-3 border">Available Qty</th>
                        <th className="text-left p-3 border">Selected Qty</th>
                        <th className="text-left p-3 border">Expiry Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredBatches.map((batch, index) => {
                        const isSelected = selectedBatches.some(b => b.batch_no === batch.batch_no);
                        const selectedBatch = selectedBatches.find(b => b.batch_no === batch.batch_no);
                        
                        return (
                          <tr key={index} className="border-b">
                            <td className="p-3 border">
                              <Checkbox
                                checked={isSelected}
                                onCheckedChange={(checked) => handleBatchSelection(batch, checked as boolean)}
                              />
                            </td>
                            <td className="p-3 border font-medium">{batch.batch_no}</td>
                            <td className="p-3 border text-orange-600">{batch.available_qty || 10}</td>
                            <td className="p-3 border">
                              {isSelected ? (
                                <Input
                                  type="number"
                                  value={selectedBatch?.selected_qty || 1}
                                  onChange={(e) => handleBatchQtyChange(batch.batch_no, parseInt(e.target.value) || 0)}
                                  className="w-20"
                                  min="1"
                                  max={batch.available_qty || 10}
                                />
                              ) : (
                                "-"
                              )}
                            </td>
                            <td className="p-3 border text-sm">{batch.expiry_date || "N/A"}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setShowBatchModal(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleAddBatchNos}
                disabled={selectedBatches.length === 0}
                className="bg-gray-900 hover:bg-gray-800 text-white"
              >
                Add Batch Nos
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default EnhancedDeliveryItemScanner;

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Scan, Package, AlertCircle, CheckCircle } from "lucide-react";
import { DeliveryEntry, SOItem } from "../../pages/Deliver";
import { createERPNextAPI } from "@/services/erpnextApi";
import { useToast } from "@/hooks/use-toast";

interface EnhancedDeliveryFormProps {
  soItems: SOItem[];
  onAddEntry: (entry: DeliveryEntry) => void;
}

const EnhancedDeliveryForm = ({ soItems, onAddEntry }: EnhancedDeliveryFormProps) => {
  const [formData, setFormData] = useState({
    itemCode: "",
    warehouse: "",
    batch: "",
    serial: "",
    actualQty: ""
  });
  const [availableBatches, setAvailableBatches] = useState<string[]>([]);
  const [availableSerials, setAvailableSerials] = useState<string[]>([]);
  const [stockInfo, setStockInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Get current item details based on selected item code
  const currentItem = soItems.find(item => item.itemCode === formData.itemCode);

  useEffect(() => {
    if (currentItem && formData.warehouse) {
      fetchStockInfo();
    }
  }, [currentItem, formData.warehouse]);

  const fetchStockInfo = async () => {
    if (!currentItem) return;
    
    try {
      setLoading(true);
      const erpnextAPI = await createERPNextAPI();
      if (!erpnxtAPI) return;

      // Get current stock
      const stockResult = await erpnxtAPI.getCurrentStock(
        currentItem.itemCode,
        formData.warehouse
      );
      
      setStockInfo(stockResult.data);

      // Fetch batches if item has batch tracking
      if (currentItem.itemCode.includes('batch') || formData.itemCode.includes('batch')) {
        // This would need to be implemented in the API
        // For now, we'll use placeholder data
        setAvailableBatches(['BATCH001', 'BATCH002', 'BATCH003']);
      }

      // Fetch serials if item has serial tracking
      if (currentItem.itemCode.includes('serial') || formData.itemCode.includes('serial')) {
        // This would need to be implemented in the API
        // For now, we'll use placeholder data
        setAvailableSerials(['SER001', 'SER002', 'SER003']);
      }

    } catch (error) {
      console.error('Error fetching stock info:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleScan = (field: string) => {
    // Simulate scanning
    if (field === "item" && soItems.length > 0) {
      setFormData(prev => ({ ...prev, itemCode: soItems[0].itemCode }));
    } else if (field === "warehouse") {
      setFormData(prev => ({ ...prev, warehouse: "Main Store" }));
    } else if (field === "batch" && availableBatches.length > 0) {
      setFormData(prev => ({ ...prev, batch: availableBatches[0] }));
    } else if (field === "serial" && availableSerials.length > 0) {
      setFormData(prev => ({ ...prev, serial: availableSerials[0] }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.itemCode || !formData.warehouse || !formData.actualQty || !currentItem) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    const actualQty = parseInt(formData.actualQty);
    if (actualQty <= 0 || actualQty > currentItem.pendingQty) {
      toast({
        title: "Invalid Quantity",
        description: `Quantity must be between 1 and ${currentItem.pendingQty}`,
        variant: "destructive"
      });
      return;
    }

    const entry: DeliveryEntry = {
      itemCode: formData.itemCode,
      itemName: currentItem.itemName,
      warehouse: formData.warehouse,
      batch: formData.batch || undefined,
      serial: formData.serial || undefined,
      qtyToDeliver: actualQty,
      actualQty: actualQty,
      rate: currentItem.rate,
      uom: currentItem.uom
    };

    onAddEntry(entry);
    
    toast({
      title: "Item Added",
      description: `${actualQty} ${currentItem.uom} of ${currentItem.itemCode} added to delivery`,
    });
    
    // Reset form
    setFormData({
      itemCode: "",
      warehouse: "",
      batch: "",
      serial: "",
      actualQty: ""
    });
    setStockInfo(null);
    setAvailableBatches([]);
    setAvailableSerials([]);
  };

  const getStockStatus = () => {
    if (!stockInfo || !currentItem) return null;
    
    const availableQty = stockInfo.actual_qty || 0;
    const requiredQty = currentItem.pendingQty;
    
    if (availableQty >= requiredQty) {
      return { status: 'sufficient', message: `${availableQty} ${currentItem.uom} available`, color: 'green' };
    } else if (availableQty > 0) {
      return { status: 'partial', message: `Only ${availableQty} ${currentItem.uom} available`, color: 'orange' };
    } else {
      return { status: 'insufficient', message: 'Out of stock', color: 'red' };
    }
  };

  const stockStatus = getStockStatus();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Package className="w-5 h-5" />
          <span>Scan Items for Delivery</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Item Code */}
            <div>
              <Label htmlFor="itemCode">Item Code *</Label>
              <div className="flex space-x-2">
                <Select value={formData.itemCode} onValueChange={(value) => setFormData(prev => ({ ...prev, itemCode: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select item..." />
                  </SelectTrigger>
                  <SelectContent>
                    {soItems.filter(item => item.pendingQty > 0).map((item) => (
                      <SelectItem key={item.itemCode} value={item.itemCode}>
                        <div className="flex flex-col">
                          <span>{item.itemCode}</span>
                          <span className="text-xs text-gray-500">{item.itemName}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button type="button" variant="outline" onClick={() => handleScan("item")}>
                  <Scan className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Warehouse */}
            <div>
              <Label htmlFor="warehouse">Warehouse *</Label>
              <div className="flex space-x-2">
                <Input
                  id="warehouse"
                  value={formData.warehouse}
                  onChange={(e) => setFormData(prev => ({ ...prev, warehouse: e.target.value }))}
                  placeholder="Scan or enter warehouse"
                />
                <Button type="button" variant="outline" onClick={() => handleScan("warehouse")}>
                  <Scan className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Batch Number */}
            <div>
              <Label htmlFor="batch">Batch Number</Label>
              <div className="flex space-x-2">
                {availableBatches.length > 0 ? (
                  <Select value={formData.batch} onValueChange={(value) => setFormData(prev => ({ ...prev, batch: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select batch..." />
                    </SelectTrigger>
                    <SelectContent>
                      {availableBatches.map((batch) => (
                        <SelectItem key={batch} value={batch}>
                          {batch}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    id="batch"
                    value={formData.batch}
                    onChange={(e) => setFormData(prev => ({ ...prev, batch: e.target.value }))}
                    placeholder="Enter batch number"
                  />
                )}
                <Button type="button" variant="outline" onClick={() => handleScan("batch")}>
                  <Scan className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Serial Number */}
            <div>
              <Label htmlFor="serial">Serial Number</Label>
              <div className="flex space-x-2">
                {availableSerials.length > 0 ? (
                  <Select value={formData.serial} onValueChange={(value) => setFormData(prev => ({ ...prev, serial: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select serial..." />
                    </SelectTrigger>
                    <SelectContent>
                      {availableSerials.map((serial) => (
                        <SelectItem key={serial} value={serial}>
                          {serial}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    id="serial"
                    value={formData.serial}
                    onChange={(e) => setFormData(prev => ({ ...prev, serial: e.target.value }))}
                    placeholder="Enter serial number"
                  />
                )}
                <Button type="button" variant="outline" onClick={() => handleScan("serial")}>
                  <Scan className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Quantity */}
            <div className="md:col-span-2">
              <Label htmlFor="actualQty">Quantity to Deliver *</Label>
              <Input
                id="actualQty"
                type="number"
                value={formData.actualQty}
                onChange={(e) => setFormData(prev => ({ ...prev, actualQty: e.target.value }))}
                placeholder="Enter quantity"
                min="1"
                max={currentItem ? currentItem.pendingQty : undefined}
              />
            </div>
          </div>

          {/* Item Preview */}
          {currentItem && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium">Item Details</h4>
                {stockStatus && (
                  <div className="flex items-center space-x-2">
                    {stockStatus.status === 'sufficient' ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-orange-600" />
                    )}
                    <span className={`text-sm font-medium text-${stockStatus.color}-600`}>
                      {stockStatus.message}
                    </span>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                <div>
                  <span className="text-gray-600">Name:</span>
                  <div className="font-medium">{currentItem.itemName}</div>
                </div>
                <div>
                  <span className="text-gray-600">Pending:</span>
                  <div className="font-medium">{currentItem.pendingQty} {currentItem.uom}</div>
                </div>
                <div>
                  <span className="text-gray-600">Rate:</span>
                  <div className="font-medium">₹{currentItem.rate.toLocaleString()}</div>
                </div>
                <div>
                  <span className="text-gray-600">UOM:</span>
                  <div className="font-medium">{currentItem.uom}</div>
                </div>
              </div>
            </div>
          )}

          <Button 
            type="submit" 
            className="w-full" 
            disabled={!currentItem || loading || (stockStatus && stockStatus.status === 'insufficient')}
          >
            {loading ? 'Checking Stock...' : 'Add Item to Delivery'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default EnhancedDeliveryForm;

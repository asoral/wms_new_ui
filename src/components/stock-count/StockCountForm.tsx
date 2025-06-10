
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Scan, Package, Plus } from "lucide-react";
import { createERPNextAPI, getUserDefaultCompany } from "@/services/erpnextApi";
import { StockCountEntry } from "../../pages/StockCount";
import ItemScanner from "../item-enquiry/ItemScanner";

interface StockCountFormProps {
  warehouse: string;
  onAddEntry: (entry: Omit<StockCountEntry, 'difference' | 'status'>) => void;
}

const StockCountForm = ({ warehouse, onAddEntry }: StockCountFormProps) => {
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [formData, setFormData] = useState({
    batch: "",
    serial: "",
    actualQty: "",
    useTraditionalEntry: false
  });
  const [currentStock, setCurrentStock] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);

  const handleItemSelect = async (itemCode: string) => {
    setIsLoading(true);
    try {
      const erpnextAPI = await createERPNextAPI();
      if (!erpnextAPI) {
        console.error('ERPNext API not configured');
        return;
      }

      // Get item details
      const itemDetails = await erpnextAPI.getItemDetails(itemCode);
      if (itemDetails.data) {
        setSelectedItem(itemDetails.data);
        
        // Get current stock for this item in the warehouse
        const stockQty = await erpnextAPI.getCurrentStock(itemCode, warehouse);
        setCurrentStock(stockQty);
      }
    } catch (error) {
      console.error('Failed to fetch item details:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddEntry = () => {
    if (!selectedItem || !formData.actualQty) return;

    const entry: Omit<StockCountEntry, 'difference' | 'status'> = {
      itemCode: selectedItem.item_code,
      itemName: selectedItem.item_name,
      warehouse: warehouse,
      batch: formData.batch || undefined,
      serial: formData.serial || undefined,
      serialBatchBundle: undefined, // Will be set by parent component
      currentQty: currentStock,
      actualQty: parseFloat(formData.actualQty),
      uom: selectedItem.stock_uom || 'Nos',
      useTraditionalEntry: formData.useTraditionalEntry
    };

    onAddEntry(entry);

    // Reset form
    setSelectedItem(null);
    setFormData({
      batch: "",
      serial: "",
      actualQty: "",
      useTraditionalEntry: false
    });
    setCurrentStock(0);
  };

  return (
    <div className="space-y-6">
      {/* Item Scanner */}
      <ItemScanner onItemSelect={handleItemSelect} />

      {/* Selected Item Details */}
      {selectedItem && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Selected Item</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Item Code</p>
                <p className="font-medium">{selectedItem.item_code}</p>
              </div>
              <div>
                <p className="text-gray-600">Item Name</p>
                <p className="font-medium">{selectedItem.item_name}</p>
              </div>
              <div>
                <p className="text-gray-600">Current Stock</p>
                <p className="font-medium">{currentStock} {selectedItem.stock_uom}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {selectedItem.has_batch_no && (
                <div>
                  <Label htmlFor="batch">Batch Number</Label>
                  <Input
                    id="batch"
                    value={formData.batch}
                    onChange={(e) => setFormData(prev => ({ ...prev, batch: e.target.value }))}
                    placeholder="Enter batch number"
                  />
                </div>
              )}

              {selectedItem.has_serial_no && (
                <div>
                  <Label htmlFor="serial">Serial Number</Label>
                  <Input
                    id="serial"
                    value={formData.serial}
                    onChange={(e) => setFormData(prev => ({ ...prev, serial: e.target.value }))}
                    placeholder="Enter serial number"
                  />
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="actualQty">Actual Quantity *</Label>
              <Input
                id="actualQty"
                type="number"
                value={formData.actualQty}
                onChange={(e) => setFormData(prev => ({ ...prev, actualQty: e.target.value }))}
                placeholder="Enter counted quantity"
                step="0.01"
              />
            </div>

            <Button 
              onClick={handleAddEntry}
              disabled={!formData.actualQty || isLoading}
              className="w-full"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add to Count
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default StockCountForm;

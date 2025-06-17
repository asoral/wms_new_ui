
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Scan, Plus, Loader2 } from "lucide-react";
import { POItem, ReceiveEntry } from "../../pages/Receive";

interface ReceiveFormProps {
  poItems: POItem[];
  onAddEntry: (entry: ReceiveEntry) => void;
}

const ReceiveForm = ({ poItems, onAddEntry }: ReceiveFormProps) => {
  const [formData, setFormData] = useState({
    selectedItem: '',
    receivedQty: 0,
    warehouse: '',
    batch: '',
    serial: ''
  });
  const [isScanning, setIsScanning] = useState(false);

  const selectedItemData = poItems.find(item => item.itemCode === formData.selectedItem);

  const handleItemScan = () => {
    setIsScanning(true);
    
    setTimeout(() => {
      const scannedItem = poItems[0]?.itemCode || '';
      setFormData(prev => ({ 
        ...prev, 
        selectedItem: scannedItem,
        warehouse: poItems[0]?.warehouse || ''
      }));
      setIsScanning(false);
    }, 2000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedItemData || formData.receivedQty <= 0) return;

    onAddEntry({
      itemCode: selectedItemData.itemCode,
      itemName: selectedItemData.itemName,
      receivedQty: formData.receivedQty,
      warehouse: formData.warehouse,
      batch: formData.batch || undefined,
      serial: formData.serial || undefined,
      uom: selectedItemData.uom,
      rate: selectedItemData.rate
    });

    // Reset form
    setFormData({
      selectedItem: '',
      receivedQty: 0,
      warehouse: '',
      batch: '',
      serial: ''
    });
  };

  return (
    <div className="space-y-6">
      {/* PO Items Table */}
      <Card>
        <CardContent className="pt-6">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Item Code</th>
                  <th className="text-left p-2">Item Name</th>
                  <th className="text-right p-2">Ordered</th>
                  <th className="text-right p-2">Received</th>
                  <th className="text-right p-2">Pending</th>
                  <th className="text-left p-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {poItems.map((item, index) => (
                  <tr key={index} className="border-b hover:bg-gray-50">
                    <td className="p-2 font-medium">{item.itemCode}</td>
                    <td className="p-2">{item.itemName}</td>
                    <td className="p-2 text-right">{item.orderedQty} {item.uom}</td>
                    <td className="p-2 text-right">{item.receivedQty} {item.uom}</td>
                    <td className="p-2 text-right font-medium">{item.pendingQty} {item.uom}</td>
                    <td className="p-2">
                      <Badge variant={item.pendingQty === 0 ? "default" : "secondary"}>
                        {item.pendingQty === 0 ? "Completed" : "Pending"}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Receive Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Item Selection */}
        <Card>
          <CardContent className="pt-6">
            <Tabs defaultValue="manual" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="manual">Select Item</TabsTrigger>
                <TabsTrigger value="scan">Scan Item</TabsTrigger>
              </TabsList>

              <TabsContent value="manual" className="space-y-4">
                <div>
                  <Label htmlFor="itemSelect">Select Item from PO</Label>
                  <Select 
                    value={formData.selectedItem} 
                    onValueChange={(value) => {
                      const item = poItems.find(i => i.itemCode === value);
                      setFormData(prev => ({ 
                        ...prev, 
                        selectedItem: value,
                        warehouse: item?.warehouse || ''
                      }));
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select an item to receive..." />
                    </SelectTrigger>
                    <SelectContent>
                      {poItems.filter(item => item.pendingQty > 0).map((item) => (
                        <SelectItem key={item.itemCode} value={item.itemCode}>
                          {item.itemCode} - {item.itemName} (Pending: {item.pendingQty} {item.uom})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </TabsContent>

              <TabsContent value="scan" className="space-y-4">
                <div className="text-center">
                  <Button 
                    type="button"
                    onClick={handleItemScan} 
                    disabled={isScanning}
                    size="lg"
                    className="w-full"
                  >
                    {isScanning ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Scanning...
                      </>
                    ) : (
                      <>
                        <Scan className="w-4 h-4 mr-2" />
                        Scan Item
                      </>
                    )}
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Item Details & Receive Quantity */}
        {selectedItemData && (
          <Card className="bg-blue-50">
            <CardContent className="pt-6 space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <Label>Item Name</Label>
                  <p className="font-medium">{selectedItemData.itemName}</p>
                </div>
                <div>
                  <Label>Pending Qty</Label>
                  <p className="font-medium">{selectedItemData.pendingQty} {selectedItemData.uom}</p>
                </div>
                <div>
                  <Label>Rate</Label>
                  <p className="font-medium">₹{selectedItemData.rate}</p>
                </div>
                <div>
                  <Label>Warehouse</Label>
                  <p className="font-medium">{selectedItemData.warehouse}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="receivedQty">Received Quantity *</Label>
                  <Input
                    id="receivedQty"
                    type="number"
                    value={formData.receivedQty}
                    onChange={(e) => setFormData(prev => ({ ...prev, receivedQty: Number(e.target.value) }))}
                    placeholder="Enter received quantity..."
                    max={selectedItemData.pendingQty}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="batch">Batch Number (Optional)</Label>
                  <Input
                    id="batch"
                    value={formData.batch}
                    onChange={(e) => setFormData(prev => ({ ...prev, batch: e.target.value }))}
                    placeholder="Enter batch number..."
                  />
                </div>
                <div>
                  <Label htmlFor="serial">Serial Number (Optional)</Label>
                  <Input
                    id="serial"
                    value={formData.serial}
                    onChange={(e) => setFormData(prev => ({ ...prev, serial: e.target.value }))}
                    placeholder="Enter serial number..."
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Submit */}
        {selectedItemData && formData.receivedQty > 0 && (
          <Button type="submit" className="w-full">
            <Plus className="w-4 h-4 mr-2" />
            Add to Receipt
          </Button>
        )}
      </form>
    </div>
  );
};

export default ReceiveForm;


import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Package2, Plus, FileText, Printer } from "lucide-react";
import { PackingSlipItem } from "../../pages/Packing";

interface PackingSlipFormProps {
  deliveryNote?: string;
  onBack: () => void;
}

const PackingSlipForm = ({ deliveryNote, onBack }: PackingSlipFormProps) => {
  const [items, setItems] = useState<PackingSlipItem[]>([]);
  const [formData, setFormData] = useState({
    customer: "ABC Electronics Ltd",
    shippingAddress: "123 Business Park, Mumbai, Maharashtra 400001",
    itemCode: "",
    qty: "",
    description: "",
    netWeight: "",
    grossWeight: ""
  });

  const mockDeliveryItems = [
    {
      itemCode: "ITM-001",
      itemName: "Laptop Dell Inspiron",
      qty: 5,
      uom: "Nos",
      description: "Dell Inspiron 15 3000 Series Laptop"
    },
    {
      itemCode: "ITM-002", 
      itemName: "Wireless Mouse",
      qty: 10,
      uom: "Nos",
      description: "Logitech Wireless Optical Mouse"
    }
  ];

  const packageTypes = ["Box", "Carton", "Envelope", "Bag", "Container"];

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.itemCode || !formData.qty) return;

    const deliveryItem = mockDeliveryItems.find(item => item.itemCode === formData.itemCode);
    if (!deliveryItem) return;

    const newItem: PackingSlipItem = {
      itemCode: formData.itemCode,
      itemName: deliveryItem.itemName,
      qty: parseInt(formData.qty),
      uom: deliveryItem.uom,
      description: formData.description || deliveryItem.description,
      netWeight: formData.netWeight ? parseFloat(formData.netWeight) : undefined,
      grossWeight: formData.grossWeight ? parseFloat(formData.grossWeight) : undefined
    };

    setItems([...items, newItem]);
    
    // Reset form
    setFormData(prev => ({
      ...prev,
      itemCode: "",
      qty: "",
      description: "",
      netWeight: "",
      grossWeight: ""
    }));
  };

  const handleSubmit = () => {
    console.log("Submitting packing slip:", { deliveryNote, items, formData });
    // Here you would call the API to create the packing slip
  };

  const getTotalWeight = () => {
    return items.reduce((total, item) => total + (item.grossWeight || 0), 0);
  };

  const getTotalPackages = () => {
    return items.length; // Simplified - each item is one package
  };

  return (
    <div className="space-y-6">
      {/* Delivery Note Info */}
      {deliveryNote && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Packing Slip for {deliveryNote}
              <Badge>From Delivery Note</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="customer">Customer</Label>
                <Input
                  id="customer"
                  value={formData.customer}
                  onChange={(e) => setFormData(prev => ({ ...prev, customer: e.target.value }))}
                  readOnly
                />
              </div>
              <div>
                <Label htmlFor="deliveryNote">Delivery Note</Label>
                <Input
                  id="deliveryNote"
                  value={deliveryNote}
                  readOnly
                />
              </div>
            </div>
            <div className="mt-4">
              <Label htmlFor="shippingAddress">Shipping Address</Label>
              <Textarea
                id="shippingAddress"
                value={formData.shippingAddress}
                onChange={(e) => setFormData(prev => ({ ...prev, shippingAddress: e.target.value }))}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Available Items from Delivery Note */}
      {deliveryNote && (
        <Card>
          <CardHeader>
            <CardTitle>Items from Delivery Note</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {mockDeliveryItems.map((item) => (
                <Card key={item.itemCode} className="p-3">
                  <div className="space-y-2">
                    <h4 className="font-medium">{item.itemCode}</h4>
                    <p className="text-sm text-gray-600">{item.itemName}</p>
                    <p className="text-sm">Qty: {item.qty} {item.uom}</p>
                    <Button 
                      size="sm" 
                      className="w-full"
                      onClick={() => setFormData(prev => ({ 
                        ...prev, 
                        itemCode: item.itemCode,
                        qty: item.qty.toString(),
                        description: item.description 
                      }))}
                    >
                      Select for Packing
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Packing Form */}
      <Tabs defaultValue="items" className="space-y-4">
        <TabsList className="grid grid-cols-2 w-full max-w-md">
          <TabsTrigger value="items">Pack Items</TabsTrigger>
          <TabsTrigger value="summary">Summary</TabsTrigger>
        </TabsList>

        <TabsContent value="items" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Package2 className="w-5 h-5" />
                <span>Pack Items</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddItem} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="itemCode">Item Code</Label>
                    <Select value={formData.itemCode} onValueChange={(value) => {
                      const item = mockDeliveryItems.find(i => i.itemCode === value);
                      setFormData(prev => ({ 
                        ...prev, 
                        itemCode: value,
                        description: item?.description || ""
                      }));
                    }}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select item to pack" />
                      </SelectTrigger>
                      <SelectContent>
                        {mockDeliveryItems.map((item) => (
                          <SelectItem key={item.itemCode} value={item.itemCode}>
                            {item.itemCode} - {item.itemName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="qty">Quantity to Pack</Label>
                    <Input
                      id="qty"
                      type="number"
                      value={formData.qty}
                      onChange={(e) => setFormData(prev => ({ ...prev, qty: e.target.value }))}
                      placeholder="Enter quantity"
                      min="1"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <Label htmlFor="description">Package Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Enter package description..."
                      rows={2}
                    />
                  </div>

                  <div>
                    <Label htmlFor="netWeight">Net Weight (kg)</Label>
                    <Input
                      id="netWeight"
                      type="number"
                      step="0.1"
                      value={formData.netWeight}
                      onChange={(e) => setFormData(prev => ({ ...prev, netWeight: e.target.value }))}
                      placeholder="Enter net weight"
                    />
                  </div>

                  <div>
                    <Label htmlFor="grossWeight">Gross Weight (kg)</Label>
                    <Input
                      id="grossWeight"
                      type="number"
                      step="0.1"
                      value={formData.grossWeight}
                      onChange={(e) => setFormData(prev => ({ ...prev, grossWeight: e.target.value }))}
                      placeholder="Enter gross weight"
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full">
                  <Plus className="w-4 h-4 mr-2" />
                  Add to Packing Slip
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="summary" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Packing Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-blue-600">{getTotalPackages()}</div>
                    <div className="text-sm text-gray-600">Total Packages</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600">{items.length}</div>
                    <div className="text-sm text-gray-600">Unique Items</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-purple-600">{getTotalWeight().toFixed(1)} kg</div>
                    <div className="text-sm text-gray-600">Total Weight</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-orange-600">{items.reduce((sum, item) => sum + item.qty, 0)}</div>
                    <div className="text-sm text-gray-600">Total Quantity</div>
                  </div>
                </div>

                {items.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-medium">Packed Items:</h4>
                    {items.map((item, index) => (
                      <div key={index} className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <h5 className="font-medium">{item.itemCode} - {item.itemName}</h5>
                            <p className="text-sm text-gray-600">{item.description}</p>
                            <p className="text-sm text-gray-600">
                              Qty: {item.qty} {item.uom}
                              {item.netWeight && ` | Net: ${item.netWeight} kg`}
                              {item.grossWeight && ` | Gross: ${item.grossWeight} kg`}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {items.length > 0 && (
                  <div className="flex justify-between items-center pt-4">
                    <Button variant="outline" onClick={onBack}>
                      Cancel
                    </Button>
                    <div className="flex space-x-2">
                      <Button variant="outline">
                        <Printer className="w-4 h-4 mr-2" />
                        Print Label
                      </Button>
                      <Button onClick={handleSubmit} size="lg">
                        <FileText className="w-4 h-4 mr-2" />
                        Submit Packing Slip
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PackingSlipForm;

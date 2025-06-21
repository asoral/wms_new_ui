import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Plus, Minus, Package, User, Calendar } from "lucide-react";
import { createERPNextAPI, getUserDefaultCompany } from "@/services/erpnextApi";
import { useToast } from "@/hooks/use-toast";

interface MaterialRequestItem {
  item_code: string;
  item_name: string;
  required_qty: number;
  uom: string;
  warehouse: string;
  description?: string;
}

interface MaterialRequest {
  title: string;
  company: string;
  mr_date: string;
  status: string;
  description: string;
  items: MaterialRequestItem[];
}

const MaterialRequestForm = () => {
  const [materialRequest, setMaterialRequest] = useState<MaterialRequest>({
    title: "",
    company: "",
    mr_date: new Date().toISOString().slice(0, 10),
    status: "Draft",
    description: "",
    items: [],
  });
  const [newItem, setNewItem] = useState<MaterialRequestItem>({
    item_code: "",
    item_name: "",
    required_qty: 1,
    uom: "Nos",
    warehouse: "Stores",
    description: "",
  });
  const [companies, setCompanies] = useState<string[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadCompanies();
    loadItems();
    loadWarehouses();
  }, []);

  const loadCompanies = async () => {
    try {
      const api = await createERPNextAPI();
      if (!api) return;

      // This would load companies from ERPNext - for now using mock data
      setCompanies(["ABC Ltd", "XYZ Corp"]);
    } catch (error) {
      console.error("Error loading companies:", error);
    }
  };

  const loadItems = async () => {
    try {
      const api = await createERPNextAPI();
      if (!api) return;

      // This would load items from ERPNext - for now using mock data
      setItems([
        { item_code: "ITEM001", item_name: "Product A" },
        { item_code: "ITEM002", item_name: "Product B" },
      ]);
    } catch (error) {
      console.error("Error loading items:", error);
    }
  };

  const loadWarehouses = async () => {
    try {
      const api = await createERPNextAPI();
      if (!api) return;

      // This would load warehouses from ERPNext - for now using mock data
      setWarehouses(["Warehouse A", "Warehouse B"]);
    } catch (error) {
      console.error("Error loading warehouses:", error);
    }
  };

  const handleInputChange = (e: any) => {
    const { name, value } = e.target;
    setMaterialRequest((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddItem = () => {
    setMaterialRequest((prev) => ({
      ...prev,
      items: [...prev.items, newItem],
    }));
    setNewItem({
      item_code: "",
      item_name: "",
      required_qty: 1,
      uom: "Nos",
      warehouse: "Stores",
      description: "",
    });
  };

  const handleRemoveItem = (index: number) => {
    setMaterialRequest((prev) => {
      const newItems = [...prev.items];
      newItems.splice(index, 1);
      return { ...prev, items: newItems };
    });
  };

  const handleNewItemChange = (e: any) => {
    const { name, value } = e.target;
    setNewItem((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    try {
      const api = await createERPNextAPI();
      if (!api) {
        toast({
          title: "ERPNext Not Configured",
          description:
            "Please configure your ERPNext settings in the Profile page.",
          variant: "destructive",
        });
        return;
      }

      // Simulate submitting the material request to ERPNext
      console.log("Submitting Material Request:", materialRequest);
      toast({
        title: "Success",
        description: "Material Request submitted successfully!",
      });
    } catch (error) {
      console.error("Error submitting material request:", error);
      toast({
        title: "Error",
        description: "Failed to submit material request",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>Create Material Request</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Title and Company */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  type="text"
                  id="title"
                  name="title"
                  value={materialRequest.title}
                  onChange={handleInputChange}
                  placeholder="Material Request Title"
                />
              </div>
              <div>
                <Label htmlFor="company">Company</Label>
                <Select
                  value={materialRequest.company}
                  onValueChange={(value) =>
                    setMaterialRequest((prev) => ({ ...prev, company: value }))
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select company" />
                  </SelectTrigger>
                  <SelectContent>
                    {companies.map((company) => (
                      <SelectItem key={company} value={company}>
                        {company}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* MR Date */}
            <div>
              <Label htmlFor="mr_date">MR Date</Label>
              <Input
                type="date"
                id="mr_date"
                name="mr_date"
                value={materialRequest.mr_date}
                onChange={handleInputChange}
              />
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                value={materialRequest.description}
                onChange={handleInputChange}
                placeholder="Description of the material request"
              />
            </div>

            {/* Items List */}
            <div>
              <h3 className="text-lg font-semibold mb-2">Items</h3>
              <div className="space-y-2">
                {materialRequest.items.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between border rounded-md p-2"
                  >
                    <div>
                      {item.item_name} ({item.item_code}) - {item.required_qty}{" "}
                      {item.uom} from {item.warehouse}
                    </div>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleRemoveItem(index)}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                {materialRequest.items.length === 0 && (
                  <div className="text-gray-500">No items added.</div>
                )}
              </div>
            </div>

            {/* Add Item Form */}
            <div className="border rounded-md p-4">
              <h4 className="text-md font-semibold mb-2">Add New Item</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="item_code">Item</Label>
                  <Select
                    value={newItem.item_code}
                    onValueChange={(value) => {
                      const selectedItem = items.find(
                        (item) => item.item_code === value
                      );
                      setNewItem((prev) => ({
                        ...prev,
                        item_code: value,
                        item_name: selectedItem?.item_name || "",
                      }));
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select item" />
                    </SelectTrigger>
                    <SelectContent>
                      {items.map((item) => (
                        <SelectItem key={item.item_code} value={item.item_code}>
                          {item.item_name} ({item.item_code})
                        </SelectItem>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="required_qty">Required Quantity</Label>
                <Input
                  type="number"
                  id="required_qty"
                  name="required_qty"
                  value={newItem.required_qty}
                  onChange={handleNewItemChange}
                  placeholder="Required Quantity"
                />
              </div>
              <div>
                <Label htmlFor="uom">UOM</Label>
                <Input
                  type="text"
                  id="uom"
                  name="uom"
                  value={newItem.uom}
                  onChange={handleNewItemChange}
                  placeholder="UOM"
                />
              </div>
              <div>
                <Label htmlFor="warehouse">Warehouse</Label>
                <Select
                  value={newItem.warehouse}
                  onValueChange={(value) =>
                    setNewItem((prev) => ({ ...prev, warehouse: value }))
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select warehouse" />
                  </SelectTrigger>
                  <SelectContent>
                    {warehouses.map((warehouse) => (
                      <SelectItem key={warehouse} value={warehouse}>
                        {warehouse}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button type="button" variant="secondary" onClick={handleAddItem}>
              Add Item
            </Button>

            {/* Submit Button */}
            <Button type="submit" disabled={loading}>
              {loading ? "Submitting..." : "Submit Material Request"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default MaterialRequestForm;

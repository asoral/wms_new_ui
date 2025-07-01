import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCaption, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { CalendarIcon, Package, Trash2 } from "lucide-react"
import { createERPNextAPI, getUserDefaultCompany } from "@/services/erpnextApi";
import { useToast } from "@/hooks/use-toast";
import ItemSelector from '../item-enquiry/ItemSelector';
import { Item } from "@/types";

interface MaterialRequestItem {
  item_code: string;
  item_name: string;
  qty: number;
  uom: string;
  rate: number;
  amount: number;
  warehouse: string;
  schedule_date: string;
  description: string;
}

interface MaterialRequestFormProps {
  onSubmit: (items: MaterialRequestItem[]) => void;
  onCancel: () => void;
}

const MaterialRequestFormImproved = ({ onSubmit, onCancel }: MaterialRequestFormProps) => {
  const [items, setItems] = useState<MaterialRequestItem[]>([]);
  const [warehouses, setWarehouses] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadWarehouses();
  }, []);

  const loadWarehouses = async () => {
    try {
      setLoading(true);
      const erpnextAPI = await createERPNextAPI();
      if (!erpnextAPI) {
        toast({
          title: "ERPNext Not Configured",
          description: "Please configure your ERPNext settings in the Profile page.",
          variant: "destructive"
        });
        return;
      }

      const response = await erpnextAPI.getWarehouses();
      if (response?.data) {
        const warehouseNames = response.data.map(warehouse => warehouse.name);
        setWarehouses(warehouseNames);
      } else {
        setWarehouses([]);
      }
    } catch (error) {
      console.error('Failed to load warehouses:', error);
      toast({
        title: "Error",
        description: "Failed to load warehouses from ERPNext",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleItemScanned = (item: Item) => {
    const itemCode = item.item_code;
    
    // Check if item is already in the list
    const existingItem = items.find(i => i.item_code === itemCode);
    if (existingItem) {
      toast({
        title: "Item Already Added",
        description: "This item is already in the material request.",
        variant: "destructive"
      });
      return;
    }

    // Add new item to the list
    const newItem = {
      item_code: itemCode,
      item_name: item.item_name,
      qty: 1,
      uom: item.stock_uom || 'Nos',
      rate: 0,
      amount: 0,
      warehouse: '',
      schedule_date: new Date().toISOString().split('T')[0],
      description: item.description || ''
    };

    setItems([...items, newItem]);
    toast({
      title: "Item Added",
      description: `${item.item_name} has been added to the material request.`,
    });
  };

  const handleItemRemove = (itemCode: string) => {
    setItems(items.filter(item => item.item_code !== itemCode));
  };

  const handleQuantityChange = (itemCode: string, qty: number) => {
    setItems(items.map(item => {
      if (item.item_code === itemCode) {
        return { ...item, qty: qty, amount: qty * item.rate };
      }
      return item;
    }));
  };

  const handleRateChange = (itemCode: string, rate: number) => {
    setItems(items.map(item => {
      if (item.item_code === itemCode) {
        return { ...item, rate: rate, amount: rate * item.qty };
      }
      return item;
    }));
  };

  const handleWarehouseChange = (itemCode: string, warehouse: string) => {
    setItems(items.map(item => {
      if (item.item_code === itemCode) {
        return { ...item, warehouse: warehouse };
      }
      return item;
    }));
  };

  const handleScheduleDateChange = (itemCode: string, date: Date | undefined) => {
    if (!date) return;
    const formattedDate = date.toISOString().split('T')[0];
    setItems(items.map(item => {
      if (item.item_code === itemCode) {
        return { ...item, schedule_date: formattedDate };
      }
      return item;
    }));
  };

  const handleDescriptionChange = (itemCode: string, description: string) => {
    setItems(items.map(item => {
      if (item.item_code === itemCode) {
        return { ...item, description: description };
      }
      return item;
    }));
  };

  const handleSubmit = () => {
    onSubmit(items);
  };

  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader>
          <CardTitle>Create Material Request</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <h2 className="text-xl font-semibold mb-2">Add Items</h2>
            <ItemSelector onItemSelected={handleItemScanned} />
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>UOM</TableHead>
                  <TableHead>Rate</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Warehouse</TableHead>
                  <TableHead>Schedule Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.item_code}>
                    <TableCell className="font-medium">{item.item_name}</TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={item.qty}
                        onChange={(e) => handleQuantityChange(item.item_code, parseFloat(e.target.value))}
                        className="w-24"
                      />
                    </TableCell>
                    <TableCell>{item.uom}</TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={item.rate}
                        onChange={(e) => handleRateChange(item.item_code, parseFloat(e.target.value))}
                        className="w-24"
                      />
                    </TableCell>
                    <TableCell>{item.amount}</TableCell>
                    <TableCell>
                      <Select onValueChange={(value) => handleWarehouseChange(item.item_code, value)}>
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Select Warehouse" defaultValue={item.warehouse} />
                        </SelectTrigger>
                        <SelectContent>
                          {warehouses.map((warehouse) => (
                            <SelectItem key={warehouse} value={warehouse}>{warehouse}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-[180px] justify-start text-left font-normal",
                              !item.schedule_date && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {item.schedule_date ? (
                              format(new Date(item.schedule_date), "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="center">
                          <Calendar
                            mode="single"
                            selected={item.schedule_date ? new Date(item.schedule_date) : undefined}
                            onSelect={(date) => handleScheduleDateChange(item.item_code, date)}
                            disabled={loading}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </TableCell>
                    <TableCell>
                      <Input
                        type="text"
                        value={item.description}
                        onChange={(e) => handleDescriptionChange(item.item_code, e.target.value)}
                        className="w-48"
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => handleItemRemove(item.item_code)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex justify-end space-x-2 mt-4">
            <Button variant="secondary" onClick={onCancel}>Cancel</Button>
            <Button onClick={handleSubmit}>Submit</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MaterialRequestFormImproved;

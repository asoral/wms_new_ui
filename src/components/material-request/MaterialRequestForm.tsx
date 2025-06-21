import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar"
import { CalendarIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { MaterialRequest, MaterialRequestItem } from "@/pages/MaterialRequests";
import { useToast } from "@/hooks/use-toast";
import MaterialRequestItems from "./MaterialRequestItems";

interface MaterialRequestFormProps {
  onSubmit: (materialRequest: MaterialRequest) => void;
  onCancel: () => void;
}

const MaterialRequestForm = ({ onSubmit, onCancel }: MaterialRequestFormProps) => {
  const [formData, setFormData] = useState({
    type: "Purchase",
    requestedBy: "",
    requestedDate: new Date(),
    requiredBy: new Date(),
    department: "",
    purpose: "",
    remarks: ""
  });
  const [items, setItems] = useState<MaterialRequestItem[]>([]);
  const { toast } = useToast();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleDateChange = (name: string, date: Date | undefined) => {
    if (date) {
      setFormData(prev => ({ ...prev, [name]: date }));
    }
  };

  const handleAddItem = (item: MaterialRequestItem) => {
    setItems(prev => [...prev, item]);
  };

  const handleUpdateItem = (index: number, item: MaterialRequestItem) => {
    setItems(prev => {
      const newItems = [...prev];
      newItems[index] = item;
      return newItems;
    });
  };

  const handleDeleteItem = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.requestedBy || items.length === 0) {
      toast({
        title: "Error",
        description: "Please fill in all required fields and add at least one item",
        variant: "destructive"
      });
      return;
    }

    const materialRequest: MaterialRequest = {
      id: crypto.randomUUID(),
      number: `MR-${Date.now()}`,
      type: formData.type,
      status: "Draft",
      requestedBy: formData.requestedBy,
      requestedDate: formData.requestedDate,
      requiredBy: formData.requiredBy,
      department: formData.department,
      purpose: formData.purpose,
      priority: "Medium", // Add missing priority field
      items: items,
      approvedBy: "",
      approvedDate: "",
      remarks: formData.remarks
    };

    onSubmit(materialRequest);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Request Details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="type">Type</Label>
              <Select value={formData.type} onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Purchase">Purchase</SelectItem>
                  <SelectItem value="Transfer">Transfer</SelectItem>
                  <SelectItem value="Manufacture">Manufacture</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="requestedBy">Requested By</Label>
              <Input id="requestedBy" name="requestedBy" value={formData.requestedBy} onChange={handleInputChange} required />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="requestedDate">Requested Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.requestedDate && "text-muted-foreground"
                    )}
                  >
                    {formData.requestedDate ? (
                      format(formData.requestedDate, "PPP")
                    ) : (
                      <span>Pick a date</span>
                    )}
                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.requestedDate}
                    onSelect={(date) => handleDateChange("requestedDate", date)}
                    disabled={(date) =>
                      date > new Date()
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <Label htmlFor="requiredBy">Required By</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.requiredBy && "text-muted-foreground"
                    )}
                  >
                    {formData.requiredBy ? (
                      format(formData.requiredBy, "PPP")
                    ) : (
                      <span>Pick a date</span>
                    )}
                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.requiredBy}
                    onSelect={(date) => handleDateChange("requiredBy", date)}
                    disabled={(date) =>
                      date < new Date()
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="department">Department</Label>
              <Input id="department" name="department" value={formData.department} onChange={handleInputChange} />
            </div>
            <div>
              <Label htmlFor="purpose">Purpose</Label>
              <Input id="purpose" name="purpose" value={formData.purpose} onChange={handleInputChange} />
            </div>
          </div>

          <div>
            <Label htmlFor="remarks">Remarks</Label>
            <Textarea id="remarks" name="remarks" value={formData.remarks} onChange={handleInputChange} />
          </div>
        </CardContent>
      </Card>

      <MaterialRequestItems 
        items={items}
        onAddItem={handleAddItem}
        onUpdateItem={handleUpdateItem}
        onDeleteItem={handleDeleteItem}
      />

      <div className="flex justify-end space-x-2">
        <Button variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button type="submit">Submit</Button>
      </div>
    </form>
  );
};

export default MaterialRequestForm;

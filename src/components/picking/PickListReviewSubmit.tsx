import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Package, CheckCircle, Edit, AlertTriangle } from "lucide-react";
import { PickList, PickListItem } from "../../pages/PickList";
import { useToast } from "@/hooks/use-toast";

interface PickListReviewSubmitProps {
  pickList: PickList;
  items: PickListItem[];
  onBack: () => void;
  onEditItem: (index: number) => void;
  onSubmit: () => void;
}

const PickListReviewSubmit = ({ 
  pickList, 
  items, 
  onBack, 
  onEditItem, 
  onSubmit 
}: PickListReviewSubmitProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    try {
      const { createERPNextAPI } = await import("@/services/erpnextApi");
      const erpnextAPI = await createERPNextAPI();
      
      if (erpnextAPI) {
        // First update the pick list with picked items
        const updateData = {
          locations: items.map(item => ({
            ...item,
            picked_qty: item.picked_qty,
            batch_no: item.scanned_batch || item.batch_no,
            serial_no: item.scanned_serials ? item.scanned_serials.join('\n') : item.serial_no
          }))
        };
        
        await erpnextAPI.updatePickList(pickList.name, updateData);
        
        // Then submit the pick list in ERPNext
        await erpnextAPI.submitPickList(pickList.name);
        
        toast({
          title: "Pick List Submitted",
          description: "Pick list has been successfully submitted to ERPNext",
        });
        
        onSubmit();
      }
    } catch (error) {
      console.error('Error submitting pick list:', error);
      toast({
        title: "Submission Failed",
        description: "Failed to submit pick list to ERPNext",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getItemStats = () => {
    const completed = items.filter(item => item.status === "completed").length;
    const partial = items.filter(item => item.status === "partial").length;
    const pending = items.filter(item => !item.status || item.status === "pending").length;
    
    return { completed, partial, pending };
  };

  const { completed, partial, pending } = getItemStats();
  const canSubmit = pending === 0; // Can submit if no pending items

  return (
    <div className="p-6 space-y-6">
      {/* Header with stepper */}
      <div className="flex items-center space-x-2 mb-6">
        <Package className="w-6 h-6 text-blue-600" />
        <h1 className="text-2xl font-bold">Pick List Review</h1>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-center space-x-4 mb-6">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-400 flex items-center justify-center text-sm font-medium">
            1
          </div>
          <span className="text-gray-400">Select</span>
        </div>
        <div className="w-8 h-px bg-gray-200"></div>
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-400 flex items-center justify-center text-sm font-medium">
            2
          </div>
          <span className="text-gray-400">Details</span>
        </div>
        <div className="w-8 h-px bg-gray-200"></div>
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-400 flex items-center justify-center text-sm font-medium">
            3
          </div>
          <span className="text-gray-400">Pick</span>
        </div>
        <div className="w-8 h-px bg-gray-200"></div>
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-medium">
            4
          </div>
          <span className="text-blue-600 font-medium">Review</span>
        </div>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onBack} className="flex items-center space-x-2">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Picking</span>
        </Button>
        <div className="flex items-center space-x-4">
          <span className="font-semibold">{pickList.name}</span>
          <Badge className="bg-blue-100 text-blue-800">{items.length} Items</Badge>
        </div>
      </div>

      {/* Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Package className="w-5 h-5" />
            <span>Pick Summary</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{completed}</div>
              <div className="text-sm text-muted-foreground">Completed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{partial}</div>
              <div className="text-sm text-muted-foreground">Partial</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-600">{pending}</div>
              <div className="text-sm text-muted-foreground">Pending</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Items List */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Items Review</h3>
        {items.map((item, index) => (
          <Card key={index} className="border-l-4 border-l-blue-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h4 className="font-medium">{item.item_code}</h4>
                    <Badge 
                      className={
                        item.status === "completed" 
                          ? "bg-green-100 text-green-800"
                          : item.status === "partial"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-gray-100 text-gray-800"
                      }
                    >
                      {item.status || "pending"}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{item.item_name}</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Required:</span>
                      <span className="ml-1 font-medium">{item.qty}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Picked:</span>
                      <span className="ml-1 font-medium text-green-600">{item.picked_qty || 0}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Warehouse:</span>
                      <span className="ml-1 text-xs">{item.warehouse}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Bin:</span>
                      <span className="ml-1 text-xs">{item.bin || "N/A"}</span>
                    </div>
                  </div>
                  {item.scanned_batch && (
                    <div className="text-sm mt-1">
                      <span className="text-muted-foreground">Batch:</span>
                      <span className="ml-1">{item.scanned_batch}</span>
                    </div>
                  )}
                  {item.scanned_serials && item.scanned_serials.length > 0 && (
                    <div className="text-sm mt-1">
                      <span className="text-muted-foreground">Serials:</span>
                      <span className="ml-1">{item.scanned_serials.length} items</span>
                    </div>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEditItem(index)}
                  className="ml-4"
                >
                  <Edit className="w-4 h-4 mr-1" />
                  Edit
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Warning if can't submit */}
      {!canSubmit && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 text-yellow-800">
              <AlertTriangle className="w-5 h-5" />
              <span className="font-medium">Cannot Submit</span>
            </div>
            <p className="text-yellow-700 text-sm mt-1">
              Please complete all pending items before submitting the pick list.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex space-x-4">
        <Button
          variant="outline"
          onClick={onBack}
          className="flex-1"
        >
          Continue Picking
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={!canSubmit || isSubmitting}
          className="flex-1 bg-green-600 hover:bg-green-700"
        >
          {isSubmitting ? (
            <>Submitting...</>
          ) : (
            <>
              <CheckCircle className="w-4 h-4 mr-2" />
              Submit Pick List
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default PickListReviewSubmit;
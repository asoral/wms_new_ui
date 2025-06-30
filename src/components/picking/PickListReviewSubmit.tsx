
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Package, ArrowLeft, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ProcessedPickItem {
  item_code: string;
  item_name: string;
  qty: number;
  uom: string;
  warehouse: string;
  bin?: string;
  batch_no?: string;
  serial_no?: string;
  scanned: boolean;
  skipped: boolean;
}

interface PickListReviewSubmitProps {
  pickListNumber: string;
  processedItems: ProcessedPickItem[];
  onBack: () => void;
  onSubmit: () => void;
}

const PickListReviewSubmit = ({
  pickListNumber,
  processedItems,
  onBack,
  onSubmit
}: PickListReviewSubmitProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const pickedItems = processedItems.filter(item => !item.skipped);
  const skippedItems = processedItems.filter(item => item.skipped);
  const totalQuantity = pickedItems.reduce((sum, item) => sum + item.qty, 0);

  const handleSubmit = async () => {
    if (pickedItems.length === 0) {
      toast({
        title: "No Items to Submit",
        description: "Please pick at least one item before submitting",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: "Pick List Submitted",
        description: `${pickListNumber} has been submitted successfully with ${pickedItems.length} items`,
      });
      
      onSubmit();
    } catch (error) {
      toast({
        title: "Submission Failed",
        description: "Failed to submit pick list. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span>Review & Submit: {pickListNumber}</span>
            </CardTitle>
            <Badge variant="outline" className="bg-green-50 text-green-800">
              Ready to Submit
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-2xl font-bold text-green-600">{pickedItems.length}</div>
            <div className="text-sm text-gray-600">Items Picked</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-2xl font-bold text-orange-600">{skippedItems.length}</div>
            <div className="text-sm text-gray-600">Items Skipped</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-2xl font-bold text-blue-600">{totalQuantity}</div>
            <div className="text-sm text-gray-600">Total Quantity</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-2xl font-bold text-purple-600">
              {processedItems.filter(item => item.scanned && !item.skipped).length}
            </div>
            <div className="text-sm text-gray-600">Items Scanned</div>
          </CardContent>
        </Card>
      </div>

      {/* Picked Items Table */}
      {pickedItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Package className="w-5 h-5" />
              <span>Picked Items ({pickedItems.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left p-3">Item Code</th>
                    <th className="text-left p-3">Item Name</th>
                    <th className="text-left p-3">Warehouse</th>
                    <th className="text-left p-3">Bin</th>
                    <th className="text-left p-3">Quantity</th>
                    <th className="text-left p-3">Batch/Serial</th>
                    <th className="text-left p-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {pickedItems.map((item, index) => (
                    <tr key={index} className="border-b">
                      <td className="p-3 font-medium">{item.item_code}</td>
                      <td className="p-3">{item.item_name}</td>
                      <td className="p-3">{item.warehouse}</td>
                      <td className="p-3">{item.bin || '-'}</td>
                      <td className="p-3">{item.qty} {item.uom}</td>
                      <td className="p-3 text-xs">
                        {item.batch_no && <div>Batch: {item.batch_no}</div>}
                        {item.serial_no && <div>Serial: {item.serial_no}</div>}
                        {!item.batch_no && !item.serial_no && '-'}
                      </td>
                      <td className="p-3">
                        {item.scanned ? (
                          <Badge className="bg-green-100 text-green-800">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Scanned
                          </Badge>
                        ) : (
                          <Badge variant="outline">Manual</Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Skipped Items */}
      {skippedItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-orange-600">Skipped Items ({skippedItems.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {skippedItems.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-orange-50 border border-orange-200 rounded">
                  <div>
                    <span className="font-medium">{item.item_code}</span> - {item.item_name}
                  </div>
                  <Badge variant="outline" className="bg-orange-100 text-orange-800">
                    Skipped
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex justify-between items-center pt-6">
        <Button variant="outline" onClick={onBack} disabled={isSubmitting}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Picking
        </Button>
        
        <Button 
          onClick={handleSubmit} 
          disabled={pickedItems.length === 0 || isSubmitting}
          size="lg"
          className="px-8"
        >
          {isSubmitting ? (
            "Submitting..."
          ) : (
            <>
              <Send className="w-4 h-4 mr-2" />
              Submit Pick List
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default PickListReviewSubmit;

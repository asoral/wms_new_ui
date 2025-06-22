
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, ArrowLeft, Send } from "lucide-react";
import { createERPNextAPI } from "@/services/erpnextApi";
import { useToast } from "@/hooks/use-toast";

interface StockEntryReviewProps {
  draftEntry: any;
  onSubmitComplete: () => void;
  onBack: () => void;
}

const StockEntryReview = ({ draftEntry, onSubmitComplete, onBack }: StockEntryReviewProps) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!draftEntry) return;

    try {
      setLoading(true);
      const erpnextAPI = await createERPNextAPI();
      if (!erpnextAPI) return;

      console.log('Submitting stock entry:', draftEntry.name);
      
      const result = await erpnextAPI.submitStockEntry(draftEntry.name);
      
      if (result.data) {
        toast({
          title: "Stock Entry Submitted",
          description: `Stock entry ${draftEntry.name} has been submitted successfully!`,
        });
        onSubmitComplete();
      }
    } catch (error) {
      console.error('Error submitting stock entry:', error);
      toast({
        title: "Submission Failed",
        description: "Failed to submit stock entry. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateTotalValue = () => {
    return draftEntry.items?.reduce((total: number, item: any) => {
      return total + (item.qty * (item.rate || 0));
    }, 0) || 0;
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Button variant="outline" size="icon" onClick={onBack}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h2 className="text-xl font-semibold">Review & Submit Stock Entry</h2>
            <p className="text-sm text-gray-600">
              {draftEntry.name} - {draftEntry.type}
            </p>
          </div>
        </div>
        <Badge variant="outline" className="bg-blue-50">
          Ready for Submission
        </Badge>
      </div>

      {/* Entry Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span>Entry Summary</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-gray-600">Entry Type</p>
              <p className="font-semibold">{draftEntry.type}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Posting Date</p>
              <p className="font-semibold">{new Date(draftEntry.posting_date).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Items</p>
              <p className="font-semibold">{draftEntry.items?.length || 0}</p>
            </div>
          </div>

          {(draftEntry.from_warehouse || draftEntry.to_warehouse) && (
            <>
              <Separator />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {draftEntry.from_warehouse && (
                  <div>
                    <p className="text-sm text-gray-600">From Warehouse</p>
                    <p className="font-semibold">{draftEntry.from_warehouse}</p>
                  </div>
                )}
                {draftEntry.to_warehouse && (
                  <div>
                    <p className="text-sm text-gray-600">To Warehouse</p>
                    <p className="font-semibold">{draftEntry.to_warehouse}</p>
                  </div>
                )}
              </div>
            </>
          )}

          {draftEntry.purpose && (
            <>
              <Separator />
              <div>
                <p className="text-sm text-gray-600">Purpose</p>
                <p className="font-semibold">{draftEntry.purpose}</p>
              </div>
            </>
          )}

          {draftEntry.remarks && (
            <>
              <Separator />
              <div>
                <p className="text-sm text-gray-600">Remarks</p>
                <p className="font-semibold">{draftEntry.remarks}</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Items Review */}
      <Card>
        <CardHeader>
          <CardTitle>Items to Process</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {draftEntry.items?.map((item: any, index: number) => (
              <div key={index} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-lg">{item.itemCode}</h4>
                    {item.itemName && item.itemName !== item.itemCode && (
                      <p className="text-sm text-gray-600">{item.itemName}</p>
                    )}
                  </div>
                  <Badge variant="outline" className="bg-green-50">
                    ✓ Ready
                  </Badge>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Quantity:</span>
                    <p className="font-medium">{item.qty} {item.uom}</p>
                  </div>
                  {item.rate && (
                    <div>
                      <span className="text-gray-500">Rate:</span>
                      <p className="font-medium">₹{item.rate.toLocaleString()}</p>
                    </div>
                  )}
                  {item.fromWarehouse && (
                    <div>
                      <span className="text-gray-500">From:</span>
                      <p className="font-medium">{item.fromWarehouse}</p>
                    </div>
                  )}
                  {item.toWarehouse && (
                    <div>
                      <span className="text-gray-500">To:</span>
                      <p className="font-medium">{item.toWarehouse}</p>
                    </div>
                  )}
                </div>

                {(item.batch || item.serial) && (
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {item.batch && (
                      <div>
                        <span className="text-gray-500">Batch:</span>
                        <p className="font-medium">{item.batch}</p>
                      </div>
                    )}
                    {item.serial && (
                      <div>
                        <span className="text-gray-500">Serial:</span>
                        <p className="font-medium">{item.serial}</p>
                      </div>
                    )}
                  </div>
                )}

                {item.rate && (
                  <div className="text-right">
                    <span className="text-lg font-semibold text-green-600">
                      ₹{(item.qty * item.rate).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>

          {calculateTotalValue() > 0 && (
            <>
              <Separator className="my-6" />
              <div className="flex justify-between items-center text-lg font-semibold">
                <span>Total Value:</span>
                <span className="text-green-600">₹{calculateTotalValue().toLocaleString()}</span>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-between items-center pb-6">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Edit
        </Button>
        <Button onClick={handleSubmit} disabled={loading} size="lg">
          <Send className="w-4 h-4 mr-2" />
          {loading ? 'Submitting...' : 'Submit Stock Entry'}
        </Button>
      </div>
    </div>
  );
};

export default StockEntryReview;

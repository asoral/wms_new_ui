
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Send, Edit } from "lucide-react";
import { MaterialRequest } from "@/pages/MaterialRequest";
import { createERPNextAPI } from "@/services/erpnextApi";
import { useToast } from "@/hooks/use-toast";

interface MaterialRequestReviewProps {
  draftRequest: MaterialRequest;
  onSubmitComplete: () => void;
  onBack: () => void;
}

const MaterialRequestReview = ({ draftRequest, onSubmitComplete, onBack }: MaterialRequestReviewProps) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const erpnextAPI = await createERPNextAPI();
      if (!erpnextAPI) {
        throw new Error('ERPNext API not configured');
      }

      // Submit the material request (change docstatus to 1)
      const submitData = {
        docstatus: 1
      };

      await erpnextAPI.updateMaterialRequest(draftRequest.name, submitData);
      
      toast({
        title: "Success",
        description: `Material request ${draftRequest.name} submitted successfully!`,
      });

      onSubmitComplete();
    } catch (error) {
      console.error('Error submitting material request:', error);
      toast({
        title: "Error",
        description: `Failed to submit material request: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getTotalValue = () => {
    return draftRequest.items.reduce((total, item) => {
      return total + (item.rate || 0) * item.qty;
    }, 0);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h2 className="text-xl font-semibold">Review & Submit</h2>
            <p className="text-sm text-gray-600">{draftRequest.name}</p>
          </div>
        </div>
        <Badge variant="secondary">Draft</Badge>
      </div>

      {/* Request Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Request Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <span className="text-sm text-gray-500">Request Type:</span>
              <p className="font-medium">{draftRequest.purpose}</p>
            </div>
            <div>
              <span className="text-sm text-gray-500">Company:</span>
              <p className="font-medium">{draftRequest.company}</p>
            </div>
            <div>
              <span className="text-sm text-gray-500">Total Items:</span>
              <p className="font-medium">{draftRequest.items.length}</p>
            </div>
          </div>
          {draftRequest.remarks && (
            <div className="mt-4">
              <span className="text-sm text-gray-500">Remarks:</span>
              <p className="font-medium">{draftRequest.remarks}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Items Review */}
      <Card>
        <CardHeader>
          <CardTitle>Items</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {draftRequest.items.map((item, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-medium">{item.itemName || item.itemCode}</h4>
                    <p className="text-sm text-gray-600">Code: {item.itemCode}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{item.qty} {item.uom}</p>
                    {item.rate && (
                      <p className="text-sm text-gray-600">
                        Rate: {item.rate} = {(item.rate * item.qty).toFixed(2)}
                      </p>
                    )}
                  </div>
                </div>
                {item.description && (
                  <p className="text-sm text-gray-600 mt-2">{item.description}</p>
                )}
                {item.requiredBy && (
                  <p className="text-xs text-gray-500 mt-1">
                    Required by: {new Date(item.requiredBy).toLocaleDateString()}
                  </p>
                )}
              </div>
            ))}
          </div>
          {getTotalValue() > 0 && (
            <div className="mt-4 pt-4 border-t">
              <div className="flex justify-between items-center">
                <span className="font-medium">Total Value:</span>
                <span className="font-bold text-lg">{getTotalValue().toFixed(2)}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row justify-between space-y-2 sm:space-y-0 sm:space-x-4 pb-6">
        <Button type="button" variant="outline" onClick={onBack} className="w-full sm:w-auto">
          <Edit className="w-4 h-4 mr-2" />
          Edit Request
        </Button>
        <Button 
          type="button" 
          onClick={handleSubmit} 
          disabled={loading}
          className="w-full sm:w-auto"
        >
          <Send className="w-4 h-4 mr-2" />
          {loading ? 'Submitting...' : 'Submit Request'}
        </Button>
      </div>
    </div>
  );
};

export default MaterialRequestReview;

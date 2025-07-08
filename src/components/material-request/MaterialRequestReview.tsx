import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, ArrowRight, Save, Send, Edit3, Package, Calendar, DollarSign, User, Building } from "lucide-react";
import { createERPNextAPI } from "@/services/erpnextApi";
import { useToast } from "@/hooks/use-toast";

interface MaterialRequestReviewProps {
  draftData: any;
  onBack: () => void;
  onEdit: () => void;
  onSubmitted: (submittedRequest: any) => void;
}

const MaterialRequestReview = ({ draftData, onBack, onEdit, onSubmitted }: MaterialRequestReviewProps) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const erpnextAPI = await createERPNextAPI();
      if (!erpnextAPI) {
        throw new Error('ERPNext API not configured');
      }

      // Submit the material request (change status from Draft to Submitted)
      const response = await erpnextAPI.submitMaterialRequest(draftData.name);
      
      if (response?.data) {
        toast({
          title: "Material Request Submitted",
          description: `Material request ${response.data.name} has been submitted successfully.`,
        });
        onSubmitted(response.data);
      }

    } catch (error) {
      console.error('Error submitting material request:', error);
      toast({
        title: "Submission Error",
        description: `Failed to submit material request: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getTotalItems = () => {
    return draftData.items?.length || 0;
  };

  const getTotalQty = () => {
    return draftData.items?.reduce((total: number, item: any) => total + (item.qty || 0), 0) || 0;
  };

  const getTotalAmount = () => {
    return draftData.items?.reduce((total: number, item: any) => total + (item.amount || 0), 0) || 0;
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h2 className="text-2xl font-bold">Review Material Request</h2>
            <div className="flex items-center space-x-2 mt-1">
              <Badge variant="outline">{draftData.material_request_type}</Badge>
              <Badge variant="secondary">{draftData.name}</Badge>
              <Badge variant="outline" className="text-yellow-600 border-yellow-200">
                {draftData.status || "Draft"}
              </Badge>
            </div>
          </div>
        </div>
        <Button variant="outline" onClick={onEdit}>
          <Edit3 className="w-4 h-4 mr-2" />
          Edit Request
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Package className="w-6 h-6 mx-auto mb-2 text-blue-600" />
            <div className="text-2xl font-bold text-blue-600">{getTotalItems()}</div>
            <div className="text-sm text-muted-foreground">Total Items</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Package className="w-6 h-6 mx-auto mb-2 text-green-600" />
            <div className="text-2xl font-bold text-green-600">{getTotalQty()}</div>
            <div className="text-sm text-muted-foreground">Total Quantity</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Calendar className="w-6 h-6 mx-auto mb-2 text-orange-600" />
            <div className="text-sm font-bold text-orange-600">
              {draftData.schedule_date ? new Date(draftData.schedule_date).toLocaleDateString() : 'Not Set'}
            </div>
            <div className="text-sm text-muted-foreground">Required By</div>
          </CardContent>
        </Card>
        {draftData.material_request_type === "Purchase" && (
          <Card>
            <CardContent className="p-4 text-center">
              <DollarSign className="w-6 h-6 mx-auto mb-2 text-purple-600" />
              <div className="text-2xl font-bold text-purple-600">${getTotalAmount().toFixed(2)}</div>
              <div className="text-sm text-muted-foreground">Est. Amount</div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Request Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Building className="w-5 h-5" />
            <span>Request Details</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Company</label>
              <p className="font-medium">{draftData.company || 'Not specified'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Request Type</label>
              <p className="font-medium">{draftData.material_request_type}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Required By</label>
              <p className="font-medium">
                {draftData.schedule_date ? new Date(draftData.schedule_date).toLocaleDateString() : 'Not specified'}
              </p>
            </div>
            {draftData.requested_by && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Requested By</label>
                <p className="font-medium">{draftData.requested_by}</p>
              </div>
            )}
            {draftData.cost_center && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Cost Center</label>
                <p className="font-medium">{draftData.cost_center}</p>
              </div>
            )}
            {draftData.project && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Project</label>
                <p className="font-medium">{draftData.project}</p>
              </div>
            )}
          </div>
          
          {draftData.remarks && (
            <div>
              <label className="text-sm font-medium text-muted-foreground">Remarks</label>
              <p className="mt-1 text-sm bg-muted p-3 rounded-md">{draftData.remarks}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Transfer Details for Material Transfer */}
      {draftData.material_request_type === "Material Transfer" && (
        <Card>
          <CardHeader>
            <CardTitle>Transfer Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Source Warehouse</label>
                <p className="font-medium">{draftData.set_from_warehouse || 'Not specified'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Target Warehouse</label>
                <p className="font-medium">{draftData.set_warehouse || 'Not specified'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Items List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Package className="w-5 h-5" />
            <span>Items ({getTotalItems()})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {draftData.items?.map((item: any, index: number) => (
              <div key={index} className="border rounded-lg p-4 bg-muted/30">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <Badge variant="outline">#{index + 1}</Badge>
                      <h4 className="font-semibold">{item.item_name || item.item_code}</h4>
                    </div>
                    <p className="text-sm text-muted-foreground">{item.item_code}</p>
                    {item.description && (
                      <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">{item.qty} {item.uom}</div>
                    {item.rate > 0 && (
                      <div className="text-sm text-muted-foreground">
                        @ ${item.rate} = ${(item.qty * item.rate).toFixed(2)}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  {item.warehouse && (
                    <div>
                      <span className="text-muted-foreground">Warehouse:</span>
                      <p className="font-medium">{item.warehouse}</p>
                    </div>
                  )}
                  {item.schedule_date && (
                    <div>
                      <span className="text-muted-foreground">Required By:</span>
                      <p className="font-medium">{new Date(item.schedule_date).toLocaleDateString()}</p>
                    </div>
                  )}
                  {item.project && (
                    <div>
                      <span className="text-muted-foreground">Project:</span>
                      <p className="font-medium">{item.project}</p>
                    </div>
                  )}
                  {item.cost_center && (
                    <div>
                      <span className="text-muted-foreground">Cost Center:</span>
                      <p className="font-medium">{item.cost_center}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {draftData.material_request_type === "Purchase" && getTotalAmount() > 0 && (
            <>
              <Separator className="my-6" />
              <div className="flex justify-between items-center text-lg font-semibold">
                <span>Total Estimated Amount:</span>
                <Badge variant="default" className="text-lg px-3 py-1">
                  ${getTotalAmount().toFixed(2)}
                </Badge>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row justify-between space-y-2 sm:space-y-0 sm:space-x-4 pb-6">
        <Button type="button" variant="outline" onClick={onBack} className="w-full sm:w-auto">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Form
        </Button>
        <div className="flex space-x-2">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onEdit}
            className="flex-1 sm:flex-none"
          >
            <Edit3 className="w-4 h-4 mr-2" />
            Edit Request
          </Button>
          <Button 
            type="button" 
            onClick={handleSubmit} 
            disabled={loading}
            className="flex-1 sm:flex-none"
          >
            <Send className="w-4 h-4 mr-2" />
            {loading ? 'Submitting...' : 'Submit Request'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default MaterialRequestReview;
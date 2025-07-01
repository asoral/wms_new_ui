
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Calendar, User, Package } from "lucide-react";
import { createERPNextAPI, getUserDefaultCompany } from "@/services/erpnextApi";
import { useToast } from "@/hooks/use-toast";

interface DraftDeliveryNote {
  name: string;
  customer: string;
  posting_date: string;
  grand_total: number;
  status: string;
  items_count: number;
  against_sales_order?: string;
}

interface DraftDeliveryNotesProps {
  onSelectDraft: (draftName: string, salesOrderNumber?: string) => void;
}

const DraftDeliveryNotes = ({ onSelectDraft }: DraftDeliveryNotesProps) => {
  const [draftNotes, setDraftNotes] = useState<DraftDeliveryNote[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadDraftNotes();
  }, []);

  const loadDraftNotes = async () => {
    setLoading(true);
    try {
      const erpnextAPI = await createERPNextAPI();
      if (!erpnxtAPI) {
        toast({
          title: "ERPNext Not Configured",
          description: "Please configure your ERPNext settings in the Profile page.",
          variant: "destructive"
        });
        return;
      }

      const company = await getUserDefaultCompany();
      
      // Fetch draft delivery notes with more details
      const result = await erpnextAPI.getDeliveryNotes([
        ['docstatus', '=', 0] // Draft status
      ], company || undefined);
      
      if (result.data) {
        // Get detailed info for each draft note to find associated sales orders
        const detailedNotes = await Promise.all(
          result.data.map(async (note: any) => {
            try {
              const detailResult = await erpnextAPI.getDeliveryNote(note.name);
              const detailData = detailResult.data;
              
              // Find the sales order from the items
              let salesOrderNumber = '';
              if (detailData?.items && detailData.items.length > 0) {
                salesOrderNumber = detailData.items[0].against_sales_order || '';
              }
              
              return {
                name: note.name,
                customer: note.customer_name || note.customer,
                posting_date: note.posting_date,
                grand_total: note.grand_total || 0,
                status: note.status,
                items_count: detailData?.items ? detailData.items.length : 0,
                against_sales_order: salesOrderNumber
              };
            } catch (error) {
              console.error(`Error getting details for ${note.name}:`, error);
              return {
                name: note.name,
                customer: note.customer_name || note.customer,
                posting_date: note.posting_date,
                grand_total: note.grand_total || 0,
                status: note.status,
                items_count: 0
              };
            }
          })
        );
        
        setDraftNotes(detailedNotes);
      }
      
    } catch (error) {
      console.error('Error loading draft delivery notes:', error);
      toast({
        title: "Error",
        description: "Failed to load draft delivery notes",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handleContinueDraft = (note: DraftDeliveryNote) => {
    onSelectDraft(note.name, note.against_sales_order);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FileText className="w-5 h-5" />
            <span>Draft Delivery Notes</span>
          </div>
          <Button variant="outline" size="sm" onClick={loadDraftNotes} disabled={loading}>
            {loading ? 'Loading...' : 'Refresh'}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {draftNotes.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {loading ? 'Loading draft notes...' : 'No draft delivery notes found.'}
          </div>
        ) : (
          <div className="space-y-4">
            {draftNotes.map((note) => (
              <Card key={note.name} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-semibold">{note.name}</h3>
                        <Badge variant="secondary">Draft</Badge>
                        {note.against_sales_order && (
                          <Badge variant="outline">SO: {note.against_sales_order}</Badge>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                        <div className="flex items-center space-x-2">
                          <User className="w-4 h-4" />
                          <span>{note.customer}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4" />
                          <span>{new Date(note.posting_date).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Package className="w-4 h-4" />
                          <span>{note.items_count} items</span>
                        </div>
                        <div className="font-medium">
                          {formatCurrency(note.grand_total)}
                        </div>
                      </div>
                    </div>
                    <Button onClick={() => handleContinueDraft(note)}>
                      Continue
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DraftDeliveryNotes;

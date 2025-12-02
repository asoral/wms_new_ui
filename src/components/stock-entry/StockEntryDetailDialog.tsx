import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Database, User, Calendar, Package, Warehouse } from "lucide-react";
import { createERPNextAPI } from "@/services/erpnextApi";
import { useToast } from "@/hooks/use-toast";

interface StockEntryDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stockEntryName: string | null;
}

const StockEntryDetailDialog = ({
  open,
  onOpenChange,
  stockEntryName,
}: StockEntryDetailDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [entry, setEntry] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (open && stockEntryName) {
      fetchStockEntryDetails();
    }
  }, [open, stockEntryName]);

  const fetchStockEntryDetails = async () => {
    if (!stockEntryName) return;
    
    setLoading(true);
    try {
      const api = await createERPNextAPI();
      if (!api) {
        toast({
          title: "Error",
          description: "ERPNext API not configured",
          variant: "destructive",
        });
        return;
      }

      const result = await api.getStockEntry(stockEntryName);
      if (result.data) {
        setEntry(result.data);
      } else {
        toast({
          title: "Not Found",
          description: `Stock entry ${stockEntryName} not found`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error fetching stock entry:", error);
      toast({
        title: "Error",
        description: "Failed to fetch stock entry details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (docstatus: number) => {
    switch (docstatus) {
      case 0:
        return <Badge className="bg-gray-100 text-gray-800">Draft</Badge>;
      case 1:
        return <Badge className="bg-green-100 text-green-800">Submitted</Badge>;
      case 2:
        return <Badge className="bg-red-100 text-red-800">Cancelled</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Database className="w-5 h-5 text-primary" />
            Stock Entry Details
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <span className="ml-2">Loading details...</span>
          </div>
        ) : entry ? (
          <div className="space-y-6">
            {/* Header Info */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">{entry.name}</h3>
                <p className="text-sm text-muted-foreground">{entry.stock_entry_type}</p>
              </div>
              {getStatusBadge(entry.docstatus)}
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Calendar className="w-4 h-4" />
                    <span className="text-xs">Posting Date</span>
                  </div>
                  <p className="font-medium">
                    {entry.posting_date
                      ? new Date(entry.posting_date).toLocaleDateString()
                      : "N/A"}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <User className="w-4 h-4" />
                    <span className="text-xs">Created By</span>
                  </div>
                  <p className="font-medium truncate">{entry.owner || "N/A"}</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <User className="w-4 h-4" />
                    <span className="text-xs">Modified By</span>
                  </div>
                  <p className="font-medium truncate">{entry.modified_by || "N/A"}</p>
                </CardContent>
              </Card>

              {entry.from_warehouse && (
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <Warehouse className="w-4 h-4" />
                      <span className="text-xs">From Warehouse</span>
                    </div>
                    <p className="font-medium truncate">{entry.from_warehouse}</p>
                  </CardContent>
                </Card>
              )}

              {entry.to_warehouse && (
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <Warehouse className="w-4 h-4" />
                      <span className="text-xs">To Warehouse</span>
                    </div>
                    <p className="font-medium truncate">{entry.to_warehouse}</p>
                  </CardContent>
                </Card>
              )}

              {entry.company && (
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <Database className="w-4 h-4" />
                      <span className="text-xs">Company</span>
                    </div>
                    <p className="font-medium truncate">{entry.company}</p>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Items Table */}
            {entry.items && entry.items.length > 0 && (
              <div>
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  Items ({entry.items.length})
                </h4>
                <div className="border rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-muted">
                        <tr>
                          <th className="text-left p-3 font-medium">Item Code</th>
                          <th className="text-left p-3 font-medium">Item Name</th>
                          <th className="text-right p-3 font-medium">Qty</th>
                          <th className="text-left p-3 font-medium">UOM</th>
                          <th className="text-left p-3 font-medium">Source</th>
                          <th className="text-left p-3 font-medium">Target</th>
                          <th className="text-left p-3 font-medium">Batch</th>
                        </tr>
                      </thead>
                      <tbody>
                        {entry.items.map((item: any, index: number) => (
                          <tr key={index} className="border-t">
                            <td className="p-3 font-medium">{item.item_code}</td>
                            <td className="p-3">{item.item_name || item.item_code}</td>
                            <td className="p-3 text-right">{item.qty}</td>
                            <td className="p-3">{item.uom || item.stock_uom}</td>
                            <td className="p-3 text-xs">{item.s_warehouse || "-"}</td>
                            <td className="p-3 text-xs">{item.t_warehouse || "-"}</td>
                            <td className="p-3 text-xs">{item.batch_no || "-"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Additional Info */}
            <div className="grid grid-cols-2 gap-4 text-sm border-t pt-4">
              <div>
                <span className="text-muted-foreground">Created:</span>
                <p>
                  {entry.creation
                    ? new Date(entry.creation).toLocaleString()
                    : "N/A"}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">Last Modified:</span>
                <p>
                  {entry.modified
                    ? new Date(entry.modified).toLocaleString()
                    : "N/A"}
                </p>
              </div>
              {entry.remarks && (
                <div className="col-span-2">
                  <span className="text-muted-foreground">Remarks:</span>
                  <p>{entry.remarks}</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            No data available
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default StockEntryDetailDialog;

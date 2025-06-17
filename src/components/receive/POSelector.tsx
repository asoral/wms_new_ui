
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Loader2 } from "lucide-react";
import { createERPNextAPI, getUserDefaultCompany } from "@/services/erpnextApi";
import { useToast } from "@/hooks/use-toast";

interface PurchaseOrderOption {
  name: string;
  supplier: string;
  supplier_name: string;
  schedule_date: string;
  grand_total: number;
  status: string;
}

interface POSelectorProps {
  onSelectPO: (poNumber: string) => void;
  loading?: boolean;
}

const POSelector = ({ onSelectPO, loading }: POSelectorProps) => {
  const [poNumber, setPONumber] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrderOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadPurchaseOrders();
  }, []);

  const loadPurchaseOrders = async () => {
    setIsLoading(true);
    try {
      const erpnextAPI = await createERPNextAPI();
      if (!erpnextAPI) {
        toast({
          title: "ERPNext Not Configured",
          description: "Please configure your ERPNext settings in the Profile page.",
          variant: "destructive"
        });
        return;
      }

      const defaultCompany = await getUserDefaultCompany();
      
      // Fetch submitted POs with status "To Receive" or "To Receive and Bill"
      const filters = [
        ['docstatus', '=', 1],
        ['status', 'in', ['To Receive', 'To Receive and Bill']]
      ];

      const result = await erpnextAPI.getPurchaseOrders(filters, defaultCompany || undefined, 100);
      
      if (result?.data) {
        // Transform the data to match our interface, handling undefined values
        const transformedOrders: PurchaseOrderOption[] = result.data.map((po: any) => ({
          name: po.name || '',
          supplier: po.supplier || '',
          supplier_name: po.supplier_name || po.supplier || '',
          schedule_date: po.schedule_date || po.transaction_date || '',
          grand_total: po.grand_total || 0,
          status: po.status || ''
        }));
        
        setPurchaseOrders(transformedOrders);
      }
    } catch (error) {
      console.error('Failed to load purchase orders:', error);
      toast({
        title: "Error",
        description: "Failed to load purchase orders from ERPNext",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePOSearch = () => {
    if (poNumber.trim()) {
      onSelectPO(poNumber.trim());
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handlePOSearch();
    }
  };

  const filteredPOs = purchaseOrders.filter(po => 
    po.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    po.supplier.toLowerCase().includes(searchTerm.toLowerCase()) ||
    po.supplier_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    po.schedule_date.includes(searchTerm) ||
    po.grand_total.toString().includes(searchTerm)
  );

  return (
    <div className="space-y-4">
      {/* Manual PO Entry */}
      <div>
        <Label htmlFor="poNumber">Enter Purchase Order Number</Label>
        <div className="flex space-x-2">
          <Input
            id="poNumber"
            value={poNumber}
            onChange={(e) => setPONumber(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Enter PO number manually..."
          />
          <Button onClick={handlePOSearch} disabled={!poNumber.trim() || loading}>
            <Search className="w-4 h-4 mr-2" />
            Select
          </Button>
        </div>
      </div>

      <div className="text-center text-gray-500">OR</div>

      {/* Purchase Order Dropdown */}
      <div>
        <Label htmlFor="searchPO">Search and Select Purchase Order</Label>
        <div className="space-y-2">
          <Input
            id="searchPO"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by PO number, supplier, date, or amount..."
            className="mb-2"
          />
          
          {isLoading ? (
            <div className="flex items-center justify-center p-4">
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              Loading purchase orders...
            </div>
          ) : (
            <Select 
              value={poNumber} 
              onValueChange={(value) => {
                setPONumber(value);
                onSelectPO(value);
              }}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a purchase order..." />
              </SelectTrigger>
              <SelectContent>
                {filteredPOs.map((po) => (
                  <SelectItem key={po.name} value={po.name}>
                    <div className="flex flex-col">
                      <div className="font-medium">{po.name}</div>
                      <div className="text-sm text-gray-600">
                        {po.supplier_name} • {po.schedule_date} • ₹{(po.grand_total || 0).toLocaleString()}
                      </div>
                    </div>
                  </SelectItem>
                ))}
                {filteredPOs.length === 0 && (
                  <SelectItem value="no-orders" disabled>
                    No purchase orders found
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>
    </div>
  );
};

export default POSelector;

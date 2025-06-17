
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Loader2, Check, ChevronsUpDown } from "lucide-react";
import { createERPNextAPI, getUserDefaultCompany } from "@/services/erpnextApi";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

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
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [searchValue, setSearchValue] = useState("");
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

      // Fix the API call to use proper parameters
      const result = await erpnextAPI.getPurchaseOrders(filters, defaultCompany || undefined, 100);
      
      if (result?.data) {
        // Transform the data to match our interface, handling undefined values
        const transformedOrders: PurchaseOrderOption[] = result.data.map((po: any) => ({
          name: po.name || '',
          supplier: po.supplier || '',
          supplier_name: po.supplier_name || po.supplier || '',
          schedule_date: po.schedule_date || po.transaction_date || '',
          grand_total: Number(po.grand_total) || 0,
          status: po.status || ''
        }));
        
        setPurchaseOrders(transformedOrders);
        console.log('Loaded POs:', transformedOrders);
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

  const handleSelect = (selectedValue: string) => {
    setValue(selectedValue);
    setSearchValue(selectedValue);
    setOpen(false);
    onSelectPO(selectedValue);
  };

  const filteredPOs = purchaseOrders.filter(po => 
    po.name.toLowerCase().includes(searchValue.toLowerCase()) ||
    po.supplier.toLowerCase().includes(searchValue.toLowerCase()) ||
    po.supplier_name.toLowerCase().includes(searchValue.toLowerCase()) ||
    po.schedule_date.includes(searchValue) ||
    po.grand_total.toString().includes(searchValue)
  );

  const selectedPO = purchaseOrders.find(po => po.name === value);

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="poSearch">Search Purchase Order</Label>
        <div className="relative">
          <Input
            id="poSearch"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onFocus={() => setOpen(true)}
            placeholder="Type PO number, supplier name, or amount..."
            className="w-full"
            disabled={loading || isLoading}
          />
          {searchValue && filteredPOs.length > 0 && open && (
            <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
              {filteredPOs.map((po) => (
                <div
                  key={po.name}
                  onClick={() => handleSelect(po.name)}
                  className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="font-medium text-sm">{po.name}</div>
                      <div className="text-xs text-gray-600">
                        {po.supplier_name} • {po.schedule_date} • ₹{po.grand_total?.toLocaleString() || '0'}
                      </div>
                    </div>
                    {value === po.name && (
                      <Check className="h-4 w-4 text-green-600" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
          {isLoading && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <Loader2 className="w-4 h-4 animate-spin" />
            </div>
          )}
        </div>
        
        {selectedPO && (
          <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-md">
            <div className="text-sm">
              <p><strong>PO:</strong> {selectedPO.name}</p>
              <p><strong>Supplier:</strong> {selectedPO.supplier_name}</p>
              <p><strong>Date:</strong> {selectedPO.schedule_date}</p>
              <p><strong>Total:</strong> ₹{selectedPO.grand_total?.toLocaleString() || '0'}</p>
              <p><strong>Status:</strong> {selectedPO.status}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default POSelector;

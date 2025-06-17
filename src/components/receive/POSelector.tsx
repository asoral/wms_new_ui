
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Search, Loader2, Check, ChevronsUpDown } from "lucide-react";
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

  const handleSelect = (selectedValue: string) => {
    setValue(selectedValue);
    setSearchValue(selectedValue);
    setOpen(false);
    onSelectPO(selectedValue);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && searchValue.trim()) {
      // If user types a PO number and presses Enter, select it directly
      handleSelect(searchValue.trim());
    }
  };

  const filteredPOs = purchaseOrders.filter(po => 
    po.name.toLowerCase().includes(searchValue.toLowerCase()) ||
    po.supplier.toLowerCase().includes(searchValue.toLowerCase()) ||
    po.supplier_name.toLowerCase().includes(searchValue.toLowerCase()) ||
    po.schedule_date.includes(searchValue) ||
    po.grand_total.toString().includes(searchValue)
  );

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="poSearch">Purchase Order Number</Label>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <div className="relative">
              <Input
                id="poSearch"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type PO number or search..."
                className="pr-10"
                disabled={loading}
              />
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3"
                onClick={() => setOpen(!open)}
                disabled={loading}
              >
                <ChevronsUpDown className="h-4 w-4" />
              </Button>
            </div>
          </PopoverTrigger>
          <PopoverContent className="w-[400px] p-0" align="start">
            <Command>
              <CommandInput 
                placeholder="Search purchase orders..." 
                value={searchValue}
                onValueChange={setSearchValue}
              />
              <CommandList>
                {isLoading ? (
                  <div className="flex items-center justify-center p-4">
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Loading...
                  </div>
                ) : (
                  <>
                    <CommandEmpty>No purchase orders found.</CommandEmpty>
                    <CommandGroup>
                      {filteredPOs.map((po) => (
                        <CommandItem
                          key={po.name}
                          value={po.name}
                          onSelect={() => handleSelect(po.name)}
                          className="flex flex-col items-start p-3"
                        >
                          <div className="flex items-center w-full">
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                value === po.name ? "opacity-100" : "opacity-0"
                              )}
                            />
                            <div className="flex-1">
                              <div className="font-medium">{po.name}</div>
                              <div className="text-sm text-gray-600">
                                {po.supplier_name} • {po.schedule_date} • ₹{(po.grand_total || 0).toLocaleString()}
                              </div>
                            </div>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </>
                )}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
        
        {searchValue && (
          <div className="mt-2">
            <Button 
              onClick={() => handleSelect(searchValue)} 
              disabled={!searchValue.trim() || loading}
              className="w-full"
            >
              <Search className="w-4 h-4 mr-2" />
              Select "{searchValue}"
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default POSelector;

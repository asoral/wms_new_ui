
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Search, ChevronDown, Calendar, User, FileText, IndianRupee } from "lucide-react";
import { createERPNextAPI, getUserDefaultCompany } from "@/services/erpnextApi";
import { useToast } from "@/hooks/use-toast";
import { PurchaseOrder } from "@/services/erp/erpnext/types";

interface POSelectorProps {
  onSelectPO: (poNumber: string) => void;
}

interface POOption {
  value: string;
  label: string;
  supplier: string;
  supplierName: string;
  poDate: string;
  expectedDate: string;
  totalAmount: number;
  status: string;
  grandTotal: string;
}

const POSelector = ({ onSelectPO }: POSelectorProps) => {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [searchValue, setSearchValue] = useState("");
  const [poOptions, setPOOptions] = useState<POOption[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadPurchaseOrders();
  }, []);

  const loadPurchaseOrders = async () => {
    try {
      setLoading(true);
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
      
      // Fetch POs with "To Receive" or "To Receive and Bill" status
      const filters = [
        ['status', 'in', ['To Receive', 'To Receive and Bill']]
      ];

      const poResult = await erpnextAPI.getPurchaseOrders(filters, defaultCompany || undefined, 100);
      
      if (poResult?.data) {
        const options: POOption[] = poResult.data.map((po: PurchaseOrder) => ({
          value: po.name || '',
          label: `${po.name || ''} - ${po.supplier_name || po.supplier || ''}`,
          supplier: po.supplier || '',
          supplierName: po.supplier_name || po.supplier || '',
          poDate: po.transaction_date || '',
          expectedDate: po.schedule_date || po.transaction_date || '',
          totalAmount: po.grand_total || po.base_grand_total || 0,
          status: po.status || 'To Receive',
          grandTotal: po.grand_total ? `₹ ${po.grand_total.toLocaleString()}` : `₹ ${(po.base_grand_total || 0).toLocaleString()}`
        }));
        
        setPOOptions(options);
        console.log('Loaded POs:', options); // Debug log
      }

    } catch (error) {
      console.error('Failed to load purchase orders:', error);
      toast({
        title: "Error",
        description: "Failed to load purchase orders from ERPNext",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredOptions = poOptions.filter(option => {
    const searchLower = searchValue.toLowerCase();
    return (
      (option.value || '').toLowerCase().includes(searchLower) ||
      (option.supplier || '').toLowerCase().includes(searchLower) ||
      (option.supplierName || '').toLowerCase().includes(searchLower) ||
      (option.poDate || '').toLowerCase().includes(searchLower)
    );
  });

  const handleSelect = (selectedValue: string) => {
    setValue(selectedValue);
    setOpen(false);
    onSelectPO(selectedValue);
  };

  const selectedPO = poOptions.find(option => option.value === value);

  return (
    <div className="space-y-2">
      <Label htmlFor="po-selector">Purchase Order</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
            disabled={loading}
          >
            {selectedPO ? selectedPO.label : "Select Purchase Order..."}
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" style={{ width: 'var(--radix-popover-trigger-width)' }}>
          <Command>
            <CommandInput 
              placeholder="Search by PO number, supplier..." 
              value={searchValue}
              onValueChange={setSearchValue}
            />
            <CommandList>
              <CommandEmpty>
                {loading ? "Loading purchase orders..." : "No purchase orders found."}
              </CommandEmpty>
              <CommandGroup>
                {filteredOptions.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={option.value}
                    onSelect={() => handleSelect(option.value)}
                    className="flex flex-col items-start py-4 px-3 border-b border-gray-100 last:border-b-0"
                  >
                    {/* First Row: PO Number and Grand Total */}
                    <div className="flex items-center justify-between w-full mb-2">
                      <div className="flex items-center space-x-2">
                        <FileText className="h-4 w-4 text-blue-600" />
                        <span className="font-semibold text-blue-700">{option.value}</span>
                      </div>
                      <div className="flex items-center space-x-1 text-green-700 font-semibold">
                        <IndianRupee className="h-4 w-4" />
                        <span>{option.grandTotal}</span>
                      </div>
                    </div>
                    
                    {/* Second Row: Supplier Name */}
                    <div className="flex items-center space-x-2 w-full mb-1">
                      <User className="h-3 w-3 text-gray-500" />
                      <span className="text-sm text-gray-700 font-medium">{option.supplierName}</span>
                    </div>
                    
                    {/* Third Row: PO Date and Status */}
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-3 w-3 text-gray-500" />
                        <span className="text-xs text-gray-600">
                          {option.poDate ? new Date(option.poDate).toLocaleDateString() : 'No Date'}
                        </span>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        option.status === 'To Receive' 
                          ? 'bg-orange-100 text-orange-700' 
                          : 'bg-blue-100 text-blue-700'
                      }`}>
                        {option.status}
                      </span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      
      {/* Refresh button */}
      <Button 
        variant="outline" 
        size="sm" 
        onClick={loadPurchaseOrders}
        disabled={loading}
        className="w-full"
      >
        <Search className="w-4 h-4 mr-2" />
        {loading ? "Loading..." : "Refresh PO List"}
      </Button>
    </div>
  );
};

export default POSelector;

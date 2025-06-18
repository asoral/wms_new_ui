
import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Check } from "lucide-react";
import { createERPNextAPI, getUserDefaultCompany } from "@/services/erpnextApi";
import { useToast } from "@/hooks/use-toast";
import { debounce } from "lodash";

interface PurchaseOrderOption {
  name: string;
  supplier: string;
  supplier_name: string;
  schedule_date: string;
  transaction_date: string;
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
  const [hasSearched, setHasSearched] = useState(false);
  const { toast } = useToast();

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce(async (searchTerm: string) => {
      if (searchTerm.length < 2) {
        setPurchaseOrders([]);
        setHasSearched(false);
        return;
      }

      setIsLoading(true);
      setHasSearched(true);
      
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
        
        // Build filters for search
        let filters = [
          ['docstatus', '=', 1],
          ['status', 'in', ['To Receive', 'To Receive and Bill', 'Partially Received']]
        ];

        // Apply company filter from user's default company
        if (defaultCompany) {
          filters.push(['company', '=', defaultCompany]);
        }

        // Add search filters - search in name, supplier, and supplier_name
        const searchFilters = [
          ['name', 'like', `%${searchTerm}%`],
          ['supplier', 'like', `%${searchTerm}%`],
          ['supplier_name', 'like', `%${searchTerm}%`]
        ];

        console.log('Searching POs with term:', searchTerm);

        // Fetch POs with explicit field selection
        const params = new URLSearchParams();
        params.append('filters', JSON.stringify(filters));
        params.append('or_filters', JSON.stringify(searchFilters));
        
        const fields = [
          'name',
          'supplier',
          'supplier_name', 
          'schedule_date',
          'transaction_date',
          'grand_total',
          'status',
          'company'
        ];
        params.append('fields', JSON.stringify(fields));
        params.append('limit_page_length', '50'); // Limit results for performance

        const response = await fetch(`${erpnextAPI.baseURL}/api/resource/Purchase Order?${params.toString()}`, {
          headers: {
            'Authorization': `token ${erpnextAPI.apiKey}:${erpnextAPI.apiSecret}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          }
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch POs: ${response.statusText}`);
        }

        const result = await response.json();
        console.log('Search results:', result);
        
        if (result?.data) {
          const transformedOrders: PurchaseOrderOption[] = result.data.map((po: any) => ({
            name: po.name || '',
            supplier: po.supplier || '',
            supplier_name: po.supplier_name || po.supplier || 'Unknown Supplier',
            schedule_date: po.schedule_date || po.transaction_date || '',
            transaction_date: po.transaction_date || po.schedule_date || '',
            grand_total: Number(po.grand_total) || 0,
            status: po.status || ''
          }));
          
          setPurchaseOrders(transformedOrders);
          console.log('Found POs:', transformedOrders.length);
        }
      } catch (error) {
        console.error('Failed to search purchase orders:', error);
        toast({
          title: "Error",
          description: "Failed to search purchase orders from ERPNext",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    }, 500),
    []
  );

  // Effect to trigger search when searchValue changes
  useEffect(() => {
    debouncedSearch(searchValue);
    
    // Cleanup function to cancel debounced calls
    return () => {
      debouncedSearch.cancel();
    };
  }, [searchValue, debouncedSearch]);

  const handleSelect = (selectedValue: string) => {
    setValue(selectedValue);
    setSearchValue(selectedValue);
    setOpen(false);
    onSelectPO(selectedValue);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchValue(newValue);
    setOpen(newValue.length >= 2); // Show dropdown when user types at least 2 characters
  };

  const selectedPO = purchaseOrders.find(po => po.name === value);

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="poSearch">Search Purchase Order</Label>
        <div className="relative">
          <Input
            id="poSearch"
            value={searchValue}
            onChange={handleInputChange}
            onFocus={() => setOpen(searchValue.length >= 2)}
            onBlur={() => setTimeout(() => setOpen(false), 200)} // Delay to allow clicks
            placeholder="Type at least 2 characters to search PO number, supplier name..."
            className="w-full"
            disabled={loading}
          />
          
          {/* Search Results Dropdown */}
          {open && searchValue.length >= 2 && (
            <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
              {isLoading && (
                <div className="p-3 text-center">
                  <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                  <p className="text-sm text-gray-600 mt-1">Searching...</p>
                </div>
              )}
              
              {!isLoading && hasSearched && purchaseOrders.length === 0 && (
                <div className="p-3 text-center text-sm text-gray-600">
                  No purchase orders found matching "{searchValue}"
                </div>
              )}
              
              {!isLoading && purchaseOrders.length > 0 && purchaseOrders.map((po) => (
                <div
                  key={po.name}
                  onClick={() => handleSelect(po.name)}
                  className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="font-medium text-sm">{po.name}</div>
                      <div className="text-xs text-gray-600">
                        {po.supplier_name} • {po.schedule_date || po.transaction_date} • ₹{po.grand_total?.toLocaleString() || '0'}
                      </div>
                      <div className="text-xs text-blue-600 mt-1">
                        Status: {po.status}
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
              <p><strong>Expected Date:</strong> {selectedPO.schedule_date || selectedPO.transaction_date}</p>
              <p><strong>Total:</strong> ₹{selectedPO.grand_total?.toLocaleString() || '0'}</p>
              <p><strong>Status:</strong> {selectedPO.status}</p>
            </div>
          </div>
        )}
        
        {!isLoading && hasSearched && searchValue.length >= 2 && purchaseOrders.length === 0 && (
          <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-sm text-yellow-800">
              No purchase orders found matching your search. Try different keywords or check if the PO exists with status "To Receive" or "To Receive and Bill".
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default POSelector;

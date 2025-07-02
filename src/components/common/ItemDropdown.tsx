
import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Search, Package, ChevronDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { createERPNextAPI } from "@/services/erpnextApi";

interface Item {
  name: string;
  item_code: string;
  item_name: string;
  stock_uom: string;
  description?: string;
}

interface ItemDropdownProps {
  onItemSelect: (item: Item) => void;
  placeholder?: string;
  disabled?: boolean;
  selectedItem?: Item | null;
  className?: string;
}

const ItemDropdown = ({ 
  onItemSelect, 
  placeholder = "Search items...", 
  disabled = false, 
  selectedItem,
  className = ""
}: ItemDropdownProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Set initial search term from selectedItem
  useEffect(() => {
    if (selectedItem) {
      setSearchTerm(selectedItem.item_name || selectedItem.item_code);
    }
  }, [selectedItem]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowResults(false);
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const searchItems = async (term: string) => {
    if (!term.trim()) {
      console.log('Empty search term, clearing results');
      setItems([]);
      setShowResults(false);
      return;
    }

    console.log('=== SEARCH ITEMS DEBUG ===');
    console.log('Search term:', term);

    try {
      setLoading(true);
      const erpnextAPI = await createERPNextAPI();
      if (!erpnextAPI) {
        console.error('ERPNext API not available');
        toast({
          title: "ERPNext Not Configured",
          description: "Please configure your ERPNext settings in the Profile page.",
          variant: "destructive"
        });
        return;
      }

      console.log('Calling searchItems with term:', term, 'limit: 10');
      // Call the API with exactly 10 items as requested
      const response = await erpnextAPI.searchItems(term, 10);
      console.log('API Response:', response);
      
      if (response && response.data && Array.isArray(response.data)) {
        console.log('Found items count:', response.data.length);
        console.log('Items:', response.data);
        setItems(response.data);
        setShowResults(true);
        setIsOpen(true);
      } else {
        console.warn('Invalid response format:', response);
        setItems([]);
        setShowResults(false);
      }
    } catch (error) {
      console.error('Search error:', error);
      setItems([]);
      setShowResults(false);
      toast({
        title: "Search Error",
        description: "Failed to search items. Please check your ERPNext connection.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Debounced search effect
  useEffect(() => {
    console.log('Search term changed to:', searchTerm);
    
    if (!searchTerm.trim()) {
      setItems([]);
      setShowResults(false);
      return;
    }

    const timer = setTimeout(() => {
      console.log('Triggering search after debounce for:', searchTerm);
      searchItems(searchTerm);
    }, 300);

    return () => {
      console.log('Clearing search timer');
      clearTimeout(timer);
    };
  }, [searchTerm]);

  const handleItemSelect = (item: Item) => {
    console.log('Item selected:', item);
    onItemSelect(item);
    setSearchTerm(item.item_name);
    setShowResults(false);
    setIsOpen(false);
  };

  const handleInputFocus = () => {
    console.log('Input focused, searchTerm:', searchTerm);
    setIsOpen(true);
    if (searchTerm.trim() && items.length === 0) {
      console.log('Triggering search on focus');
      searchItems(searchTerm);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    console.log('Input changed from', searchTerm, 'to', value);
    setSearchTerm(value);
    setIsOpen(true);
    
    if (!value.trim()) {
      setItems([]);
      setShowResults(false);
    }
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          placeholder={placeholder}
          className="pl-10 pr-10"
          disabled={disabled || loading}
        />
        <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
      </div>

      {loading && isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border rounded-lg shadow-lg p-3">
          <div className="text-center text-sm text-gray-500 dark:text-gray-400">Searching...</div>
        </div>
      )}

      {showResults && items.length > 0 && isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {items.map((item) => (
            <div
              key={item.name}
              className="p-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer border-b last:border-b-0"
              onClick={() => handleItemSelect(item)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Package className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="font-medium text-sm dark:text-gray-100">{item.item_name}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">{item.item_code}</p>
                  </div>
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400">{item.stock_uom}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {showResults && items.length === 0 && !loading && searchTerm.trim() && isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border rounded-lg shadow-lg p-3">
          <div className="text-center text-sm text-gray-500 dark:text-gray-400">No items found</div>
        </div>
      )}
    </div>
  );
};

export default ItemDropdown;

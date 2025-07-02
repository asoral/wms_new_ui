
import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
      setItems([]);
      setShowResults(false);
      return;
    }

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

      const response = await erpnextAPI.searchItems(term, 20);
      
      if (response?.data && Array.isArray(response.data)) {
        setItems(response.data);
        setShowResults(true);
        setIsOpen(true);
      } else {
        setItems([]);
        setShowResults(false);
      }
    } catch (error) {
      console.error('Error searching items:', error);
      toast({
        title: "Error",
        description: "Failed to search items",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm && isOpen) {
        searchItems(searchTerm);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm, isOpen]);

  const handleItemSelect = (item: Item) => {
    onItemSelect(item);
    setSearchTerm(item.item_name);
    setShowResults(false);
    setIsOpen(false);
  };

  const handleInputFocus = () => {
    setIsOpen(true);
    if (searchTerm) {
      searchItems(searchTerm);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    setIsOpen(true);
    if (!value) {
      setItems([]);
      setShowResults(false);
    }
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <div className="flex space-x-2">
        <div className="relative flex-1">
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
      </div>

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

      {loading && isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border rounded-lg shadow-lg p-3">
          <div className="text-center text-sm text-gray-500 dark:text-gray-400">Searching...</div>
        </div>
      )}

      {showResults && items.length === 0 && !loading && searchTerm && isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border rounded-lg shadow-lg p-3">
          <div className="text-center text-sm text-gray-500 dark:text-gray-400">No items found</div>
        </div>
      )}
    </div>
  );
};

export default ItemDropdown;

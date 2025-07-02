
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Package } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { createERPNextAPI } from "@/services/erpnextApi";

interface Item {
  name: string;
  item_code: string;
  item_name: string;
  stock_uom: string;
  description?: string;
}

interface ItemSearchProps {
  onItemSelect: (item: Item) => void;
  placeholder?: string;
  disabled?: boolean;
}

const ItemSearch = ({ onItemSelect, placeholder = "Search items...", disabled = false }: ItemSearchProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const { toast } = useToast();

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
      searchItems(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleItemSelect = (item: Item) => {
    onItemSelect(item);
    setSearchTerm(item.item_name);
    setShowResults(false);
  };

  return (
    <div className="relative">
      <div className="flex space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={placeholder}
            className="pl-10"
            disabled={disabled || loading}
          />
        </div>
      </div>

      {showResults && items.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {items.map((item) => (
            <div
              key={item.name}
              className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
              onClick={() => handleItemSelect(item)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Package className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="font-medium text-sm">{item.item_name}</p>
                    <p className="text-xs text-gray-600">{item.item_code}</p>
                  </div>
                </div>
                <span className="text-xs text-gray-500">{item.stock_uom}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {loading && (
        <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg p-3">
          <div className="text-center text-sm text-gray-500">Searching...</div>
        </div>
      )}
    </div>
  );
};

export default ItemSearch;

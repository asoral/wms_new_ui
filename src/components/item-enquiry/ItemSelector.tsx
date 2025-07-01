
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Package, Scan } from "lucide-react";
import { createERPNextAPI } from "@/services/erpnextApi";
import { useToast } from "@/hooks/use-toast";

interface Item {
  name: string;
  item_name: string;
  item_code: string;
  description?: string;
  stock_uom?: string;
}

interface ItemSelectorProps {
  onItemSelected: (item: Item) => void;
  isLoading?: boolean;
}

const ItemSelector = ({ onItemSelected, isLoading = false }: ItemSelectorProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Item[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (searchQuery.length >= 2) {
      searchItems();
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const searchItems = async () => {
    try {
      setSearching(true);
      const erpnextAPI = await createERPNextAPI();
      if (!erpnextAPI) {
        toast({
          title: "ERPNext Not Configured",
          description: "Please configure your ERPNext settings in the Profile page.",
          variant: "destructive"
        });
        return;
      }

      // Check if it's a barcode search (numeric)
      if (/^\d+$/.test(searchQuery)) {
        const barcodeResult = await erpnextAPI.searchItemsByBarcode(searchQuery);
        if (barcodeResult.data && barcodeResult.data.length > 0) {
          setSearchResults(barcodeResult.data);
          return;
        }
      }

      // Regular search by name/code
      const searchResult = await erpnextAPI.searchItems(searchQuery);
      if (searchResult.data) {
        setSearchResults(searchResult.data);
      }
    } catch (error) {
      console.error('Error searching items:', error);
      toast({
        title: "Search Error",
        description: "Failed to search items. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSearching(false);
    }
  };

  const handleItemSelect = (item: Item) => {
    setSelectedItem(item);
    onItemSelected(item);
    setSearchQuery(item.item_name);
    setSearchResults([]);
  };

  const handleBarcodeSearch = async () => {
    if (!searchQuery) return;
    
    try {
      setSearching(true);
      const erpnextAPI = await createERPNextAPI();
      if (!erpnextAPI) return;

      const result = await erpnextAPI.searchItemsByBarcode(searchQuery);
      if (result.data && result.data.length > 0) {
        setSearchResults(result.data);
      } else {
        // Fallback to regular search
        const searchResult = await erpnextAPI.searchItems(searchQuery);
        if (searchResult.data) {
          setSearchResults(searchResult.data);
        }
      }
    } catch (error) {
      console.error('Error searching by barcode:', error);
      toast({
        title: "Search Error",
        description: "Failed to search by barcode.",
        variant: "destructive"
      });
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Package className="w-5 h-5 text-blue-600" />
            <span>Select Item</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search Input */}
          <div className="flex space-x-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by item name, code, or scan barcode"
                className="pl-10"
                disabled={isLoading}
              />
            </div>
            <Button 
              variant="outline" 
              onClick={handleBarcodeSearch}
              disabled={!searchQuery || searching || isLoading}
            >
              <Scan className="w-4 h-4" />
            </Button>
          </div>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="border rounded-lg max-h-60 overflow-y-auto">
              {searchResults.map((item) => (
                <div
                  key={item.name}
                  className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                  onClick={() => handleItemSelect(item)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{item.item_name}</p>
                      <p className="text-sm text-gray-600">{item.item_code}</p>
                      {item.description && (
                        <p className="text-xs text-gray-500 mt-1">{item.description}</p>
                      )}
                    </div>
                    <Badge variant="outline">{item.stock_uom || 'Nos'}</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Selected Item Display */}
          {selectedItem && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <Package className="w-4 h-4 text-green-600" />
                <span className="font-medium text-green-900">Selected Item</span>
              </div>
              <div className="space-y-1 text-sm">
                <p><span className="font-medium">Name:</span> {selectedItem.item_name}</p>
                <p><span className="font-medium">Code:</span> {selectedItem.item_code}</p>
                <p><span className="font-medium">UOM:</span> {selectedItem.stock_uom || 'Nos'}</p>
              </div>
            </div>
          )}

          {searching && (
            <div className="text-center py-4">
              <div className="inline-flex items-center space-x-2">
                <div className="animate-spin rounded-full w-4 h-4 border-b-2 border-blue-600"></div>
                <span className="text-sm text-gray-600">Searching...</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ItemSelector;


import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package } from "lucide-react";
import { Item, ItemSelectCallback } from "@/types";
import { useItemSearch } from "@/hooks/useItemSearch";
import ItemSearchInput from "./ItemSearchInput";
import ItemSearchResults from "./ItemSearchResults";
import SelectedItemDisplay from "./SelectedItemDisplay";

interface ItemSelectorProps {
  onItemSelected: ItemSelectCallback;
  isLoading?: boolean;
}

const ItemSelector = ({ onItemSelected, isLoading = false }: ItemSelectorProps) => {
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const {
    searchQuery,
    setSearchQuery,
    searchResults,
    setSearchResults,
    searching,
    searchByBarcode
  } = useItemSearch();

  const handleItemSelect = (item: Item) => {
    setSelectedItem(item);
    onItemSelected(item);
    setSearchQuery(item.item_name);
    setSearchResults([]);
  };

  const handleBarcodeSearch = () => {
    searchByBarcode(searchQuery);
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
          <ItemSearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            onBarcodeSearch={handleBarcodeSearch}
            searching={searching}
            disabled={isLoading}
          />

          <ItemSearchResults
            results={searchResults}
            onItemSelect={handleItemSelect}
          />

          {selectedItem && (
            <SelectedItemDisplay item={selectedItem} />
          )}

          {searching && (
            <div className="text-center py-4">
              <div className="inline-flex items-center space-x-2">
                <div className="animate-spin rounded-full w-4 h-4 border-b-2 border-blue-600"></div>
                <span className="text-sm text-muted-foreground">Searching...</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ItemSelector;

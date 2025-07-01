
import { Badge } from "@/components/ui/badge";
import { Item } from "@/types";

interface ItemSearchResultsProps {
  results: Item[];
  onItemSelect: (item: Item) => void;
  maxHeight?: string;
}

const ItemSearchResults = ({ 
  results, 
  onItemSelect, 
  maxHeight = "max-h-60" 
}: ItemSearchResultsProps) => {
  if (results.length === 0) return null;

  return (
    <div className={`border rounded-lg ${maxHeight} overflow-y-auto`}>
      {results.map((item) => (
        <div
          key={item.name}
          className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
          onClick={() => onItemSelect(item)}
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
  );
};

export default ItemSearchResults;


import { Package } from "lucide-react";
import { Item } from "@/types";

interface SelectedItemDisplayProps {
  item: Item;
}

const SelectedItemDisplay = ({ item }: SelectedItemDisplayProps) => {
  return (
    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
      <div className="flex items-center space-x-2 mb-2">
        <Package className="w-4 h-4 text-green-600" />
        <span className="font-medium text-green-900">Selected Item</span>
      </div>
      <div className="space-y-1 text-sm">
        <p><span className="font-medium">Name:</span> {item.item_name}</p>
        <p><span className="font-medium">Code:</span> {item.item_code}</p>
        <p><span className="font-medium">UOM:</span> {item.stock_uom || 'Nos'}</p>
      </div>
    </div>
  );
};

export default SelectedItemDisplay;


import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Scan } from "lucide-react";

interface ItemSearchInputProps {
  value: string;
  onChange: (value: string) => void;
  onBarcodeSearch: () => void;
  searching: boolean;
  disabled?: boolean;
  placeholder?: string;
}

const ItemSearchInput = ({ 
  value, 
  onChange, 
  onBarcodeSearch, 
  searching, 
  disabled = false,
  placeholder = "Search by item name, code, or scan barcode"
}: ItemSearchInputProps) => {
  return (
    <div className="flex space-x-2">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="pl-10"
          disabled={disabled || searching}
        />
      </div>
      <Button 
        variant="outline" 
        onClick={onBarcodeSearch}
        disabled={!value || searching || disabled}
      >
        <Scan className="w-4 h-4" />
      </Button>
    </div>
  );
};

export default ItemSearchInput;

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { ItemLabelData } from "../../pages/PrintLabel";
import ItemScanner from "../item-enquiry/ItemScanner";
import { Item } from "@/types";
import { useToast } from "@/hooks/use-toast";

interface ItemLabelFormProps {
  onGenerateLabel: (data: ItemLabelData) => void;
}

const ItemLabelForm = ({ onGenerateLabel }: ItemLabelFormProps) => {
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [qty, setQty] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleItemScanned = (item: Item) => {
    setSelectedItem(item);
  };

  const handleGenerateLabel = () => {
    if (!selectedItem || !qty) return;

    const labelData: ItemLabelData = {
      itemCode: selectedItem.item_code,
      itemName: selectedItem.item_name,
      itemGroup: selectedItem.item_group || "General",
      qty: parseInt(qty),
      uom: selectedItem.stock_uom || "Nos",
      itemBarcode: selectedItem.item_code,
    };
    
    onGenerateLabel(labelData);
    
    toast({
      title: "Label Generated",
      description: `Generated label for ${selectedItem.item_name}`,
    });
  };

  return (
    <div className="space-y-6">
      {loading && (
        <Card>
          <CardContent className="p-6 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-primary" />
            <p>Loading item data...</p>
          </CardContent>
        </Card>
      )}
      
      {!loading && (
        <>
          <ItemScanner 
            onItemScanned={handleItemScanned}
            isLoading={loading}
          />

          {selectedItem && (
            <>
              {/* Item Info */}
              <Card>
                <CardContent className="p-4 space-y-2">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="font-medium">Code:</span> {selectedItem.item_code}
                    </div>
                    <div>
                      <span className="font-medium">Name:</span> {selectedItem.item_name}
                    </div>
                    <div>
                      <span className="font-medium">Group:</span> {selectedItem.item_group || "N/A"}
                    </div>
                    <div>
                      <span className="font-medium">UOM:</span> {selectedItem.stock_uom || "Nos"}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quantity */}
              <div className="space-y-2">
                <Label htmlFor="qty">Quantity</Label>
                <Input
                  id="qty"
                  type="number"
                  placeholder="Enter quantity..."
                  value={qty}
                  onChange={(e) => setQty(e.target.value)}
                  min="1"
                />
              </div>

              {/* Generate Button */}
              <Button 
                onClick={handleGenerateLabel}
                disabled={!qty || parseInt(qty) <= 0}
                className="w-full"
              >
                Generate Item Label
              </Button>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default ItemLabelForm;

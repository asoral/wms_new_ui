import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Package } from "lucide-react";
import POSelector from "./POSelector";

interface PurchaseOrderSelectorProps {
  onSelectPO: (purchaseOrder: any) => void;
  shortcuts?: Array<{
    label: string;
    icon: any;
    action: () => void;
  }>;
}

const PurchaseOrderSelector = ({ onSelectPO, shortcuts = [] }: PurchaseOrderSelectorProps) => {
  const handlePOSelect = (purchaseOrder: any) => {
    onSelectPO(purchaseOrder);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Package className="w-5 h-5" />
          <span>Select Purchase Order to Receive</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <POSelector onOrderSelected={handlePOSelect} isLoading={false} />

        {/* Quick Actions */}
        {shortcuts.length > 0 && (
          <div className="mt-6 pt-4 border-t">
            <CardTitle className="mb-3">Quick Actions</CardTitle>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {shortcuts.map((shortcut, index) => (
                <Button
                  key={index}
                  onClick={shortcut.action}
                  variant="outline"
                  className="h-16 flex flex-col items-center justify-center space-y-2 hover:bg-blue-50 hover:border-blue-200"
                >
                  <shortcut.icon className="w-5 h-5 text-blue-600" />
                  <span className="text-sm font-medium">{shortcut.label}</span>
                </Button>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PurchaseOrderSelector;

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { SalesOrder } from "@/types";
import { createERPNextAPI } from "@/services/erpnextApi";
import { useToast } from "@/hooks/use-toast";

interface SalesOrderSelectorProps {
  onSelectSalesOrder: (salesOrder: SalesOrder) => void;
}

const SalesOrderSelector = ({ onSelectSalesOrder }: SalesOrderSelectorProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<SalesOrder[]>([]);
  const [searching, setSearching] = useState(false);
  const { toast } = useToast();

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;

    try {
      setSearching(true);
      const erpnextAPI = await createERPNextAPI();
      if (!erpnextAPI) return;

      const response = await erpnextAPI.searchSalesOrders(searchTerm);
      if (response.data) {
        setSearchResults(response.data);
      }
    } catch (error) {
      console.error('Error searching sales orders:', error);
      toast({
        title: "Search Error",
        description: "Failed to search sales orders",
        variant: "destructive"
      });
    } finally {
      setSearching(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Search Sales Orders</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex space-x-2">
          <Input
            placeholder="Search by SO number or customer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          />
          <Button 
            onClick={handleSearch}
            disabled={searching || !searchTerm.trim()}
          >
            <Search className="w-4 h-4" />
          </Button>
        </div>

        {searchResults.length > 0 && (
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {searchResults.map((so) => (
              <div
                key={so.id}
                className="p-3 border rounded cursor-pointer hover:bg-gray-50"
                onClick={() => onSelectSalesOrder(so)}
              >
                <div className="font-medium">{so.number}</div>
                <div className="text-sm text-gray-600">{so.customer}</div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SalesOrderSelector;

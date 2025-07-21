import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createERPNextAPI, getUserDefaultCompany } from "@/services/erpnextApi";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { BarChart3, Building2 } from "lucide-react";

const StockCountNew = () => {
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>("");
  const [selectedPurpose, setSelectedPurpose] = useState<string>("Stock Reconciliation");
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    loadWarehouses();
  }, []);

  const loadWarehouses = async () => {
    try {
      const erpnextAPI = await createERPNextAPI();
      if (!erpnextAPI) {
        toast({
          title: "ERPNext Not Configured",
          description: "Please configure your ERPNext settings in the Profile page.",
          variant: "destructive"
        });
        return;
      }

      const company = await getUserDefaultCompany();
      const filters = company ? [['company', '=', company]] : undefined;
      const response = await erpnextAPI.getWarehouses(filters);
      
      if (response?.data) {
        setWarehouses(response.data);
      }
    } catch (error) {
      console.error('Failed to load warehouses:', error);
      toast({
        title: "Error",
        description: "Failed to load warehouses",
        variant: "destructive"
      });
    }
  };

  const handleStartSession = () => {
    if (!selectedWarehouse) {
      toast({
        title: "Warehouse Required",
        description: "Please select a warehouse to start the stock count session.",
        variant: "destructive"
      });
      return;
    }

    // Navigate to stock count session with parameters
    navigate(`/app/stock-count/session?warehouse=${encodeURIComponent(selectedWarehouse)}&purpose=${encodeURIComponent(selectedPurpose)}`);
  };

  return (
    <div className="w-full max-w-7xl mx-auto py-4 md:py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center space-x-2">
          <BarChart3 className="w-6 h-6" />
          <span>Stock Count</span>
        </h1>
        <p className="text-gray-500">Start a new stock count session</p>
      </div>

      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Start Stock Count Session</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="warehouse">Select Warehouse *</Label>
            <Select value={selectedWarehouse} onValueChange={setSelectedWarehouse}>
              <SelectTrigger>
                <SelectValue placeholder="Search warehouse by code or name..." />
              </SelectTrigger>
              <SelectContent>
                {warehouses.map((warehouse) => (
                  <SelectItem key={warehouse.name} value={warehouse.name}>
                    <div className="flex items-center space-x-2">
                      <Building2 className="w-4 h-4" />
                      <span>{warehouse.warehouse_name || warehouse.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="purpose">Select Count Purpose *</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Card 
                className={`cursor-pointer transition-all ${selectedPurpose === 'Stock Reconciliation' ? 'bg-blue-50 border-blue-500' : 'hover:bg-gray-50'}`}
                onClick={() => setSelectedPurpose('Stock Reconciliation')}
              >
                <CardContent className="p-6 text-center">
                  <BarChart3 className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                  <h3 className="font-semibold">Stock Reconciliation</h3>
                </CardContent>
              </Card>

              <Card 
                className={`cursor-pointer transition-all ${selectedPurpose === 'Stock Opening' ? 'bg-blue-50 border-blue-500' : 'hover:bg-gray-50'}`}
                onClick={() => setSelectedPurpose('Stock Opening')}
              >
                <CardContent className="p-6 text-center">
                  <Building2 className="w-8 h-8 mx-auto mb-2 text-green-600" />
                  <h3 className="font-semibold">Stock Opening</h3>
                </CardContent>
              </Card>
            </div>
          </div>

          <Button 
            onClick={handleStartSession}
            className="w-full py-3"
            disabled={loading || !selectedWarehouse}
          >
            Start Count Session
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default StockCountNew;

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Warehouse, Loader2 } from "lucide-react";
import { createERPNextAPI } from "@/services/erpnextApi";

interface WarehouseInfo {
  name: string;
  warehouse_name: string;
  is_group: number;
}

interface WarehouseSelectorProps {
  onWarehouseSelected: (warehouseCode: string) => void;
  isLoading: boolean;
}

const WarehouseSelector = ({ onWarehouseSelected, isLoading }: WarehouseSelectorProps) => {
  const [warehouses, setWarehouses] = useState<WarehouseInfo[]>([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>("");
  const [isLoadingWarehouses, setIsLoadingWarehouses] = useState(false);

  useEffect(() => {
    loadWarehouses();
  }, []);

  const loadWarehouses = async () => {
    setIsLoadingWarehouses(true);
    try {
      const erpnextAPI = await createERPNextAPI();
      if (!erpnextAPI) {
        console.error('ERPNext API not configured');
        return;
      }

      const warehouseResult = await erpnextAPI.getWarehouses();
      if (warehouseResult.data && warehouseResult.data.length > 0) {
        setWarehouses(warehouseResult.data);
      }
    } catch (error) {
      console.error('Error loading warehouses:', error);
    } finally {
      setIsLoadingWarehouses(false);
    }
  };

  const handleWarehouseChange = (warehouseCode: string) => {
    setSelectedWarehouse(warehouseCode);
  };

  const handleSearchWarehouse = () => {
    if (selectedWarehouse) {
      onWarehouseSelected(selectedWarehouse);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="warehouse-select">Select Warehouse</Label>
        <div className="flex space-x-2">
          <Select 
            value={selectedWarehouse} 
            onValueChange={handleWarehouseChange}
            disabled={isLoadingWarehouses || isLoading}
          >
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Choose a warehouse..." />
            </SelectTrigger>
            <SelectContent>
              {warehouses.map((warehouse) => (
                <SelectItem key={warehouse.name} value={warehouse.name}>
                  <div className="flex items-center space-x-2">
                    <Warehouse className="w-4 h-4" />
                    <span>{warehouse.warehouse_name || warehouse.name}</span>
                    {warehouse.is_group === 1 && (
                      <span className="text-xs text-gray-500">(Group)</span>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button 
            onClick={handleSearchWarehouse} 
            disabled={!selectedWarehouse || isLoading || isLoadingWarehouses}
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Warehouse className="w-4 h-4" />
            )}
            Search
          </Button>
        </div>
      </div>
      
      {isLoadingWarehouses && (
        <div className="text-sm text-gray-600">Loading warehouses...</div>
      )}
      
      {warehouses.length === 0 && !isLoadingWarehouses && (
        <div className="text-sm text-gray-500">No warehouses found</div>
      )}
    </div>
  );
};

export default WarehouseSelector;

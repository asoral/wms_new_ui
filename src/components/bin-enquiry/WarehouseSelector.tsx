
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Warehouse, Loader2, Search } from "lucide-react";
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
  const [filteredWarehouses, setFilteredWarehouses] = useState<WarehouseInfo[]>([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [isLoadingWarehouses, setIsLoadingWarehouses] = useState(false);
  const [useDropdown, setUseDropdown] = useState(true);

  useEffect(() => {
    loadWarehouses();
  }, []);

  useEffect(() => {
    // Filter warehouses based on search term
    if (searchTerm.trim() === "") {
      setFilteredWarehouses(warehouses);
    } else {
      const filtered = warehouses.filter(warehouse =>
        warehouse.warehouse_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        warehouse.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredWarehouses(filtered);
    }
  }, [searchTerm, warehouses]);

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
        setFilteredWarehouses(warehouseResult.data);
      }
    } catch (error) {
      console.error('Error loading warehouses:', error);
    } finally {
      setIsLoadingWarehouses(false);
    }
  };

  const handleWarehouseChange = (warehouseCode: string) => {
    setSelectedWarehouse(warehouseCode);
    setSearchTerm("");
  };

  const handleWarehouseSelect = (warehouseCode: string) => {
    const warehouse = warehouses.find(w => w.name === warehouseCode);
    setSelectedWarehouse(warehouseCode);
    setSearchTerm(warehouse?.warehouse_name || warehouse?.name || "");
  };

  const handleSearchWarehouse = () => {
    if (selectedWarehouse) {
      onWarehouseSelected(selectedWarehouse);
    } else if (searchTerm.trim()) {
      // If user typed something but didn't select from dropdown, try to find exact match
      const exactMatch = warehouses.find(w => 
        w.warehouse_name?.toLowerCase() === searchTerm.toLowerCase() ||
        w.name.toLowerCase() === searchTerm.toLowerCase()
      );
      if (exactMatch) {
        onWarehouseSelected(exactMatch.name);
      } else if (filteredWarehouses.length > 0) {
        // Use first filtered result
        onWarehouseSelected(filteredWarehouses[0].name);
      }
    }
  };

  const handleDirectSearch = () => {
    if (searchTerm.trim()) {
      onWarehouseSelected(searchTerm.trim());
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleDirectSearch();
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="warehouse-select">Select or Search Warehouse</Label>
        
        {/* Toggle between dropdown and search input */}
        <div className="flex space-x-2 mb-2">
          <Button
            variant={useDropdown ? "default" : "outline"}
            size="sm"
            onClick={() => setUseDropdown(true)}
          >
            Dropdown
          </Button>
          <Button
            variant={!useDropdown ? "default" : "outline"}
            size="sm"
            onClick={() => setUseDropdown(false)}
          >
            Search
          </Button>
        </div>

        <div className="flex space-x-2">
          {useDropdown ? (
            <Select 
              value={selectedWarehouse} 
              onValueChange={handleWarehouseChange}
              disabled={isLoadingWarehouses || isLoading}
            >
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Choose a warehouse..." />
              </SelectTrigger>
              <SelectContent>
                <div className="p-2">
                  <Input
                    placeholder="Search warehouses..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="mb-2"
                  />
                </div>
                {filteredWarehouses.map((warehouse) => (
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
                {filteredWarehouses.length === 0 && searchTerm && (
                  <div className="p-2 text-sm text-gray-500">No warehouses found</div>
                )}
              </SelectContent>
            </Select>
          ) : (
            <div className="flex-1 relative">
              <Input
                placeholder="Type warehouse name or code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={isLoading || isLoadingWarehouses}
                className="pr-10"
              />
              <Search className="w-4 h-4 absolute right-3 top-3 text-gray-400" />
              
              {/* Search suggestions dropdown */}
              {searchTerm && filteredWarehouses.length > 0 && (
                <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-y-auto">
                  <Command>
                    <CommandList>
                      <CommandGroup>
                        {filteredWarehouses.slice(0, 10).map((warehouse) => (
                          <CommandItem
                            key={warehouse.name}
                            onSelect={() => handleWarehouseSelect(warehouse.name)}
                            className="cursor-pointer"
                          >
                            <div className="flex items-center space-x-2">
                              <Warehouse className="w-4 h-4" />
                              <span>{warehouse.warehouse_name || warehouse.name}</span>
                              {warehouse.is_group === 1 && (
                                <span className="text-xs text-gray-500">(Group)</span>
                              )}
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </div>
              )}
            </div>
          )}
          
          <Button 
            onClick={useDropdown ? handleSearchWarehouse : handleDirectSearch}
            disabled={(!selectedWarehouse && !searchTerm.trim()) || isLoading || isLoadingWarehouses}
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

      {searchTerm && filteredWarehouses.length === 0 && warehouses.length > 0 && (
        <div className="text-sm text-yellow-600">
          No warehouses match "{searchTerm}". You can still search directly.
        </div>
      )}
    </div>
  );
};

export default WarehouseSelector;

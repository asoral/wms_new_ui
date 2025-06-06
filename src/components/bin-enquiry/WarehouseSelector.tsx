
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
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
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [isLoadingWarehouses, setIsLoadingWarehouses] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

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
    setCurrentPage(1); // Reset to first page when searching
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

  const handleWarehouseSelect = (warehouseCode: string) => {
    const warehouse = warehouses.find(w => w.name === warehouseCode);
    setSearchTerm(warehouse?.warehouse_name || warehouse?.name || "");
    onWarehouseSelected(warehouseCode);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && filteredWarehouses.length > 0) {
      handleWarehouseSelect(filteredWarehouses[0].name);
    }
  };

  // Pagination logic
  const totalPages = Math.ceil(filteredWarehouses.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentWarehouses = filteredWarehouses.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="warehouse-search">Search Warehouse</Label>
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
          <Input
            id="warehouse-search"
            placeholder="Type warehouse name to search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isLoading || isLoadingWarehouses}
            className="pl-10"
          />
        </div>
      </div>
      
      {isLoadingWarehouses && (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="w-4 h-4 animate-spin mr-2" />
          <span className="text-sm text-gray-600">Loading warehouses...</span>
        </div>
      )}
      
      {!isLoadingWarehouses && warehouses.length === 0 && (
        <div className="text-sm text-gray-500 text-center py-4">No warehouses found</div>
      )}

      {!isLoadingWarehouses && warehouses.length > 0 && (
        <>
          {/* Warehouse List */}
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {currentWarehouses.length > 0 ? (
              currentWarehouses.map((warehouse) => (
                <div
                  key={warehouse.name}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                  onClick={() => handleWarehouseSelect(warehouse.name)}
                >
                  <div className="flex items-center space-x-3">
                    <Warehouse className="w-4 h-4 text-gray-500" />
                    <div>
                      <div className="font-medium">{warehouse.warehouse_name || warehouse.name}</div>
                      <div className="text-sm text-gray-500">{warehouse.name}</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {warehouse.is_group === 1 && (
                      <span className="text-xs px-2 py-1 bg-blue-100 text-blue-600 rounded">Group</span>
                    )}
                    <Button size="sm" variant="outline">
                      Select
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-sm text-gray-500 text-center py-4">
                {searchTerm ? `No warehouses found matching "${searchTerm}"` : "No warehouses available"}
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                    className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
                
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pageNumber = i + 1;
                  return (
                    <PaginationItem key={pageNumber}>
                      <PaginationLink
                        onClick={() => handlePageChange(pageNumber)}
                        isActive={currentPage === pageNumber}
                        className="cursor-pointer"
                      >
                        {pageNumber}
                      </PaginationLink>
                    </PaginationItem>
                  );
                })}
                
                <PaginationItem>
                  <PaginationNext 
                    onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                    className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}

          {/* Results count */}
          <div className="text-sm text-gray-600 text-center">
            Showing {startIndex + 1}-{Math.min(endIndex, filteredWarehouses.length)} of {filteredWarehouses.length} warehouses
          </div>
        </>
      )}
    </div>
  );
};

export default WarehouseSelector;

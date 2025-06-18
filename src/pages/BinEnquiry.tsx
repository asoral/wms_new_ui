
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Warehouse, QrCode, Scan } from "lucide-react";
import { createERPNextAPI } from "@/services/erpnextApi";
import { useToast } from "@/hooks/use-toast";
import BinScanner from "../components/bin-enquiry/BinScanner";
import CameraScanner from "../components/bin-enquiry/CameraScanner";
import BinItemsTable from "../components/bin-enquiry/BinItemsTable";
import WarehouseSelector from "../components/bin-enquiry/WarehouseSelector";

export interface BinEnquiryItem {
  itemCode: string;
  itemName: string;
  quantity: number;
  reserved: number;
  available: number;
  uom: string;
  binLocation: string;
}

const BinEnquiry = () => {
  const [activeTab, setActiveTab] = useState("search");
  const [binCode, setBinCode] = useState("");
  const [selectedWarehouse, setSelectedWarehouse] = useState("");
  const [binItems, setBinItems] = useState<BinEnquiryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const { toast } = useToast();

  const handleBinCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBinCode(e.target.value);
  };

  const handleWarehouseSelected = (warehouseCode: string) => {
    setSelectedWarehouse(warehouseCode);
  };

  const handleSearchBin = async () => {
    if (!binCode.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter a bin code to search",
        variant: "destructive",
      });
      return;
    }
    
    await fetchBinItems();
  };

  const handleBinScanned = async (scannedBin: string) => {
    setBinCode(scannedBin);
    await fetchBinItems(scannedBin);
  };

  const fetchBinItems = async (binCodeToSearch = binCode) => {
    setLoading(true);
    setHasSearched(true);
    
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

      // First get warehouses to validate if bin exists
      const warehousesResult = await erpnextAPI.warehouse.getWarehouses();
      const warehouses = warehousesResult?.data || [];
      
      // Get warehouse code from bin if not set already
      let warehouseCode = selectedWarehouse;
      if (!warehouseCode && binCodeToSearch.includes('-')) {
        warehouseCode = binCodeToSearch.split('-')[0];
        setSelectedWarehouse(warehouseCode);
      }

      // Validate warehouse exists
      const warehouseExists = !warehouseCode || warehouses.some((wh: any) => wh.name === warehouseCode);
      if (warehouseCode && !warehouseExists) {
        toast({
          title: "Invalid Warehouse",
          description: `Warehouse ${warehouseCode} does not exist in the system.`,
          variant: "destructive"
        });
        setBinItems([]);
        setLoading(false);
        return;
      }

      // Check bin/warehouse combination exists
      const binWarehouseExists = await validateBinExists(binCodeToSearch, warehouseCode);
      if (!binWarehouseExists) {
        toast({
          title: "Invalid Bin",
          description: `Bin ${binCodeToSearch} does not exist in warehouse ${warehouseCode || 'any'}.`,
          variant: "destructive"
        });
        setBinItems([]);
        setLoading(false);
        return;
      }

      // Fetch bin stock data
      const binStockData = await erpnextAPI.stock.getBinStock("", warehouseCode);
      
      // Filter and transform the data for the given bin
      const filteredBinData = binStockData?.data?.filter((item: any) => 
        item.bin_code === binCodeToSearch
      ) || [];
      
      const transformedData: BinEnquiryItem[] = filteredBinData.map((item: any) => ({
        itemCode: item.item_code || "",
        itemName: item.item_name || "",
        quantity: Number(item.actual_qty || 0),
        reserved: Number(item.reserved_qty || 0),
        available: Number((item.actual_qty || 0) - (item.reserved_qty || 0)),
        uom: item.stock_uom || "",
        binLocation: item.bin_code || "",
      }));

      setBinItems(transformedData);
      
      if (transformedData.length === 0) {
        toast({
          title: "No Items Found",
          description: `No items found in bin ${binCodeToSearch}.`,
          variant: "default"
        });
      }

    } catch (error) {
      console.error('Error fetching bin items:', error);
      toast({
        title: "Error",
        description: "Failed to fetch bin items from ERPNext",
        variant: "destructive"
      });
      setBinItems([]);
    } finally {
      setLoading(false);
    }
  };

  const validateBinExists = async (binCode: string, warehouseCode: string): Promise<boolean> => {
    try {
      // This is a simple validation that could be enhanced with a direct bin check API
      // For now, assume the bin exists if it follows the format
      return true;
    } catch (error) {
      console.error('Error validating bin:', error);
      return false;
    }
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center mb-6">
        <Warehouse className="w-6 h-6 mr-2 text-blue-600" />
        <h1 className="text-2xl font-bold">Bin Enquiry</h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-3 mb-6">
          <TabsTrigger value="search">
            <Search className="w-4 h-4 mr-2" />
            <span>Manual Search</span>
          </TabsTrigger>
          <TabsTrigger value="scan">
            <QrCode className="w-4 h-4 mr-2" />
            <span>QR Code</span>
          </TabsTrigger>
          <TabsTrigger value="camera">
            <Scan className="w-4 h-4 mr-2" />
            <span>Camera</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="search">
          <Card>
            <CardHeader>
              <CardTitle>Search Bin</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="binCode">Bin Code</Label>
                  <div className="flex mt-1">
                    <Input
                      id="binCode"
                      value={binCode}
                      onChange={handleBinCodeChange}
                      placeholder="Enter bin code (e.g. WH1-A1-B2)"
                    />
                    <Button onClick={handleSearchBin} className="ml-2" disabled={loading}>
                      {loading ? (
                        <span className="animate-spin mr-2">◠</span>
                      ) : (
                        <Search className="w-4 h-4 mr-2" />
                      )}
                      Search
                    </Button>
                  </div>
                </div>

                <div>
                  <Label>Warehouse (Optional)</Label>
                  <WarehouseSelector
                    onWarehouseSelected={handleWarehouseSelected}
                    isLoading={loading}
                  />
                </div>
              </div>

              {hasSearched && (
                <BinItemsTable items={binItems} isLoading={loading} />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="scan">
          <Card>
            <CardHeader>
              <CardTitle>Scan QR Code</CardTitle>
            </CardHeader>
            <CardContent>
              <BinScanner onBinScanned={handleBinScanned} />
              
              {hasSearched && (
                <div className="mt-6">
                  <BinItemsTable items={binItems} isLoading={loading} />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="camera">
          <Card>
            <CardHeader>
              <CardTitle>Camera Scan</CardTitle>
            </CardHeader>
            <CardContent>
              <CameraScanner onBinScanned={handleBinScanned} />
              
              {hasSearched && (
                <div className="mt-6">
                  <BinItemsTable items={binItems} isLoading={loading} />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BinEnquiry;

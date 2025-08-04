import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import BarcodeScanner from "@/components/common/BarcodeScanner";
import { ScanBarcode, Building2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { createERPNextAPI } from "@/services/erpnextApi";

interface WarehouseScannerProps {
  onWarehouseFound: (warehouse: any) => void;
  disabled?: boolean;
}

const WarehouseScanner = ({ onWarehouseFound, disabled = false }: WarehouseScannerProps) => {
  const [showScanner, setShowScanner] = useState(false);
  const [scanning, setScanning] = useState(false);
  const { toast } = useToast();

  const handleBarcodeScanned = async (barcode: string) => {
    try {
      setScanning(true);
      setShowScanner(false);
      
      toast({
        title: "Barcode Scanned",
        description: `Searching for warehouse with barcode: ${barcode}`,
      });
      
      const erpnextAPI = await createERPNextAPI();
      if (!erpnextAPI) {
        throw new Error('ERPNext API not available');
      }

      // Search for warehouse by barcode/code
      const response = await erpnextAPI.getWarehouses([['name', 'like', `%${barcode}%`]]);
      
      if (response?.data && response.data.length > 0) {
        const foundWarehouse = response.data[0];
        onWarehouseFound(foundWarehouse);
        
        toast({
          title: "Warehouse Found",
          description: `Found: ${foundWarehouse.warehouse_name || foundWarehouse.name}`,
        });
      } else {
        // Try searching by warehouse name if barcode search fails
        const nameResponse = await erpnextAPI.getWarehouses([['warehouse_name', 'like', `%${barcode}%`]]);
        
        if (nameResponse?.data && nameResponse.data.length > 0) {
          const foundWarehouse = nameResponse.data[0];
          onWarehouseFound(foundWarehouse);
          
          toast({
            title: "Warehouse Found",
            description: `Found: ${foundWarehouse.warehouse_name || foundWarehouse.name}`,
          });
        } else {
          toast({
            title: "No Warehouse Found",
            description: "No warehouse found with the scanned barcode.",
            variant: "destructive"
          });
        }
      }
      
    } catch (error) {
      console.error('Warehouse barcode search failed:', error);
      toast({
        title: "Search Failed",
        description: "Could not find warehouse with the scanned barcode.",
        variant: "destructive"
      });
    } finally {
      setScanning(false);
    }
  };

  if (showScanner) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <ScanBarcode className="w-5 h-5" />
            <span>Scan Warehouse Barcode</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <BarcodeScanner
            onBarcodeScanned={handleBarcodeScanned}
            onClose={() => setShowScanner(false)}
            title="Scan Warehouse Barcode"
            description="Position the barcode within the frame to scan automatically"
            isModal={false}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="text-center">
          <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">Scan Warehouse Barcode</h3>
          <p className="text-muted-foreground mb-4">Use your device camera to scan warehouse barcode</p>
          <Button
            onClick={() => setShowScanner(true)}
            className="w-full"
            disabled={disabled || scanning}
          >
            <ScanBarcode className="w-4 h-4 mr-2" />
            {scanning ? 'Searching...' : 'Start Camera'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default WarehouseScanner;
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { BinLabelData } from "../../pages/PrintLabel";
import BinScanner from "../bin-enquiry/BinScanner";
import { createERPNextAPI, getUserDefaultCompany } from "@/services/erpnextApi";
import { useToast } from "@/hooks/use-toast";

interface BinLabelFormProps {
  onGenerateLabel: (data: BinLabelData) => void;
}

const BinLabelForm = ({ onGenerateLabel }: BinLabelFormProps) => {
  const [loading, setLoading] = useState(false);
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>("");
  const { toast } = useToast();

  const handleWarehouseScanned = async (warehouseCode: string) => {
    try {
      setLoading(true);
      setSelectedWarehouse(warehouseCode);
      
      const erpnextAPI = await createERPNextAPI();
      if (!erpnextAPI) {
        toast({
          title: "ERPNext Not Configured",
          description: "Please configure your ERPNext settings in the Profile page.",
          variant: "destructive"
        });
        return;
      }

      // Get company
      const company = await getUserDefaultCompany();
      
      // Check if warehouse is a group and get descendants
      let warehousesToQuery = [warehouseCode];
      let warehouseNames: string[] = [];
      
      try {
        const warehouseDetails = await erpnextAPI.callAPI(`Warehouse/${warehouseCode}`, 'GET');
        
        if (warehouseDetails?.data?.is_group === 1) {
          // Get all descendant warehouses recursively
          const getAllWarehouses = async (parentWarehouse: string): Promise<string[]> => {
            try {
              const childrenFilters = [['parent_warehouse', '=', parentWarehouse]];
              const childrenResponse = await erpnextAPI.callAPI('Warehouse', 'GET', undefined, childrenFilters, undefined, ['name', 'warehouse_name', 'is_group']);
              
              if (childrenResponse?.data && childrenResponse.data.length > 0) {
                const childWarehouses: string[] = [];
                
                for (const warehouse of childrenResponse.data) {
                  childWarehouses.push(warehouse.name);
                  
                  if (warehouse.is_group === 1) {
                    const grandChildren = await getAllWarehouses(warehouse.name);
                    childWarehouses.push(...grandChildren);
                  }
                }
                
                return childWarehouses;
              }
              return [];
            } catch (error) {
              console.error(`Failed to get children for ${parentWarehouse}:`, error);
              return [];
            }
          };
          
          warehousesToQuery = await getAllWarehouses(warehouseCode);
          
          if (warehousesToQuery.length === 0) {
            warehousesToQuery = [warehouseCode];
          }
        }
        
        warehouseNames = warehousesToQuery;
      } catch (error) {
        console.warn('Could not check warehouse hierarchy:', error);
      }

      // Fetch bin stock details
      const filters = [['warehouse', 'in', warehousesToQuery], ['actual_qty', '>', 0]];
      const fields = ['item_code', 'warehouse', 'actual_qty', 'stock_uom'];
      
      const response = await erpnextAPI.callAPI('Bin', 'GET', undefined, filters, 200, fields);
      
      const items = response?.data?.map((item: any) => ({
        itemCode: item.item_code,
        itemName: item.item_code,
        qty: Math.round((item.actual_qty || 0) * 100) / 100,
        uom: item.stock_uom || 'Nos',
      })) || [];

      const labelData: BinLabelData = {
        warehouseId: warehouseCode,
        warehouseName: warehouseCode,
        barcode: warehouseCode,
        items: items,
        warehouses: warehouseNames,
      };
      
      onGenerateLabel(labelData);
      
      toast({
        title: "Label Generated",
        description: `Generated label for ${warehouseNames.length} warehouse(s)`,
      });
      
    } catch (error) {
      console.error('Failed to generate bin label:', error);
      toast({
        title: "Error",
        description: `Failed to generate label: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {loading && (
        <Card>
          <CardContent className="p-6 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-primary" />
            <p>Loading warehouse data...</p>
          </CardContent>
        </Card>
      )}
      
      {!loading && (
        <BinScanner 
          onBinScanned={handleWarehouseScanned}
          isLoading={loading}
        />
      )}
    </div>
  );
};

export default BinLabelForm;

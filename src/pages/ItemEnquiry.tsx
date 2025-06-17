import React, { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { PackageOpen, Search, XCircle } from "lucide-react";
import ItemScanner from '@/components/item-enquiry/ItemScanner';
import { StockBalanceItem } from '@/services/erp/erpnext/stockApi';
import { createERPNextAPI } from '@/services/erpnextApi';

const ItemEnquiry = () => {
  const [itemCode, setItemCode] = useState('');
  const [itemName, setItemName] = useState('');
  const [warehouseStock, setWarehouseStock] = useState<StockBalanceItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleItemSelect = (code: string) => {
    setItemCode(code);
  };

  useEffect(() => {
    if (itemCode) {
      loadItemStock(itemCode);
    }
  }, [itemCode]);

  const loadItemStock = async (itemCode: string) => {
    setLoading(true);
    setError(null);
    setWarehouseStock([]);

    if (!itemCode) {
      setError('Please select or scan an item.');
      setLoading(false);
      return;
    }

    try {
      const erpnextAPI = await createERPNextAPI();
      if (!erpnextAPI) {
        setError('ERPNext API not configured. Please configure in Profile.');
        setLoading(false);
        return;
      }

      // Get stock balance with proper filters
      const stockResult = await erpnextAPI.getStockBalance({ item_code: itemCode });
      
      if (stockResult.success && stockResult.data) {
        setWarehouseStock(stockResult.data);
      } else {
        setWarehouseStock([]);
        setError('No stock found for this item');
      }
    } catch (error) {
      setError(`Failed to load stock: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-3">
          <PackageOpen className="w-6 h-6 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900">Item Stock Enquiry</h1>
        </div>

        {/* Item Selection */}
        <ItemScanner onItemSelect={handleItemSelect} />

        {/* Display Item Code and Name */}
        {itemCode && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center space-x-2">
                <Search className="w-5 h-5" />
                <span>Item Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Item Code</Label>
                <Input value={itemCode} disabled className="bg-gray-100" />
              </div>
              {itemName && (
                <div className="space-y-2">
                  <Label>Item Name</Label>
                  <Input value={itemName} disabled className="bg-gray-100" />
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Display Stock Information */}
        {itemCode && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center space-x-2">
                <PackageOpen className="w-5 h-5" />
                <span>Warehouse Stock</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {error && (
                <Alert variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              {loading ? (
                <div className="text-center py-4">Loading stock information...</div>
              ) : warehouseStock.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Warehouse</th>
                        <th className="text-right p-2">Projected Qty</th>
                        <th className="text-right p-2">Actual Qty</th>
                      </tr>
                    </thead>
                    <tbody>
                      {warehouseStock.map((stock) => (
                        <tr key={stock.warehouse} className="border-b hover:bg-gray-50">
                          <td className="p-2 font-medium">{stock.warehouse}</td>
                          <td className="p-2 text-right">{stock.projected_qty}</td>
                          <td className="p-2 text-right">{stock.actual_qty || 0}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : !error ? (
                <div className="text-center py-4 text-gray-500">No stock information available for this item.</div>
              ) : null}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ItemEnquiry;

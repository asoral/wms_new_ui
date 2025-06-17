import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { PackageOpen, Search, XCircle, Loader2, MapPin } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableRow,
} from "@/components/ui/table"
import { createERPNextAPI } from '@/services/erpnextApi';
import BinScanner from '@/components/bin-enquiry/BinScanner';

interface BinItem {
  item_code: string;
  warehouse: string;
  actual_qty: number;
  reserved_qty: number;
  available_qty: number;
  valuation_rate: number;
  stock_value: number;
}

const BinEnquiry = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [binCode, setBinCode] = useState('');
  const [binItems, setBinItems] = useState<BinItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleBack = () => {
    navigate('/');
  };

  const loadBinStock = async (binCode: string) => {
    setBinItems([]);
    setLoading(true);
    setError(null);

    if (!binCode) {
      setError('Please enter a warehouse/bin code.');
      setLoading(false);
      return;
    }

    try {
      const erpnextAPI = await createERPNextAPI();
      if (!erpnextAPI) {
        toast({
          title: "ERPNext Not Configured",
          description: "Please configure your ERPNext settings.",
          variant: "destructive"
        });
        return;
      }

      // Get warehouse stock using the correct method signature
      const warehouseStockResult = await erpnextAPI.stockApi.getWarehouseStockBalance(binCode);
      
      if (warehouseStockResult.success && warehouseStockResult.data) {
        setBinItems(warehouseStockResult.data);
      } else {
        setBinItems([]);
        setError('No stock found in this warehouse/bin');
      }
    } catch (error: any) {
      console.error('Error fetching bin stock:', error);
      setError(error.message || 'Failed to fetch bin stock');
      toast({
        title: "Error",
        description: error.message || 'Failed to fetch bin stock',
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <MapPin className="w-6 h-6 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">Bin / Warehouse Enquiry</h1>
          </div>
          <Button variant="outline" onClick={handleBack}>
            Back to Menu
          </Button>
        </div>

        {/* Bin Scanner & Input */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center space-x-2">
              <Search className="w-5 h-5" />
              <span>Warehouse / Bin Code</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <BinScanner 
              onBinScanned={(code) => {
                setBinCode(code);
                loadBinStock(code);
              }}
              isLoading={loading}
            />
          </CardContent>
        </Card>

        {/* Stock Information */}
        {binItems.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center space-x-2">
                <PackageOpen className="w-5 h-5" />
                <span>Stock Information for {binCode}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableCaption>Stock levels in the selected bin/warehouse</TableCaption>
                <TableHead>
                  <TableRow>
                    <TableHead className="text-left">Item Code</TableHead>
                    <TableHead className="text-right">Available Quantity</TableHead>
                    <TableHead className="text-right">Reserved Quantity</TableHead>
                    <TableHead className="text-right">Actual Quantity</TableHead>
                    <TableHead className="text-right">Valuation Rate</TableHead>
                    <TableHead className="text-right">Stock Value</TableHead>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {binItems.map((item) => (
                    <TableRow key={item.item_code}>
                      <TableCell className="font-medium">{item.item_code}</TableCell>
                      <TableCell className="text-right">{item.available_qty}</TableCell>
                      <TableCell className="text-right">{item.reserved_qty}</TableCell>
                      <TableCell className="text-right">{item.actual_qty}</TableCell>
                      <TableCell className="text-right">₹{item.valuation_rate}</TableCell>
                      <TableCell className="text-right">₹{item.stock_value}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Error & Loading States */}
        {loading && (
          <Alert variant="secondary">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            <strong>Loading...</strong> Fetching stock information.
          </Alert>
        )}

        {error && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4 mr-2" />
            <strong>Error!</strong> {error}
          </Alert>
        )}

        {binItems.length === 0 && !loading && !error && binCode && (
          <Alert variant="info">
            <Search className="h-4 w-4 mr-2" />
            No stock information found for bin code: <strong>{binCode}</strong>.
          </Alert>
        )}
      </div>
    </div>
  );
};

export default BinEnquiry;

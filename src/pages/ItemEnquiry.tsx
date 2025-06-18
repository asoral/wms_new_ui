import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Search, Package, Warehouse } from "lucide-react";
import { useNavigate } from 'react-router-dom';
import { createERPNextAPI, getUserDefaultCompany } from '@/services/erpnextApi';
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import Layout from '@/components/Layout';

export interface StockData {
  warehouse: string;
  actual_qty: number;
  reserved_qty: number;
  projected_qty: number;
}

export interface StockInfo {
  warehouse: string;
  actual_qty: number;
  reserved_qty: number;
  projected_qty: number;
}

const ItemEnquiry = () => {
  const [itemCode, setItemCode] = useState('');
  const [itemName, setItemName] = useState('');
  const [stockData, setStockData] = useState<StockData[]>([]);
	const [stockInfo, setStockInfo] = useState<StockInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [company, setCompany] = useState<string | null>(null);
  const [availableCompanies, setAvailableCompanies] = useState<string[]>([]);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    loadUserDefaultCompany();
    loadAvailableCompanies();
  }, []);

  const loadUserDefaultCompany = async () => {
    try {
      const defaultCompany = await getUserDefaultCompany();
      setCompany(defaultCompany);
    } catch (error) {
      console.error("Error loading default company:", error);
      toast({
        title: "Error",
        description: "Failed to load default company.",
        variant: "destructive",
      });
    }
  };

  const loadAvailableCompanies = async () => {
    try {
      const erpnextAPI = await createERPNextAPI();
      if (!erpnextAPI) {
        toast({
          title: "ERPNext Not Configured",
          description: "Please configure ERPNext settings in the Profile page.",
          variant: "destructive",
        });
        return;
      }

      const companiesResult = await erpnextAPI.getCompanies();
      if (companiesResult.data) {
        setAvailableCompanies(companiesResult.data.map((c: any) => c.name));
      }
    } catch (error) {
      console.error("Error loading available companies:", error);
      toast({
        title: "Error",
        description: "Failed to load available companies.",
        variant: "destructive",
      });
    }
  };

  const handleSearch = async () => {
    if (!itemCode) {
      toast({
        title: "Error",
        description: "Please enter an item code.",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      const erpnextAPI = await createERPNextAPI();
      if (!erpnextAPI) {
        toast({
          title: "ERPNext Not Configured",
          description: "Please configure ERPNext settings in the Profile page.",
          variant: "destructive",
        });
        return;
      }

      // Fetch item details
      const itemDetails = await erpnextAPI.getItemDetails(itemCode);
      if (itemDetails.data) {
        setItemName(itemDetails.data.item_name);
      } else {
        setItemName('Item not found');
        setStockData([]);
        return;
      }

      // Fetch stock balance for the item
      const stockBalance = await erpnextAPI.getStockBalance(itemCode);
			if (stockBalance.data) {
        // Transform the data to match the StockData interface
        const transformedStockData: StockData[] = stockBalance.data.map((item: any) => ({
          warehouse: item.warehouse,
          actual_qty: item.actual_qty,
          reserved_qty: item.reserved_qty,
          projected_qty: item.projected_qty,
        }));
        setStockData(transformedStockData);
      } else {
        setStockData([]);
      }
    } catch (error) {
      console.error("Error fetching item details:", error);
      toast({
        title: "Error",
        description: "Failed to fetch item details from ERPNext",
        variant: "destructive",
      });
      setItemName('Error fetching item');
      setStockData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleItemSelect = (selectedItemCode: string) => {
    setItemCode(selectedItemCode);
  };

  return (
    <Layout>
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Package className="w-6 h-6 mr-2 text-blue-600" />
            <h1 className="text-2xl font-bold">Item Enquiry</h1>
          </div>
          <Button variant="outline" onClick={() => navigate('/')}>
            Back to Dashboard
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Search Item</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="itemCode">Item Code</Label>
                <Input
                  id="itemCode"
                  placeholder="Enter item code"
                  value={itemCode}
                  onChange={(e) => setItemCode(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="company">Company</Label>
                <Select value={company} onValueChange={setCompany}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select company" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableCompanies.map((companyName) => (
                      <SelectItem key={companyName} value={companyName}>
                        {companyName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button onClick={handleSearch} disabled={loading}>
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <Search className="w-4 h-4 mr-2" />
              )}
              Search
            </Button>
          </CardContent>
        </Card>

        {itemName && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Item Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-lg font-semibold">{itemName}</p>
                {loading ? (
                  <div className="space-y-3">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                ) : stockData.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="py-3 px-4 text-left font-semibold text-sm text-gray-600">Warehouse</th>
                          <th className="py-3 px-4 text-left font-semibold text-sm text-gray-600">Actual Qty</th>
                          <th className="py-3 px-4 text-left font-semibold text-sm text-gray-600">Reserved Qty</th>
                          <th className="py-3 px-4 text-left font-semibold text-sm text-gray-600">Projected Qty</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stockData.map((stock, index) => (
                          <tr key={index} className="border-b hover:bg-gray-50">
                            <td className="py-3 px-4">{stock.warehouse}</td>
                            <td className="py-3 px-4">{stock.actual_qty}</td>
                            <td className="py-3 px-4">{stock.reserved_qty}</td>
                            <td className="py-3 px-4">{stock.projected_qty}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <Warehouse className="w-10 h-10 mx-auto text-gray-400" />
                    <p className="text-gray-500">No stock information found for this item.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default ItemEnquiry;

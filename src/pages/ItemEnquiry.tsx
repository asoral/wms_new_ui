import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, Warehouse, Search, TrendingUp, AlertTriangle, Calendar, DollarSign } from "lucide-react";
import { createERPNextAPI, getUserDefaultCompany } from "@/services/erpnextApi";
import { useToast } from "@/hooks/use-toast";
import ItemScanner from "../components/item-enquiry/ItemScanner";

interface StockItem {
  itemCode: string;
  itemName: string;
  warehouse: string;
  qty: number;
  uom: string;
  valuation: number;
  age: number;
  batch?: string;
  serial?: string;
  binLocation?: string;
}

const ItemEnquiry = () => {
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState<string>("");
  const [companyCurrency, setCompanyCurrency] = useState<string>("INR");
  const { toast } = useToast();

  const loadItemStock = async (itemCode: string) => {
    try {
      setLoading(true);
      setSelectedItem(itemCode);
      
      const erpnextAPI = await createERPNextAPI();
      if (!erpnextAPI) {
        toast({
          title: "ERPNext Not Configured",
          description: "Please configure your ERPNext settings in the Profile page.",
          variant: "destructive"
        });
        return;
      }

      // Get company currency
      const company = await getUserDefaultCompany();
      if (company) {
        try {
          // Use the company API to get company details
          const companiesResult = await erpnextAPI.getCompanies();
          const companyData = companiesResult.data?.find(c => c.name === company);
          if (companyData) {
            setCompanyCurrency("INR"); // Default currency, can be enhanced later
          }
        } catch (error) {
          console.error('Failed to fetch company currency:', error);
        }
      }

      // Fetch item stock details
      const response = await erpnextAPI.getBinStock(itemCode);
      console.log('Item stock response:', response);

      if (response?.data) {
        // Transform the data to match our StockItem interface
        const transformedItems: StockItem[] = response.data
          .filter((item: any) => (item.actual_qty || 0) > 0) // Filter out zero stock items
          .map((item: any) => {
            const actualQty = Math.round((item.actual_qty || 0) * 100) / 100;
            const valuationRate = item.valuation_rate || 0;
            const stockValue = item.stock_value || 0;
            
            // Use stock_value if available, otherwise calculate from qty * rate
            let totalValuation = stockValue;
            if (!stockValue && valuationRate && actualQty > 0) {
              totalValuation = Math.round(actualQty * valuationRate * 100) / 100;
            }

            return {
              itemCode: item.item_code,
              itemName: item.item_name || item.item_code,
              warehouse: item.warehouse,
              qty: actualQty,
              uom: 'Nos',
              valuation: totalValuation,
              age: Math.floor(Math.random() * 120), // Placeholder
              binLocation: item.warehouse
            };
          });
        setStockItems(transformedItems);
      } else {
        setStockItems([]);
      }

    } catch (error) {
      console.error('Failed to load item stock:', error);
      toast({
        title: "Error",
        description: "Failed to load item stock from ERPNext",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: companyCurrency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const getAgeColor = (age: number) => {
    if (age <= 30) return "bg-green-100 text-green-800";
    if (age <= 60) return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  };

  const totalItems = stockItems.length;
  const totalQty = Math.round(stockItems.reduce((sum, item) => sum + item.qty, 0) * 100) / 100;
  const totalValuation = Math.round(stockItems.reduce((sum, item) => sum + item.valuation, 0) * 100) / 100;

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center space-x-2">
          <Package className="w-6 h-6" />
          <span>Item Enquiry</span>
        </h1>
        <p className="text-gray-500">Check the stock levels of a specific item.</p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Search className="w-5 h-5" />
            <span>Select Item</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ItemScanner 
            onBarcodeScanned={loadItemStock}
            isLoading={loading}
          />
        </CardContent>
      </Card>

      {selectedItem && (
        <>
          {/* Summary Cards - Colorful like Deliver Screen */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5" />
                <span>Item Summary - {selectedItem}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-blue-600 mb-1">Total Locations</p>
                        <p className="text-2xl font-bold text-blue-600">{totalItems}</p>
                      </div>
                      <Calendar className="w-8 h-8 text-blue-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-green-50 border-green-200">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-green-600 mb-1">Total Quantity</p>
                        <p className="text-2xl font-bold text-green-600">{totalQty}</p>
                      </div>
                      <Package className="w-8 h-8 text-green-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-yellow-50 border-yellow-200">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-yellow-600 mb-1">Total Value</p>
                        <p className="text-2xl font-bold text-yellow-600">{formatCurrency(totalValuation)}</p>
                      </div>
                      <DollarSign className="w-8 h-8 text-yellow-600" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>

          {/* Stock Items Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Warehouse className="w-5 h-5" />
                <span>Stock of {selectedItem}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p>Loading item stock...</p>
                </div>
              ) : stockItems.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p>No stock found for this item.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Mobile View */}
                  <div className="md:hidden space-y-4">
                    {stockItems.map((item, index) => (
                      <Card key={index} className="border-l-4 border-l-green-500">
                        <CardContent className="p-4">
                          <div className="space-y-3">
                            <div className="flex justify-between items-start">
                              <div>
                                <h3 className="font-semibold text-lg">{item.itemName}</h3>
                                <p className="text-gray-600 text-sm">Warehouse: {item.warehouse}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-xl font-bold text-green-600">{item.qty}</p>
                                <p className="text-sm text-gray-600">{item.uom}</p>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="text-gray-600">Age:</span>
                                <div className="mt-1">
                                  <Badge className={getAgeColor(item.age)}>
                                    {item.age} days
                                  </Badge>
                                </div>
                              </div>
                              <div>
                                <span className="text-gray-600">Valuation:</span>
                                <p className="font-semibold mt-1">{formatCurrency(item.valuation)}</p>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {/* Desktop View */}
                  <div className="hidden md:block">
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left p-3 font-medium text-gray-700">Item Name</th>
                            <th className="text-left p-3 font-medium text-gray-700">Warehouse</th>
                            <th className="text-right p-3 font-medium text-gray-700">Quantity</th>
                            <th className="text-left p-3 font-medium text-gray-700">UOM</th>
                            <th className="text-right p-3 font-medium text-gray-700">Age (Days)</th>
                            <th className="text-right p-3 font-medium text-gray-700">Valuation</th>
                          </tr>
                        </thead>
                        <tbody>
                          {stockItems.map((item, index) => (
                            <tr key={index} className="border-b hover:bg-gray-50">
                              <td className="p-3">
                                <div className="flex items-center space-x-2">
                                  <Package className="w-4 h-4 text-gray-500" />
                                  <span className="font-medium">{item.itemName}</span>
                                </div>
                              </td>
                              <td className="p-3 text-gray-600">{item.warehouse}</td>
                              <td className="p-3 text-right font-semibold">{item.qty}</td>
                              <td className="p-3">{item.uom}</td>
                              <td className="p-3 text-right">
                                <Badge className={getAgeColor(item.age)}>
                                  {item.age} days
                                </Badge>
                              </td>
                              <td className="p-3 text-right font-semibold">
                                {formatCurrency(item.valuation)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {!loading && !selectedItem && (
        <Card>
          <CardContent className="text-center py-8">
            <Package className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-500">Select an item to view its stock levels.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ItemEnquiry;

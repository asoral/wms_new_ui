import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Package, Warehouse, Search, TrendingUp, AlertTriangle, Calendar, DollarSign, FileSpreadsheet, FileText } from "lucide-react";
import { createERPNextAPI, getUserDefaultCompany } from "@/services/erpnextApi";
import { useToast } from "@/hooks/use-toast";
import BinScanner from "../components/bin-enquiry/BinScanner";
import { exportBinEnquiryToExcel, exportBinEnquiryToPDF } from "@/utils/exportUtils";

export interface BinItem {
  item_code: string;
  item_name: string;
  actual_qty: number;
  valuation_rate: number;
  warehouse: string;
  bin: string;
  itemCode?: string;
  itemName?: string;
  qty?: number;
  uom?: string;
  age?: number;
  valuation?: number;
  batch?: string;
  serial?: string;
}

const BinEnquiry = () => {
  const [binItems, setBinItems] = useState<BinItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedBin, setSelectedBin] = useState<string>("");
  const [companyCurrency, setCompanyCurrency] = useState<string>("INR");
  const { toast } = useToast();

  const loadBinItems = async (binCode: string) => {
    try {
      setLoading(true);
      setSelectedBin(binCode);
      
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

      // Check if the selected warehouse is a group warehouse
      let warehousesToQuery = [binCode];
      
      try {
        const warehouseDetails = await erpnextAPI.callAPI(`Warehouse/${binCode}`, 'GET');
        console.log('Warehouse details:', warehouseDetails);
        
        if (warehouseDetails?.data?.is_group === 1) {
          console.log('Selected warehouse is a group, fetching descendant warehouses');
          // Get descendant warehouses using Frappe's method
          const descendantsResponse = await fetch(`${erpnextAPI.getBaseURL}/api/method/frappe.utils.nestedset.get_descendants_of`, {
            method: 'POST',
            headers: {
              'Authorization': `token ${erpnextAPI.getApiKey}:${erpnextAPI.getApiSecret}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              doctype: 'Warehouse',
              name: binCode,
              include_self: false // Exclude the group warehouse itself
            })
          });
          
          if (descendantsResponse.ok) {
            const descendantsResult = await descendantsResponse.json();
            console.log('Descendant warehouses:', descendantsResult);
            if (descendantsResult?.message && descendantsResult.message.length > 0) {
              warehousesToQuery = descendantsResult.message;
            }
          }
        }
      } catch (error) {
        console.warn('Could not check warehouse hierarchy:', error);
        // Continue with original warehouse if hierarchy check fails
      }

      console.log('Final warehouses to query:', warehousesToQuery);

      // Fetch bin stock details from Bin doctype for all warehouses
      const filters = [['warehouse', 'in', warehousesToQuery], ['actual_qty', '>', 0]];
      const fields = [
        'name',
        'item_code', 
        'warehouse',
        'actual_qty',
        'reserved_qty',
        'planned_qty',
        'valuation_rate',
        'stock_value'
      ];
      const response = await erpnextAPI.callAPI('Bin', 'GET', undefined, filters, undefined, fields);
      console.log('Bin stock response:', response);

      if (response?.data) {
        // Transform the data to match our BinItem interface with proper item names
        const transformedItems: BinItem[] = await Promise.all(
          response.data
            .filter((item: any) => {
              const actualQty = item.actual_qty || 0;
              return actualQty > 0; // Only show items with positive stock
            })
            .map(async (item: any) => {
              // Get item details to fetch item name
              let itemName = item.item_name || item.item_code;
              try {
                const itemDetails = await erpnextAPI.getItemDetails(item.item_code);
                if (itemDetails?.data?.item_name) {
                  itemName = itemDetails.data.item_name;
                }
              } catch (error) {
                console.error('Failed to fetch item name for:', item.item_code);
              }

              // Calculate quantities and valuation properly
              const actualQty = Math.round((item.actual_qty || 0) * 100) / 100;
              const valuationRate = item.valuation_rate || 0;
              const stockValue = item.stock_value || 0;
              
              // Use stock_value if available, otherwise calculate from qty * rate
              let totalValuation = stockValue;
              if (!stockValue && valuationRate && actualQty > 0) {
                totalValuation = Math.round(actualQty * valuationRate * 100) / 100;
              }

              return {
                item_code: item.item_code,
                item_name: itemName,
                actual_qty: actualQty,
                valuation_rate: valuationRate,
                warehouse: item.warehouse,
                bin: item.warehouse,
                itemCode: item.item_code,
                itemName: itemName,
                qty: actualQty,
                uom: 'Nos',
                age: Math.floor(Math.random() * 120), // Placeholder
                valuation: totalValuation
              };
            })
        );
        
        // Sort items by item code
        const sortedItems = transformedItems.sort((a, b) => 
          a.item_code.localeCompare(b.item_code)
        );
        
        setBinItems(sortedItems);
      } else {
        setBinItems([]);
      }

    } catch (error) {
      console.error('Failed to load bin items:', error);
      toast({
        title: "Error",
        description: "Failed to load bin items from ERPNext",
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

  const handleExportExcel = () => {
    if (binItems.length === 0 || !selectedBin) {
      toast({
        title: "No Data",
        description: "No data available to export",
        variant: "destructive"
      });
      return;
    }

    const success = exportBinEnquiryToExcel(binItems, selectedBin);
    if (success) {
      toast({
        title: "Export Successful",
        description: "Data exported to Excel successfully",
      });
    } else {
      toast({
        title: "Export Failed",
        description: "Failed to export data to Excel",
        variant: "destructive"
      });
    }
  };

  const handleExportPDF = () => {
    if (binItems.length === 0 || !selectedBin) {
      toast({
        title: "No Data",
        description: "No data available to export",
        variant: "destructive"
      });
      return;
    }

    const success = exportBinEnquiryToPDF(binItems, selectedBin);
    if (success) {
      toast({
        title: "Export Successful",
        description: "Data exported to PDF successfully",
      });
    } else {
      toast({
        title: "Export Failed",
        description: "Failed to export data to PDF",
        variant: "destructive"
      });
    }
  };

  const getAgeColor = (age: number) => {
    if (age <= 30) return "bg-green-100 text-green-800";
    if (age <= 60) return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  };

  const totalItems = binItems.length;
  const totalQty = Math.round(binItems.reduce((sum, item) => sum + (item.qty || 0), 0) * 100) / 100;
  const totalValuation = Math.round(binItems.reduce((sum, item) => sum + (item.valuation || 0), 0) * 100) / 100;

  return (
    <div className="w-full max-w-7xl mx-auto py-4 md:py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center space-x-2">
          <Package className="w-6 h-6" />
          <span>Bin Enquiry</span>
        </h1>
        <p className="text-gray-500">Check the items in a specific bin or warehouse.</p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Search className="w-5 h-5" />
            <span>Select Bin/Warehouse</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <BinScanner 
            onBinScanned={loadBinItems}
            isLoading={loading}
          />
        </CardContent>
      </Card>

      {selectedBin && (
        <>
          {/* Summary Cards - Colorful like Deliver Screen */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5" />
                <span>Bin Summary - {selectedBin}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-blue-600 mb-1">Total Items</p>
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

          {/* Items Table */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <Warehouse className="w-5 h-5" />
                  <span>Items in {selectedBin}</span>
                </CardTitle>
                {binItems.length > 0 && (
                  <div className="flex items-center space-x-2">
                    <Button
                      onClick={handleExportExcel}
                      variant="outline"
                      size="sm"
                      className="flex items-center space-x-2"
                    >
                      <FileSpreadsheet className="w-4 h-4" />
                      <span>Excel</span>
                    </Button>
                    <Button
                      onClick={handleExportPDF}
                      variant="outline"
                      size="sm"
                      className="flex items-center space-x-2"
                    >
                      <FileText className="w-4 h-4" />
                      <span>PDF</span>
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p>Loading bin items...</p>
                </div>
              ) : binItems.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p>No items found in this bin.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Mobile View */}
                  <div className="md:hidden space-y-4">
                    {binItems.map((item, index) => (
                      <Card key={index} className="border-l-4 border-l-green-500">
                        <CardContent className="p-4">
                          <div className="space-y-3">
                            <div className="flex justify-between items-start">
                              <div>
                                <h3 className="font-semibold text-lg">{item.item_name}</h3>
                                <p className="text-gray-600 text-sm">{item.item_code}</p>
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
                                  <Badge className={getAgeColor(item.age || 0)}>
                                    {item.age} days
                                  </Badge>
                                </div>
                              </div>
                              <div>
                                <span className="text-gray-600">Valuation:</span>
                                <p className="font-semibold mt-1">{formatCurrency(item.valuation || 0)}</p>
                              </div>
                            </div>

                            {(item.batch || item.serial) && (
                              <div className="flex flex-wrap gap-2">
                                {item.batch && (
                                  <Badge variant="outline">
                                    Batch: {item.batch}
                                  </Badge>
                                )}
                                {item.serial && (
                                  <Badge variant="outline">
                                    Serial: {item.serial}
                                  </Badge>
                                )}
                              </div>
                            )}
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
                            <th className="text-left p-3 font-medium text-gray-700">Item Code</th>
                            <th className="text-right p-3 font-medium text-gray-700">Quantity</th>
                            <th className="text-left p-3 font-medium text-gray-700">UOM</th>
                            <th className="text-right p-3 font-medium text-gray-700">Age (Days)</th>
                            <th className="text-right p-3 font-medium text-gray-700">Valuation</th>
                          </tr>
                        </thead>
                        <tbody>
                          {binItems.map((item, index) => (
                            <tr key={index} className="border-b hover:bg-gray-50">
                              <td className="p-3">
                                <div className="flex items-center space-x-2">
                                  <Package className="w-4 h-4 text-gray-500" />
                                  <span className="font-medium">{item.item_name}</span>
                                </div>
                              </td>
                              <td className="p-3 text-gray-600">{item.item_code}</td>
                              <td className="p-3 text-right font-semibold">{item.qty}</td>
                              <td className="p-3">{item.uom}</td>
                              <td className="p-3 text-right">
                                <Badge className={getAgeColor(item.age || 0)}>
                                  {item.age} days
                                </Badge>
                              </td>
                              <td className="p-3 text-right font-semibold">
                                {formatCurrency(item.valuation || 0)}
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

      {!loading && !selectedBin && (
        <Card>
          <CardContent className="text-center py-8">
            <Warehouse className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-500">Select a bin or warehouse to view its items.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default BinEnquiry;

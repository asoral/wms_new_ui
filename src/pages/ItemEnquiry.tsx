
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Package, Warehouse, TrendingUp, AlertTriangle, DollarSign, Download, FileSpreadsheet, FileText, Eye, EyeOff, ShoppingCart, Truck, Lock } from "lucide-react";
import { createERPNextAPI, getUserDefaultCompany } from "@/services/erpnextApi";
import { useToast } from "@/hooks/use-toast";
import { usePermissions } from "@/hooks/usePermissions";
import { Item } from "@/types";
import ItemScanner from "@/components/item-enquiry/ItemScanner";
import { exportItemEnquiryToExcel, exportItemEnquiryToPDF } from "@/utils/exportUtils";

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
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [companyCurrency, setCompanyCurrency] = useState<string>("INR");
  const [totalPOQty, setTotalPOQty] = useState<number>(0);
  const [totalSOQty, setTotalSOQty] = useState<number>(0);
  const [loadingPOSO, setLoadingPOSO] = useState(false);
  const [showUnauthorizedDialog, setShowUnauthorizedDialog] = useState(false);
  
  const { toast } = useToast();
  const { hasPermission } = usePermissions();

  const loadItemStock = async (item: Item) => {
    const code = item.item_code;
      console.log('=== loadItemStock called with item:', item);
      console.log('Item code:', code);
    
    if (!code || !code.trim()) {
      console.error('No item code provided');
      toast({
        title: "Error",
        description: "Please enter an item code",
        variant: "destructive"
      });
      return;
    }

    try {
      console.log('Starting stock loading process...');
      setLoading(true);
      setSelectedItem(item);
      
      console.log('Creating ERPNext API connection...');
      const erpnextAPI = await createERPNextAPI();
      if (!erpnextAPI) {
        toast({
          title: "ERPNext Not Configured",
          description: "Please configure your ERPNext settings in the Profile page.",
          variant: "destructive"
        });
        return;
      }

      // Get user's default company
      const company = await getUserDefaultCompany();
      console.log('User default company:', company);
      
      if (!company) {
        toast({
          title: "No Default Company",
          description: "Please set your default company in the Profile page.",
          variant: "destructive"
        });
        return;
      }

      // Get company currency
      try {
        const companiesResult = await erpnextAPI.getCompanies();
        const companyData = companiesResult.data?.find(c => c.name === company);
        if (companyData) {
          setCompanyCurrency(companyData.default_currency || "INR");
        }
      } catch (error) {
        console.error('Failed to fetch company currency:', error);
      }

      // Get item details to check if it has variants
      let itemDetails = null;
      try {
        const itemDetailResponse = await erpnextAPI.getItemDetails(code);
        itemDetails = itemDetailResponse?.data;
        console.log('Item details for', code, ':', itemDetails);
        console.log('Has variants:', itemDetails?.has_variants);
      } catch (error) {
        console.warn('Could not fetch item details:', error);
      }

      // Determine which items to fetch stock for
      let itemCodesToFetch = [code];
      
      if (itemDetails?.has_variants === 1) {
        console.log('Item has variants, fetching all variant stock');
        // Fetch all items where variant_of equals this item code
        try {
          const variantResponse = await erpnextAPI.itemsAPI.getItemVariants(code);
          console.log('Variant API response:', variantResponse);
          if (variantResponse?.data && variantResponse.data.length > 0) {
            itemCodesToFetch = variantResponse.data.map((item: any) => item.item_code);
            console.log('Found variants:', itemCodesToFetch);
          } else {
            console.log('No variants found, using template item only');
          }
        } catch (error) {
          console.warn('Could not fetch item variants:', error);
          // Continue with original item if variants fetch fails
        }
      }

      // Fetch stock for all items (original or variants)
      console.log('=== FETCHING STOCK FOR ITEMS ===');
      console.log('Items to fetch:', itemCodesToFetch);
      console.log('Company:', company);
      let allStockData: any[] = [];
      
      for (const itemCode of itemCodesToFetch) {
        try {
          console.log(`--- Fetching stock for item: ${itemCode} in company: ${company} ---`);
          const response = await erpnextAPI.stockAPI.getBinStockForCompany(itemCode, company);
          console.log(`Stock API response for ${itemCode}:`, response);
          
          if (response?.data && response.data.length > 0) {
            console.log(`✓ Found ${response.data.length} stock entries for ${itemCode}`);
            allStockData = [...allStockData, ...response.data];
          } else {
            console.log(`✗ No stock data found for ${itemCode}`);
            console.log('Response structure:', response);
          }
        } catch (error) {
          console.error(`❌ Failed to fetch stock for item ${itemCode}:`, error);
        }
      }
      
      console.log('=== COMBINED STOCK DATA ===');
      console.log('Total stock entries found:', allStockData.length);
      console.log('Combined stock data:', allStockData);
      
      console.log('Combined stock response:', allStockData);

      if (allStockData && allStockData.length > 0) {
        // Get stock ledger entries for accurate valuation
        const warehouses = allStockData.map((item: any) => item.warehouse);
        console.log('Fetching stock ledger for warehouses:', warehouses);
        
        let stockLedgerData: any[] = [];
        for (const itemCode of itemCodesToFetch) {
          try {
            const stockLedgerResponse = await erpnextAPI.stockAPI.getStockLedgerEntries(itemCode, warehouses);
            if (stockLedgerResponse?.data) {
              stockLedgerData = [...stockLedgerData, ...stockLedgerResponse.data];
            }
          } catch (error) {
            console.warn(`Could not fetch stock ledger entries for ${itemCode}:`, error);
          }
        }
        console.log('Stock ledger entries:', stockLedgerData);

        console.log('All stock data before filtering:', allStockData);
        console.log('=== FILTERING STOCK DATA ===');
        allStockData.forEach((item, index) => {
          console.log(`Item ${index}:`, {
            warehouse: item.warehouse,
            actual_qty: item.actual_qty,
            projected_qty: item.projected_qty,
            item_code: item.item_code
          });
        });
        
        console.log('=== TRANSFORMING STOCK DATA ===');
        console.log('Raw stock data before transformation:', allStockData);
        
        const transformedItems: StockItem[] = allStockData
          .filter((item: any) => {
            const actualQty = item.actual_qty || 0;
            const shouldInclude = actualQty > 0;
            console.log(`FILTER: ${item.warehouse} - actual_qty=${actualQty}, include=${shouldInclude}, item:`, item);
            return shouldInclude;
          })
          .map((item: any) => {
            const actualQty = Math.round((item.actual_qty || 0) * 100) / 100;
            
            // Try to get valuation rate from stock ledger
            let valuationRate = 0;
            let totalValuation = 0;
            
            // Find the latest stock ledger entry for this warehouse and item
            const warehouseLedgerEntries = stockLedgerData
              .filter((entry: any) => entry.warehouse === item.warehouse && entry.item_code === item.item_code)
              .sort((a: any, b: any) => {
                const dateA = new Date(a.posting_date + ' ' + (a.posting_time || '00:00:00'));
                const dateB = new Date(b.posting_date + ' ' + (b.posting_time || '00:00:00'));
                return dateB.getTime() - dateA.getTime();
              });

            if (warehouseLedgerEntries.length > 0) {
              const latestEntry = warehouseLedgerEntries[0];
              valuationRate = latestEntry.valuation_rate || 0;
              console.log(`Latest valuation rate for ${item.warehouse}:`, valuationRate);
            }

            // Fallback to item details if no stock ledger data
            if (!valuationRate && itemDetails) {
              valuationRate = itemDetails.standard_rate || itemDetails.valuation_rate || 0;
              console.log(`Fallback valuation rate from item details:`, valuationRate);
            }

            if (valuationRate && actualQty > 0) {
              totalValuation = Math.round(actualQty * valuationRate * 100) / 100;
            }

            console.log(`Item: ${item.item_code}, Warehouse: ${item.warehouse}, Qty: ${actualQty}, Rate: ${valuationRate}, Total: ${totalValuation}`);

            // Calculate age from bin creation date
            let age = 1; // Default to at least 1 day
            if (item.creation) {
              const creationDate = new Date(item.creation);
              const today = new Date();
              const diffTime = Math.abs(today.getTime() - creationDate.getTime());
              age = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
            }

            // Get item name from details if we have it, or try to fetch it
            let itemName = item.item_code;
            if (itemDetails && item.item_code === code) {
              itemName = itemDetails.item_name || item.item_code;
            } else {
              // For variants, try to get item name from API
              itemName = item.item_name || item.item_code;
            }

            return {
              itemCode: item.item_code,
              itemName: itemName,
              warehouse: item.warehouse,
              qty: actualQty,
              uom: itemDetails?.stock_uom || item.stock_uom || 'Nos',
              valuation: totalValuation,
              age: age,
              binLocation: item.warehouse
            };
          })
          .sort((a, b) => a.itemCode.localeCompare(b.itemCode)); // Sort by item code
          
        setStockItems(transformedItems);
        
        if (transformedItems.length === 0) {
          toast({
            title: "No Stock Found",
            description: `No stock found for item: ${code} in company: ${company}`,
            variant: "destructive"
          });
        } else {
          const itemType = itemDetails?.has_variants === 1 ? 'template item and its variants' : 'item';
          toast({
            title: "Stock Loaded",
            description: `Found stock in ${transformedItems.length} locations for ${itemType}: ${code}`,
          });
        }

        // Fetch PO and SO quantities
        await fetchPOSOQuantities(itemCodesToFetch, company);
      } else {
        setStockItems([]);
        toast({
          title: "No Data",
          description: `No stock data available for item: ${code} in company: ${company}`,
          variant: "destructive"
        });
      }

    } catch (error) {
      console.error('Failed to load item stock:', error);
      toast({
        title: "Error",
        description: `Failed to load item stock: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setSelectedItem(null);
    setStockItems([]);
    setTotalPOQty(0);
    setTotalSOQty(0);
  };

  const canViewValuations = hasPermission('view_valuations');

  const handleToggleValuationVisibility = () => {
    if (!canViewValuations) {
      setShowUnauthorizedDialog(true);
    }
    // If user has permission, valuation data is always visible
    // No need to toggle since it's controlled by permissions
  };

  const fetchPOSOQuantities = async (itemCodes: string[], company: string) => {
    try {
      setLoadingPOSO(true);
      const erpnextAPI = await createERPNextAPI();
      if (!erpnextAPI) return;

      let totalPO = 0;
      let totalSO = 0;

      // Fetch Purchase Orders with pending status
      for (const itemCode of itemCodes) {
        try {
          // Get Purchase Orders for this company with pending status
          const poFilters = [
            ['docstatus', '=', 1],
            ['status', 'in', ['To Receive', 'To Receive and Bill']],
            ['company', '=', company]
          ];
          
          const poResponse = await erpnextAPI.getPurchaseOrders(poFilters, company, 50);
          
          if (poResponse?.data) {
            for (const po of poResponse.data) {
              // Get detailed PO with items
              try {
                const poDetailResponse = await erpnextAPI.callAPI(`Purchase Order/${po.name}`, 'GET');
                const poDetail = poDetailResponse?.data;
                
                if (poDetail?.items) {
                  poDetail.items.forEach((item: any) => {
                    if (item.item_code === itemCode) {
                      const pendingQty = (item.qty || 0) - (item.received_qty || 0);
                      if (pendingQty > 0) {
                        totalPO += pendingQty;
                      }
                    }
                  });
                }
              } catch (error) {
                console.warn(`Failed to fetch PO details for ${po.name}:`, error);
              }
            }
          }

          // Get Sales Orders for this company with pending status  
          const soFilters = [
            ['docstatus', '=', 1],
            ['status', 'in', ['To Deliver', 'To Deliver and Bill', 'Partially Delivered']],
            ['company', '=', company]
          ];
          
          const soResponse = await erpnextAPI.getSalesOrders(soFilters, company, 50);
          
          if (soResponse?.data) {
            for (const so of soResponse.data) {
              // Get detailed SO with items
              try {
                const soDetailResponse = await erpnextAPI.callAPI(`Sales Order/${so.name}`, 'GET');
                const soDetail = soDetailResponse?.data;
                
                if (soDetail?.items) {
                  soDetail.items.forEach((item: any) => {
                    if (item.item_code === itemCode) {
                      const pendingQty = (item.qty || 0) - (item.delivered_qty || 0);
                      if (pendingQty > 0) {
                        totalSO += pendingQty;
                      }
                    }
                  });
                }
              } catch (error) {
                console.warn(`Failed to fetch SO details for ${so.name}:`, error);
              }
            }
          }
        } catch (error) {
          console.warn(`Failed to fetch PO/SO data for item ${itemCode}:`, error);
        }
      }

      setTotalPOQty(Math.round(totalPO * 100) / 100);
      setTotalSOQty(Math.round(totalSO * 100) / 100);
    } catch (error) {
      console.error('Error fetching PO/SO quantities:', error);
    } finally {
      setLoadingPOSO(false);
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

  const handleExportExcel = () => {
    if (stockItems.length === 0 || !selectedItem) {
      toast({
        title: "No Data",
        description: "No data available to export",
        variant: "destructive"
      });
      return;
    }

    const success = exportItemEnquiryToExcel(stockItems, selectedItem.item_code, companyCurrency);
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
    if (stockItems.length === 0 || !selectedItem) {
      toast({
        title: "No Data",
        description: "No data available to export",
        variant: "destructive"
      });
      return;
    }

    const success = exportItemEnquiryToPDF(stockItems, selectedItem.item_code, selectedItem.item_name, companyCurrency);
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

  const totalItems = stockItems.length;
  const totalQty = Math.round(stockItems.reduce((sum, item) => sum + item.qty, 0) * 100) / 100;
  const totalValuation = Math.round(stockItems.reduce((sum, item) => sum + item.valuation, 0) * 100) / 100;

  return (
    <div className="w-full max-w-7xl mx-auto py-4 md:py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center space-x-2">
          <Package className="w-6 h-6" />
          <span>Item Enquiry</span>
        </h1>
        <p className="text-gray-500">Check the stock levels of a specific item.</p>
      </div>

      <div className="mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Select Item</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ItemScanner 
              onItemScanned={loadItemStock}
              isLoading={loading}
            />
            {selectedItem && (
              <div className="flex justify-end">
                <Button 
                  type="button" 
                  variant="secondary" 
                  onClick={handleClear}
                >
                  Clear
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {selectedItem && (
        <>
          {/* Summary Cards */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5" />
                <span>Item Summary - {selectedItem.item_code}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-blue-600 mb-1">Total Locations</p>
                        <p className="text-2xl font-bold text-blue-600">{totalItems}</p>
                      </div>
                      <Warehouse className="w-8 h-8 text-blue-600" />
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
                        <div className="flex items-center space-x-2 mb-1">
                          <p className="text-sm text-yellow-600">Total Value</p>
                           <button
                             onClick={handleToggleValuationVisibility}
                             className="text-yellow-600 hover:text-yellow-700 transition-colors"
                           >
                             <Eye className="w-4 h-4" />
                           </button>
                         </div>
                         <p className="text-2xl font-bold text-yellow-600">
                           {canViewValuations ? formatCurrency(totalValuation) : "••••••"}
                         </p>
                      </div>
                      <DollarSign className="w-8 h-8 text-yellow-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-purple-50 border-purple-200">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-purple-600 mb-1">Total PO Qty</p>
                        <p className="text-2xl font-bold text-purple-600">
                          {loadingPOSO ? "..." : totalPOQty}
                        </p>
                      </div>
                      <ShoppingCart className="w-8 h-8 text-purple-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-orange-50 border-orange-200">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-orange-600 mb-1">Total SO Qty</p>
                        <p className="text-2xl font-bold text-orange-600">
                          {loadingPOSO ? "..." : totalSOQty}
                        </p>
                      </div>
                      <Truck className="w-8 h-8 text-orange-600" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>

          {/* Stock Items Table */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <Warehouse className="w-5 h-5" />
                  <span>Stock of {selectedItem.item_code}</span>
                </CardTitle>
                {stockItems.length > 0 && (
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
                                <div className="flex items-center space-x-2">
                                  <span className="text-gray-600">Valuation:</span>
                                 <button
                                   onClick={handleToggleValuationVisibility}
                                   className="text-gray-600 hover:text-gray-700 transition-colors"
                                 >
                                     <Eye className="w-3 h-3" />
                                   </button>
                                 </div>
                                 <p className="font-semibold mt-1">
                                   {canViewValuations ? formatCurrency(item.valuation) : "••••••"}
                                 </p>
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
                            <th className="text-right p-3 font-medium text-gray-700">
                              <div className="flex items-center justify-end space-x-2">
                                <span>Valuation</span>
                                  <button
                                     onClick={handleToggleValuationVisibility}
                                     className="text-gray-600 hover:text-gray-700 transition-colors"
                                   >
                                   <Eye className="w-4 h-4" />
                                 </button>
                              </div>
                            </th>
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
                                 {canViewValuations ? formatCurrency(item.valuation) : "••••••"}
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
            <p className="text-gray-500 mb-4">Select an item using the dropdown to view stock levels.</p>
            <div className="text-sm text-gray-400">
              <p>• Use the item selector dropdown for quick selection</p>
              <p>• Search by item name or code</p>
              <p>• View stock across all warehouses</p>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Unauthorized Access Dialog */}
      <Dialog open={showUnauthorizedDialog} onOpenChange={setShowUnauthorizedDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Lock className="w-5 h-5" />
              <span>Access Restricted</span>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              You don't have permission to view valuation data. Please contact your administrator to request the "view_valuations" permission.
            </p>
            <div className="flex justify-end">
              <Button onClick={() => setShowUnauthorizedDialog(false)}>
                OK
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ItemEnquiry;

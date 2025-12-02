import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import LoadingSpinner from "@/components/LoadingSpinner";
import { 
  BarChart3, 
  TrendingUp, 
  Package, 
  AlertTriangle,
  Calendar,
  Warehouse,
  Download,
  RefreshCcw,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createERPNextAPI, getUserDefaultCompany } from "@/services/erpnextApi";
import { useToast } from "@/hooks/use-toast";
import ItemSelector from "@/components/common/ItemSelector";
import WarehouseSelector from "@/components/bin-enquiry/WarehouseSelector";
import { Item } from "@/types";
import { exportToExcel, exportToPDF } from "@/utils/exportUtils";

const ITEMS_PER_PAGE = 20;

const Reports = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedReport, setSelectedReport] = useState<string | null>(null);
  const [stockBalanceData, setStockBalanceData] = useState<any[]>([]);
  const [reportData, setReportData] = useState<any[]>([]);
  const [reportColumns, setReportColumns] = useState<any[]>([]);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [companyCurrency, setCompanyCurrency] = useState<string>("INR");
  const [currentPage, setCurrentPage] = useState(1);

  const reportCategories = [
    {
      title: "Stock Reports",
      reports: [
        { 
          id: "stock-balance", 
          name: "Stock Balance", 
          description: "Current stock levels across warehouses",
          icon: Package,
          color: "bg-blue-500"
        },
        { 
          id: "stock-aging", 
          name: "Stock Aging", 
          description: "Age analysis of stock items",
          icon: Calendar,
          color: "bg-orange-500"
        },
        { 
          id: "stock-projected", 
          name: "Stock Projected Qty", 
          description: "Projected stock quantities",
          icon: TrendingUp,
          color: "bg-green-500"
        },
        { 
          id: "item-shortage", 
          name: "Item Shortage", 
          description: "Items below minimum stock level",
          icon: AlertTriangle,
          color: "bg-red-500"
        }
      ]
    },
    {
      title: "Movement Reports",
      reports: [
        { 
          id: "stock-ledger", 
          name: "Stock Ledger", 
          description: "Stock movement transactions",
          icon: BarChart3,
          color: "bg-purple-500"
        },
        { 
          id: "warehouse-wise", 
          name: "Warehouse-wise Stock", 
          description: "Stock distribution by warehouse",
          icon: Warehouse,
          color: "bg-teal-500"
        }
      ]
    }
  ];

  const fetchStockBalance = async () => {
    console.log('Fetching stock balance with filters:', { 
      selectedItem: selectedItem?.item_code, 
      selectedWarehouse 
    });
    
    setLoading(true);
    try {
      const apiFilters = [];
      
      // Only add filters if items are actually selected
      if (selectedItem) {
        apiFilters.push(['item_code', '=', selectedItem.item_code]);
      }
      if (selectedWarehouse) {
        apiFilters.push(['warehouse', '=', selectedWarehouse]);
      }
      
      // Always filter for positive stock only
      apiFilters.push(['actual_qty', '>', 0]);
      
      console.log('API filters for stock balance:', apiFilters);
      
      // Use the ERPNext API directly for better field control
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
          const companiesResult = await erpnextAPI.getCompanies();
          const companyData = companiesResult.data?.find(c => c.name === company);
          if (companyData) {
            setCompanyCurrency(companyData.default_currency || "INR");
          }
        } catch (error) {
          console.error('Failed to fetch company currency:', error);
        }
      }

      const fields = [
        'item_code',
        'warehouse', 
        'actual_qty',
        'reserved_qty',
        'planned_qty',
        'valuation_rate',
        'stock_value',
        'stock_uom'
      ];

      const response = await erpnextAPI.callAPI('Bin', 'GET', undefined, apiFilters, undefined, fields);
      console.log('Direct Bin API response:', response);
      
      if (response?.data && Array.isArray(response.data)) {
        // Get item details to fetch item names
        const itemCodes = [...new Set(response.data.map((bin: any) => bin.item_code))];
        console.log('Fetching item names for codes:', itemCodes);
        
        const itemNames: Record<string, string> = {};
        
        // Fetch item names in batches
        try {
          if (itemCodes.length > 0) {
            const itemFilters = [['item_code', 'in', itemCodes]];
            const itemFields = ['item_code', 'item_name'];
            console.log('Item API call with filters:', itemFilters);
            
            const itemResponse = await erpnextAPI.callAPI('Item', 'GET', undefined, itemFilters, undefined, itemFields);
            console.log('Item API response:', itemResponse);
            
            if (itemResponse?.data && Array.isArray(itemResponse.data)) {
              itemResponse.data.forEach((item: any) => {
                itemNames[item.item_code] = item.item_name || item.item_code;
                console.log(`Mapped item: ${item.item_code} -> ${item.item_name}`);
              });
            } else {
              console.warn('Item API returned no data or invalid format:', itemResponse);
            }
          }
        } catch (error) {
          console.error('Failed to fetch item names:', error);
        }
        
        console.log('Final itemNames mapping:', itemNames);
        
        // Transform ERPNext Bin data to our format
        const transformedData = response.data.map((bin: any) => {
          const itemName = itemNames[bin.item_code] || bin.item_code;
          console.log(`Transforming bin: ${bin.item_code} -> itemName: ${itemName}`);
          
          return {
            item: bin.item_code,
            itemName: itemName,
            warehouse: bin.warehouse,
            qty: bin.actual_qty || 0,
            uom: bin.stock_uom || "Nos",
            value: bin.stock_value || ((bin.actual_qty || 0) * (bin.valuation_rate || 0))
          };
        }).filter((item: any) => item.qty > 0); // Only show items with positive stock
        
        console.log('Transformed stock balance data:', transformedData);
        setStockBalanceData(transformedData);
        
        if (transformedData.length === 0) {
          toast({
            title: "No Data",
            description: selectedItem || selectedWarehouse ? "No stock balance data found with the selected filters" : "No stock found in any warehouse",
            variant: "destructive"
          });
        } else {
          toast({
            title: "Data Loaded",
            description: `Found ${transformedData.length} stock records`,
          });
        }
      } else {
        console.log('No data in response or invalid response format');
        setStockBalanceData([]);
        toast({
          title: "No Data", 
          description: "No stock balance data available",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Stock balance fetch error:', error);
      toast({
        title: "Error",
        description: "Failed to fetch stock balance data. Please check your connection and try again.",
        variant: "destructive"
      });
      setStockBalanceData([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchReportData = async (reportType: string) => {
    console.log('Fetching report data for:', reportType);
    setLoading(true);
    setReportData([]);
    setReportColumns([]);
    
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

      // Get company currency
      const company = await getUserDefaultCompany();
      if (company) {
        try {
          const companiesResult = await erpnextAPI.getCompanies();
          const companyData = companiesResult.data?.find(c => c.name === company);
          if (companyData) {
            setCompanyCurrency(companyData.default_currency || "INR");
          }
        } catch (error) {
          console.error('Failed to fetch company currency:', error);
        }
      }

      let reportName = '';
      let filters: any = {};

      switch (reportType) {
        case 'stock-aging':
          reportName = 'Stock Ageing';
          filters = {};
          if (company) filters.company = company;
          if (selectedWarehouse) filters.warehouse = selectedWarehouse;
          if (selectedItem) filters.item_code = selectedItem.item_code;
          break;
        case 'stock-projected':
          reportName = 'Stock Projected Qty';
          filters = {};
          if (company) filters.company = company;
          if (selectedWarehouse) filters.warehouse = selectedWarehouse;
          if (selectedItem) filters.item_code = selectedItem.item_code;
          break;
        case 'item-shortage':
          reportName = 'Item Shortage Report';
          filters = {};
          if (company) filters.company = company;
          if (selectedWarehouse) filters.warehouse = selectedWarehouse;
          break;
        case 'stock-ledger':
          reportName = 'Stock Ledger';
          filters = {
            from_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days ago
            to_date: new Date().toISOString().split('T')[0] // Today
          };
          if (company) filters.company = company;
          if (selectedWarehouse) filters.warehouse = selectedWarehouse;
          if (selectedItem) filters.item_code = selectedItem.item_code;
          break;
        case 'warehouse-wise':
          reportName = 'Warehouse wise Stock Balance';
          filters = {};
          if (company) filters.company = company;
          if (selectedWarehouse) filters.warehouse = selectedWarehouse;
          if (selectedItem) filters.item_code = selectedItem.item_code;
          break;
        default:
          throw new Error('Unknown report type');
      }

      console.log('Running ERPNext report:', reportName, 'with filters:', filters);

      // Use ERPNext's report runner API
      const response = await erpnextAPI.runReport(reportName, filters);
      console.log('Report response:', response);

      const responseMessage = response?.message;
      if (responseMessage && typeof responseMessage === 'object') {
        const messageObj = responseMessage as any;
        if ('result' in messageObj && Array.isArray(messageObj.result) && messageObj.result.length > 0) {
          const reportResult = messageObj.result;
          
          console.log('Report data received:', reportResult.length, 'rows');
          console.log('Sample row:', reportResult[0]);
          
          // For newer ERPNext versions, result is an array of objects
          // Extract column information from the first row's keys
          const firstRow = reportResult[0];
          const dynamicColumns = Object.keys(firstRow).map((key, index) => ({
            fieldname: key,
            label: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
            fieldtype: typeof firstRow[key] === 'number' ? 'Float' : 'Data',
            width: 120
          }));
          
          // Transform the data - since it's already in object format, just add IDs
          const transformedData = reportResult.map((row: any, index: number) => ({
            id: index,
            ...row
          }));
          
          setReportData(transformedData);
          setReportColumns(dynamicColumns);
          
          toast({
            title: "Report Generated",
            description: `${reportName} loaded successfully with ${transformedData.length} records`,
          });
        } else {
          console.log('No data in response result:', responseMessage);
          setReportData([]);
          setReportColumns([]);
          toast({
            title: "No Data",
            description: `No data available for ${reportName}`,
            variant: "destructive"
          });
        }
      } else {
        console.log('No data in response:', response);
        setReportData([]);
        setReportColumns([]);
        toast({
          title: "No Data",
          description: `No data available for ${reportName}`,
          variant: "destructive"
        });
      }

    } catch (error) {
      console.error('Report fetch error:', error);
      setReportData([]);
      setReportColumns([]);
      toast({
        title: "Error",
        description: `Failed to generate report: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedReport === "stock-balance") {
      // Automatically load all stock balance data when report is selected
      setCurrentPage(1);
      fetchStockBalance();
    }
  }, [selectedReport]);

  // Auto-fetch when filters change
  useEffect(() => {
    if (selectedReport === "stock-balance") {
      setCurrentPage(1);
      fetchStockBalance();
    }
  }, [selectedItem, selectedWarehouse]);

  // Reset page when report data changes
  useEffect(() => {
    setCurrentPage(1);
  }, [stockBalanceData.length, reportData.length]);

  // Pagination helpers
  const getPaginatedData = (data: any[]) => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return data.slice(startIndex, endIndex);
  };

  const getTotalPages = (data: any[]) => Math.ceil(data.length / ITEMS_PER_PAGE);

  const renderPagination = (totalItems: number) => {
    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
    if (totalPages <= 1) return null;

    return (
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
        <p className="text-sm text-muted-foreground">
          Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, totalItems)} of {totalItems} records
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Previous
          </Button>
          <span className="text-sm text-muted-foreground px-2">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            Next
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </div>
    );
  };

  const handleFilter = () => {
    if (selectedReport === "stock-balance") {
      fetchStockBalance();
    } else if (selectedReport) {
      fetchReportData(selectedReport);
    }
  };

  const handleItemSelect = (item: Item) => {
    setSelectedItem(item);
    console.log('Selected item for report:', item);
  };

  const handleWarehouseSelect = (warehouse: string) => {
    setSelectedWarehouse(warehouse);
    console.log('Selected warehouse for report:', warehouse);
  };

  const handleClearFilters = () => {
    setSelectedItem(null);
    setSelectedWarehouse("");
    if (selectedReport === "stock-balance") {
      fetchStockBalance();
    }
  };

  const handleRefresh = () => {
    if (selectedReport === "stock-balance") {
      fetchStockBalance();
    } else if (selectedReport) {
      fetchReportData(selectedReport);
    }
  };

  const handleExportExcel = () => {
    if (stockBalanceData.length === 0) {
      toast({
        title: "No Data",
        description: "No data available to export",
        variant: "destructive"
      });
      return;
    }

    const exportData = stockBalanceData.map(item => ({
      'Item Code': item.item,
      'Item Name': item.itemName,
      'Warehouse': item.warehouse, 
      'Quantity': item.qty,
      'UOM': item.uom,
      'Value': item.value
    }));

    const success = exportToExcel(exportData, 'Stock_Balance_Report', 'Stock Balance', companyCurrency);
    if (success) {
      toast({
        title: "Export Successful",
        description: "Stock balance report exported to Excel successfully",
      });
    } else {
      toast({
        title: "Export Failed",
        description: "Failed to export report to Excel",
        variant: "destructive"
      });
    }
  };

  const handleExportPDF = () => {
    if (stockBalanceData.length === 0) {
      toast({
        title: "No Data",
        description: "No data available to export", 
        variant: "destructive"
      });
      return;
    }

    const exportData = stockBalanceData.map(item => ({
      item: item.item,
      itemName: item.itemName,
      warehouse: item.warehouse,
      qty: item.qty,
      uom: item.uom,
      value: item.value
    }));

    const columns = [
      { header: 'Item Code', dataKey: 'item' },
      { header: 'Item Name', dataKey: 'itemName' },
      { header: 'Warehouse', dataKey: 'warehouse' },
      { header: 'Quantity', dataKey: 'qty' },
      { header: 'UOM', dataKey: 'uom' },
      { header: 'Value', dataKey: 'value' }
    ];

    const success = exportToPDF(exportData, 'Stock_Balance_Report', 'Stock Balance Report', columns, companyCurrency);
    if (success) {
      toast({
        title: "Export Successful", 
        description: "Stock balance report exported to PDF successfully",
      });
    } else {
      toast({
        title: "Export Failed",
        description: "Failed to export report to PDF",
        variant: "destructive"
      });
    }
  };

  const renderStockBalanceReport = () => {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Select Item</label>
            <ItemSelector
              onItemSelect={handleItemSelect}
              selectedItem={selectedItem}
              placeholder="Search and select item..."
              isLoading={loading}
            />
          </div>
          <div>
            <WarehouseSelector
              onWarehouseSelected={handleWarehouseSelect}
              isLoading={loading}
            />
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2 mb-4">
          <Button variant="outline" onClick={handleFilter} disabled={loading}>
            <RefreshCcw className="w-4 h-4 mr-2" />
            Apply Filters
          </Button>
          {(selectedItem || selectedWarehouse) && (
            <Button variant="outline" onClick={handleClearFilters} disabled={loading}>
              Clear Filters
            </Button>
          )}
          {selectedItem && (
            <Badge variant="secondary">Item: {selectedItem.item_code}</Badge>
          )}
          {selectedWarehouse && (
            <Badge variant="secondary">Warehouse: {selectedWarehouse}</Badge>
          )}
        </div>
        
        {loading ? (
          <div className="flex justify-center py-8">
            <LoadingSpinner />
          </div>
        ) : stockBalanceData.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No stock balance data found</p>
          </div>
        ) : (
          <>
            {/* Mobile Card View */}
            <div className="md:hidden space-y-3">
              {getPaginatedData(stockBalanceData).map((item, index) => (
                <Card key={index}>
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">{item.itemName}</h4>
                          <p className="text-sm text-muted-foreground">{item.item}</p>
                        </div>
                        <Badge variant="outline">{item.warehouse}</Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Quantity:</span>
                          <p className="font-medium">{item.qty} {item.uom}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Value:</span>
                          <p className="font-medium">{new Intl.NumberFormat('en-IN', {
                            style: 'currency',
                            currency: companyCurrency,
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          }).format(item.value)}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-3 text-foreground">Item Details</th>
                    <th className="text-left p-3 text-foreground">Warehouse</th>
                    <th className="text-right p-3 text-foreground">Quantity</th>
                    <th className="text-left p-3 text-foreground">UOM</th>
                    <th className="text-right p-3 text-foreground">Value</th>
                  </tr>
                </thead>
                <tbody>
                  {getPaginatedData(stockBalanceData).map((item, index) => (
                    <tr key={index} className="border-b border-border hover:bg-accent">
                      <td className="p-3 text-foreground">
                        <div>
                          <div className="font-medium">{item.itemName}</div>
                          <div className="text-sm text-muted-foreground">{item.item}</div>
                        </div>
                      </td>
                      <td className="p-3 text-foreground">{item.warehouse}</td>
                      <td className="p-3 text-right text-foreground">{item.qty}</td>
                      <td className="p-3 text-foreground">{item.uom}</td>
                      <td className="p-3 text-right text-foreground">{new Intl.NumberFormat('en-IN', {
                        style: 'currency',
                        currency: companyCurrency,
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      }).format(item.value)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {renderPagination(stockBalanceData.length)}
          </>
        )}
      </div>
    );
  };

  const renderGenericReport = (reportType: string, reportName: string, description: string) => {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Select Item</label>
            <ItemSelector
              onItemSelect={handleItemSelect}
              selectedItem={selectedItem}
              placeholder="Search and select item..."
              isLoading={loading}
            />
          </div>
          <div>
            <WarehouseSelector
              onWarehouseSelected={handleWarehouseSelect}
              isLoading={loading}
            />
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2 mb-4">
          <Button variant="outline" onClick={() => { setCurrentPage(1); fetchReportData(reportType); }} disabled={loading}>
            <RefreshCcw className="w-4 h-4 mr-2" />
            Load {reportName}
          </Button>
          {(selectedItem || selectedWarehouse) && (
            <Button variant="outline" onClick={handleClearFilters} disabled={loading}>
              Clear Filters
            </Button>
          )}
          {selectedItem && (
            <Badge variant="secondary">Item: {selectedItem.item_code}</Badge>
          )}
          {selectedWarehouse && (
            <Badge variant="secondary">Warehouse: {selectedWarehouse}</Badge>
          )}
        </div>
        
        {loading ? (
          <div className="flex justify-center py-8">
            <LoadingSpinner />
          </div>
        ) : reportData.length > 0 ? (
          <>
            {/* Mobile Card View */}
            <div className="md:hidden space-y-3">
              {getPaginatedData(reportData).map((row, index) => (
                <Card key={index}>
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      {reportColumns.slice(0, 4).map((col: any, colIndex: number) => {
                        const fieldName = col.fieldname || col.label || `col_${colIndex}`;
                        const value = row[fieldName];
                        return (
                          <div key={colIndex} className="flex justify-between">
                            <span className="text-muted-foreground">{col.label || fieldName}:</span>
                            <span className="font-medium">
                              {col.fieldtype === 'Currency' && value !== null && value !== undefined 
                                ? new Intl.NumberFormat('en-IN', {
                                    style: 'currency',
                                    currency: companyCurrency,
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  }).format(Number(value) || 0)
                                : String(value || '')
                              }
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-border">
                    {reportColumns.map((col: any, index: number) => (
                      <th key={index} className="text-left p-3 text-foreground">
                        {col.label || col.fieldname || `Column ${index + 1}`}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {getPaginatedData(reportData).map((row: any, rowIndex: number) => (
                    <tr key={rowIndex} className="border-b border-border hover:bg-accent">
                      {reportColumns.map((col: any, colIndex: number) => {
                        const fieldName = col.fieldname || col.label || `col_${colIndex}`;
                        const value = row[fieldName];
                        return (
                          <td key={colIndex} className="p-3 text-foreground">
                            {col.fieldtype === 'Currency' && value !== null && value !== undefined 
                              ? new Intl.NumberFormat('en-IN', {
                                  style: 'currency',
                                  currency: companyCurrency,
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                }).format(Number(value) || 0)
                              : String(value || '')
                            }
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {renderPagination(reportData.length)}
          </>
        ) : (
          <div className="text-center py-8">
            <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground text-lg font-medium">{reportName}</p>
            <p className="text-sm text-muted-foreground mt-2">{description}</p>
            <p className="text-xs text-muted-foreground mt-4">Click "Load {reportName}" to generate the report</p>
          </div>
        )}
      </div>
    );
  };

  const renderReportData = () => {
    if (!selectedReport) return null;

    switch (selectedReport) {
      case "stock-balance":
        return renderStockBalanceReport();
      case "stock-aging":
        return renderGenericReport("stock-aging", "Stock Aging Report", "Shows how long items have been in stock grouped by age ranges (0-30, 30-60, 60+ days)");
      case "stock-projected":
        return renderGenericReport("stock-projected", "Stock Projected Qty Report", "Shows projected stock levels including planned receipts and issues");
      case "item-shortage":
        return renderGenericReport("item-shortage", "Item Shortage Report", "Shows items below minimum stock level or reorder point");
      case "stock-ledger":
        return renderGenericReport("stock-ledger", "Stock Ledger Report", "Shows all stock movement transactions with dates and references");
      case "warehouse-wise":
        return renderGenericReport("warehouse-wise", "Warehouse-wise Stock Report", "Shows stock distribution across different warehouses");
      default:
        return (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Report data will be displayed here</p>
          </div>
        );
    }
  };

  if (selectedReport) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <Button variant="outline" onClick={() => setSelectedReport(null)}>
                ← Back
              </Button>
              <h1 className="text-2xl font-bold text-foreground">
                {reportCategories.flatMap(c => c.reports).find(r => r.id === selectedReport)?.name}
              </h1>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" size="icon" onClick={handleRefresh} disabled={loading}>
                <RefreshCcw className="w-4 h-4" />
              </Button>
              {selectedReport === "stock-balance" && stockBalanceData.length > 0 && (
                <>
                  <Button variant="outline" onClick={handleExportExcel} disabled={loading}>
                    <Download className="w-4 h-4 mr-2" />
                    Excel
                  </Button>
                  <Button variant="outline" onClick={handleExportPDF} disabled={loading}>
                    <Download className="w-4 h-4 mr-2" />
                    PDF
                  </Button>
                </>
              )}
            </div>
          </div>

          <Card>
            <CardContent className="p-6">
              {renderReportData()}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <BarChart3 className="w-6 h-6 text-blue-600" />
            <h1 className="text-2xl font-bold text-foreground">Reports</h1>
          </div>
        </div>

        <div className="space-y-8">
          {reportCategories.map((category, categoryIndex) => (
            <div key={categoryIndex}>
              <h2 className="text-xl font-semibold mb-4">{category.title}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {category.reports.map((report) => {
                  const Icon = report.icon;
                  return (
                    <Card 
                      key={report.id} 
                      className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => setSelectedReport(report.id)}
                    >
                      <CardHeader>
                        <CardTitle className="flex items-center space-x-3">
                          <div className={`w-10 h-10 rounded-lg ${report.color} flex items-center justify-center`}>
                            <Icon className="w-5 h-5 text-white" />
                          </div>
                          <span>{report.name}</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground">{report.description}</p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Reports;
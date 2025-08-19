
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
  RefreshCcw
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createERPNextAPI } from "@/services/erpnextApi";
import { useToast } from "@/hooks/use-toast";
import ItemSelector from "@/components/common/ItemSelector";
import WarehouseSelector from "@/components/bin-enquiry/WarehouseSelector";
import { Item } from "@/types";
import { exportToExcel, exportToPDF } from "@/utils/exportUtils";

const Reports = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedReport, setSelectedReport] = useState<string | null>(null);
  const [stockBalanceData, setStockBalanceData] = useState<any[]>([]);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>("");
  const [loading, setLoading] = useState(false);

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
          const itemFilters = [['item_code', 'in', itemCodes]];
          const itemFields = ['item_code', 'item_name'];
          const itemResponse = await erpnextAPI.callAPI('Item', 'GET', undefined, itemFilters, undefined, itemFields);
          
          if (itemResponse?.data) {
            itemResponse.data.forEach((item: any) => {
              itemNames[item.item_code] = item.item_name || item.item_code;
            });
          }
        } catch (error) {
          console.warn('Failed to fetch item names:', error);
        }
        
        // Transform ERPNext Bin data to our format
        const transformedData = response.data.map((bin: any) => ({
          item: bin.item_code,
          itemName: itemNames[bin.item_code] || bin.item_code,
          warehouse: bin.warehouse,
          qty: bin.actual_qty || 0,
          uom: bin.stock_uom || "Nos",
          value: bin.stock_value || ((bin.actual_qty || 0) * (bin.valuation_rate || 0))
        })).filter((item: any) => item.qty > 0); // Only show items with positive stock
        
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

  useEffect(() => {
    if (selectedReport === "stock-balance") {
      // Automatically load all stock balance data when report is selected
      fetchStockBalance();
    }
  }, [selectedReport]);

  // Auto-fetch when filters change
  useEffect(() => {
    if (selectedReport === "stock-balance") {
      fetchStockBalance();
    }
  }, [selectedItem, selectedWarehouse]);

  const handleFilter = () => {
    if (selectedReport === "stock-balance") {
      fetchStockBalance();
    }
  };

  const handleItemSelect = (item: Item) => {
    setSelectedItem(item);
    console.log('Selected item for stock balance:', item);
  };

  const handleWarehouseSelect = (warehouse: string) => {
    setSelectedWarehouse(warehouse);
    console.log('Selected warehouse for stock balance:', warehouse);
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

    const success = exportToExcel(exportData, 'Stock_Balance_Report', 'Stock Balance');
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

    const success = exportToPDF(exportData, 'Stock_Balance_Report', 'Stock Balance Report', columns);
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

  const renderReportData = () => {
    if (!selectedReport) return null;

    switch (selectedReport) {
      case "stock-balance":
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
                  {stockBalanceData.map((item, index) => (
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
                          <p className="font-medium">₹{item.value.toLocaleString()}</p>
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
                      {stockBalanceData.map((item, index) => (
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
                      <td className="p-3 text-right text-foreground">₹{item.value.toLocaleString()}</td>
                    </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        );
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
              {stockBalanceData.length > 0 && (
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

import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { BarChart3, RotateCcw, Save, Trash2, Edit, Check, X, Package, Eye, EyeOff } from "lucide-react";
import ItemSelector from "@/components/stock-count/ItemSelector";
import MultiWarehouseItemSelector from "@/components/stock-count/MultiWarehouseItemSelector";
import { StockCountEntry } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { createERPNextAPI } from "@/services/erpnextApi";

const StockCountSession = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const warehouse = searchParams.get('warehouse') || '';
  const purpose = searchParams.get('purpose') || 'Stock Reconciliation';
  const sessionId = searchParams.get('sessionId');
  const mode = searchParams.get('mode') || 'create'; // create, edit, view
  const isMultiWarehouse = searchParams.get('multiWarehouse') === 'true';
  const [entries, setEntries] = useState<StockCountEntry[]>([]);
  const [activeTab, setActiveTab] = useState("entry");
  const [stockReconciliationId, setStockReconciliationId] = useState<string | null>(sessionId);
  const [loading, setLoading] = useState(false);
  const [sessionData, setSessionData] = useState<any>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingEntry, setEditingEntry] = useState<StockCountEntry | null>(null);
  const [loadingWarehouseItems, setLoadingWarehouseItems] = useState(false);
  const [visibleQuantities, setVisibleQuantities] = useState<Set<number>>(new Set());
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [pendingVisibilityIndex, setPendingVisibilityIndex] = useState<number | null>(null);
  const { toast } = useToast();

  // Load existing session data if in edit/view mode
  useEffect(() => {
    if (sessionId && (mode === 'edit' || mode === 'view')) {
      loadSessionData();
    }
  }, [sessionId, mode]);

  const totalItems = entries.length;
  const matchedItems = entries.filter(entry => entry.status === 'matched').length;
  const varianceItems = entries.filter(entry => entry.status === 'variance').length;

  const loadSessionData = async () => {
    if (!sessionId) return;
    
    try {
      setLoading(true);
      const erpnextAPI = await createERPNextAPI();
      if (!erpnextAPI) {
        toast({
          title: "ERPNext Not Configured",
          description: "Please configure your ERPNext settings in the Profile page.",
          variant: "destructive"
        });
        return;
      }

      const response = await erpnextAPI.getStockReconciliation(sessionId);
      if (response?.data) {
        setSessionData(response.data);
        setStockReconciliationId(response.data.name);
        
        // Transform ERPNext items to StockCountEntry format
        if (response.data.items) {
          const transformedEntries: StockCountEntry[] = response.data.items.map((item: any) => ({
            itemCode: item.item_code,
            itemName: item.item_name || item.item_code,
            warehouse: item.warehouse,
            currentQty: item.current_qty || 0,
            actualQty: item.qty || 0,
            difference: (item.qty || 0) - (item.current_qty || 0),
            status: ((item.qty || 0) === (item.current_qty || 0)) ? 'matched' : 'variance',
            uom: item.uom || '',
            batch: item.batch_no || '',
            serial: item.serial_no || '',
            serialBatchBundle: item.serial_and_batch_bundle || ''
          }));
          setEntries(transformedEntries);
        }
        
        // Switch to review tab if items exist
        if (response.data.items && response.data.items.length > 0) {
          setActiveTab("review");
        }
      }
    } catch (error) {
      console.error('Failed to load session data:', error);
      toast({
        title: "Error",
        description: "Failed to load stock reconciliation data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEntryAdded = async (entry: StockCountEntry) => {
    try {
      const erpnextAPI = await createERPNextAPI();
      if (!erpnextAPI) {
        throw new Error('ERPNext API not available');
      }

      if (stockReconciliationId) {
        // We're editing an existing stock reconciliation - add the new item
        console.log('Adding item to existing Stock Reconciliation:', stockReconciliationId);
        
        // Get current stock reconciliation data
        const currentSR = await erpnextAPI.getStockReconciliation(stockReconciliationId);
        if (!currentSR?.data) {
          throw new Error('Failed to fetch current stock reconciliation');
        }

        // Get valuation rate for the new item
        let valuationRate = 0;
        try {
          const stockLedgerResponse = await erpnextAPI.stockAPI.getStockLedgerEntries(entry.itemCode, [entry.warehouse]);
          if (stockLedgerResponse?.data && stockLedgerResponse.data.length > 0) {
            const latestEntry = stockLedgerResponse.data
              .filter((ledger: any) => ledger.warehouse === entry.warehouse)
              .sort((a: any, b: any) => {
                const dateA = new Date(a.posting_date + ' ' + (a.posting_time || '00:00:00'));
                const dateB = new Date(b.posting_date + ' ' + (b.posting_time || '00:00:00'));
                return dateB.getTime() - dateA.getTime();
              })[0];
            
            if (latestEntry) {
              valuationRate = latestEntry.valuation_rate || 0;
            }
          }
          
          // Fallback: get item details for standard rate
          if (!valuationRate) {
            const itemDetails = await erpnextAPI.getItemDetails(entry.itemCode);
            if (itemDetails?.data) {
              valuationRate = (itemDetails.data as any).standard_rate || (itemDetails.data as any).valuation_rate || 0;
            }
          }
        } catch (error) {
          console.warn('Could not fetch valuation rate for new item:', error);
        }

        // Add the new item to the existing items array
        const newItem = {
          item_code: entry.itemCode,
          warehouse: entry.warehouse,
          qty: entry.actualQty,
          valuation_rate: valuationRate || 0,
          current_qty: entry.currentQty,
          current_valuation_rate: valuationRate || 0,
          ...(entry.batch && { batch_no: entry.batch }),
          ...(entry.serial && { serial_no: entry.serial }),
          ...(entry.serialBatchBundle && { serial_and_batch_bundle: entry.serialBatchBundle })
        };

        const updatedItems = [...currentSR.data.items, newItem];

        // Update the stock reconciliation in ERPNext
        const updateData = {
          items: updatedItems
        };

        console.log('Adding new item to Stock Reconciliation:', updateData);
        await erpnextAPI.callAPI(`Stock Reconciliation/${stockReconciliationId}`, 'PUT', updateData);

        toast({
          title: "Item Added",
          description: `Stock count entry for ${entry.itemName} has been added to ERPNext.`,
        });
      } else {
        // Create new stock reconciliation if this is the first entry
        console.log('Creating new Stock Reconciliation...');
        // Get company from user profile
        const { getUserDefaultCompany } = await import('@/services/erpnextApi');
        const company = await getUserDefaultCompany();
        
        if (!company) {
          throw new Error('No default company found. Please set your default company in Profile settings.');
        }

        // Get current stock valuation for the item
        let currentQty = 0;
        let valuationRate = 0;
        
        try {
          const stockResponse = await erpnextAPI.stockAPI.getBinStockForCompany(entry.itemCode, company);
          if (stockResponse?.data) {
            const warehouseStock = stockResponse.data.find((stock: any) => stock.warehouse === entry.warehouse);
            if (warehouseStock) {
              currentQty = warehouseStock.actual_qty || 0;
            }
          }
          
          // Get valuation rate from stock ledger
          const stockLedgerResponse = await erpnextAPI.stockAPI.getStockLedgerEntries(entry.itemCode, [entry.warehouse]);
          if (stockLedgerResponse?.data && stockLedgerResponse.data.length > 0) {
            const latestEntry = stockLedgerResponse.data
              .filter((ledger: any) => ledger.warehouse === entry.warehouse)
              .sort((a: any, b: any) => {
                const dateA = new Date(a.posting_date + ' ' + (a.posting_time || '00:00:00'));
                const dateB = new Date(b.posting_date + ' ' + (b.posting_time || '00:00:00'));
                return dateB.getTime() - dateA.getTime();
              })[0];
            
            if (latestEntry) {
              valuationRate = latestEntry.valuation_rate || 0;
            }
          }
          
          // Fallback: get item details for standard rate
          if (!valuationRate) {
            const itemDetails = await erpnextAPI.getItemDetails(entry.itemCode);
            if (itemDetails?.data) {
              valuationRate = (itemDetails.data as any).standard_rate || (itemDetails.data as any).valuation_rate || 0;
            }
          }
        } catch (error) {
          console.warn('Could not fetch stock details for valuation:', error);
        }

        const stockReconciliationData = {
          doctype: 'Stock Reconciliation',
          company: company,
          purpose: sessionData?.purpose || purpose,
          posting_date: new Date().toISOString().split('T')[0],
          posting_time: new Date().toTimeString().split(' ')[0],
          set_posting_time: 1,
          expense_account: '', // Will be auto-set by ERPNext
          cost_center: '', // Will be auto-set by ERPNext
          items: [{
            item_code: entry.itemCode,
            warehouse: entry.warehouse,
            qty: entry.actualQty,
            valuation_rate: valuationRate || 0,
            current_qty: currentQty,
            current_valuation_rate: valuationRate || 0,
            ...(entry.batch && { batch_no: entry.batch }),
            ...(entry.serial && { serial_no: entry.serial }),
            ...(entry.serialBatchBundle && { serial_and_batch_bundle: entry.serialBatchBundle })
          }]
        };

        console.log('Creating Stock Reconciliation with data:', stockReconciliationData);
        const response = await erpnextAPI.callAPI('Stock Reconciliation', 'POST', stockReconciliationData);
        console.log('Stock Reconciliation response:', response);
        
        if (response?.data?.name) {
          setStockReconciliationId(response.data.name);
          toast({
            title: "Stock Reconciliation Created",
            description: `Draft Stock Reconciliation ${response.data.name} created successfully.`,
          });
        } else {
          throw new Error('No Stock Reconciliation ID returned from API');
        }
      }

      // Update local state
      setEntries(prev => [...prev, entry]);
    } catch (error: any) {
      console.error('Failed to add entry to stock reconciliation:', error);
      
      let errorMessage = 'Failed to add entry to Stock Reconciliation in ERPNext.';
      
      if (error.message) {
        if (error.message.includes('ValidationError')) {
          errorMessage = 'Validation failed: Please check that all required fields are filled correctly.';
        } else if (error.message.includes('PermissionError')) {
          errorMessage = 'Permission denied: You may not have rights to modify Stock Reconciliation.';
        } else if (error.message.includes('DuplicateEntryError')) {
          errorMessage = 'Duplicate entry: A similar item entry may already exist.';
        } else {
          errorMessage = error.message;
        }
      }
      
      toast({
        title: "Error Adding Entry",
        description: errorMessage,
        variant: "destructive"
      });
      return; // Don't add entry to local state if ERPNext update failed
    }
  };

  const handleReset = () => {
    setEntries([]);
    setActiveTab("entry");
    toast({
      title: "Session Reset",
      description: "All entries have been cleared.",
    });
  };

  const handleDeleteEntry = async (index: number) => {
    if (!stockReconciliationId) {
      // If no stock reconciliation ID, just remove from local state
      const deletedEntry = entries[index];
      setEntries(prev => prev.filter((_, i) => i !== index));
      toast({
        title: "Entry Deleted",
        description: `Stock count entry for ${deletedEntry.itemName} has been removed.`,
      });
      return;
    }

    try {
      const erpnextAPI = await createERPNextAPI();
      if (!erpnextAPI) {
        throw new Error('ERPNext API not available');
      }

      const deletedEntry = entries[index];

      // Get current stock reconciliation data
      const currentSR = await erpnextAPI.getStockReconciliation(stockReconciliationId);
      if (!currentSR?.data) {
        throw new Error('Failed to fetch current stock reconciliation');
      }

      // Remove the item from the items array
      const updatedItems = currentSR.data.items.filter((_: any, i: number) => i !== index);

      // Update the stock reconciliation in ERPNext
      const updateData = {
        items: updatedItems
      };

      console.log('Updating Stock Reconciliation after delete:', updateData);
      await erpnextAPI.callAPI(`Stock Reconciliation/${stockReconciliationId}`, 'PUT', updateData);

      // Update local state
      setEntries(prev => prev.filter((_, i) => i !== index));
      
      toast({
        title: "Entry Deleted",
        description: `Stock count entry for ${deletedEntry.itemName} has been removed from ERPNext.`,
      });
    } catch (error: any) {
      console.error('Failed to delete entry from stock reconciliation:', error);
      toast({
        title: "Delete Failed",
        description: error.message || "Failed to delete entry from ERPNext",
        variant: "destructive"
      });
    }
  };

  const handleEditEntry = (index: number) => {
    setEditingIndex(index);
    setEditingEntry({ ...entries[index] });
  };

  const handleSaveEdit = async () => {
    if (editingIndex !== null && editingEntry && stockReconciliationId) {
      try {
        const erpnextAPI = await createERPNextAPI();
        if (!erpnextAPI) {
          throw new Error('ERPNext API not available');
        }

        // Update the stock reconciliation in ERPNext
        const updatedEntry: StockCountEntry = {
          ...editingEntry,
          difference: editingEntry.actualQty - editingEntry.currentQty,
          status: (editingEntry.actualQty === editingEntry.currentQty ? 'matched' : 'variance') as 'matched' | 'variance' | 'pending'
        };

        // Get current stock reconciliation data
        const currentSR = await erpnextAPI.getStockReconciliation(stockReconciliationId);
        if (!currentSR?.data) {
          throw new Error('Failed to fetch current stock reconciliation');
        }

        // Update the specific item in the items array
        const updatedItems = currentSR.data.items.map((item: any, index: number) => 
          index === editingIndex ? {
            ...item,
            qty: updatedEntry.actualQty,
            valuation_rate: item.valuation_rate || 0
          } : item
        );

        // Update the stock reconciliation in ERPNext
        const updateData = {
          items: updatedItems
        };

        console.log('Updating Stock Reconciliation with:', updateData);
        await erpnextAPI.callAPI(`Stock Reconciliation/${stockReconciliationId}`, 'PUT', updateData);
        
        // Update local state
        setEntries(prev => prev.map((entry, i) => 
          i === editingIndex ? updatedEntry : entry
        ));
        
        setEditingIndex(null);
        setEditingEntry(null);
        
        toast({
          title: "Entry Updated",
          description: `Stock count entry for ${updatedEntry.itemName} has been updated in ERPNext.`,
        });
      } catch (error: any) {
        console.error('Failed to update stock reconciliation:', error);
        toast({
          title: "Update Failed",
          description: error.message || "Failed to update entry in ERPNext",
          variant: "destructive"
        });
      }
    }
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setEditingEntry(null);
  };

  const handleSubmitCount = async () => {
    if (entries.length === 0) {
      toast({
        title: "No Entries",
        description: "Please add some stock count entries before submitting.",
        variant: "destructive"
      });
      return;
    }

    if (!stockReconciliationId) {
      toast({
        title: "No Stock Reconciliation",
        description: "No stock reconciliation found to submit.",
        variant: "destructive"
      });
      return;
    }

    try {
      const erpnextAPI = await createERPNextAPI();
      if (!erpnextAPI) {
        throw new Error('ERPNext API not available');
      }

      console.log('Submitting Stock Reconciliation:', stockReconciliationId);
      
      // Submit the stock reconciliation in ERPNext
      const submitResponse = await erpnextAPI.callAPI(`Stock Reconciliation/${stockReconciliationId}`, 'PUT', {
        docstatus: 1
      });

      console.log('Submit response:', submitResponse);

      toast({
        title: "Stock Reconciliation Submitted",
        description: `Stock Reconciliation ${stockReconciliationId} has been successfully submitted in ERPNext.`,
      });
      
      // Navigate back to stock count list
      navigate('/app/stock-count');
    } catch (error: any) {
      console.error('Failed to submit stock reconciliation:', error);
      toast({
        title: "Submit Failed",
        description: error.message || "Failed to submit stock reconciliation in ERPNext",
        variant: "destructive"
      });
    }
  };

  const handleGetAllItems = async () => {
    if (!warehouse) {
      toast({
        title: "No Warehouse",
        description: "No warehouse selected for stock count.",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoadingWarehouseItems(true);
      const erpnextAPI = await createERPNextAPI();
      if (!erpnextAPI) {
        throw new Error('ERPNext API not available');
      }

      // Get company from user profile
      const { getUserDefaultCompany } = await import('@/services/erpnextApi');
      const company = await getUserDefaultCompany();
      
      if (!company) {
        throw new Error('No default company found. Please set your default company in Profile settings.');
      }

      console.log(`Getting all items for warehouse: ${warehouse}`);
      
      // Get all items for the warehouse
      const warehouseItemsResponse = await erpnextAPI.stockAPI.getAllWarehouseItems(warehouse, company);
      
      if (!warehouseItemsResponse?.data || warehouseItemsResponse.data.length === 0) {
        toast({
          title: "No Items Found",
          description: `No items with stock found in warehouse ${warehouse}.`,
          variant: "destructive"
        });
        return;
      }

      console.log(`Found ${warehouseItemsResponse.data.length} items in warehouse`);

      // Create Stock Reconciliation with all items
      const stockReconciliationItems = warehouseItemsResponse.data.map((bin: any) => ({
        item_code: bin.item_code,
        warehouse: bin.warehouse,
        qty: bin.actual_qty, // Start with current qty as actual qty
        valuation_rate: 0, // Will be calculated by ERPNext
        current_qty: bin.actual_qty,
        current_valuation_rate: 0
      }));

      const stockReconciliationData = {
        doctype: 'Stock Reconciliation',
        company: company,
        purpose: purpose,
        posting_date: new Date().toISOString().split('T')[0],
        posting_time: new Date().toTimeString().split(' ')[0],
        set_posting_time: 1,
        expense_account: '', // Will be auto-set by ERPNext
        cost_center: '', // Will be auto-set by ERPNext
        items: stockReconciliationItems
      };

      console.log('Creating Stock Reconciliation with all warehouse items:', stockReconciliationData);
      const response = await erpnextAPI.callAPI('Stock Reconciliation', 'POST', stockReconciliationData);
      console.log('Stock Reconciliation response:', response);
      
      if (response?.data?.name) {
        setStockReconciliationId(response.data.name);
        
        // Transform items to StockCountEntry format
        const transformedEntries: StockCountEntry[] = warehouseItemsResponse.data.map((bin: any) => ({
          itemCode: bin.item_code,
          itemName: bin.item_code, // We'll need to fetch item names separately if needed
          warehouse: bin.warehouse,
          currentQty: bin.actual_qty,
          actualQty: bin.actual_qty,
          difference: 0,
          status: 'matched' as 'matched' | 'variance' | 'pending',
          uom: bin.uom || '',
          batch: '',
          serial: '',
          serialBatchBundle: ''
        }));
        
        setEntries(transformedEntries);
        setActiveTab("review");
        
        toast({
          title: "Stock Reconciliation Created",
          description: `Draft Stock Reconciliation ${response.data.name} created with ${warehouseItemsResponse.data.length} items from warehouse ${warehouse}.`,
        });
      } else {
        throw new Error('No Stock Reconciliation ID returned from API');
      }
    } catch (error: any) {
      console.error('Failed to get warehouse items:', error);
      
      let errorMessage = 'Failed to get warehouse items and create Stock Reconciliation.';
      
      if (error.message) {
        if (error.message.includes('ValidationError')) {
          errorMessage = 'Validation failed: Please check warehouse permissions and data.';
        } else if (error.message.includes('PermissionError')) {
          errorMessage = 'Permission denied: You may not have rights to access warehouse data.';
        } else {
          errorMessage = error.message;
        }
      }
      
      toast({
        title: "Error Getting Items",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoadingWarehouseItems(false);
    }
  };

  const handleToggleQuantityVisibility = (index: number) => {
    if (visibleQuantities.has(index)) {
      // Already visible, hide it
      const newVisible = new Set(visibleQuantities);
      newVisible.delete(index);
      setVisibleQuantities(newVisible);
    } else {
      // Not visible, show password dialog
      setPendingVisibilityIndex(index);
      setShowPasswordDialog(true);
    }
  };

  const handlePasswordSubmit = () => {
    if (passwordInput === "show123" && pendingVisibilityIndex !== null) {
      const newVisible = new Set(visibleQuantities);
      newVisible.add(pendingVisibilityIndex);
      setVisibleQuantities(newVisible);
      setPasswordInput("");
      setShowPasswordDialog(false);
      setPendingVisibilityIndex(null);
    } else {
      toast({
        title: "Incorrect Password",
        description: "Please enter the correct password to view quantities.",
        variant: "destructive"
      });
    }
  };

  const handlePasswordCancel = () => {
    setPasswordInput("");
    setShowPasswordDialog(false);
    setPendingVisibilityIndex(null);
  };

  const renderQuantityCell = (quantity: number, index: number, isEditing: boolean = false) => {
    const isVisible = visibleQuantities.has(index);
    
    if (isEditing) {
      return quantity; // Always show during editing
    }
    
    return (
      <div className="flex items-center justify-end space-x-2">
        <span className={isVisible ? "" : "filter blur-sm select-none"}>
          {quantity}
        </span>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => handleToggleQuantityVisibility(index)}
          className="h-6 w-6 p-0"
        >
          {isVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </Button>
      </div>
    );
  };

  return (
    <div className="w-full max-w-7xl mx-auto py-4 md:py-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 space-y-4 md:space-y-0">
        <div>
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold flex items-center space-x-2">
              <BarChart3 className="w-6 h-6" />
              <span>
                {mode === 'edit' ? 'Edit Stock Count' : mode === 'view' ? 'View Stock Count' : 'Stock Count'}
              </span>
            </h1>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigate('/app/stock-count')}
            >
              ← Back to Dashboard
            </Button>
          </div>
          <p className="text-gray-500">
            {stockReconciliationId && (
              <span className="text-blue-600 font-medium text-lg">
                {sessionData?.purpose || 'Stock Reconciliation'}: {stockReconciliationId}
              </span>
            )}
            {warehouse && !stockReconciliationId && !isMultiWarehouse && (
              <span>Warehouse: {warehouse}</span>
            )}
            {isMultiWarehouse && !stockReconciliationId && (
              <span className="text-blue-600 font-medium">Multi-Warehouse Mode</span>
            )}
            {sessionData?.company && (
              <span className="ml-4 text-gray-600">
                Company: {sessionData.company}
              </span>
            )}
            {!isMultiWarehouse && (sessionData?.warehouse || warehouse || (entries.length > 0 ? entries[0].warehouse : '')) && (
              <span className="ml-4 text-gray-600">
                Warehouse: {sessionData?.warehouse || warehouse || (entries.length > 0 ? entries[0].warehouse : '')}
              </span>
            )}
            {isMultiWarehouse && entries.length > 0 && (
              <span className="ml-4 text-gray-600">
                Warehouses: {[...new Set(entries.map(e => e.warehouse))].join(', ')}
              </span>
            )}
          </p>
        </div>
        <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-2 w-full md:w-auto">
          {mode !== 'view' && (
            <>
              <Button variant="outline" onClick={handleReset} className="w-full md:w-auto">
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset
              </Button>
              <Button onClick={handleSubmitCount} className="w-full md:w-auto">
                <Save className="w-4 h-4 mr-2" />
                {mode === 'edit' ? 'Update Count' : 'Submit Count'}
              </Button>
            </>
          )}
        </div>
      </div>

      {loading ? (
        <Card className="mb-6">
          <CardContent className="p-8 text-center">
            <div className="text-gray-500">Loading session data...</div>
          </CardContent>
        </Card>
      ) : (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Stock Count Session</span>
              <Badge variant="outline">{sessionData?.purpose || purpose}</Badge>
            </CardTitle>
          </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3 md:gap-6 text-center">
            <div>
              <div className="text-2xl md:text-3xl font-bold text-gray-600">{totalItems}</div>
              <div className="text-xs md:text-sm text-gray-500">Total Items</div>
            </div>
            <div>
              <div className="text-2xl md:text-3xl font-bold text-green-600">{matchedItems}</div>
              <div className="text-xs md:text-sm text-gray-500">Matched</div>
            </div>
            <div>
              <div className="text-2xl md:text-3xl font-bold text-red-600">{varianceItems}</div>
              <div className="text-xs md:text-sm text-gray-500">Variance</div>
            </div>
          </div>
        </CardContent>
        </Card>
      )}

      {/* Tabs for Entry and Review */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="entry">Item Entry</TabsTrigger>
          <TabsTrigger value="review" className="relative">
            Review & Submit
            {entries.length > 0 && (
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="entry" className="space-y-6">
          {mode === 'view' ? (
            <Card>
              <CardHeader>
                <CardTitle>Session Items (View Only)</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-500">This session is in view-only mode. You cannot add new items.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {isMultiWarehouse && (
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2">
                      <Package className="w-5 h-5 text-blue-600" />
                      <div>
                        <h3 className="font-medium text-blue-900">Multi-Warehouse Stock Count</h3>
                        <p className="text-sm text-blue-700">Select warehouse for each item individually</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{isMultiWarehouse ? 'Add Items with Warehouses' : 'Scan Items'}</span>
                    {!isMultiWarehouse && warehouse && mode !== 'view' && !stockReconciliationId && (
                      <Button 
                        onClick={handleGetAllItems} 
                        disabled={loadingWarehouseItems}
                        className="ml-4"
                      >
                        {loadingWarehouseItems ? (
                          <>
                            <Package className="w-4 h-4 mr-2 animate-spin" />
                            Loading...
                          </>
                        ) : (
                          <>
                            <Package className="w-4 h-4 mr-2" />
                            Get Items
                          </>
                        )}
                      </Button>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isMultiWarehouse ? (
                    <MultiWarehouseItemSelector 
                      onItemAdded={(item) => {
                        const entry: StockCountEntry = {
                          itemCode: item.itemCode,
                          itemName: item.itemName,
                          warehouse: item.warehouse,
                          currentQty: item.currentQty,
                          actualQty: item.actualQty,
                          difference: item.actualQty - item.currentQty,
                          status: item.actualQty === item.currentQty ? 'matched' : 'variance',
                          uom: item.uom,
                          batch: item.batch,
                          serial: item.serial,
                          serialBatchBundle: item.serialBatchBundle
                        };
                        handleEntryAdded(entry);
                      }}
                    />
                  ) : (
                    <ItemSelector 
                      warehouse={warehouse || sessionData?.warehouse || (entries.length > 0 ? entries[0].warehouse : '')}
                      onItemAdded={(item) => {
                        const entry: StockCountEntry = {
                          itemCode: item.itemCode,
                          itemName: item.itemName,
                          warehouse: item.warehouse || warehouse || sessionData?.warehouse || (entries.length > 0 ? entries[0].warehouse : ''),
                          currentQty: item.currentQty,
                          actualQty: item.actualQty,
                          difference: item.actualQty - item.currentQty,
                          status: item.actualQty === item.currentQty ? 'matched' : 'variance',
                          uom: item.uom,
                          batch: item.batch,
                          serial: item.serial,
                          serialBatchBundle: item.serialBatchBundle
                        };
                        handleEntryAdded(entry);
                      }}
                    />
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="review" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Review Stock Count Entries</CardTitle>
            </CardHeader>
            <CardContent>
              {entries.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No entries added yet. Switch to Item Entry tab to start adding items.</p>
                </div>
              ) : (
                <>
                  {/* Desktop Table View */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-3 font-medium text-gray-700">Item Code</th>
                          <th className="text-left p-3 font-medium text-gray-700">Item Name</th>
                          <th className="text-left p-3 font-medium text-gray-700">Warehouse</th>
                          <th className="text-right p-3 font-medium text-gray-700">Current Qty</th>
                          <th className="text-right p-3 font-medium text-gray-700">Actual Qty</th>
                          <th className="text-right p-3 font-medium text-gray-700">Difference</th>
                          <th className="text-left p-3 font-medium text-gray-700">Status</th>
                          {mode !== 'view' && <th className="text-center p-3 font-medium text-gray-700">Actions</th>}
                        </tr>
                      </thead>
                      <tbody>
                        {entries.map((entry, index) => (
                          <tr key={index} className="border-b hover:bg-gray-50">
                            <td className="p-3 font-medium">{entry.itemCode}</td>
                            <td className="p-3">{entry.itemName}</td>
                            <td className="p-3">{entry.warehouse}</td>
                             <td className="p-3 text-right">
                               {renderQuantityCell(entry.currentQty, index)}
                             </td>
                             <td className="p-3 text-right">
                               {editingIndex === index ? (
                                 <Input
                                   type="number"
                                   value={editingEntry?.actualQty || 0}
                                   onChange={(e) => setEditingEntry(prev => prev ? {
                                     ...prev,
                                     actualQty: parseFloat(e.target.value) || 0
                                   } : null)}
                                   className="w-20 text-right"
                                 />
                               ) : (
                                 renderQuantityCell(entry.actualQty, index)
                               )}
                             </td>
                            <td className="p-3 text-right">
                              {editingIndex === index && editingEntry
                                ? editingEntry.actualQty - editingEntry.currentQty
                                : entry.difference
                              }
                            </td>
                            <td className="p-3">
                              <Badge 
                                variant={editingIndex === index && editingEntry
                                  ? (editingEntry.actualQty === editingEntry.currentQty ? 'default' : 'destructive')
                                  : (entry.status === 'matched' ? 'default' : 'destructive')
                                }
                              >
                                {editingIndex === index && editingEntry
                                  ? (editingEntry.actualQty === editingEntry.currentQty ? 'matched' : 'variance')
                                  : entry.status
                                }
                              </Badge>
                            </td>
                            {mode !== 'view' && (
                              <td className="p-3">
                                <div className="flex items-center justify-center space-x-1">
                                  {editingIndex === index ? (
                                    <>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={handleSaveEdit}
                                        className="h-8 w-8 p-0"
                                      >
                                        <Check className="w-4 h-4" />
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={handleCancelEdit}
                                        className="h-8 w-8 p-0"
                                      >
                                        <X className="w-4 h-4" />
                                      </Button>
                                    </>
                                  ) : (
                                    <>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleEditEntry(index)}
                                        className="h-8 w-8 p-0"
                                      >
                                        <Edit className="w-4 h-4" />
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="destructive"
                                        onClick={() => handleDeleteEntry(index)}
                                        className="h-8 w-8 p-0"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </Button>
                                    </>
                                  )}
                                </div>
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Card View */}
                  <div className="md:hidden space-y-3">
                    {entries.map((entry, index) => (
                      <Card key={index} className="p-4">
                        <div className="space-y-2">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <p className="font-medium text-gray-900">{entry.itemCode}</p>
                              <p className="text-sm text-gray-600">{entry.itemName}</p>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Badge 
                                variant={editingIndex === index && editingEntry
                                  ? (editingEntry.actualQty === editingEntry.currentQty ? 'default' : 'destructive')
                                  : (entry.status === 'matched' ? 'default' : 'destructive')
                                }
                                className="ml-2"
                              >
                                {editingIndex === index && editingEntry
                                  ? (editingEntry.actualQty === editingEntry.currentQty ? 'matched' : 'variance')
                                  : entry.status
                                }
                              </Badge>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <span className="text-gray-600">Warehouse:</span>
                              <span className="ml-1 font-medium">{entry.warehouse}</span>
                            </div>
                            <div>
                              <span className="text-gray-600">UOM:</span>
                              <span className="ml-1 font-medium">{entry.uom}</span>
                            </div>
                             <div className="flex items-center justify-between">
                               <span className="text-gray-600">Current:</span>
                               <div className="flex items-center space-x-1">
                                 <span className={`font-medium ${visibleQuantities.has(index) ? "" : "filter blur-sm select-none"}`}>
                                   {entry.currentQty}
                                 </span>
                                 <Button
                                   size="sm"
                                   variant="ghost"
                                   onClick={() => handleToggleQuantityVisibility(index)}
                                   className="h-5 w-5 p-0"
                                 >
                                   {visibleQuantities.has(index) ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                                 </Button>
                               </div>
                             </div>
                             <div className="flex items-center justify-between">
                               <span className="text-gray-600">Actual:</span>
                               {editingIndex === index ? (
                                 <Input
                                   type="number"
                                   value={editingEntry?.actualQty || 0}
                                   onChange={(e) => setEditingEntry(prev => prev ? {
                                     ...prev,
                                     actualQty: parseFloat(e.target.value) || 0
                                   } : null)}
                                   className="w-20 ml-1 inline-block text-sm"
                                 />
                               ) : (
                                 <div className="flex items-center space-x-1">
                                   <span className={`font-medium ${visibleQuantities.has(index) ? "" : "filter blur-sm select-none"}`}>
                                     {entry.actualQty}
                                   </span>
                                   <Button
                                     size="sm"
                                     variant="ghost"
                                     onClick={() => handleToggleQuantityVisibility(index)}
                                     className="h-5 w-5 p-0"
                                   >
                                     {visibleQuantities.has(index) ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                                   </Button>
                                 </div>
                               )}
                             </div>
                            <div className="col-span-2">
                              <span className="text-gray-600">Difference:</span>
                              <span className={`ml-1 font-medium ${
                                editingIndex === index && editingEntry
                                  ? (editingEntry.actualQty - editingEntry.currentQty !== 0 ? 'text-red-600' : 'text-green-600')
                                  : (entry.difference !== 0 ? 'text-red-600' : 'text-green-600')
                              }`}>
                                {editingIndex === index && editingEntry
                                  ? (editingEntry.actualQty - editingEntry.currentQty > 0 ? '+' : '') + (editingEntry.actualQty - editingEntry.currentQty)
                                  : (entry.difference > 0 ? '+' : '') + entry.difference
                                }
                              </span>
                            </div>
                          </div>
                          {mode !== 'view' && (
                            <div className="flex justify-end space-x-2 pt-2 border-t">
                              {editingIndex === index ? (
                                <>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={handleSaveEdit}
                                  >
                                    <Check className="w-4 h-4 mr-1" />
                                    Save
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={handleCancelEdit}
                                  >
                                    <X className="w-4 h-4 mr-1" />
                                    Cancel
                                  </Button>
                                </>
                              ) : (
                                <>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleEditEntry(index)}
                                  >
                                    <Edit className="w-4 h-4 mr-1" />
                                    Edit
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => handleDeleteEntry(index)}
                                  >
                                    <Trash2 className="w-4 h-4 mr-1" />
                                    Delete
                                  </Button>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      </Card>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Password Dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Enter Password</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Enter the manager password to view quantity information.
            </p>
            <Input
              type="password"
              placeholder="Enter password"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handlePasswordSubmit()}
              className="w-full"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handlePasswordCancel}>
              Cancel
            </Button>
            <Button onClick={handlePasswordSubmit}>
              Show Quantities
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StockCountSession;

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Truck, Package, CheckCircle, FileText, Printer, ArrowRight, RotateCcw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createERPNextAPI } from "@/services/erpnextApi";
import { useToast } from "@/hooks/use-toast";
import { createSerialBatchBundle, checkBatchExists, createBatch } from "@/services/serialBatchBundleApi";
import ReceiveDashboard from "../components/receive/ReceiveDashboard";
import ReceiveForm from "../components/receive/ReceiveForm";
import ReceiveTable from "../components/receive/ReceiveTable";
import POItemsDisplay from "../components/receive/POItemsDisplay";
import WarehouseSelector from "../components/bin-enquiry/WarehouseSelector";

export interface PurchaseOrder {
  poNumber: string;
  supplier: string; // Supplier ID
  supplierName?: string; // Supplier display name
  date: string;
  totalAmount: number;
  status: 'pending' | 'partial' | 'completed';
  items: POItem[];
}

export interface POItem {
  itemCode: string;
  itemName: string;
  orderedQty: number;
  receivedQty: number;
  pendingQty: number;
  uom: string;
  rate: number;
  warehouse: string;
  name?: string; // PO Item ID for linking
  has_batch_no?: boolean;
  has_serial_no?: boolean;
}

export interface ReceiveEntry {
  itemCode: string;
  itemName: string;
  receivedQty: number;
  warehouse: string;
  batch?: string;
  serial?: string;
  uom: string;
  rate: number;
  purchaseOrderItem?: string; // Reference to PO item
}

const Receive = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>("");
  const [receiveEntries, setReceiveEntries] = useState<ReceiveEntry[]>([]);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [poNumber, setPONumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentPurchaseReceipt, setCurrentPurchaseReceipt] = useState<string | null>(null);

  const selectPO = async (purchaseOrder: any) => {
    setLoading(true);
    try {
      console.log('selectPO called with:', purchaseOrder);
      
      // Handle both cases: when called from dashboard (direct PO object) and from selector (transformed object)
      const transformedPO: PurchaseOrder = {
        poNumber: purchaseOrder.number || purchaseOrder.name,
        supplier: purchaseOrder.supplier,
        supplierName: purchaseOrder.supplierName || purchaseOrder.supplier_name || purchaseOrder.supplier,
        date: purchaseOrder.scheduleDate || purchaseOrder.schedule_date || purchaseOrder.transaction_date,
        totalAmount: purchaseOrder.totalValue || purchaseOrder.grand_total || 0,
        status: purchaseOrder.status === 'To Receive' ? 'pending' : 
                purchaseOrder.status === 'Partially Received' ? 'partial' : 'completed',
        items: purchaseOrder.items || []
      };

      console.log('Transformed PO:', transformedPO);
      
      setSelectedPO(transformedPO);
      setActiveTab("receive");
      
      toast({
        title: "Purchase Order Loaded",
        description: `PO ${transformedPO.poNumber} loaded successfully with ${transformedPO.items.length} items`,
      });
      
    } catch (error) {
      console.error('Error processing PO:', error);
      toast({
        title: "Error",
        description: "Failed to process Purchase Order",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const selectDraftReceipt = async (receiptId: string) => {
    setLoading(true);
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

      // Fetch draft receipt data
      const receiptResult = await erpnextAPI.getPurchaseReceipt(receiptId);
      if (!receiptResult.data) {
        toast({
          title: "Purchase Receipt Not Found",
          description: `Receipt ${receiptId} could not be found.`,
          variant: "destructive"
        });
        return;
      }

      const receipt = receiptResult.data;
      
      // If receipt has a purchase order, fetch and load it properly with items
      if (receipt.purchase_order) {
        try {
          console.log('Fetching PO for draft receipt:', receipt.purchase_order);
          
          // Fetch complete PO data with items (same approach as POSelector)
          const poResponse = await fetch(
            `${erpnextAPI.baseURL}/api/resource/Purchase Order/${encodeURIComponent(receipt.purchase_order)}`,
            {
              headers: {
                'Authorization': `token ${erpnextAPI.apiKey}:${erpnextAPI.apiSecret}`,
                'Content-Type': 'application/json',
              }
            }
          );

          if (poResponse.ok) {
            const poResult = await poResponse.json();
            if (poResult?.data) {
              const fullPO = poResult.data;
              console.log('Fetched complete PO data:', fullPO);
              
              // Fetch item tracking information for each item
              const itemsWithTracking = await Promise.all(
                (fullPO.items || []).map(async (item: any) => {
                  try {
                    const itemResponse = await fetch(
                      `${erpnextAPI.baseURL}/api/resource/Item/${encodeURIComponent(item.item_code)}?fields=["has_batch_no","has_serial_no"]`,
                      {
                        headers: {
                          'Authorization': `token ${erpnextAPI.apiKey}:${erpnextAPI.apiSecret}`,
                          'Content-Type': 'application/json',
                        }
                      }
                    );
                    
                    let hasBatch = false;
                    let hasSerial = false;
                    
                    if (itemResponse.ok) {
                      const itemData = await itemResponse.json();
                      hasBatch = itemData.data?.has_batch_no === 1;
                      hasSerial = itemData.data?.has_serial_no === 1;
                    }

                    return {
                      itemCode: item.item_code,
                      itemName: item.item_name || item.item_code,
                      orderedQty: item.qty || 0,
                      receivedQty: item.received_qty || 0,
                      pendingQty: (item.qty || 0) - (item.received_qty || 0),
                      uom: item.uom || 'Nos',
                      rate: item.rate || 0,
                      warehouse: item.warehouse || 'Main Store',
                      name: item.name,
                      has_batch_no: hasBatch,
                      has_serial_no: hasSerial
                    };
                  } catch (error) {
                    console.error('Error fetching item tracking:', error);
                    return {
                      itemCode: item.item_code,
                      itemName: item.item_name || item.item_code,
                      orderedQty: item.qty || 0,
                      receivedQty: item.received_qty || 0,
                      pendingQty: (item.qty || 0) - (item.received_qty || 0),
                      uom: item.uom || 'Nos',
                      rate: item.rate || 0,
                      warehouse: item.warehouse || 'Main Store',
                      name: item.name,
                      has_batch_no: false,
                      has_serial_no: false
                    };
                  }
                })
              );

              // Create the complete PO object with items
              const completePO = {
                ...fullPO,
                items: itemsWithTracking
              };
              
              console.log('Complete PO with tracking:', completePO);
              
              // Now call selectPO with the complete data
              await selectPO(completePO);
            }
          }
        } catch (poError) {
          console.error('Error fetching PO for draft receipt:', poError);
          // Continue without PO if it fails
        }
      }

      // Set current receipt and populate entries
      setCurrentPurchaseReceipt(receiptId);
      
      // Transform receipt items to receive entries
      const entries: ReceiveEntry[] = receipt.items ? receipt.items.map((item: any) => ({
        itemCode: item.item_code,
        itemName: item.item_name || item.item_code,
        receivedQty: item.qty || 0,
        warehouse: item.warehouse || 'Main Store',
        batch: item.batch_no,
        serial: item.serial_no,
        uom: item.uom || 'Nos',
        rate: item.rate || 0,
        purchaseOrderItem: item.purchase_order_item
      })) : [];

      setReceiveEntries(entries);
      setActiveTab("receive");
      
      toast({
        title: "Draft Receipt Loaded",
        description: `Draft receipt ${receiptId} loaded with ${entries.length} items`,
      });
      
    } catch (error) {
      console.error('Error fetching draft receipt:', error);
      toast({
        title: "Error",
        description: "Failed to fetch draft purchase receipt",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePOSearch = () => {
    if (poNumber.trim()) {
      selectPO(poNumber.trim());
    }
  };

  const handleWarehouseSelected = (warehouseCode: string) => {
    setSelectedWarehouse(warehouseCode);
  };

  const addReceiveEntry = async (entry: ReceiveEntry) => {
    console.log('addReceiveEntry called with:', entry);
    
    if (!selectedPO) {
      console.error('No PO selected');
      toast({
        title: "Error",
        description: "No Purchase Order selected",
        variant: "destructive"
      });
      return;
    }

    try {
      const erpnextAPI = await createERPNextAPI();
      if (!erpnextAPI) {
        console.error('ERPNext API not configured');
        toast({
          title: "ERPNext Not Configured",
          description: "Please configure your ERPNext settings.",
          variant: "destructive"
        });
        return;
      }

      // Find the corresponding PO item to get the PO item ID
      const poItem = selectedPO.items.find(item => item.itemCode === entry.itemCode);
      if (!poItem) {
        console.error('PO item not found for item code:', entry.itemCode);
        console.log('Available PO items:', selectedPO.items.map(i => ({ itemCode: i.itemCode, name: i.name })));
        toast({
          title: "Error",
          description: `Item ${entry.itemCode} not found in this Purchase Order`,
          variant: "destructive"
        });
        return;
      }

      // Override warehouse with selected warehouse if one is chosen
      const entryWithWarehouse = {
        ...entry,
        warehouse: selectedWarehouse || entry.warehouse,
        purchaseOrderItem: poItem.name || poItem.itemCode // Use name if available, fallback to itemCode
      };

      console.log('Processing entry with warehouse and PO item reference:', entryWithWarehouse);

      // Get the company from the PO details we fetch
      const poDetails = await erpnextAPI.getPurchaseOrder(selectedPO.poNumber);
      const company = poDetails.data.company;
      const supplierFromPO = poDetails.data.supplier; // Get correct supplier ID

      // Create Serial and Batch Bundle if item has batch or serial tracking
      let serialBatchBundle = null;
      if (entryWithWarehouse.batch || entryWithWarehouse.serial) {
        console.log('Creating Serial and Batch Bundle for batch:', entryWithWarehouse.batch);
        
        // Step 1: Check if batch exists, create if it doesn't (same as Stock Reconciliation)
        const batchExists = await checkBatchExists(entryWithWarehouse.batch, entryWithWarehouse.itemCode);
        if (!batchExists) {
          console.log('Creating new batch:', entryWithWarehouse.batch);
          const batchCreated = await createBatch(entryWithWarehouse.batch, entryWithWarehouse.itemCode);
          if (!batchCreated) {
            toast({
              title: "Error",
              description: `Failed to create batch ${entryWithWarehouse.batch}`,
              variant: "destructive"
            });
            return;
          }
          console.log('New batch created successfully:', entryWithWarehouse.batch);
        }

        // Step 2: Create Serial and Batch Bundle entries (same format as Stock Reconciliation)
        const bundleEntries = [{
          batch_no: entryWithWarehouse.batch,
          qty: entryWithWarehouse.receivedQty,
          warehouse: entryWithWarehouse.warehouse,
          delivered_qty: 0,
          incoming_rate: entryWithWarehouse.rate,
          outgoing_rate: 0,
          stock_value_difference: entryWithWarehouse.rate * entryWithWarehouse.receivedQty,
          is_outward: 0, // Inward transaction for Purchase Receipt
          ...(entryWithWarehouse.serial && { serial_no: entryWithWarehouse.serial })
        }];

        // Step 3: Create bundle data (same format as Stock Reconciliation)
        const bundleData = {
          company: company,
          item_code: entryWithWarehouse.itemCode,
          item_name: entryWithWarehouse.itemName,
          item_group: "Raw Material", // Default item group for Purchase Receipt
          has_serial_no: entryWithWarehouse.serial ? 1 : 0,
          has_batch_no: 1,
          warehouse: entryWithWarehouse.warehouse,
          type_of_transaction: 'Inward',
          total_qty: entryWithWarehouse.receivedQty,
          avg_rate: entryWithWarehouse.rate,
          total_amount: entryWithWarehouse.rate * entryWithWarehouse.receivedQty,
          posting_date: new Date().toISOString().split('T')[0],
          posting_time: new Date().toTimeString().split(' ')[0].slice(0, 8),
          voucher_type: 'Purchase Receipt',
          entries: bundleEntries
        };

        console.log('Creating Serial and Batch Bundle with data:', bundleData);
        const bundleResult = await createSerialBatchBundle(bundleData);
        
        if (bundleResult?.data?.name) {
          serialBatchBundle = bundleResult.data.name;
          console.log('Serial and Batch Bundle created successfully:', serialBatchBundle);
          toast({
            title: "Bundle Created",
            description: `Serial and Batch Bundle ${serialBatchBundle} created for batch ${entryWithWarehouse.batch}`,
          });
        } else {
          throw new Error('Failed to create Serial and Batch Bundle - no bundle name returned');
        }
      }

      // Always add to the same Purchase Receipt instead of creating multiple ones
      if (!currentPurchaseReceipt) {
        console.log('Creating new Purchase Receipt...');
        
        const receiptItem = {
          item_code: entryWithWarehouse.itemCode,
          qty: entryWithWarehouse.receivedQty,
          warehouse: entryWithWarehouse.warehouse,
          rate: entryWithWarehouse.rate,
          uom: entryWithWarehouse.uom,
          purchase_order: selectedPO.poNumber,
          purchase_order_item: entryWithWarehouse.purchaseOrderItem,
          ...(serialBatchBundle && { serial_and_batch_bundle: serialBatchBundle }),
          ...(entryWithWarehouse.serial && !serialBatchBundle && { serial_no: entryWithWarehouse.serial })
        };

        const receiptData = {
          supplier: supplierFromPO, // Use supplier ID from PO details
          company: company,
          posting_date: new Date().toISOString().split('T')[0],
          purchase_order: selectedPO.poNumber,
          set_posting_time: 1,
          items: [receiptItem]
        };

        console.log('Creating new Purchase Receipt with data:', receiptData);
        
        const result = await erpnextAPI.createPurchaseReceipt(receiptData);
        console.log('Purchase Receipt creation result:', result);
        
        if (result.data?.name) {
          setCurrentPurchaseReceipt(result.data.name);
          console.log('Purchase Receipt created successfully:', result.data.name);
          toast({
            title: "Purchase Receipt Created",
            description: `Draft Purchase Receipt ${result.data.name} created successfully`,
          });
        } else {
          console.error('No name returned from receipt creation:', result);
          throw new Error('Purchase Receipt creation failed - no name returned');
        }
      } else {
        console.log('Adding item to existing Purchase Receipt:', currentPurchaseReceipt);
        
        // Fetch current receipt data
        const currentReceiptResponse = await erpnextAPI.getPurchaseReceipt(currentPurchaseReceipt);
        const currentReceiptData = currentReceiptResponse.data;
        
        console.log('Current receipt data:', currentReceiptData);
        
        // Add new item to existing items array - this ensures all batches go into one receipt
        const newItem = {
          item_code: entryWithWarehouse.itemCode,
          qty: entryWithWarehouse.receivedQty,
          warehouse: entryWithWarehouse.warehouse,
          rate: entryWithWarehouse.rate,
          uom: entryWithWarehouse.uom,
          purchase_order: selectedPO.poNumber,
          purchase_order_item: entryWithWarehouse.purchaseOrderItem,
          ...(serialBatchBundle && { serial_and_batch_bundle: serialBatchBundle }),
          ...(entryWithWarehouse.serial && !serialBatchBundle && { serial_no: entryWithWarehouse.serial })
        };
        
        const updatedItems = [...(currentReceiptData.items || []), newItem];
        
        // Update the receipt with new items
        const updateResult = await erpnextAPI.updatePurchaseReceipt(currentPurchaseReceipt, {
          items: updatedItems
        });
        
        console.log('Item added to existing receipt successfully:', updateResult);
        toast({
          title: "Item Added",
          description: `Item ${entryWithWarehouse.itemCode} added to Purchase Receipt ${currentPurchaseReceipt}`,
        });
      }

      // Add to local state
      console.log('Adding entry to local state:', entryWithWarehouse);
      setReceiveEntries(prev => [...prev, entryWithWarehouse]);
      
    } catch (error) {
      console.error('Error in addReceiveEntry:', error);
      toast({
        title: "Error",
        description: `Failed to create/update purchase receipt: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive"
      });
    }
  };

  const updateReceiveEntry = async (index: number, updatedEntry: ReceiveEntry) => {
    try {
      const erpnextAPI = await createERPNextAPI();
      if (!erpnextAPI || !currentPurchaseReceipt) {
        toast({
          title: "Error",
          description: "ERPNext not configured or no active receipt",
          variant: "destructive"
        });
        return;
      }

      // Get current receipt data first
      const currentReceiptResponse = await erpnextAPI.getPurchaseReceipt(currentPurchaseReceipt);
      const currentReceiptData = currentReceiptResponse.data;
      
      // Update the corresponding item in ERPNext with all necessary fields
      const updatedItems = [...(currentReceiptData.items || [])];
      if (updatedItems[index]) {
        const item = updatedItems[index] as any; // Use 'any' to access ERPNext-specific fields
        
        // Preserve all existing fields and only update what's needed
        updatedItems[index] = {
          ...item,
          qty: updatedEntry.receivedQty,
          batch_no: updatedEntry.batch || item.batch_no,
          serial_no: updatedEntry.serial || item.serial_no,
          // Include additional fields that ERPNext might need for validation
          ...(item.received_qty !== undefined && { received_qty: updatedEntry.receivedQty }),
          ...(item.accepted_qty !== undefined && { accepted_qty: updatedEntry.receivedQty }),
          ...(item.rejected_qty !== undefined && { rejected_qty: 0 }),
        };
      }

      // Update the receipt in ERPNext
      await erpnextAPI.updatePurchaseReceipt(currentPurchaseReceipt, {
        items: updatedItems
      });

      // Only update local state after successful ERPNext update
      const updatedEntries = [...receiveEntries];
      updatedEntries[index] = updatedEntry;
      setReceiveEntries(updatedEntries);

      toast({
        title: "Entry Updated",
        description: `${updatedEntry.itemCode} updated successfully`,
      });
    } catch (error) {
      console.error('Error updating entry:', error);
      
      let errorMessage = "Failed to update entry. Please try again.";
      
      // Parse ERPNext specific error messages
      if (error instanceof Error && error.message.includes('QtyMismatchError')) {
        errorMessage = "Quantity validation failed. Please check the received quantity against ERPNext rules.";
      } else if (error instanceof Error && error.message.includes('417')) {
        errorMessage = "ERPNext validation failed. The quantity may not meet business rule requirements.";
      }
      
      toast({
        title: "Update Failed", 
        description: errorMessage,
        variant: "destructive"
      });
    }
  };

  const deleteReceiveEntry = async (index: number) => {
    try {
      const erpnextAPI = await createERPNextAPI();
      if (!erpnextAPI || !currentPurchaseReceipt) {
        toast({
          title: "Error",
          description: "ERPNext not configured or no active receipt",
          variant: "destructive"
        });
        return;
      }

      const entryToDelete = receiveEntries[index];

      // Update local state
      const updatedEntries = receiveEntries.filter((_, i) => i !== index);
      setReceiveEntries(updatedEntries);

      // Update in ERPNext
      const currentReceiptResponse = await erpnextAPI.getPurchaseReceipt(currentPurchaseReceipt);
      const currentReceiptData = currentReceiptResponse.data;
      
      // Remove the corresponding item from ERPNext
      const updatedItems = (currentReceiptData.items || []).filter((_, i) => i !== index);

      await erpnextAPI.updatePurchaseReceipt(currentPurchaseReceipt, {
        items: updatedItems
      });

      toast({
        title: "Entry Deleted",
        description: `${entryToDelete.itemCode} removed from receipt`,
      });
    } catch (error) {
      console.error('Error deleting entry:', error);
      toast({
        title: "Error",
        description: "Failed to delete entry",
        variant: "destructive"
      });
    }
  };

  const submitReceipt = async () => {
    if (!currentPurchaseReceipt) {
      toast({
        title: "No Receipt to Submit",
        description: "Please add items first to create a purchase receipt.",
        variant: "destructive"
      });
      return;
    }
    
    // Show processing toast immediately
    toast({
      title: "Processing Transaction",
      description: "Purchase receipt is being submitted. You may continue your work.",
    });
    
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

      // Submit the Purchase Receipt
      await erpnextAPI.submitPurchaseReceipt(currentPurchaseReceipt);
      
      toast({
        title: "Success",
        description: `Purchase receipt ${currentPurchaseReceipt} submitted successfully!`,
      });
      
      // Reset form
      setReceiveEntries([]);
      setSelectedPO(null);
      setSelectedWarehouse("");
      setCurrentPurchaseReceipt(null);
      setActiveTab("dashboard");
      
    } catch (error) {
      console.error('Error submitting receipt:', error);
      toast({
        title: "Error",
        description: `Failed to submit purchase receipt: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive"
      });
    }
  };

  const resetToDashboard = () => {
    // Clear all state and go back to dashboard
    setSelectedPO(null);
    setSelectedWarehouse("");
    setReceiveEntries([]);
    setCurrentPurchaseReceipt(null);
    setActiveTab("dashboard");
    
    toast({
      title: "Reset Complete",
      description: "Cleared all data and returned to dashboard",
    });
  };

  const shortcuts = [
    { label: 'Print Label', icon: Printer, action: () => navigate('/print-label') },
    { label: 'Request QC', icon: CheckCircle, action: () => navigate('/quality-check') },
    { label: 'Transfer Stock', icon: ArrowRight, action: () => navigate('/stock-entry') }
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Truck className="w-6 h-6 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">Receive</h1>
          </div>
          {(selectedPO || currentPurchaseReceipt) && (
            <div className="flex items-center space-x-2">
              <Button 
                variant="outline" 
                onClick={resetToDashboard}
                className="text-muted-foreground hover:text-destructive"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset
              </Button>
              {selectedPO && (
                <>
                  <Badge variant="outline">{selectedPO.poNumber}</Badge>
                  {currentPurchaseReceipt && (
                    <Badge variant="secondary">PR: {currentPurchaseReceipt}</Badge>
                  )}
                  <Button onClick={submitReceipt} disabled={!currentPurchaseReceipt || loading}>
                    <Package className="w-4 h-4 mr-2" />
                    Submit Receipt
                  </Button>
                </>
              )}
            </div>
          )}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="receive" disabled={!selectedPO && !currentPurchaseReceipt}>
              Receive Items
            </TabsTrigger>
            <TabsTrigger value="review" disabled={receiveEntries.length === 0} className="relative">
              Review & Submit
              {receiveEntries.length > 0 && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></div>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <ReceiveDashboard 
              onSelectPO={selectPO}
              onSelectDraftReceipt={selectDraftReceipt}
              shortcuts={shortcuts}
            />
          </TabsContent>

          <TabsContent value="receive">
            {selectedPO && (
              <div className="space-y-6">
                {/* PO Summary */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      Purchase Order Details
                      <Badge variant={selectedPO.status === 'pending' ? 'destructive' : 'default'}>
                        {selectedPO.status}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">PO Number</p>
                        <p className="font-medium">{selectedPO.poNumber}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Supplier</p>
                        <p className="font-medium">{selectedPO.supplierName || selectedPO.supplier}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Date</p>
                        <p className="font-medium">{selectedPO.date}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Total Amount</p>
                        <p className="font-medium">₹{((selectedPO.totalAmount && typeof selectedPO.totalAmount === 'number') ? selectedPO.totalAmount : 0).toLocaleString()}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Warehouse Selection */}
                <Card>
                  <CardHeader>
                    <CardTitle>Select Receiving Warehouse</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <WarehouseSelector 
                      onWarehouseSelected={handleWarehouseSelected}
                      isLoading={loading}
                    />
                    {selectedWarehouse && (
                      <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
                        <p className="text-sm text-green-800">
                          <strong>Selected Warehouse:</strong> {selectedWarehouse}
                        </p>
                        <p className="text-xs text-green-600 mt-1">
                          All items will be received in this warehouse unless overridden individually.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Receive Form */}
                <ReceiveForm 
                  poItems={selectedPO.items} 
                  onAddEntry={addReceiveEntry}
                  defaultWarehouse={selectedWarehouse}
                />

                {/* Purchase Order Items Table */}
                <Card>
                  <CardHeader>
                    <CardTitle>Purchase Order Items</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <POItemsDisplay items={selectedPO.items} />
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          <TabsContent value="review">
            <Card>
              <CardHeader>
                <CardTitle>Review Receipt</CardTitle>
              </CardHeader>
              <CardContent>
                <ReceiveTable 
                  entries={receiveEntries} 
                  onUpdateEntry={updateReceiveEntry}
                  onDeleteEntry={deleteReceiveEntry}
                  mode="edit"
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Receive;

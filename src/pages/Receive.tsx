
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Truck, Package, CheckCircle, FileText, Printer, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createERPNextAPI } from "@/services/erpnextApi";
import { useToast } from "@/hooks/use-toast";
import ReceiveDashboard from "../components/receive/ReceiveDashboard";
import ReceiveForm from "../components/receive/ReceiveForm";
import ReceiveTable from "../components/receive/ReceiveTable";
import POItemsDisplay from "../components/receive/POItemsDisplay";
import WarehouseSelector from "../components/bin-enquiry/WarehouseSelector";

export interface PurchaseOrder {
  poNumber: string;
  supplier: string;
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

  const selectPO = async (poNumber: string) => {
    setLoading(true);
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

      // Fetch PO data from ERPNext
      const poResult = await erpnextAPI.getPurchaseOrder(poNumber);
      if (!poResult.data) {
        toast({
          title: "Purchase Order Not Found",
          description: `PO ${poNumber} could not be found in ERPNext.`,
          variant: "destructive"
        });
        return;
      }

      const po = poResult.data;
      
      // Transform ERPNext PO data to our interface
      const transformedPO: PurchaseOrder = {
        poNumber: po.name,
        supplier: po.supplier, // Use the supplier field directly from ERPNext
        date: po.schedule_date || po.transaction_date,
        totalAmount: po.grand_total || 0,
        status: po.status === 'To Receive' ? 'pending' : 
                po.status === 'Partially Received' ? 'partial' : 'completed',
        items: po.items ? po.items.map((item: any) => ({
          itemCode: item.item_code,
          itemName: item.item_name,
          orderedQty: item.qty || 0,
          receivedQty: item.received_qty || 0,
          pendingQty: (item.qty || 0) - (item.received_qty || 0),
          uom: item.stock_uom || item.uom,
          rate: item.rate || 0,
          warehouse: item.warehouse || 'Main Store',
          name: item.name // Store the PO item ID for linking
        })) : []
      };

      setSelectedPO(transformedPO);
      setActiveTab("receive");
      
      toast({
        title: "Purchase Order Loaded",
        description: `PO ${poNumber} loaded successfully with ${transformedPO.items.length} items`,
      });
      
    } catch (error) {
      console.error('Error fetching PO:', error);
      toast({
        title: "Error",
        description: "Failed to fetch Purchase Order from ERPNext",
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
      
      // If receipt has a purchase order, load it first
      if (receipt.purchase_order) {
        await selectPO(receipt.purchase_order);
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
      if (!poItem || !poItem.name) {
        console.error('PO item not found or missing ID:', entry.itemCode);
        toast({
          title: "Error",
          description: "Purchase Order item reference not found",
          variant: "destructive"
        });
        return;
      }

      // Override warehouse with selected warehouse if one is chosen
      const entryWithWarehouse = {
        ...entry,
        warehouse: selectedWarehouse || entry.warehouse,
        purchaseOrderItem: poItem.name // Add PO item reference
      };

      console.log('Processing entry with warehouse and PO item reference:', entryWithWarehouse);

      // Get the company from the PO
      const poDetails = await erpnextAPI.getPurchaseOrder(selectedPO.poNumber);
      const company = poDetails.data.company;

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
          ...(entryWithWarehouse.batch && { batch_no: entryWithWarehouse.batch }),
          ...(entryWithWarehouse.serial && { serial_no: entryWithWarehouse.serial })
        };

        const receiptData = {
          supplier: selectedPO.supplier,
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
          ...(entryWithWarehouse.batch && { batch_no: entryWithWarehouse.batch }),
          ...(entryWithWarehouse.serial && { serial_no: entryWithWarehouse.serial })
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
          {selectedPO && (
            <div className="flex items-center space-x-2">
              <Badge variant="outline">{selectedPO.poNumber}</Badge>
              {currentPurchaseReceipt && (
                <Badge variant="secondary">PR: {currentPurchaseReceipt}</Badge>
              )}
              <Button onClick={submitReceipt} disabled={!currentPurchaseReceipt || loading}>
                <Package className="w-4 h-4 mr-2" />
                Submit Receipt
              </Button>
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
                        <p className="font-medium">{selectedPO.supplier}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Date</p>
                        <p className="font-medium">{selectedPO.date}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Total Amount</p>
                        <p className="font-medium">₹{selectedPO.totalAmount.toLocaleString()}</p>
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
              </div>
            )}
          </TabsContent>

          <TabsContent value="review">
            <Card>
              <CardHeader>
                <CardTitle>Review Receipt</CardTitle>
              </CardHeader>
              <CardContent>
                <ReceiveTable entries={receiveEntries} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Receive;

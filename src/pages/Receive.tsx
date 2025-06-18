
import { useState, useEffect } from "react";
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
        supplier: po.supplier_name || po.supplier,
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
          warehouse: item.warehouse || 'Main Store'
        })) : []
      };

      setSelectedPO(transformedPO);
      setActiveTab("receive");
      
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

      // Override warehouse with selected warehouse if one is chosen
      const entryWithWarehouse = {
        ...entry,
        warehouse: selectedWarehouse || entry.warehouse
      };

      console.log('Processing entry with warehouse:', entryWithWarehouse);

      // If this is the first item, create a new Purchase Receipt
      if (!currentPurchaseReceipt) {
        console.log('Creating new Purchase Receipt...');
        
        const receiptData = {
          supplier: selectedPO.supplier,
          posting_date: new Date().toISOString().split('T')[0],
          purchase_order: selectedPO.poNumber,
          set_posting_time: 1,
          items: [{
            item_code: entryWithWarehouse.itemCode,
            qty: entryWithWarehouse.receivedQty,
            warehouse: entryWithWarehouse.warehouse,
            rate: entryWithWarehouse.rate,
            uom: entryWithWarehouse.uom,
            ...(entryWithWarehouse.batch && { batch_no: entryWithWarehouse.batch }),
            ...(entryWithWarehouse.serial && { serial_no: entryWithWarehouse.serial })
          }]
        };

        console.log('Creating new Purchase Receipt with data:', receiptData);
        
        const result = await erpnextAPI.purchase.createPurchaseReceipt(receiptData);
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
        
        // Fetch current receipt data using standard fetch API since we can't access protected getHeaders
        const storedApiKey = localStorage.getItem('erpnextApiKey');
        const storedApiSecret = localStorage.getItem('erpnextApiSecret');
        const authString = btoa(`${storedApiKey}:${storedApiSecret}`);
        
        const currentReceiptResponse = await fetch(`${erpnextAPI.baseURL}/api/resource/Purchase Receipt/${currentPurchaseReceipt}`, {
          headers: {
            'Authorization': `Basic ${authString}`,
            'Content-Type': 'application/json'
          },
        });
        
        if (!currentReceiptResponse.ok) {
          throw new Error('Failed to fetch current receipt data');
        }
        
        const currentReceiptData = await currentReceiptResponse.json();
        console.log('Current receipt data:', currentReceiptData);
        
        // Add new item to existing items array
        const newItem = {
          item_code: entryWithWarehouse.itemCode,
          qty: entryWithWarehouse.receivedQty,
          warehouse: entryWithWarehouse.warehouse,
          rate: entryWithWarehouse.rate,
          uom: entryWithWarehouse.uom,
          ...(entryWithWarehouse.batch && { batch_no: entryWithWarehouse.batch }),
          ...(entryWithWarehouse.serial && { serial_no: entryWithWarehouse.serial })
        };
        
        const updatedItems = [...(currentReceiptData.data.items || []), newItem];
        
        // Update the receipt with new items
        const updateResult = await erpnextAPI.purchase.updatePurchaseReceipt(currentPurchaseReceipt, {
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
      await erpnextAPI.purchase.submitPurchaseReceipt(currentPurchaseReceipt);
      
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
            <TabsTrigger value="receive" disabled={!selectedPO}>
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

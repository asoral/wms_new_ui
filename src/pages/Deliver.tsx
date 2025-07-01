
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Truck, Package, CheckCircle, FileText, Printer, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createERPNextAPI } from "@/services/erpnextApi";
import { useToast } from "@/hooks/use-toast";
import SalesOrderSearch from "../components/deliver/SalesOrderSearch";
import DeliveryForm from "../components/deliver/DeliveryForm";
import DraftDeliveryNotes from "../components/deliver/DraftDeliveryNotes";

export interface SalesOrder {
  name: string;
  customer: string;
  customer_name?: string;
  transaction_date: string;
  delivery_date?: string;
  status: string;
  grand_total: number;
  per_delivered?: number;
  items?: SalesOrderItem[];
}

export interface SalesOrderItem {
  name: string;
  item_code: string;
  item_name: string;
  qty: number;
  delivered_qty?: number;
  pending_qty?: number;
  uom: string;
  rate: number;
  warehouse: string;
  description?: string;
  stock_qty?: number;
  conversion_factor?: number;
}

export interface DeliveryEntry {
  itemCode: string;
  itemName: string;
  deliveredQty: number;
  warehouse: string;
  batch?: string;
  serial?: string;
  serialBatchBundle?: string;
  uom: string;
  rate: number;
  salesOrderItem?: string;
  useTraditionalEntry?: boolean;
}

const Deliver = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedSO, setSelectedSO] = useState<SalesOrder | null>(null);
  const [deliveryEntries, setDeliveryEntries] = useState<DeliveryEntry[]>([]);
  const [activeTab, setActiveTab] = useState("search");
  const [loading, setLoading] = useState(false);
  const [currentDeliveryNote, setCurrentDeliveryNote] = useState<string | null>(null);

  const selectSO = async (soNumber: string) => {
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

      // Fetch SO data from ERPNext
      const soResult = await erpnextAPI.getSalesOrder(soNumber);
      if (!soResult.data) {
        toast({
          title: "Sales Order Not Found",
          description: `SO ${soNumber} could not be found in ERPNext.`,
          variant: "destructive"
        });
        return;
      }

      const so = soResult.data;
      
      // Transform ERPNext SO data to our interface
      const transformedSO: SalesOrder = {
        name: so.name,
        customer: so.customer,
        customer_name: so.customer_name,
        transaction_date: so.transaction_date,
        delivery_date: so.delivery_date,
        status: so.status,
        grand_total: so.grand_total || 0,
        per_delivered: so.per_delivered || 0,
        items: so.items ? so.items.map((item: any) => ({
          name: item.name,
          item_code: item.item_code,
          item_name: item.item_name,
          qty: item.qty || 0,
          delivered_qty: item.delivered_qty || 0,
          pending_qty: (item.qty || 0) - (item.delivered_qty || 0),
          uom: item.stock_uom || item.uom,
          rate: item.rate || 0,
          warehouse: item.warehouse || 'Main Store',
          description: item.description,
          stock_qty: item.stock_qty,
          conversion_factor: item.conversion_factor || 1
        })) : []
      };

      setSelectedSO(transformedSO);
      setActiveTab("deliver");
      
      toast({
        title: "Sales Order Loaded",
        description: `SO ${soNumber} loaded successfully with ${transformedSO.items?.length || 0} items`,
      });
      
    } catch (error) {
      console.error('Error fetching SO:', error);
      toast({
        title: "Error",
        description: "Failed to fetch Sales Order from ERPNext",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const selectDraftDeliveryNote = async (deliveryNoteId: string) => {
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

      // Fetch draft delivery note data
      const deliveryNoteResult = await erpnextAPI.getDeliveryNote(deliveryNoteId);
      if (!deliveryNoteResult.data) {
        toast({
          title: "Delivery Note Not Found",
          description: `Delivery Note ${deliveryNoteId} could not be found.`,
          variant: "destructive"
        });
        return;
      }

      const deliveryNote = deliveryNoteResult.data;
      
      // If delivery note has a sales order, load it first
      if (deliveryNote.sales_order) {
        await selectSO(deliveryNote.sales_order);
      }

      // Set current delivery note and populate entries
      setCurrentDeliveryNote(deliveryNoteId);
      
      // Transform delivery note items to delivery entries
      const entries: DeliveryEntry[] = deliveryNote.items ? deliveryNote.items.map((item: any) => ({
        itemCode: item.item_code,
        itemName: item.item_name || item.item_code,
        deliveredQty: item.qty || 0,
        warehouse: item.warehouse || 'Main Store',
        batch: item.batch_no,
        serial: item.serial_no,
        serialBatchBundle: item.serial_batch_bundle,
        uom: item.uom || 'Nos',
        rate: item.rate || 0,
        salesOrderItem: item.so_detail,
        useTraditionalEntry: item.batch_no || item.serial_no ? true : false
      })) : [];

      setDeliveryEntries(entries);
      setActiveTab("deliver");
      
      toast({
        title: "Draft Delivery Note Loaded",
        description: `Draft delivery note ${deliveryNoteId} loaded with ${entries.length} items`,
      });
      
    } catch (error) {
      console.error('Error fetching draft delivery note:', error);
      toast({
        title: "Error",
        description: "Failed to fetch draft delivery note",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const addDeliveryEntry = async (entry: DeliveryEntry) => {
    console.log('addDeliveryEntry called with:', entry);
    
    if (!selectedSO) {
      console.error('No SO selected');
      toast({
        title: "Error",
        description: "No Sales Order selected",
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

      // Find the corresponding SO item to get the SO item ID
      const soItem = selectedSO.items?.find(item => item.item_code === entry.itemCode);
      if (!soItem || !soItem.name) {
        console.error('SO item not found or missing ID:', entry.itemCode);
        toast({
          title: "Error",
          description: "Sales Order item reference not found",
          variant: "destructive"
        });
        return;
      }

      const entryWithSOItem = {
        ...entry,
        salesOrderItem: soItem.name
      };

      console.log('Processing entry with SO item reference:', entryWithSOItem);

      // Get the company from the SO
      const soDetails = await erpnextAPI.getSalesOrder(selectedSO.name);
      const company = soDetails.data.company;

      if (!currentDeliveryNote) {
        console.log('Creating new Delivery Note...');
        
        const deliveryNoteItem = {
          item_code: entryWithSOItem.itemCode,
          qty: entryWithSOItem.deliveredQty,
          warehouse: entryWithSOItem.warehouse,
          rate: entryWithSOItem.rate,
          uom: entryWithSOItem.uom,
          sales_order: selectedSO.name,
          so_detail: entryWithSOItem.salesOrderItem,
          ...(entryWithSOItem.batch && { batch_no: entryWithSOItem.batch }),
          ...(entryWithSOItem.serial && { serial_no: entryWithSOItem.serial }),
          ...(entryWithSOItem.serialBatchBundle && { serial_batch_bundle: entryWithSOItem.serialBatchBundle })
        };

        const deliveryNoteData = {
          customer: selectedSO.customer,
          company: company,
          posting_date: new Date().toISOString().split('T')[0],
          sales_order: selectedSO.name,
          set_posting_time: 1,
          items: [deliveryNoteItem]
        };

        console.log('Creating new Delivery Note with data:', deliveryNoteData);
        
        const result = await erpnextAPI.createDeliveryNote(deliveryNoteData);
        console.log('Delivery Note creation result:', result);
        
        if (result.data?.name) {
          setCurrentDeliveryNote(result.data.name);
          console.log('Delivery Note created successfully:', result.data.name);
          toast({
            title: "Delivery Note Created",
            description: `Draft Delivery Note ${result.data.name} created successfully`,
          });
        } else {
          console.error('No name returned from delivery note creation:', result);
          throw new Error('Delivery Note creation failed - no name returned');
        }
      } else {
        console.log('Adding item to existing Delivery Note:', currentDeliveryNote);
        
        // Get current delivery note data
        const currentDeliveryNoteResponse = await erpnextAPI.getDeliveryNote(currentDeliveryNote);
        const currentDeliveryNoteData = currentDeliveryNoteResponse.data;
        
        console.log('Current delivery note data:', currentDeliveryNoteData);
        
        // Add new item to existing items array
        const newItem = {
          item_code: entryWithSOItem.itemCode,
          qty: entryWithSOItem.deliveredQty,
          warehouse: entryWithSOItem.warehouse,
          rate: entryWithSOItem.rate,
          uom: entryWithSOItem.uom,
          sales_order: selectedSO.name,
          so_detail: entryWithSOItem.salesOrderItem,
          ...(entryWithSOItem.batch && { batch_no: entryWithSOItem.batch }),
          ...(entryWithSOItem.serial && { serial_no: entryWithSOItem.serial }),
          ...(entryWithSOItem.serialBatchBundle && { serial_batch_bundle: entryWithSOItem.serialBatchBundle })
        };
        
        const updatedItems = [...(currentDeliveryNoteData.items || []), newItem];
        
        // Update the delivery note with new items
        const updateResult = await erpnextAPI.updateDeliveryNote(currentDeliveryNote, {
          items: updatedItems
        });
        
        console.log('Item added to existing delivery note successfully:', updateResult);
        toast({
          title: "Item Added",
          description: `Item ${entryWithSOItem.itemCode} added to Delivery Note ${currentDeliveryNote}`,
        });
      }

      // Add to local state
      console.log('Adding entry to local state:', entryWithSOItem);
      setDeliveryEntries(prev => [...prev, entryWithSOItem]);
      
    } catch (error) {
      console.error('Error in addDeliveryEntry:', error);
      toast({
        title: "Error",
        description: `Failed to create/update delivery note: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive"
      });
    }
  };

  const submitDeliveryNote = async () => {
    if (!currentDeliveryNote) {
      toast({
        title: "No Delivery Note to Submit",
        description: "Please add items first to create a delivery note.",
        variant: "destructive"
      });
      return;
    }
    
    // Show processing toast immediately
    toast({
      title: "Processing Transaction",
      description: "Delivery note is being submitted. You may continue your work.",
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

      // Submit the Delivery Note
      await erpnextAPI.submitDeliveryNote(currentDeliveryNote);
      
      toast({
        title: "Success",
        description: `Delivery note ${currentDeliveryNote} submitted successfully!`,
      });
      
      // Reset form
      setDeliveryEntries([]);
      setSelectedSO(null);
      setCurrentDeliveryNote(null);
      setActiveTab("search");
      
    } catch (error) {
      console.error('Error submitting delivery note:', error);
      toast({
        title: "Error",
        description: `Failed to submit delivery note: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive"
      });
    }
  };

  const shortcuts = [
    { label: 'Print Label', icon: Printer, action: () => navigate('/print-label') },
    { label: 'Quality Check', icon: CheckCircle, action: () => navigate('/quality-check') },
    { label: 'Transfer Stock', icon: ArrowRight, action: () => navigate('/stock-entry') }
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Truck className="w-6 h-6 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">Deliver</h1>
          </div>
          {selectedSO && (
            <div className="flex items-center space-x-2">
              <Badge variant="outline">{selectedSO.name}</Badge>
              {currentDeliveryNote && (
                <Badge variant="secondary">DN: {currentDeliveryNote}</Badge>
              )}
              <Button onClick={submitDeliveryNote} disabled={!currentDeliveryNote || loading}>
                <Package className="w-4 h-4 mr-2" />
                Submit Delivery
              </Button>
            </div>
          )}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="search">Search Orders</TabsTrigger>
            <TabsTrigger value="deliver" disabled={!selectedSO && !currentDeliveryNote}>
              Deliver Items
            </TabsTrigger>
            <TabsTrigger value="drafts">Draft Notes</TabsTrigger>
          </TabsList>

          <TabsContent value="search">
            <SalesOrderSearch 
              onSelectSO={selectSO}
              shortcuts={shortcuts}
            />
          </TabsContent>

          <TabsContent value="deliver">
            {selectedSO && (
              <DeliveryForm 
                salesOrder={selectedSO}
                onAddEntry={addDeliveryEntry}
                deliveryEntries={deliveryEntries}
              />
            )}
          </TabsContent>

          <TabsContent value="drafts">
            <DraftDeliveryNotes onSelectDraftNote={selectDraftDeliveryNote} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Deliver;

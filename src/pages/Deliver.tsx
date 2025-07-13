import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createERPNextAPI } from "@/services/erpnextApi";
import { useToast } from "@/hooks/use-toast";
import { Truck, ArrowLeft, Plus, Package, FileText, CheckCircle } from "lucide-react";
import DeliverDashboard from "@/components/deliver/DeliverDashboard";
import SOItemsDisplay from "@/components/deliver/SOItemsDisplay";
import EnhancedDeliveryItemScanner from "@/components/deliver/EnhancedDeliveryItemScanner";
import DeliveryTable from "@/components/deliver/DeliveryTable";
import { SalesOrder, SalesOrderOption, DashboardData, DeliveryEntry } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Deliver = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<'dashboard' | 'deliver' | 'review'>('dashboard');
  const [selectedSalesOrder, setSelectedSalesOrder] = useState<SalesOrder | null>(null);
  const [deliveryEntries, setDeliveryEntries] = useState<DeliveryEntry[]>([]);
  const [draftDeliveryNote, setDraftDeliveryNote] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const [dashboardData, setDashboardData] = useState<DashboardData>({
    pendingOrders: 0,
    readyToShip: 0,
    overdue: 0,
    deliveredToday: 0,
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
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

      // Set default dashboard data since the get_counts API doesn't exist
      setDashboardData({
        pendingOrders: 0,
        readyToShip: 0,
        overdue: 0,
        deliveredToday: 0,
      });

    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data from ERPNext",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSalesOrder = async (salesOrder: any) => {
    try {
      setLoading(true);
      const erpnextAPI = await createERPNextAPI();
      if (!erpnextAPI) {
        toast({
          title: "ERPNext Not Configured",
          description: "Please configure your ERPNext settings.",
          variant: "destructive"
        });
        return;
      }

      // Fetch full sales order details including items
      const response = await erpnextAPI.getSalesOrder(salesOrder.name);
      
      if (response?.data) {
        const soData = response.data;
        const transformedSO: SalesOrder = {
          id: soData.name,
          name: soData.name,
          number: soData.name,
          customer: soData.customer,
          customer_name: soData.customer_name || soData.customer, // Use customer_name if available
          status: soData.status,
          totalValue: soData.grand_total || 0,
          grand_total: soData.grand_total || 0,
          totalItems: soData.items?.length || 0,
          percentDelivered: soData.per_delivered || 0,
          items: soData.items?.map((item: any) => ({
            name: item.name, // ERPNext Sales Order Item unique identifier
            item_code: item.item_code,
            itemCode: item.item_code,
            item_name: item.item_name,
            itemName: item.item_name,
            qty: item.qty || 0,
            orderedQty: item.qty || 0,
            delivered_qty: item.delivered_qty || 0,
            deliveredQty: item.delivered_qty || 0,
            pending_qty: (item.qty || 0) - (item.delivered_qty || 0),
            pendingQty: (item.qty || 0) - (item.delivered_qty || 0),
            rate: item.rate || 0,
            stock_uom: item.uom || item.stock_uom || 'Nos',
            uom: item.uom || item.stock_uom || 'Nos',
            warehouse: item.warehouse || 'Main Store'
          })) || []
        };

        console.log('Selected SO with items:', transformedSO);
        setSelectedSalesOrder(transformedSO);
        setCurrentStep('deliver');
      } else {
        toast({
          title: "Error",
          description: "No sales order data found",
          variant: "destructive"
        });
      }

    } catch (error) {
      console.error('Error fetching sales order:', error);
      toast({
        title: "Error",
        description: "Failed to fetch sales order details",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddDeliveryEntry = async (entry: DeliveryEntry) => {
    const newEntries = [...deliveryEntries, entry];
    setDeliveryEntries(newEntries);
    
    // Create draft delivery note on first item if not already created
    if (!draftDeliveryNote && newEntries.length === 1) {
      await createDraftDeliveryNote(newEntries);
    } else if (draftDeliveryNote) {
      // Update existing draft with new item
      await updateDraftDeliveryNote(newEntries);
    }
  };

  const createDraftDeliveryNote = async (entries: DeliveryEntry[]) => {
    if (!selectedSalesOrder) return;
    
    try {
      setLoading(true);
      const erpnextAPI = await createERPNextAPI();
      if (!erpnextAPI) return;

      const { getUserDefaultCompany } = await import('@/services/erpnextApi');
      const defaultCompany = await getUserDefaultCompany();
      
      const deliveryNoteData = {
        company: defaultCompany || selectedSalesOrder.customer,
        customer: selectedSalesOrder.customer,
        items: await Promise.all(entries.map(async (entry) => {
          const soItem = selectedSalesOrder.items.find(item => item.itemCode === entry.itemCode);
          const itemData: any = {
            item_code: entry.itemCode,
            qty: entry.deliveredQty,
            rate: entry.rate,
            warehouse: entry.warehouse,
            against_sales_order: selectedSalesOrder.name,
            so_detail: soItem?.name || '', // Correct field name for Sales Order Item
          };
          
          // Handle batches for ERPNext v15+ Serial and Batch Bundle
          if (entry.batches && entry.batches.length > 0) {
            // Create a Serial and Batch Bundle for this item
            console.log('Creating Serial and Batch Bundle for batches:', entry.batches);
            
            try {
              const { createSerialBatchBundle } = await import('@/services/serialBatchBundleApi');
              
              const bundleEntries = entry.batches.map(batch => ({
                batch_no: batch.batch_no,
                qty: batch.qty,
                warehouse: entry.warehouse,
                delivered_qty: 0,
                incoming_rate: 0,
                outgoing_rate: 0,
                stock_value_difference: 0,
                is_outward: 1
              }));

              const bundleData = {
                item_code: entry.itemCode,
                item_name: entry.itemName,
                item_group: "All Item Groups", // Default item group
                has_serial_no: 0,
                has_batch_no: 1,
                warehouse: entry.warehouse,
                type_of_transaction: 'Outward',
                total_qty: entry.deliveredQty,
                avg_rate: entry.rate,
                total_amount: entry.deliveredQty * entry.rate,
                posting_date: new Date().toISOString().split('T')[0],
                posting_time: new Date().toTimeString().split(' ')[0].slice(0, 8),
                voucher_type: 'Delivery Note',
                entries: bundleEntries
              };

              const bundleResult = await createSerialBatchBundle(bundleData);
              if (bundleResult?.data?.name) {
                itemData.serial_and_batch_bundle = bundleResult.data.name;
                console.log('Created Serial and Batch Bundle:', bundleResult.data.name);
              } else {
                console.error('Failed to create Serial and Batch Bundle');
                // Fallback to old batch_no method
                itemData.batch_no = entry.batches[0].batch_no;
              }
            } catch (error) {
              console.error('Error creating Serial and Batch Bundle:', error);
              // Fallback to old batch_no method
              itemData.batch_no = entry.batches[0].batch_no;
            }
          } else if (entry.batch) {
            itemData.batch_no = entry.batch;
          }
          
          if (entry.serial) {
            itemData.serial_no = entry.serial;
          }
          
          return itemData;
        }))
      };

      const response = await erpnextAPI.createDeliveryNote(deliveryNoteData);
      
      if (response?.data) {
        setDraftDeliveryNote(response.data.name);
        toast({
          title: "Draft Delivery Note Created",
          description: `Draft ${response.data.name} created successfully.`,
        });
      }
    } catch (error) {
      console.error('Failed to create draft delivery note:', error);
      toast({
        title: "Error",
        description: "Failed to create draft delivery note",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateDraftDeliveryNote = async (entries: DeliveryEntry[]) => {
    if (!selectedSalesOrder || !draftDeliveryNote) return;
    
    try {
      setLoading(true);
      const erpnextAPI = await createERPNextAPI();
      if (!erpnextAPI) return;

      const { getUserDefaultCompany } = await import('@/services/erpnextApi');
      const defaultCompany = await getUserDefaultCompany();
      
      const deliveryNoteData = {
        company: defaultCompany || selectedSalesOrder.customer,
        customer: selectedSalesOrder.customer,
        items: entries.map(entry => {
          const soItem = selectedSalesOrder.items.find(item => item.itemCode === entry.itemCode);
          return {
            item_code: entry.itemCode,
            qty: entry.deliveredQty,
            rate: entry.rate,
            warehouse: entry.warehouse,
            against_sales_order: selectedSalesOrder.name,
            so_detail: soItem?.name || '', // Correct field name for Sales Order Item
            ...(entry.batch && { batch_no: entry.batch }),
            ...(entry.serial && { serial_no: entry.serial })
          };
        })
      };

      await erpnextAPI.updateDeliveryNote(draftDeliveryNote, deliveryNoteData);
      
      toast({
        title: "Draft Updated",
        description: `Draft ${draftDeliveryNote} updated with new item.`,
      });
    } catch (error) {
      console.error('Failed to update draft delivery note:', error);
      toast({
        title: "Error", 
        description: "Failed to update draft delivery note",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBackToDashboard = () => {
    setCurrentStep('dashboard');
    setSelectedSalesOrder(null);
    setDeliveryEntries([]);
    setDraftDeliveryNote(null);
  };

  const handleProceedToReview = () => {
    if (deliveryEntries.length === 0) {
      toast({
        title: "No Items Added",
        description: "Please add items to the delivery before proceeding.",
        variant: "destructive"
      });
      return;
    }
    setCurrentStep('review');
  };

  const handleSubmitDelivery = async () => {
    if (!selectedSalesOrder || deliveryEntries.length === 0) {
      toast({
        title: "Invalid Delivery",
        description: "Please ensure a sales order is selected and items are added.",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);
      const erpnextAPI = await createERPNextAPI();
      if (!erpnextAPI) {
        toast({
          title: "ERPNext Not Configured",
          description: "Please configure your ERPNext settings.",
          variant: "destructive"
        });
        return;
      }

      if (draftDeliveryNote) {
        // Submit the existing draft delivery note
        const response = await erpnextAPI.submitDeliveryNote(draftDeliveryNote);
        
        if (response?.data) {
          toast({
            title: "Delivery Note Submitted",
            description: `Delivery Note ${draftDeliveryNote} submitted successfully.`,
          });
          
          // Reset to dashboard
          handleBackToDashboard();
        }
      } else {
        // Create and submit new delivery note
        const { getUserDefaultCompany } = await import('@/services/erpnextApi');
        const defaultCompany = await getUserDefaultCompany();
        
        const deliveryNoteData = {
          company: defaultCompany || selectedSalesOrder.customer,
          customer: selectedSalesOrder.customer,
          items: deliveryEntries.map(entry => {
            const soItem = selectedSalesOrder.items.find(item => item.itemCode === entry.itemCode);
            return {
              item_code: entry.itemCode,
              qty: entry.deliveredQty,
              rate: entry.rate,
              warehouse: entry.warehouse,
              against_sales_order: selectedSalesOrder.name,
              so_detail: soItem?.name || '', // Correct field name for Sales Order Item
              ...(entry.batch && { batch_no: entry.batch }),
              ...(entry.serial && { serial_no: entry.serial })
            };
          })
        };

        const response = await erpnextAPI.createDeliveryNote(deliveryNoteData);

        if (response?.data) {
          // Submit the newly created delivery note
          await erpnextAPI.submitDeliveryNote(response.data.name);
          
          toast({
            title: "Delivery Note Created & Submitted",
            description: `Delivery Note ${response.data.name} created and submitted successfully.`,
          });
          
          // Reset to dashboard
          handleBackToDashboard();
        }
      }
    } catch (error) {
      console.error('Failed to submit delivery note:', error);
      toast({
        title: "Error",
        description: `Failed to submit delivery note: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViewAllSalesOrders = () => {
    // Navigate to sales orders list
    navigate('/sales-orders');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="container mx-auto py-6">
      {currentStep === 'dashboard' ? (
        <>
          <div className="mb-6">
            <h1 className="text-2xl font-bold flex items-center space-x-2">
              <Truck className="w-6 h-6" />
              <span>Deliver</span>
            </h1>
            <p className="text-gray-500">Create a new delivery for a sales order.</p>
          </div>
          <DeliverDashboard
            onSelectSalesOrder={handleSelectSalesOrder}
            onSelectDraftDelivery={async (draftId, salesOrderNumber) => {
              try {
                setLoading(true);
                const erpnextAPI = await createERPNextAPI();
                if (!erpnextAPI) return;

                // Load the draft delivery note data
                const draftResponse = await erpnextAPI.getDeliveryNote(draftId);
                if (draftResponse?.data) {
                  const draftData = draftResponse.data;
                  
                  // Load associated sales order if available
                  if (salesOrderNumber) {
                    const soResponse = await erpnextAPI.getSalesOrder(salesOrderNumber);
                    if (soResponse?.data) {
                      const soData = soResponse.data;
                      const transformedSO: SalesOrder = {
                        id: soData.name,
                        name: soData.name,
                        number: soData.name,
                        customer: soData.customer,
                        customer_name: soData.customer_name || soData.customer,
                        status: soData.status,
                        totalValue: soData.grand_total || 0,
                        grand_total: soData.grand_total || 0,
                        totalItems: soData.items?.length || 0,
                        percentDelivered: soData.per_delivered || 0,
                        items: soData.items?.map((item: any) => ({
                          name: item.name,
                          item_code: item.item_code,
                          itemCode: item.item_code,
                          item_name: item.item_name,
                          itemName: item.item_name,
                          qty: item.qty || 0,
                          orderedQty: item.qty || 0,
                          delivered_qty: item.delivered_qty || 0,
                          deliveredQty: item.delivered_qty || 0,
                          pending_qty: (item.qty || 0) - (item.delivered_qty || 0),
                          pendingQty: (item.qty || 0) - (item.delivered_qty || 0),
                          rate: item.rate || 0,
                          stock_uom: item.uom || item.stock_uom || 'Nos',
                          uom: item.uom || item.stock_uom || 'Nos',
                          warehouse: item.warehouse || 'Main Store'
                        })) || []
                      };
                      setSelectedSalesOrder(transformedSO);
                    }
                  }

                  // Convert draft delivery note items to delivery entries
                  const draftEntries: DeliveryEntry[] = draftData.items?.map((item: any) => ({
                    itemCode: item.item_code,
                    itemName: item.item_name,
                    deliveredQty: item.qty,
                    rate: item.rate,
                    warehouse: item.warehouse,
                    batch: item.batch_no,
                    serial: item.serial_no
                  })) || [];

                  setDeliveryEntries(draftEntries);
                  setDraftDeliveryNote(draftId);
                  setCurrentStep('review'); // Go directly to review tab for draft continuation
                  
                  toast({
                    title: "Draft Loaded",
                    description: `Draft delivery note ${draftId} loaded for review and submission.`,
                  });
                }
              } catch (error) {
                console.error('Error loading draft delivery note:', error);
                toast({
                  title: "Error",
                  description: "Failed to load draft delivery note",
                  variant: "destructive"
                });
              } finally {
                setLoading(false);
              }
            }}
            shortcuts={[
              {
                label: "View All SOs",
                icon: FileText,
                action: handleViewAllSalesOrders
              },
              {
                label: "Print Label",
                icon: Package,
                action: () => navigate('/print-label')
              },
              {
                label: "Quality Check",
                icon: CheckCircle,
                action: () => navigate('/quality-check')
              }
            ]}
          />
        </>
      ) : (
        <>
          {/* Header with back button and sales order info */}
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button
                  variant="ghost"
                  onClick={handleBackToDashboard}
                  className="flex items-center space-x-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to Dashboard</span>
                </Button>
                <div className="h-6 w-px bg-gray-300" />
                <div className="flex items-center space-x-2">
                  <Truck className="w-5 h-5 text-blue-600" />
                  <span className="font-semibold">Deliver</span>
                </div>
              </div>
            </div>
            {selectedSalesOrder && (
              <div className="mt-4 text-sm text-gray-600">
                Selected: {selectedSalesOrder.number} - {selectedSalesOrder.customer_name || selectedSalesOrder.customer}
              </div>
            )}
          </div>

          {/* Main Content with Tabs */}
          <Tabs value={currentStep} onValueChange={(value) => setCurrentStep(value as any)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="dashboard" disabled>Dashboard</TabsTrigger>
              <TabsTrigger value="deliver">Deliver Items</TabsTrigger>
              <TabsTrigger value="review">Review & Submit</TabsTrigger>
            </TabsList>

            <TabsContent value="deliver" className="mt-6">
              {selectedSalesOrder && (
                <div className="space-y-6">
                  {/* Selected Sales Order Summary */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Selected Sales Order</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-4 gap-4 text-center">
                        <div>
                          <div className="text-sm text-gray-600">Order:</div>
                          <div className="font-semibold text-blue-600">{selectedSalesOrder.number}</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-600">Customer:</div>
                          <div className="font-semibold">{selectedSalesOrder.customer_name || selectedSalesOrder.customer}</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-600">Amount:</div>
                          <div className="font-semibold">{formatCurrency(selectedSalesOrder.totalValue)}</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-600">Draft DN:</div>
                          <div className={`text-sm ${draftDeliveryNote ? 'text-green-600 font-medium' : 'text-gray-500'}`}>
                            {draftDeliveryNote || 'Will create after first item'}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Delivery Item Scanner */}
                  <EnhancedDeliveryItemScanner
                    soItems={selectedSalesOrder.items}
                    onAddEntry={handleAddDeliveryEntry}
                  />

                  {/* Items in Sales Order Card View */}
                  <SOItemsDisplay 
                    items={selectedSalesOrder.items}
                    salesOrderNumber={selectedSalesOrder.number}
                  />
                </div>
              )}
            </TabsContent>

            <TabsContent value="review" className="mt-6">
              <div className="space-y-6">
                {/* Review Summary */}
                <Card>
                  <CardHeader>
                    <CardTitle>Review Delivery</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 mb-6">Review the items and submit the delivery note.</p>
                    
                    {deliveryEntries.length > 0 && (
                       <DeliveryTable entries={deliveryEntries} onRemove={(index) => {
                         setDeliveryEntries(prev => prev.filter((_, i) => i !== index));
                       }} />
                    )}
                    
                    <div className="flex justify-between items-center mt-6">
                      <Button
                        variant="outline"
                        onClick={() => setCurrentStep('deliver')}
                      >
                        Back to Edit
                      </Button>
                      <Button
                        onClick={handleSubmitDelivery}
                        disabled={loading || deliveryEntries.length === 0}
                      >
                        {loading ? 'Submitting...' : `Submit Delivery (${deliveryEntries.length} items)`}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
};

export default Deliver;
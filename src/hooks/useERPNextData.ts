
import { useState, useEffect } from 'react';
import { createERPNextAPI, getUserDefaultCompany } from '@/services/erpnextApi';
import { useToast } from '@/hooks/use-toast';

export const useERPNextData = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchData = async (dataType: string, filters?: any[], company?: string) => {
    try {
      setLoading(true);
      const erpnextAPI = await createERPNextAPI();
      if (!erpnextAPI) {
        throw new Error('ERPNext API not configured');
      }

      const defaultCompany = company || await getUserDefaultCompany();
      let response;

      switch (dataType) {
        case 'items':
          response = await erpnextAPI.getItems(filters, 1000);
          break;
        case 'sales_orders':
          response = await erpnextAPI.getSalesOrders(filters, defaultCompany);
          break;
        case 'material_requests':
          response = await erpnextAPI.getMaterialRequests(filters, defaultCompany);
          break;
        case 'pick_lists':
          response = await erpnextAPI.getPickLists(filters, defaultCompany);
          break;
        case 'delivery_notes':
          response = await erpnextAPI.getDeliveryNotes(filters, defaultCompany);
          break;
        case 'purchase_orders':
          response = await erpnextAPI.getPurchaseOrders(filters, defaultCompany);
          break;
        case 'purchase_receipts':
          response = await erpnextAPI.getPurchaseReceipts(filters, defaultCompany);
          break;
        case 'stock_entries':
          response = await erpnextAPI.getStockEntries(filters, defaultCompany);
          break;
        case 'stock_reconciliations':
          response = await erpnextAPI.getStockReconciliations(filters);
          break;
        case 'warehouses':
          response = await erpnextAPI.getWarehouses(filters, defaultCompany);
          break;
        case 'packing_slips':
          response = await erpnextAPI.getPackingSlips(filters);
          break;
        case 'quality_inspections':
          response = await erpnextAPI.getQualityInspections(filters);
          break;
        case 'product_bundles':
          response = await erpnextAPI.getProductBundles(filters);
          break;
        default:
          throw new Error(`Unknown data type: ${dataType}`);
      }

      return response?.data || [];
    } catch (error) {
      console.error(`Error fetching ${dataType}:`, error);
      toast({
        title: "Error",
        description: `Failed to fetch ${dataType}`,
        variant: "destructive"
      });
      return [];
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    fetchData
  };
};

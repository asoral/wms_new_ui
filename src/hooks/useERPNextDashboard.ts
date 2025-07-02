
import { useState, useEffect } from 'react';
import { createERPNextAPI, getUserDefaultCompany } from '@/services/erpnextApi';
import { useToast } from '@/hooks/use-toast';

interface DashboardData {
  salesOrders: any[];
  materialRequests: any[];
  pickLists: any[];
  deliveryNotes: any[];
  stockEntries: any[];
  purchaseOrders: any[];
  purchaseReceipts: any[];
}

export const useERPNextDashboard = () => {
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    salesOrders: [],
    materialRequests: [],
    pickLists: [],
    deliveryNotes: [],
    stockEntries: [],
    purchaseOrders: [],
    purchaseReceipts: []
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const erpnextAPI = await createERPNextAPI();
      if (!erpnextAPI) {
        throw new Error('ERPNext API not configured');
      }

      const company = await getUserDefaultCompany();
      
      // Fetch all data in parallel
      const [
        salesOrdersResponse,
        materialRequestsResponse,
        pickListsResponse,
        deliveryNotesResponse,
        stockEntriesResponse,
        purchaseOrdersResponse,
        purchaseReceiptsResponse
      ] = await Promise.all([
        erpnextAPI.getSalesOrders(undefined, company),
        erpnextAPI.getMaterialRequests(undefined, company),
        erpnextAPI.getPickLists(undefined, company),
        erpnextAPI.getDeliveryNotes(undefined, company),
        erpnextAPI.getStockEntries(undefined, company),
        erpnextAPI.getPurchaseOrders(undefined, company),
        erpnextAPI.getPurchaseReceipts(undefined, company)
      ]);

      setDashboardData({
        salesOrders: salesOrdersResponse?.data || [],
        materialRequests: materialRequestsResponse?.data || [],
        pickLists: pickListsResponse?.data || [],
        deliveryNotes: deliveryNotesResponse?.data || [],
        stockEntries: stockEntriesResponse?.data || [],
        purchaseOrders: purchaseOrdersResponse?.data || [],
        purchaseReceipts: purchaseReceiptsResponse?.data || []
      });

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch dashboard data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  return {
    dashboardData,
    loading,
    refreshDashboard: fetchDashboardData
  };
};

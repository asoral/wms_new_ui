
import { useState, useEffect } from 'react';
import { createERPNextAPI, getUserDefaultCompany } from '@/services/erpnextApi';
import { useToast } from './use-toast';

interface DashboardData {
  warehouses: number;
  salesOrders: number;
  totalStock: number;
  pendingDelivery: number;
  pendingReceive: number;
  itemsOutOfStock: number;
  company: string | null;
  isLoading: boolean;
  error: string | null;
}

export function useERPNextDashboard() {
  const [data, setData] = useState<DashboardData>({
    warehouses: 0,
    salesOrders: 0,
    totalStock: 0,
    pendingDelivery: 0,
    pendingReceive: 0,
    itemsOutOfStock: 0,
    company: null,
    isLoading: true,
    error: null,
  });

  const { toast } = useToast();

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        const api = await createERPNextAPI();
        if (!api) {
          setData(prev => ({ ...prev, isLoading: false, error: 'ERPNext API not configured' }));
          return;
        }

        const company = await getUserDefaultCompany();

        // Fetch data in parallel
        const [warehousesRes, salesOrdersRes, stockBalanceRes] = await Promise.all([
          api.warehouse.getWarehouses({}, company),
          api.sales.getSalesOrders({}, company),
          api.stock.getStockBalance() // No parameters needed for getting all stock
        ]);

        // Calculate dashboard metrics
        const warehousesCount = warehousesRes?.data?.length || 0;
        const salesOrdersCount = salesOrdersRes?.data?.length || 0;
        
        // Process stock data
        let totalStock = 0;
        let outOfStockCount = 0;
        
        if (stockBalanceRes?.data) {
          for (const item of stockBalanceRes.data) {
            const qty = parseFloat(String(item.actual_qty || 0));
            totalStock += qty;
            if (qty <= 0) outOfStockCount++;
          }
        }

        // Get pending deliveries from sales orders
        let pendingDeliveryCount = 0;
        if (salesOrdersRes?.data) {
          pendingDeliveryCount = salesOrdersRes.data.filter(
            (so: any) => ['To Deliver', 'To Deliver and Bill'].includes(so.status)
          ).length;
        }

        // Get pending purchase receipts
        const purchaseOrdersRes = await api.purchase.getPurchaseOrders({ 
          status: ['To Receive', 'To Receive and Bill']
        }, company);
        
        const pendingReceiveCount = purchaseOrdersRes?.data?.length || 0;

        setData({
          warehouses: warehousesCount,
          salesOrders: salesOrdersCount,
          totalStock,
          pendingDelivery: pendingDeliveryCount,
          pendingReceive: pendingReceiveCount,
          itemsOutOfStock: outOfStockCount,
          company,
          isLoading: false,
          error: null,
        });

      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setData(prev => ({
          ...prev,
          isLoading: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        }));
        
        toast({
          title: 'Error',
          description: 'Failed to load dashboard data from ERPNext',
          variant: 'destructive',
        });
      }
    }

    fetchDashboardData();
  }, [toast]);

  return data;
}

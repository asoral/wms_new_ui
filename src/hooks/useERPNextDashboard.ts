
import { useState, useEffect } from 'react';
import { createERPNextAPI } from '@/services/erpnextApi';

interface DashboardStats {
  totalItems: number;
  lowStockItems: number;
  pendingOrders: number;
  totalWarehouses: number;
}

export const useERPNextDashboard = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalItems: 0,
    lowStockItems: 0,
    pendingOrders: 0,
    totalWarehouses: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        const erpnextAPI = await createERPNextAPI();
        
        if (!erpnextAPI) {
          setError('ERPNext API not configured');
          return;
        }

        // Fetch various data for dashboard using the new API structure
        const [itemsResponse, warehousesResponse, ordersResponse, stockBalanceResponse] = await Promise.all([
          erpnextAPI.getItems(),
          erpnextAPI.getWarehouses(),
          erpnextAPI.getSalesOrders([['status', '=', 'Draft']]),
          erpnextAPI.getStockBalance({ actual_qty: ['<', 10] })
        ]);

        setStats({
          totalItems: itemsResponse.data?.length || 0,
          lowStockItems: stockBalanceResponse.data?.length || 0,
          pendingOrders: ordersResponse.data?.length || 0,
          totalWarehouses: warehousesResponse.data?.length || 0
        });
        
        setError(null);
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch dashboard data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  return { stats, isLoading, error };
};

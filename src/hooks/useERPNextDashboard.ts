
import { useState, useEffect } from 'react';
import { createERPNextAPI, getUserDefaultCompany } from '@/services/erpnextApi';

interface DashboardData {
  totalItems: number;
  totalWarehouses: number;
  lowStockItems: number;
  pendingDeliveries: number;
  recentActivity: any[];
}

export function useERPNextDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log('Fetching dashboard data...');

        const erpnextAPI = await createERPNextAPI();
        if (!erpnextAPI) {
          throw new Error('ERPNext API not configured. Please configure your ERPNext settings in the Profile page.');
        }

        // Get user's default company
        const defaultCompany = await getUserDefaultCompany();
        console.log('Default company:', defaultCompany);

        // Fetch multiple data points in parallel with better error handling
        const results = await Promise.allSettled([
          erpnextAPI.getItems(undefined, ['name', 'item_name'], defaultCompany || undefined),
          erpnextAPI.getWarehouses(undefined, defaultCompany || undefined),
          erpnextAPI.getStockBalance(undefined, defaultCompany || undefined),
          erpnextAPI.getSalesOrders([['status', '=', 'To Deliver']], defaultCompany || undefined),
        ]);

        console.log('Dashboard API results:', results);

        // Process results with better error handling
        const totalItems = results[0].status === 'fulfilled' && results[0].value?.data ? results[0].value.data.length : 0;
        const totalWarehouses = results[1].status === 'fulfilled' && results[1].value?.data ? results[1].value.data.length : 0;
        
        // Calculate low stock items (items with qty < 10)
        const lowStockItems = results[2].status === 'fulfilled' && results[2].value?.data
          ? results[2].value.data.filter((item: any) => (item.actual_qty || 0) < 10).length
          : 0;
        
        const pendingDeliveries = results[3].status === 'fulfilled' && results[3].value?.data ? results[3].value.data.length : 0;

        // Get recent activity from various sources
        const recentActivityResults = await Promise.allSettled([
          erpnextAPI.getPurchaseReceipts(undefined, defaultCompany || undefined),
          erpnextAPI.getDeliveryNotes(undefined, defaultCompany || undefined),
          erpnextAPI.getStockEntries(undefined, defaultCompany || undefined),
        ]);

        const recentActivity: any[] = [];
        
        recentActivityResults.forEach((result, index) => {
          if (result.status === 'fulfilled' && result.value?.data) {
            const docTypes = ['Purchase Receipt', 'Delivery Note', 'Stock Entry'];
            result.value.data.slice(0, 8).forEach((doc: any) => {
              recentActivity.push({
                ...doc,
                doctype: docTypes[index],
                modified: doc.modified || doc.posting_date || doc.creation
              });
            });
          }
        });

        // Sort by modified date and limit to 25
        recentActivity.sort((a, b) => new Date(b.modified || '').getTime() - new Date(a.modified || '').getTime());
        const limitedActivity = recentActivity.slice(0, 25);

        console.log('Dashboard data processed:', {
          totalItems,
          totalWarehouses,
          lowStockItems,
          pendingDeliveries,
          recentActivityCount: limitedActivity.length
        });

        setData({
          totalItems,
          totalWarehouses,
          lowStockItems,
          pendingDeliveries,
          recentActivity: limitedActivity
        });

      } catch (err) {
        console.error('Dashboard fetch error:', err);
        const errorMessage = err instanceof Error ? err.message : 'An error occurred while fetching dashboard data';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  return { data, loading, error };
}

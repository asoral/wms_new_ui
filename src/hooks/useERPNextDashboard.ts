
import { useState, useEffect } from 'react';
import { createERPNextAPI } from '@/services/erpnextApi';

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

        const erpnextAPI = await createERPNextAPI();

        // Fetch multiple data points in parallel
        const [
          itemsResult,
          warehousesResult,
          stockResult,
          salesOrdersResult,
          recentActivityResults
        ] = await Promise.allSettled([
          erpnextAPI.getItems(),
          erpnextAPI.getWarehouses(),
          erpnextAPI.getStockBalance(),
          erpnextAPI.getSalesOrders({ filters: [['status', '=', 'To Deliver']] }),
          Promise.allSettled([
            erpnextAPI.getPurchaseReceipts({ 
              filters: [], 
              fields: ['name', 'posting_date', 'supplier', 'grand_total', 'modified'],
              limit_page_length: 5,
              order_by: 'modified desc'
            }),
            erpnextAPI.getDeliveryNotes({ 
              filters: [], 
              fields: ['name', 'posting_date', 'customer', 'grand_total', 'modified'],
              limit_page_length: 5,
              order_by: 'modified desc'
            }),
            erpnextAPI.getStockEntries({ 
              filters: [], 
              fields: ['name', 'posting_date', 'stock_entry_type', 'modified'],
              limit_page_length: 5,
              order_by: 'modified desc'
            }),
            erpnextAPI.getStockReconciliations({ 
              filters: [], 
              fields: ['name', 'posting_date', 'purpose', 'modified'],
              limit_page_length: 5,
              order_by: 'modified desc'
            }),
            erpnextAPI.getPickLists({ 
              filters: [], 
              fields: ['name', 'date', 'purpose', 'modified'],
              limit_page_length: 5,
              order_by: 'modified desc'
            }),
            erpnextAPI.getPackingSlips({ 
              filters: [], 
              fields: ['name', 'date', 'delivery_note', 'modified'],
              limit_page_length: 5,
              order_by: 'modified desc'
            })
          ])
        ]);

        // Process results
        const totalItems = itemsResult.status === 'fulfilled' ? itemsResult.value.data?.length || 0 : 0;
        const totalWarehouses = warehousesResult.status === 'fulfilled' ? warehousesResult.value.data?.length || 0 : 0;
        
        // Calculate low stock items (items with qty < 10)
        const lowStockItems = stockResult.status === 'fulfilled' 
          ? stockResult.value.data?.filter((item: any) => (item.actual_qty || 0) < 10).length || 0 
          : 0;
        
        const pendingDeliveries = salesOrdersResult.status === 'fulfilled' ? salesOrdersResult.value.data?.length || 0 : 0;

        // Combine and sort recent activity
        const recentActivity: any[] = [];
        
        if (recentActivityResults.status === 'fulfilled') {
          recentActivityResults.value.forEach((result, index) => {
            if (result.status === 'fulfilled' && result.value.data) {
              const docTypes = ['Purchase Receipt', 'Delivery Note', 'Stock Entry', 'Stock Reconciliation', 'Pick List', 'Packing Slip'];
              result.value.data.forEach((doc: any) => {
                recentActivity.push({
                  ...doc,
                  doctype: docTypes[index],
                  modified: doc.modified || doc.posting_date || doc.date
                });
              });
            }
          });
        }

        // Sort by modified date and limit to 25
        recentActivity.sort((a, b) => new Date(b.modified).getTime() - new Date(a.modified).getTime());
        const limitedActivity = recentActivity.slice(0, 25);

        setData({
          totalItems,
          totalWarehouses,
          lowStockItems,
          pendingDeliveries,
          recentActivity: limitedActivity
        });

      } catch (err) {
        console.error('Dashboard fetch error:', err);
        setError(err instanceof Error ? err.message : 'An error occurred while fetching dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  return { data, loading, error };
}

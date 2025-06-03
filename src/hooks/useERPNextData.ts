
import { useState, useEffect } from 'react';
import { createERPNextAPI } from '@/services/erpnextApi';
import { offlineStorage } from '@/services/offlineStorage';

export function useERPNextData<T>(
  endpoint: string,
  filters?: any,
  cacheKey?: string,
  cacheTTL: number = 300000 // 5 minutes default
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Check cache first if cache key is provided
        if (cacheKey) {
          const cachedData = await offlineStorage.getCachedData(cacheKey);
          if (cachedData) {
            setData(cachedData);
            setLoading(false);
            return;
          }
        }

        // Fetch from ERPNext API
        const erpnextAPI = await createERPNextAPI();
        if (!erpnextAPI) {
          throw new Error('ERPNext API not configured');
        }

        let result;
        
        // Dynamic method calling based on endpoint
        switch (endpoint) {
          case 'items':
            result = await erpnextAPI.getItems(filters);
            break;
          case 'warehouses':
            result = await erpnextAPI.getWarehouses(filters);
            break;
          case 'stock-balance':
            result = await erpnextAPI.getStockBalance(filters);
            break;
          case 'sales-orders':
            result = await erpnextAPI.getSalesOrders(filters);
            break;
          case 'delivery-notes':
            result = await erpnextAPI.getDeliveryNotes(filters);
            break;
          case 'purchase-orders':
            result = await erpnextAPI.getPurchaseOrders(filters);
            break;
          case 'purchase-receipts':
            result = await erpnextAPI.getPurchaseReceipts(filters);
            break;
          case 'material-requests':
            result = await erpnextAPI.getMaterialRequests(filters);
            break;
          case 'stock-entries':
            result = await erpnextAPI.getStockEntries(filters);
            break;
          case 'pick-lists':
            result = await erpnextAPI.getPickLists(filters);
            break;
          case 'packing-slips':
            result = await erpnextAPI.getPackingSlips(filters);
            break;
          case 'quality-inspections':
            result = await erpnextAPI.getQualityInspections(filters);
            break;
          case 'product-bundles':
            result = await erpnextAPI.getProductBundles(filters);
            break;
          default:
            throw new Error(`Unknown endpoint: ${endpoint}`);
        }

        setData(result.data);

        // Cache the result if cache key is provided
        if (cacheKey) {
          await offlineStorage.cacheData(cacheKey, result.data, cacheTTL);
        }

      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        
        // Try to load from cache if available
        if (cacheKey) {
          const cachedData = await offlineStorage.getCachedData(cacheKey);
          if (cachedData) {
            setData(cachedData);
            setError('Using cached data - connection failed');
          }
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [endpoint, JSON.stringify(filters), cacheKey, cacheTTL]);

  return { data, loading, error };
}

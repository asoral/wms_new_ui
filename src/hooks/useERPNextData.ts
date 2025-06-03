
import { useState, useEffect } from 'react';
import { createERPNextAPI, getUserDefaultCompany } from '@/services/erpnextApi';
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

        // Get user's default company
        const defaultCompany = await getUserDefaultCompany();

        let result;
        
        // Dynamic method calling based on endpoint
        switch (endpoint) {
          case 'items':
            result = await erpnextAPI.getItems(filters, undefined, defaultCompany || undefined);
            break;
          case 'warehouses':
            result = await erpnextAPI.getWarehouses(filters, defaultCompany || undefined);
            break;
          case 'stock-balance':
            result = await erpnextAPI.getStockBalance(filters, defaultCompany || undefined);
            break;
          case 'sales-orders':
            result = await erpnextAPI.getSalesOrders(filters, defaultCompany || undefined);
            break;
          case 'delivery-notes':
            result = await erpnextAPI.getDeliveryNotes(filters, defaultCompany || undefined);
            break;
          case 'purchase-orders':
            result = await erpnextAPI.getPurchaseOrders(filters, defaultCompany || undefined);
            break;
          case 'purchase-receipts':
            result = await erpnextAPI.getPurchaseReceipts(filters, defaultCompany || undefined);
            break;
          case 'material-requests':
            result = await erpnextAPI.getMaterialRequests(filters, defaultCompany || undefined);
            break;
          case 'stock-entries':
            result = await erpnextAPI.getStockEntries(filters, defaultCompany || undefined);
            break;
          case 'pick-lists':
            result = await erpnextAPI.getPickLists(filters, defaultCompany || undefined);
            break;
          case 'packing-slips':
            result = await erpnextAPI.getPackingSlips(filters, defaultCompany || undefined);
            break;
          case 'quality-inspections':
            result = await erpnextAPI.getQualityInspections(filters, defaultCompany || undefined);
            break;
          case 'product-bundles':
            result = await erpnextAPI.getProductBundles(filters, defaultCompany || undefined);
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


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
        console.log('Using company for API call:', defaultCompany);

        let result;
        
        // Dynamic method calling based on endpoint with corrected API calls
        switch (endpoint) {
          case 'items':
            result = await erpnextAPI.getItems(filters, 20);
            break;
          case 'warehouses':
            result = await erpnextAPI.getWarehouses(filters, undefined, 20);
            break;
          case 'stock-balance':
            result = await erpnextAPI.getStockBalance(undefined, defaultCompany || undefined);
            break;
          case 'sales-orders':
            result = await erpnextAPI.getSalesOrders(filters, undefined, 20);
            break;
          case 'delivery-notes':
            result = await erpnextAPI.getDeliveryNotes(filters, defaultCompany || undefined, 20);
            break;
          case 'purchase-orders':
            result = await erpnextAPI.getPurchaseOrders(filters, undefined, 20);
            break;
          case 'purchase-receipts':
            result = await erpnextAPI.getPurchaseReceipts(filters, defaultCompany || undefined, 20);
            break;
          case 'material-requests':
            result = await erpnextAPI.getMaterialRequests(filters, defaultCompany || undefined, 20);
            break;
          case 'stock-entries':
            result = await erpnextAPI.getStockEntries(filters, defaultCompany || undefined, 20);
            break;
          case 'pick-lists':
            result = await erpnextAPI.getPickLists(filters, defaultCompany || undefined, 20);
            break;
          case 'packing-slips':
            result = await erpnextAPI.getPackingSlips(filters, defaultCompany || undefined, 20);
            break;
          case 'quality-inspections':
            result = await erpnextAPI.getQualityInspections(filters, defaultCompany || undefined, 20);
            break;
          case 'product-bundles':
            result = await erpnextAPI.getProductBundles(filters, defaultCompany || undefined, 20);
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

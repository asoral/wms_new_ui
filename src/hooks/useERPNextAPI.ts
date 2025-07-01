
import { useState, useCallback } from 'react';
import { createERPNextAPI } from '@/services/erpnextApi';
import { useToast } from '@/hooks/use-toast';

export const useERPNextAPI = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const callAPI = useCallback(async <T>(
    apiCall: (api: any) => Promise<T>,
    errorMessage: string = "API call failed"
  ): Promise<T | null> => {
    try {
      setLoading(true);
      const erpnextAPI = await createERPNextAPI();
      if (!erpnextAPI) {
        toast({
          title: "ERPNext Not Configured",
          description: "Please configure your ERPNext settings in the Profile page.",
          variant: "destructive"
        });
        return null;
      }

      return await apiCall(erpnextAPI);
    } catch (error) {
      console.error('API Error:', error);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  return {
    loading,
    callAPI
  };
};

export const useSalesOrderAPI = () => {
  const { callAPI, loading } = useERPNextAPI();

  const getSalesOrders = useCallback((filters?: any, company?: string) => {
    return callAPI(
      (api) => api.getSalesOrders(filters, company),
      "Failed to fetch sales orders"
    );
  }, [callAPI]);

  const getSalesOrder = useCallback((soNumber: string) => {
    return callAPI(
      (api) => api.getSalesOrder(soNumber),
      "Failed to fetch sales order details"
    );
  }, [callAPI]);

  const searchSalesOrders = useCallback((searchTerm: string, company?: string) => {
    return callAPI(
      (api) => api.searchSalesOrders(searchTerm, company),
      "Failed to search sales orders"
    );
  }, [callAPI]);

  const createDeliveryNote = useCallback((deliveryData: any) => {
    return callAPI(
      (api) => api.createDeliveryNote(deliveryData),
      "Failed to create delivery note"
    );
  }, [callAPI]);

  return {
    loading,
    getSalesOrders,
    getSalesOrder,
    searchSalesOrders,
    createDeliveryNote
  };
};

export const useItemAPI = () => {
  const { callAPI, loading } = useERPNextAPI();

  const searchItems = useCallback((searchTerm: string) => {
    return callAPI(
      (api) => api.searchItems(searchTerm),
      "Failed to search items"
    );
  }, [callAPI]);

  const getItemDetails = useCallback((itemCode: string) => {
    return callAPI(
      (api) => api.getItemDetails(itemCode),
      "Failed to fetch item details"
    );
  }, [callAPI]);

  const searchItemsByBarcode = useCallback((barcode: string) => {
    return callAPI(
      (api) => api.searchItems(barcode),
      "Failed to search items by barcode"
    );
  }, [callAPI]);

  return {
    loading,
    searchItems,
    getItemDetails,
    searchItemsByBarcode
  };
};

export const useStockAPI = () => {
  const { callAPI, loading } = useERPNextAPI();

  const getStockBalance = useCallback((filters?: any) => {
    return callAPI(
      (api) => api.getStockBalance(filters),
      "Failed to fetch stock balance"
    );
  }, [callAPI]);

  const getCurrentStock = useCallback((itemCode: string, warehouse: string) => {
    return callAPI(
      (api) => api.getCurrentStock(itemCode, warehouse),
      "Failed to fetch current stock"
    );
  }, [callAPI]);

  const createStockEntry = useCallback((stockEntryData: any) => {
    return callAPI(
      (api) => api.createStockEntry(stockEntryData),
      "Failed to create stock entry"
    );
  }, [callAPI]);

  const getStockEntries = useCallback((filters?: any) => {
    return callAPI(
      (api) => api.getStockEntries(filters),
      "Failed to fetch stock entries"
    );
  }, [callAPI]);

  const submitStockEntry = useCallback((stockEntryName: string) => {
    return callAPI(
      (api) => api.submitStockEntry(stockEntryName),
      "Failed to submit stock entry"
    );
  }, [callAPI]);

  return {
    loading,
    getStockBalance,
    getCurrentStock,
    createStockEntry,
    getStockEntries,
    submitStockEntry
  };
};

export const useMaterialRequestAPI = () => {
  const { callAPI, loading } = useERPNextAPI();

  const getMaterialRequests = useCallback((filters?: any) => {
    return callAPI(
      (api) => api.getMaterialRequests(filters),
      "Failed to fetch material requests"
    );
  }, [callAPI]);

  const getMaterialRequest = useCallback((mrNumber: string) => {
    return callAPI(
      (api) => api.getMaterialRequest(mrNumber),
      "Failed to fetch material request"
    );
  }, [callAPI]);

  const createMaterialRequest = useCallback((requestData: any) => {
    return callAPI(
      (api) => api.createMaterialRequest(requestData),
      "Failed to create material request"
    );
  }, [callAPI]);

  const updateMaterialRequest = useCallback((name: string, requestData: any) => {
    return callAPI(
      (api) => api.updateMaterialRequest(name, requestData),
      "Failed to update material request"
    );
  }, [callAPI]);

  return {
    loading,
    getMaterialRequests,
    getMaterialRequest,
    createMaterialRequest,
    updateMaterialRequest
  };
};

export const usePickListAPI = () => {
  const { callAPI, loading } = useERPNextAPI();

  const getPickLists = useCallback((filters?: any) => {
    return callAPI(
      (api) => api.getPickLists(filters),
      "Failed to fetch pick lists"
    );
  }, [callAPI]);

  const getPickList = useCallback((pickListName: string) => {
    return callAPI(
      (api) => api.getPickList(pickListName),
      "Failed to fetch pick list"
    );
  }, [callAPI]);

  const getPickListItems = useCallback((pickListName: string) => {
    return callAPI(
      (api) => api.getPickListItems(pickListName),
      "Failed to fetch pick list items"
    );
  }, [callAPI]);

  const createPickListFromDocument = useCallback((documentType: string, documentName: string) => {
    return callAPI(
      (api) => api.createPickListFromDocument(documentType, documentName),
      "Failed to create pick list"
    );
  }, [callAPI]);

  const getPickListAnalytics = useCallback((company?: string) => {
    return callAPI(
      (api) => api.getPickListAnalytics(company),
      "Failed to fetch pick list analytics"
    );
  }, [callAPI]);

  return {
    loading,
    getPickLists,
    getPickList,
    getPickListItems,
    createPickListFromDocument,
    getPickListAnalytics
  };
};

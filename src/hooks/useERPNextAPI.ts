
import { useState, useCallback } from 'react';
import { createERPNextAPI } from '@/services/erpnextApi';
import { useToast } from '@/hooks/use-toast';

interface APIResponse<T = any> {
  data?: T;
  error?: string;
}

export const useERPNextAPI = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const callAPI = useCallback(async <T>(
    apiCall: (api: any) => Promise<T>,
    errorMessage: string = "API call failed"
  ): Promise<APIResponse<T>> => {
    try {
      setLoading(true);
      const erpnextAPI = await createERPNextAPI();
      if (!erpnextAPI) {
        toast({
          title: "ERPNext Not Configured",
          description: "Please configure your ERPNext settings in the Profile page.",
          variant: "destructive"
        });
        return { error: "ERPNext not configured" };
      }

      const data = await apiCall(erpnextAPI);
      return { data };
    } catch (error) {
      console.error('API Error:', error);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
      return { error: errorMessage };
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

  const getAllWarehouseItems = useCallback((warehouse: string, company?: string) => {
    return callAPI(
      (api) => api.stockAPI.getAllWarehouseItems(warehouse, company),
      `Failed to fetch all items for warehouse ${warehouse}`
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
    getAllWarehouseItems,
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

  const getPickLists = useCallback((filters?: any, company?: string, limitPageLength?: number, orderBy?: string) => {
    return callAPI(
      (api) => api.getPickLists(filters, company, limitPageLength, orderBy),
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

  const deletePickList = useCallback((name: string) => {
    return callAPI(
      (api) => api.deletePickList(name),
      "Failed to delete pick list"
    );
  }, [callAPI]);

  return {
    loading,
    getPickLists,
    getPickList,
    getPickListItems,
    createPickListFromDocument,
    getPickListAnalytics,
    deletePickList
  };
};

export const useWorkOrderAPI = () => {
  const { callAPI, loading } = useERPNextAPI();

  const getWorkOrders = useCallback(async (filters?: any, company?: string, limitPageLength?: number) => {
    return callAPI(
      async (api) => await api.getWorkOrders(filters, company, limitPageLength),
      "Failed to fetch work orders"
    );
  }, [callAPI]);

  const getWorkOrder = useCallback(async (name: string) => {
    return callAPI(
      async (api) => await api.getWorkOrder(name),
      "Failed to fetch work order"
    );
  }, [callAPI]);

  const searchWorkOrders = useCallback(async (searchTerm: string, company?: string, limitPageLength?: number) => {
    return callAPI(
      async (api) => await api.searchWorkOrders(searchTerm, company, limitPageLength),
      "Failed to search work orders"
    );
  }, [callAPI]);

  return {
    loading,
    getWorkOrders,
    getWorkOrder,
    searchWorkOrders
  };
};

export const useCustomerAPI = () => {
  const { callAPI, loading } = useERPNextAPI();

  const getCustomers = useCallback(async (filters?: any, company?: string, limitPageLength?: number) => {
    return callAPI(
      async (api) => await api.getCustomers(filters, company, limitPageLength),
      "Failed to fetch customers"
    );
  }, [callAPI]);

  const getCustomer = useCallback(async (name: string) => {
    return callAPI(
      async (api) => await api.getCustomer(name),
      "Failed to fetch customer"
    );
  }, [callAPI]);

  const searchCustomers = useCallback(async (searchTerm: string, company?: string, limitPageLength?: number) => {
    return callAPI(
      async (api) => await api.searchCustomers(searchTerm, company, limitPageLength),
      "Failed to search customers"
    );
  }, [callAPI]);

  const getSalesOrdersForCustomer = useCallback(async (customerName: string, company?: string) => {
    return callAPI(
      async (api) => await api.getSalesOrdersForCustomer(customerName, company),
      "Failed to get sales orders for customer"
    );
  }, [callAPI]);

  return {
    loading,
    getCustomers,
    getCustomer,
    searchCustomers,
    getSalesOrdersForCustomer
  };
};

export const useWarehouseAPI = () => {
  const { callAPI, loading } = useERPNextAPI();

  const getWarehouses = useCallback(async (filters?: any, company?: string, limitPageLength?: number) => {
    return callAPI(
      async (api) => await api.getWarehouses(filters, company, limitPageLength),
      "Failed to fetch warehouses"
    );
  }, [callAPI]);

  const getWarehouseDescendants = useCallback(async (warehouseName: string) => {
    return callAPI(
      async (api) => {
        // Call Frappe's get_descendants_of method for warehouse hierarchy
        const response = await fetch(`${api.getBaseURL}/api/method/frappe.utils.nestedset.get_descendants_of`, {
          method: 'POST',
          headers: {
            'Authorization': `token ${api.getApiKey}:${api.getApiSecret}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            doctype: 'Warehouse',
            name: warehouseName,
            include_self: true
          })
        });
        
        if (!response.ok) {
          throw new Error(`Failed to get warehouse descendants: ${response.statusText}`);
        }
        
        return response.json();
      },
      "Failed to get warehouse descendants"
    );
  }, [callAPI]);

  return {
    loading,
    getWarehouses,
    getWarehouseDescendants
  };
};

import { createERPNextAPI } from "@/services/erpnextApi";

export const getStockLedgerEntries = async (filters: any = {}) => {
  try {
    const api = await createERPNextAPI();
    if (!api) throw new Error('ERPNext API not configured');

    const result = await api.getDocList('Stock Ledger Entry', {
      fields: ['*'],
      filters,
      limit_page_length: 1000
    });

    console.log('Stock ledger entries result:', result);
    return result;
  } catch (error) {
    console.error('Error fetching stock ledger entries:', error);
    throw error;
  }
};

export const getStockBalanceReport = async (filters: any = {}) => {
  try {
    const api = await createERPNextAPI();
    if (!api) throw new Error('ERPNext API not configured');

    const result = await api.runReport('Stock Balance', filters);
    console.log('Stock balance report result:', result);
    
    // Handle the response structure properly
    if (result && result.message) {
      return {
        data: result.message.result || [],
        columns: result.message.columns || []
      };
    }
    
    return { data: [], columns: [] };
  } catch (error) {
    console.error('Error running stock balance report:', error);
    throw error;
  }
};

export const getStockAgeingReport = async (filters: any = {}) => {
  try {
    const api = await createERPNextAPI();
    if (!api) throw new Error('ERPNext API not configured');

    console.log('Running Stock Ageing report with filters:', filters);
    const result = await api.runReport('Stock Ageing', filters);
    console.log('Stock Ageing report result:', result);
    
    // Handle the response structure properly
    if (result && result.message) {
      return {
        data: result.message.result || [],
        columns: result.message.columns || []
      };
    }
    
    return { data: [], columns: [] };
  } catch (error) {
    console.error('Error running stock ageing report:', error);
    throw error;
  }
};

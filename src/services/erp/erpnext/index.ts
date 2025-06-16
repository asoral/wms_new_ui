import { ERPNextConfig } from './types';
import { ERPNextBaseAPI } from './baseApi';
import { ERPNextItemsAPI } from './itemsApi';
import { ERPNextStockAPI } from './stockApi';
import { ERPNextWarehouseAPI } from './warehouseApi';
import { ERPNextSalesAPI } from './salesApi';
import { ERPNextPurchaseAPI } from './purchaseApi';
import { ERPNextMaterialAPI } from './materialApi';
import { ERPNextCompanyAPI } from './companyApi';
import { ERPNextOtherAPIs } from './otherApis';
import { ERPNextDashboardAPI } from './dashboardApi';

let erpnextConfig: ERPNextConfig | null = null;

export const configureERPNextAPI = (config: ERPNextConfig) => {
  erpnextConfig = config;
  localStorage.setItem('erpnextBaseURL', config.baseURL);
  localStorage.setItem('erpnextApiKey', config.apiKey);
  localStorage.setItem('erpnextApiSecret', config.apiSecret);
};

export const createERPNextAPI = async (): Promise<ERPNextAPI | null> => {
  if (!erpnextConfig) {
    const baseURL = localStorage.getItem('erpnextBaseURL');
    const apiKey = localStorage.getItem('erpnextApiKey');
    const apiSecret = localStorage.getItem('erpnextApiSecret');
    
    if (baseURL && apiKey && apiSecret) {
      erpnextConfig = { baseURL, apiKey, apiSecret };
    } else {
      console.warn('ERPNext API not configured. Configure credentials first.');
      return null;
    }
  }

  return new ERPNextAPI(erpnextConfig.baseURL, erpnextConfig.apiKey, erpnextConfig.apiSecret);
};

export const getUserDefaultCompany = async (): Promise<string | null> => {
  try {
    const storedCompany = localStorage.getItem('erpnextDefaultCompany');
    if (storedCompany) {
      return storedCompany;
    }

    const erpnextAPI = await createERPNextAPI();
    if (!erpnextAPI) {
      console.error('ERPNext API not configured');
      return null;
    }

    const userDetails = await erpnextAPI.getLoggedInUserDetails();
    if (userDetails && userDetails.data && userDetails.data.defaults && userDetails.data.defaults.company) {
      const company = userDetails.data.defaults.company;
      localStorage.setItem('erpnextDefaultCompany', company);
      return company;
    } else {
      console.warn('Unable to retrieve default company from user details.');
      return null;
    }
  } catch (error) {
    console.error('Error fetching user details:', error);
    return null;
  }
};

export class ERPNextAPI extends ERPNextBaseAPI {
  private itemsApi: ERPNextItemsAPI;
  private stockApi: ERPNextStockAPI;
  private warehouseApi: ERPNextWarehouseAPI;
  private salesApi: ERPNextSalesAPI;
  private purchaseApi: ERPNextPurchaseAPI;
  private materialApi: ERPNextMaterialAPI;
  private companyApi: ERPNextCompanyAPI;
  private otherApis: ERPNextOtherAPIs;
  private dashboardApi: ERPNextDashboardAPI;

  constructor(baseURL: string, apiKey: string, apiSecret: string) {
    super(baseURL, apiKey, apiSecret);
    this.itemsApi = new ERPNextItemsAPI(baseURL, apiKey, apiSecret);
    this.stockApi = new ERPNextStockAPI(baseURL, apiKey, apiSecret);
    this.warehouseApi = new ERPNextWarehouseAPI(baseURL, apiKey, apiSecret);
    this.salesApi = new ERPNextSalesAPI(baseURL, apiKey, apiSecret);
    this.purchaseApi = new ERPNextPurchaseAPI(baseURL, apiKey, apiSecret);
    this.materialApi = new ERPNextMaterialAPI(baseURL, apiKey, apiSecret);
    this.companyApi = new ERPNextCompanyAPI(baseURL, apiKey, apiSecret);
    this.otherApis = new ERPNextOtherAPIs(baseURL, apiKey, apiSecret);
    this.dashboardApi = new ERPNextDashboardAPI(baseURL, apiKey, apiSecret);
  }

  // Items API methods
  getItems(filters?: any, searchTerm?: string, limit: number = 20) {
    return this.itemsApi.getItems(filters, searchTerm, limit);
  }

  searchItems(searchTerm: string, company?: string, limitPageLength?: number) {
    return this.itemsApi.searchItems(searchTerm, company, limitPageLength);
  }

  getItemsPaginated(filters?: any, fields?: string[], company?: string, limitPageLength?: number, page?: number) {
    return this.itemsApi.getItemsPaginated(filters, fields, company, limitPageLength, page);
  }

  getItemByBarcode(barcode: string) {
    return this.itemsApi.getItemByBarcode(barcode);
  }

  getItemDetails(itemCode: string) {
    return this.itemsApi.getItemDetails(itemCode);
  }

  searchItemsByBarcode(barcode: string) {
    return this.itemsApi.searchItemsByBarcode(barcode);
  }

  // Stock API methods
  getStockBalance(itemCode: string, warehouses: string[]): Promise<any>;
  getStockBalance(filters?: any, company?: string): Promise<any>;
  getStockBalance(filterOrItemCode?: any, warehousesOrCompany?: string[] | string) {
    return this.stockApi.getStockBalance(filterOrItemCode, warehousesOrCompany);
  }

  getBinStock(itemCode: string, warehouse: string) {
    return this.stockApi.getBinStock(itemCode, warehouse);
  }

  getCurrentStock(itemCode: string, warehouse: string, batch?: string, serial?: string) {
    return this.stockApi.getCurrentStock(itemCode, warehouse, batch, serial);
  }

  getStockLedgerEntries(filters?: any, company?: string) {
    return this.stockApi.getStockLedgerEntries(filters, company);
  }

  getStockAgingReport(filters?: any) {
    return this.stockApi.getStockAgingReport(filters);
  }

  getStockEntries(filters?: any, company?: string, limitPageLength?: number) {
    return this.stockApi.getStockEntries(filters, company, limitPageLength);
  }

  createStockReconciliation(reconciliationData: any) {
    return this.stockApi.createStockReconciliation(reconciliationData);
  }

  updateStockReconciliation(name: string, reconciliationData: any) {
    return this.stockApi.updateStockReconciliation(name, reconciliationData);
  }

  // Warehouse API methods
  getWarehouses(filters?: any, company?: string) {
    return this.warehouseApi.getWarehouses(filters, company);
  }

  // Sales API methods
  getSalesOrders(filters?: any, company?: string, limitPageLength?: number) {
    return this.salesApi.getSalesOrders(filters, company, limitPageLength);
  }

  getSalesOrder(soNumber: string) {
    return this.salesApi.getSalesOrder(soNumber);
  }

  getDeliveryNotes(filters?: any, company?: string, limitPageLength?: number) {
    return this.salesApi.getDeliveryNotes(filters, company, limitPageLength);
  }

  // Purchase API methods
  getPurchaseOrders(filters?: any, company?: string, limitPageLength?: number) {
    return this.purchaseApi.getPurchaseOrders(filters, company, limitPageLength);
  }

  getPurchaseOrder(poNumber: string) {
    return this.purchaseApi.getPurchaseOrder(poNumber);
  }

  getPurchaseReceipts(filters?: any, company?: string, limitPageLength?: number) {
    return this.purchaseApi.getPurchaseReceipts(filters, company, limitPageLength);
  }

  createPurchaseReceipt(receiptData: any) {
    return this.purchaseApi.createPurchaseReceipt(receiptData);
  }

  // Material API methods
  getMaterialRequests(filters?: any, company?: string, limitPageLength?: number) {
    return this.materialApi.getMaterialRequests(filters, company, limitPageLength);
  }

  // Company API methods
  getCompanies() {
    return this.companyApi.getCompanies();
  }

  // Other APIs methods
  getPickLists(filters?: any, company?: string, limitPageLength?: number) {
    return this.otherApis.getPickLists(filters, company, limitPageLength);
  }

  getPackingSlips(filters?: any, company?: string, limitPageLength?: number) {
    return this.otherApis.getPackingSlips(filters, company, limitPageLength);
  }

  getQualityInspections(filters?: any, company?: string, limitPageLength?: number) {
    return this.otherApis.getQualityInspections(filters, company, limitPageLength);
  }

  getProductBundles(filters?: any, company?: string, limitPageLength?: number) {
    return this.otherApis.getProductBundles(filters, company, limitPageLength);
  }

  validateBatch(batchNo: string, itemCode: string) {
    return this.otherApis.validateBatch(batchNo, itemCode);
  }

  validateSerial(serialNo: string, itemCode: string, warehouse: string) {
    return this.otherApis.validateSerial(serialNo, itemCode, warehouse);
  }

  // Dashboard API methods
  getDashboardMetrics(company?: string) {
    return this.dashboardApi.getDashboardMetrics(company);
  }

  getRecentActivities(company?: string, limitPageLength?: number) {
    return this.dashboardApi.getRecentActivities(company, limitPageLength);
  }

  getOperationalMetrics(company?: string) {
    return this.dashboardApi.getOperationalMetrics(company);
  }

  getFinancialMetrics(company?: string) {
    return this.dashboardApi.getFinancialMetrics(company);
  }
}

// Re-export types for convenience
export * from './types';

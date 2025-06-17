import { ERPNextConfig } from './types';
import { ERPNextBaseAPI } from './baseApi';
import { ERPNextItemsAPI } from './itemsApi';
import { ERPNextStockAPI } from './stockApi';
import { ERPNextWarehouseAPI } from './warehouseApi';
import { ERPNextPurchaseAPI } from './purchaseApi';
import { ERPNextSalesAPI } from './salesApi';
import { ERPNextCompanyAPI } from './companyApi';
import { ERPNextMaterialAPI } from './materialApi';
import { ERPNextDashboardAPI } from './dashboardApi';
import { ERPNextOtherApis } from './otherApis';

export class ERPNextAPI extends ERPNextBaseAPI {
  private itemsApi: ERPNextItemsAPI;
  private stockApi: ERPNextStockAPI;
  private warehouseApi: ERPNextWarehouseAPI;
  private purchaseApi: ERPNextPurchaseAPI;
  private salesApi: ERPNextSalesAPI;
  private companyApi: ERPNextCompanyAPI;
  private materialApi: ERPNextMaterialAPI;
  private dashboardApi: ERPNextDashboardAPI;
  private otherApis: ERPNextOtherApis;

  constructor(config: ERPNextConfig) {
    super(config);
    this.itemsApi = new ERPNextItemsAPI(config);
    this.stockApi = new ERPNextStockAPI(config);
    this.warehouseApi = new ERPNextWarehouseAPI(config);
    this.purchaseApi = new ERPNextPurchaseAPI(config);
    this.salesApi = new ERPNextSalesAPI(config);
    this.companyApi = new ERPNextCompanyAPI(config);
    this.materialApi = new ERPNextMaterialAPI(config);
    this.dashboardApi = new ERPNextDashboardAPI(config);
    this.otherApis = new ERPNextOtherApis(config);
  }

  // Helper method to get default company
  async getDefaultCompany(): Promise<string | null> {
    return getUserDefaultCompany();
  }
};

export const getUserDefaultCompany = async (): Promise<string | null> => {
  try {
    const storedCompany = localStorage.getItem('erpnextDefaultCompany');
    if (storedCompany) {
      return storedCompany;
    }

    // If no stored company, try to get from user defaults
    const config = JSON.parse(localStorage.getItem('erpnextConfig') || '{}');
    if (!config.url || !config.apiKey || !config.apiSecret) {
      return null;
    }

    const erpnextAPI = new ERPNextAPI(config);
    const userDetails = await erpnextAPI.getCurrentUser();
    
    if (userDetails?.data?.defaults?.company) {
      const defaultCompany = userDetails.data.defaults.company;
      localStorage.setItem('erpnextDefaultCompany', defaultCompany);
      return defaultCompany;
    }

    return null;
  } catch (error) {
    console.error('Error getting default company:', error);
    return null;
  }
};

// Extend ERPNextAPI with all the API methods
export interface ERPNextAPI extends ERPNextBaseAPI {
  // Items API methods
  getItems(filters?: any, fields?: string[], limitPageLength?: number): ReturnType<ERPNextItemsAPI['getItems']>;
  getItem(itemCode: string): ReturnType<ERPNextItemsAPI['getItem']>;
  createItem(itemData: any): ReturnType<ERPNextItemsAPI['createItem']>;
  updateItem(itemCode: string, itemData: any): ReturnType<ERPNextItemsAPI['updateItem']>;
  deleteItem(itemCode: string): ReturnType<ERPNextItemsAPI['deleteItem']>;

  // Stock API methods
  getStockBalance(filters?: any, company?: string): ReturnType<ERPNextStockAPI['getStockBalance']>;
  getBinStock(itemCode: string, warehouse: string): ReturnType<ERPNextStockAPI['getBinStock']>;
  getCurrentStock(itemCode: string, warehouse?: string): ReturnType<ERPNextStockAPI['getCurrentStock']>;
  getStockLedgerEntries(filters?: any, limit?: number, offset?: number): ReturnType<ERPNextStockAPI['getStockLedgerEntries']>;
  createStockEntry(entryData: any): ReturnType<ERPNextStockAPI['createStockEntry']>;
  getAvailableStock(itemCode: string, warehouse: string, posting_date?: string): ReturnType<ERPNextStockAPI['getAvailableStock']>;
  getStockSummary(company?: string, warehouse?: string, item_group?: string): ReturnType<ERPNextStockAPI['getStockSummary']>;
  getStockEntries(filters?: any, company?: string, limitPageLength?: number): ReturnType<ERPNextStockAPI['getStockEntries']>;
  getStockAgingReport(filters?: any): ReturnType<ERPNextStockAPI['getStockAgingReport']>;
  createStockReconciliation(reconciliationData: any): ReturnType<ERPNextStockAPI['createStockReconciliation']>;
  updateStockReconciliation(name: string, reconciliationData: any): ReturnType<ERPNextStockAPI['updateStockReconciliation']>;

  // Warehouse API methods
  getWarehouses(filters?: any, company?: string): ReturnType<ERPNextWarehouseAPI['getWarehouses']>;
  getWarehouse(warehouseName: string): ReturnType<ERPNextWarehouseAPI['getWarehouse']>;
  createWarehouse(warehouseData: any): ReturnType<ERPNextWarehouseAPI['createWarehouse']>;

  // Purchase API methods
  getPurchaseOrders(filters?: any, company?: string, limitPageLength?: number): ReturnType<ERPNextPurchaseAPI['getPurchaseOrders']>;
  getPurchaseOrder(poNumber: string): ReturnType<ERPNextPurchaseAPI['getPurchaseOrder']>;
  createPurchaseReceipt(receiptData: any): ReturnType<ERPNextPurchaseAPI['createPurchaseReceipt']>;
  getPurchaseReceipts(filters?: any, company?: string): ReturnType<ERPNextPurchaseAPI['getPurchaseReceipts']>;

  // Sales API methods
  getSalesOrders(filters?: any, company?: string, limitPageLength?: number): ReturnType<ERPNextSalesAPI['getSalesOrders']>;
  getSalesOrder(soNumber: string): ReturnType<ERPNextSalesAPI['getSalesOrder']>;
  createDeliveryNote(deliveryData: any): ReturnType<ERPNextSalesAPI['createDeliveryNote']>;
  getDeliveryNotes(filters?: any, company?: string): ReturnType<ERPNextSalesAPI['getDeliveryNotes']>;

  // Company API methods
  getCompanies(): ReturnType<ERPNextCompanyAPI['getCompanies']>;
  getCompany(companyName: string): ReturnType<ERPNextCompanyAPI['getCompany']>;

  // Material API methods
  createMaterialRequest(requestData: any): ReturnType<ERPNextMaterialAPI['createMaterialRequest']>;
  getMaterialRequests(filters?: any, company?: string): ReturnType<ERPNextMaterialAPI['getMaterialRequests']>;

  // Dashboard API methods
  getDashboardData(company?: string): ReturnType<ERPNextDashboardAPI['getDashboardData']>;

  // Other APIs
  getCurrentUser(): ReturnType<ERPNextOtherApis['getCurrentUser']>;
}

// Apply mixins to combine all API methods into ERPNextAPI
Object.getOwnPropertyNames(ERPNextItemsAPI.prototype).forEach(name => {
  if (name !== 'constructor') {
    (ERPNextAPI.prototype as any)[name] = function(this: ERPNextAPI, ...args: any[]) {
      return (this.itemsApi as any)[name](...args);
    };
  }
});

Object.getOwnPropertyNames(ERPNextStockAPI.prototype).forEach(name => {
  if (name !== 'constructor') {
    (ERPNextAPI.prototype as any)[name] = function(this: ERPNextAPI, ...args: any[]) {
      return (this.stockApi as any)[name](...args);
    };
  }
});

Object.getOwnPropertyNames(ERPNextWarehouseAPI.prototype).forEach(name => {
  if (name !== 'constructor') {
    (ERPNextAPI.prototype as any)[name] = function(this: ERPNextAPI, ...args: any[]) {
      return (this.warehouseApi as any)[name](...args);
    };
  }
});

Object.getOwnPropertyNames(ERPNextPurchaseAPI.prototype).forEach(name => {
  if (name !== 'constructor') {
    (ERPNextAPI.prototype as any)[name] = function(this: ERPNextAPI, ...args: any[]) {
      return (this.purchaseApi as any)[name](...args);
    };
  }
});

Object.getOwnPropertyNames(ERPNextSalesAPI.prototype).forEach(name => {
  if (name !== 'constructor') {
    (ERPNextAPI.prototype as any)[name] = function(this: ERPNextAPI, ...args: any[]) {
      return (this.salesApi as any)[name](...args);
    };
  }
});

Object.getOwnPropertyNames(ERPNextCompanyAPI.prototype).forEach(name => {
  if (name !== 'constructor') {
    (ERPNextAPI.prototype as any)[name] = function(this: ERPNextAPI, ...args: any[]) {
      return (this.companyApi as any)[name](...args);
    };
  }
});

Object.getOwnPropertyNames(ERPNextMaterialAPI.prototype).forEach(name => {
  if (name !== 'constructor') {
    (ERPNextAPI.prototype as any)[name] = function(this: ERPNextAPI, ...args: any[]) {
      return (this.materialApi as any)[name](...args);
    };
  }
});

Object.getOwnPropertyNames(ERPNextDashboardAPI.prototype).forEach(name => {
  if (name !== 'constructor') {
    (ERPNextAPI.prototype as any)[name] = function(this: ERPNextAPI, ...args: any[]) {
      return (this.dashboardApi as any)[name](...args);
    };
  }
});

Object.getOwnPropertyNames(ERPNextOtherApis.prototype).forEach(name => {
  if (name !== 'constructor') {
    (ERPNextAPI.prototype as any)[name] = function(this: ERPNextAPI, ...args: any[]) {
      return (this.otherApis as any)[name](...args);
    };
  }
});

export * from './types';
export { ERPNextConfig } from './types';

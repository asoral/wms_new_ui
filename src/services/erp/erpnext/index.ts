import { ERPNextConfig } from './types';
import { ERPNextAuthAPI } from './authApi';
import { ERPNextItemsAPI } from './itemsApi';
import { ERPNextStockAPI } from './stockApi';
import { ERPNextWarehouseAPI } from './warehouseApi';
import { ERPNextSalesAPI } from './salesApi';
import { ERPNextPurchaseAPI } from './purchaseApi';
import { ERPNextManufacturingAPI } from './manufacturingApi';
import { ERPNextCRMAPI } from './crmApi';
import { ERPNextAccountsAPI } from './accountsApi';
import { ERPNextQualityAPI } from './qualityApi';
import { ERPNextAssetsAPI } from './assetsApi';
import { ERPNextSupportAPI } from './supportApi';
import { ERPNextBinAPI } from './binApi';

export class ERPNextAPI extends ERPNextBinAPI {
  public auth: ERPNextAuthAPI;
  public items: ERPNextItemsAPI;
  public stock: ERPNextStockAPI;
  public warehouse: ERPNextWarehouseAPI;
  public sales: ERPNextSalesAPI;
  public purchase: ERPNextPurchaseAPI;
  public manufacturing: ERPNextManufacturingAPI;
  public crm: ERPNextCRMAPI;
  public accounts: ERPNextAccountsAPI;
  public quality: ERPNextQualityAPI;
  public assets: ERPNextAssetsAPI;
  public support: ERPNextSupportAPI;
  public bin: ERPNextBinAPI;

  constructor(config: ERPNextConfig) {
    super(config.baseURL, config.apiKey, config.apiSecret);
    this.auth = new ERPNextAuthAPI(config.baseURL, config.apiKey, config.apiSecret);
    this.items = new ERPNextItemsAPI(config.baseURL, config.apiKey, config.apiSecret);
    this.stock = new ERPNextStockAPI(config.baseURL, config.apiKey, config.apiSecret);
    this.warehouse = new ERPNextWarehouseAPI(config.baseURL, config.apiKey, config.apiSecret);
    this.sales = new ERPNextSalesAPI(config.baseURL, config.apiKey, config.apiSecret);
    this.purchase = new ERPNextPurchaseAPI(config.baseURL, config.apiKey, config.apiSecret);
    this.manufacturing = new ERPNextManufacturingAPI(config.baseURL, config.apiKey, config.apiSecret);
    this.crm = new ERPNextCRMAPI(config.baseURL, config.apiKey, config.apiSecret);
    this.accounts = new ERPNextAccountsAPI(config.baseURL, config.apiKey, config.apiSecret);
    this.quality = new ERPNextQualityAPI(config.baseURL, config.apiKey, config.apiSecret);
    this.assets = new ERPNextAssetsAPI(config.baseURL, config.apiKey, config.apiSecret);
    this.support = new ERPNextSupportAPI(config.baseURL, config.apiKey, config.apiSecret);
    this.bin = new ERPNextBinAPI(config.baseURL, config.apiKey, config.apiSecret);
  }

  // Delegate methods to appropriate modules
  async getItems(filters?: any, searchTerm?: string, company?: string) {
    return this.items.getItems(filters, searchTerm, company);
  }

  async searchItems(searchTerm: string, company?: string, limitPageLength?: number) {
    return this.items.searchItems(searchTerm, company, limitPageLength);
  }

  async getItemsPaginated(filters?: any, fields?: string[], company?: string, limitPageLength?: number, page?: number) {
    return this.items.getItemsPaginated(filters, fields, company, limitPageLength, page);
  }

  async getItemDetails(itemCode: string) {
    return this.items.getItemDetails(itemCode);
  }

  async getWarehouses(filters?: any, company?: string) {
    return this.warehouse.getWarehouses(filters, company);
  }

  async getStockBalance(filters?: any, company?: string) {
    return this.stock.getStockBalance(filters, company);
  }

  async getCurrentStock(itemCode: string, warehouse: string, batch?: string, serial?: string) {
    return this.stock.getCurrentStock(itemCode, warehouse, batch, serial);
  }

  async getSalesOrders(filters?: any, company?: string) {
    return this.sales.getSalesOrders(filters, company);
  }

  async getSalesOrder(name: string) {
    return this.sales.getSalesOrder(name);
  }

  async getDeliveryNotes(filters?: any, company?: string) {
    return this.sales.getDeliveryNotes(filters, company);
  }

  async getPurchaseOrders(filters?: any, company?: string) {
    return this.purchase.getPurchaseOrders(filters, company);
  }

  async getPurchaseOrder(name: string) {
    return this.purchase.getPurchaseOrder(name);
  }

  async getPurchaseReceipts(filters?: any, company?: string) {
    return this.purchase.getPurchaseReceipts(filters, company);
  }

  async createPurchaseReceipt(data: any) {
    return this.purchase.createPurchaseReceipt(data);
  }

  async getPendingPurchaseOrders(company?: string) {
    return this.purchase.getPendingPurchaseOrders(company);
  }

  async getReceiptDrafts(company?: string) {
    return this.purchase.getReceiptDrafts(company);
  }

  async getMaterialRequests(filters?: any, company?: string) {
    return this.getDocumentList('Material Request', filters);
  }

  async getStockEntries(filters?: any, company?: string) {
    return this.stock.getStockEntries(filters, company);
  }

  async createStockReconciliation(data: any) {
    return this.stock.createStockReconciliation(data);
  }

  async updateStockReconciliation(name: string, data: any) {
    return this.stock.updateStockReconciliation(name, data);
  }

  async getPickLists(filters?: any, company?: string) {
    return this.getDocumentList('Pick List', filters);
  }

  async getPackingSlips(filters?: any, company?: string) {
    return this.getDocumentList('Packing Slip', filters);
  }

  async getQualityInspections(filters?: any, company?: string) {
    return this.quality.getQualityInspections(filters, company);
  }

  async getQualityInspectionsPending(company?: string) {
    return this.quality.getQualityInspectionsPending(company);
  }

  async getProductBundles(filters?: any, company?: string) {
    return this.getDocumentList('Product Bundle', filters);
  }

  async getCompanies() {
    return this.getDocumentList('Company');
  }

  async getStockAgingReport() {
    return this.stock.getStockAgingReport();
  }

  async getDashboardMetrics(company?: string) {
    // This would be a custom implementation
    return {
      totalItems: 0,
      lowStockItems: 0,
      pendingOrders: 0,
      totalWarehouses: 0,
      totalStockValue: 0,
      recentActivitiesCount: 0
    };
  }

  async getOperationalMetrics(company?: string) {
    return {
      pickAccuracy: 0,
      putawaySpeed: 0,
      cycleCountAccuracy: 0,
      orderFulfillmentRate: 0,
      warehouseUtilization: 0,
      averageProcessingTime: 0
    };
  }

  async getFinancialMetrics(company?: string) {
    return {
      stockTurnoverRatio: 0,
      carryingCostPercentage: 0,
      deadStockValue: 0,
      abcAnalysis: {
        classA: 0,
        classB: 0,
        classC: 0
      }
    };
  }

  async getRecentActivities(company?: string, limit?: number) {
    return [];
  }
}

export const configureERPNextAPI = async (
  baseURL: string,
  apiKey: string,
  apiSecret: string
): Promise<ERPNextAPI | null> => {
  if (!baseURL || !apiKey || !apiSecret) {
    console.error('ERPNext API configuration is incomplete.');
    return null;
  }

  const api = new ERPNextAPI({ baseURL, apiKey, apiSecret });
  const isConnected = await api.auth.testConnection();

  if (!isConnected) {
    console.error('Failed to connect to ERPNext with provided credentials.');
    return null;
  }

  return api;
};

export const createERPNextAPI = async (): Promise<ERPNextAPI | null> => {
  const baseURL = localStorage.getItem('erpnextBaseURL') || '';
  const apiKey = localStorage.getItem('erpnextAPIKey') || '';
  const apiSecret = localStorage.getItem('erpnextAPISecret') || '';

  if (!baseURL || !apiKey || !apiSecret) {
    console.warn('ERPNext API configuration not found in localStorage.');
    return null;
  }

  return configureERPNextAPI(baseURL, apiKey, apiSecret);
};

export const getUserDefaultCompany = async (): Promise<string | null> => {
  try {
    const baseURL = localStorage.getItem('erpnextBaseURL') || '';
    const apiKey = localStorage.getItem('erpnextAPIKey') || '';
    const apiSecret = localStorage.getItem('erpnextAPISecret') || '';

    if (!baseURL || !apiKey || !apiSecret) {
      console.warn('ERPNext API configuration not found in localStorage.');
      return null;
    }

    const api = new ERPNextAuthAPI(baseURL, apiKey, apiSecret);
    const userDetails = await api.getLoggedInUserDetails();

    if (userDetails && userDetails.data && userDetails.data.company) {
      return userDetails.data.company;
    }

    return null;
  } catch (error) {
    console.error('Failed to fetch user details:', error);
    return null;
  }
};

// Export types
export * from './types';

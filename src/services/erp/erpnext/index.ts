import { ERPNextSalesAPI } from './salesApi';
import { ERPNextStockAPI } from './stockApi';
import { ERPNextCompanyAPI } from './companyApi';
import { ERPNextMaterialAPI } from './materialApi';
import { ERPNextWarehouseAPI } from './warehouseApi';
import { ERPNextBaseAPI } from './baseApi';
import { ERPNextPurchaseAPI } from './purchaseApi';
import { ERPNextItemsAPI } from './itemsApi';
import { getERPNextConfig } from '../../authService';

export class ERPNextAPI {
  public baseURL: string;
  public apiKey: string;
  public apiSecret: string;

  public sales: ERPNextSalesAPI;
  public stock: ERPNextStockAPI;
  public company: ERPNextCompanyAPI;
  public material: ERPNextMaterialAPI;
  public warehouse: ERPNextWarehouseAPI;
  public purchase: ERPNextPurchaseAPI;
  public items: ERPNextItemsAPI;
  private baseApi: ERPNextBaseAPI;

  constructor(baseURL: string, apiKey: string, apiSecret: string) {
    this.baseURL = baseURL;
    this.apiKey = apiKey;
    this.apiSecret = apiSecret;

    this.sales = new ERPNextSalesAPI(baseURL, apiKey, apiSecret);
    this.stock = new ERPNextStockAPI(baseURL, apiKey, apiSecret);
    this.company = new ERPNextCompanyAPI(baseURL, apiKey, apiSecret);
    this.material = new ERPNextMaterialAPI(baseURL, apiKey, apiSecret);
    this.warehouse = new ERPNextWarehouseAPI(baseURL, apiKey, apiSecret);
    this.purchase = new ERPNextPurchaseAPI(baseURL, apiKey, apiSecret);
    this.items = new ERPNextItemsAPI(baseURL, apiKey, apiSecret);
    this.baseApi = new ERPNextBaseAPI(baseURL, apiKey, apiSecret);
  }

  // Proxy methods for backward compatibility
  async testConnection(): Promise<boolean> {
    return this.baseApi.testConnection();
  }

  async getCompanies() {
    return this.company.getCompanies();
  }

  // Items don't have company field, so we remove company parameter from item methods
  async getItems(filters?: any, limitPageLength?: number) {
    return this.stock.getItems(filters || {}, limitPageLength);
  }

  // Item methods
  async searchItems(search: string, limit?: number) {
    return this.stock.searchItems(search, limit);
  }

  async searchItemsByBarcode(barcode: string) {
    return this.stock.searchItemsByBarcode(barcode);
  }

  async getItemsPaginated(filters?: any, fields?: string[], limit?: number, page?: number) {
    return this.stock.getItemsPaginated(filters, fields, limit, page);
  }

  async getItemDetails(itemCode: string) {
    return this.stock.getItemDetails(itemCode);
  }

  async getItemByBarcode(barcode: string) {
    return this.stock.getItemByBarcode(barcode);
  }

  // Warehouse methods - warehouses have company field
  async getWarehouses(filters?: any, company?: string) {
    const effectiveCompany = company || await this.getUserDefaultCompany();
    return this.warehouse.getWarehouses(filters || {}, effectiveCompany);
  }

  // Stock methods - filter by company through warehouses
  async getStockBalance(itemCode?: string, warehouse?: string) {
    const effectiveCompany = await this.getUserDefaultCompany();
    return this.stock.getStockBalance(itemCode, effectiveCompany, warehouse);
  }

  async getCurrentStock(itemCode: string, warehouse?: string) {
    return this.stock.getCurrentStock(itemCode, warehouse || '');
  }

  async getBinStock(itemCode?: string, warehouse?: string) {
    const effectiveCompany = await this.getUserDefaultCompany();
    return this.stock.getBinStock(itemCode, warehouse, effectiveCompany);
  }

  // Sales methods
  async getSalesOrders(filters?: any, company?: string, limitPageLength?: number) {
    const effectiveCompany = company || await this.getUserDefaultCompany();
    return this.sales.getSalesOrders(filters || {}, effectiveCompany, limitPageLength);
  }

  async getSalesOrder(soNumber: string) {
    return this.sales.getSalesOrder(soNumber);
  }

  async getDeliveryNotes(filters?: any, company?: string, limitPageLength?: number) {
    const effectiveCompany = company || await this.getUserDefaultCompany();
    return this.sales.getDeliveryNotes(filters || {}, effectiveCompany, limitPageLength);
  }

  async createDeliveryNote(deliveryData: any) {
    return this.sales.createDeliveryNote(deliveryData);
  }

  async updateDeliveryNote(name: string, deliveryData: any) {
    return this.sales.updateDeliveryNote(name, deliveryData);
  }

  // Purchase methods - forward to purchase API
  async getPurchaseOrders(filters?: any, company?: string, limitPageLength?: number) {
    const effectiveCompany = company || await this.getUserDefaultCompany();
    return this.purchase.getPurchaseOrders(filters || {}, effectiveCompany, limitPageLength);
  }

  async getPurchaseOrder(poNumber: string) {
    return this.purchase.getPurchaseOrder(poNumber);
  }

  async getPurchaseReceipts(filters?: any, company?: string, limitPageLength?: number) {
    const effectiveCompany = company || await this.getUserDefaultCompany();
    return this.purchase.getPurchaseReceipts(filters || {}, effectiveCompany, limitPageLength);
  }

  async getPurchaseReceipt(receiptNumber: string) {
    return this.purchase.getPurchaseReceipt(receiptNumber);
  }

  // Helper method to get user's default company
  private async getUserDefaultCompany(): Promise<string | undefined> {
    try {
      const config = await getERPNextConfig();
      return config?.erpnext_default_company || undefined;
    } catch (error) {
      console.error('Failed to get user default company:', error);
      return undefined;
    }
  }

  // Placeholder methods for other missing functionality
  async getMaterialRequests(filters?: any, company?: string) {
    return { data: [] };
  }

  async getStockEntries(filters?: any, company?: string) {
    const effectiveCompany = company || await this.getUserDefaultCompany();
    return this.stock.getStockEntries(filters || {}, effectiveCompany);
  }

  async getPickLists(filters?: any, company?: string) {
    return { data: [] };
  }

  async getPackingSlips(filters?: any, company?: string) {
    return { data: [] };
  }

  async getQualityInspections(filters?: any, company?: string) {
    return { data: [] };
  }

  async getProductBundles(filters?: any, company?: string) {
    return { data: [] };
  }

  async getDashboardMetrics() {
    return { data: {} };
  }

  async getOperationalMetrics() {
    return { data: {} };
  }

  async getFinancialMetrics() {
    return { data: {} };
  }

  async getStockAgingReport() {
    return this.stock.getStockAgingReport();
  }

  async getRecentActivities() {
    return { data: [] };
  }

  // Stock reconciliation methods
  async createStockReconciliation(reconciliationData: any) {
    return this.stock.createStockReconciliation(reconciliationData);
  }

  async updateStockReconciliation(name: string, reconciliationData: any) {
    return this.stock.updateStockReconciliation(name, reconciliationData);
  }

  // Serial Batch Bundle methods
  async getSerialBatchBundle(name: string) {
    return this.stock.getSerialBatchBundle(name);
  }

  async createSerialBatchBundle(bundleData: any) {
    return this.stock.createSerialBatchBundle(bundleData);
  }

  // Validation methods
  async validateBatch(batchNo: string, itemCode: string): Promise<boolean> {
    try {
      // Check if batch exists
      const response = await fetch(`${this.baseURL}/api/resource/Batch/${encodeURIComponent(batchNo)}`, {
        headers: {
          'Authorization': `token ${this.apiKey}:${this.apiSecret}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        }
      });

      if (response.ok) {
        return true; // Batch exists
      }

      // Create new batch if it doesn't exist
      const createResponse = await fetch(`${this.baseURL}/api/resource/Batch`, {
        method: 'POST',
        headers: {
          'Authorization': `token ${this.apiKey}:${this.apiSecret}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          batch_id: batchNo,
          item: itemCode
        })
      });

      return createResponse.ok;
    } catch (error) {
      console.error('Error validating/creating batch:', error);
      return false;
    }
  }

  async validateSerial(serialNo: string, itemCode: string, warehouse?: string): Promise<boolean> {
    try {
      // Check if serial exists
      const response = await fetch(`${this.baseURL}/api/resource/Serial No/${encodeURIComponent(serialNo)}`, {
        headers: {
          'Authorization': `token ${this.apiKey}:${this.apiSecret}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        }
      });

      if (response.ok) {
        return true; // Serial exists
      }

      // Create new serial if it doesn't exist
      const createResponse = await fetch(`${this.baseURL}/api/resource/Serial No`, {
        method: 'POST',
        headers: {
          'Authorization': `token ${this.apiKey}:${this.apiSecret}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          serial_no: serialNo,
          item_code: itemCode,
          warehouse: warehouse
        })
      });

      return createResponse.ok;
    } catch (error) {
      console.error('Error validating/creating serial:', error);
      return false;
    }
  }
}

// ERPNext configuration and instance management
let erpnextAPIInstance: ERPNextAPI | null = null;

export interface ERPNextConfig {
  baseURL: string;
  apiKey: string;
  apiSecret: string;
}

export function configureERPNextAPI(config: ERPNextConfig): void {
  erpnextAPIInstance = new ERPNextAPI(config.baseURL, config.apiKey, config.apiSecret);
  
  // Store configuration in localStorage for persistence
  localStorage.setItem('erpnext_config', JSON.stringify(config));
}

export async function createERPNextAPI(): Promise<ERPNextAPI | null> {
  if (erpnextAPIInstance) {
    return erpnextAPIInstance;
  }

  // Try to restore from localStorage
  const savedConfig = localStorage.getItem('erpnext_config');
  if (savedConfig) {
    try {
      const config = JSON.parse(savedConfig);
      erpnextAPIInstance = new ERPNextAPI(config.baseURL, config.apiKey, config.apiSecret);
      return erpnextAPIInstance;
    } catch (error) {
      console.error('Failed to restore ERPNext config:', error);
    }
  }

  return null;
}

export async function getUserDefaultCompany(): Promise<string | null> {
  try {
    const config = await getERPNextConfig();
    if (config?.erpnext_default_company) {
      console.log('Using user default company:', config.erpnext_default_company);
      return config.erpnext_default_company;
    }

    // Fallback to first company if no default is set
    const api = await createERPNextAPI();
    if (!api) return null;

    const companiesResult = await api.getCompanies();
    if (companiesResult.data && companiesResult.data.length > 0) {
      console.log('Using first available company:', companiesResult.data[0].name);
      return companiesResult.data[0].name;
    }
  } catch (error) {
    console.error('Failed to get default company:', error);
  }

  return null;
}

// Re-export types
export type * from './types';

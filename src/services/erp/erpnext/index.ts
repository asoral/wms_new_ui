
import { ERPNextSalesAPI } from './salesApi';
import { ERPNextStockAPI } from './stockApi';
import { ERPNextCompanyAPI } from './companyApi';
import { ERPNextMaterialAPI } from './materialApi';
import { ERPNextWarehouseAPI } from './warehouseApi';
import { ERPNextBaseAPI } from './baseApi';
import { ERPNextPurchaseAPI } from './purchaseApi';

export class ERPNextAPI {
  public baseURL: string;
  public apiKey: string;
  public apiSecret: string;

  public sales: ERPNextSalesAPI;
  public stock: ERPNextStockAPI;
  public company: ERPNextCompanyAPI;
  public material: ERPNextMaterialAPI;
  public warehouse: ERPNextWarehouseAPI;
  public purchase: ERPNextPurchaseAPI; // Use proper PurchaseAPI
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
    this.purchase = new ERPNextPurchaseAPI(baseURL, apiKey, apiSecret); // Use proper PurchaseAPI
    this.baseApi = new ERPNextBaseAPI(baseURL, apiKey, apiSecret);
  }

  // Proxy methods for backward compatibility
  async testConnection(): Promise<boolean> {
    return this.baseApi.testConnection();
  }

  async getCompanies() {
    return this.company.getCompanies();
  }

  async getItems(filters?: any, company?: string, limitPageLength?: number) {
    return this.stock.getItems(filters, company, limitPageLength);
  }

  // Item methods
  async searchItems(search: string, company?: string, limit?: number) {
    return this.stock.searchItems(search, company, limit);
  }

  async searchItemsByBarcode(barcode: string) {
    return this.stock.searchItemsByBarcode(barcode);
  }

  async getItemsPaginated(filters?: any, fields?: string[], company?: string, limit?: number, page?: number) {
    return this.stock.getItemsPaginated(filters, fields, company, limit, page);
  }

  async getItemDetails(itemCode: string) {
    return this.stock.getItemDetails(itemCode);
  }

  async getItemByBarcode(barcode: string) {
    return this.stock.getItemByBarcode(barcode);
  }

  // Warehouse methods
  async getWarehouses(filters?: any, company?: string) {
    return this.warehouse.getWarehouses(filters, company);
  }

  // Stock methods
  async getStockBalance(itemCode?: string, warehouse?: string) {
    return this.stock.getStockBalance(itemCode, warehouse);
  }

  async getCurrentStock(itemCode: string, warehouse?: string, batch?: string, serial?: string) {
    return this.stock.getCurrentStock(itemCode, warehouse, batch, serial);
  }

  async getBinStock(itemCode?: string, warehouse?: string) {
    return this.stock.getBinStock(itemCode, warehouse);
  }

  // Sales methods
  async getSalesOrders(filters?: any, company?: string, limitPageLength?: number) {
    return this.sales.getSalesOrders(filters, company, limitPageLength);
  }

  async getSalesOrder(soNumber: string) {
    return this.sales.getSalesOrder(soNumber);
  }

  async getDeliveryNotes(filters?: any, company?: string, limitPageLength?: number) {
    return this.sales.getDeliveryNotes(filters, company, limitPageLength);
  }

  async createDeliveryNote(deliveryData: any) {
    return this.sales.createDeliveryNote(deliveryData);
  }

  async updateDeliveryNote(name: string, deliveryData: any) {
    return this.sales.updateDeliveryNote(name, deliveryData);
  }

  // Purchase methods - forward to purchase API
  async getPurchaseOrders(filters?: any, company?: string, limitPageLength?: number) {
    return this.purchase.getPurchaseOrders(filters, company, limitPageLength);
  }

  async getPurchaseOrder(poNumber: string) {
    return this.purchase.getPurchaseOrder(poNumber);
  }

  async getPurchaseReceipts(filters?: any, company?: string, limitPageLength?: number) {
    return this.purchase.getPurchaseReceipts(filters, company, limitPageLength);
  }

  async getPurchaseReceipt(receiptNumber: string) {
    return this.purchase.getPurchaseReceipt(receiptNumber);
  }

  // Placeholder methods for other missing functionality
  async getMaterialRequests(filters?: any, company?: string) {
    return { data: [] };
  }

  async getStockEntries(filters?: any, company?: string) {
    return { data: [] };
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
    return { data: [] };
  }

  async getRecentActivities() {
    return { data: [] };
  }

  // Stock reconciliation methods
  async createStockReconciliation(reconciliationData: any) {
    const response = await fetch(`${this.baseURL}/api/resource/Stock Reconciliation`, {
      method: 'POST',
      headers: {
        'Authorization': `token ${this.apiKey}:${this.apiSecret}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(reconciliationData)
    });

    if (!response.ok) {
      throw new Error(`Failed to create stock reconciliation: ${response.statusText}`);
    }

    return response.json();
  }

  async updateStockReconciliation(name: string, reconciliationData: any) {
    const response = await fetch(`${this.baseURL}/api/resource/Stock Reconciliation/${encodeURIComponent(name)}`, {
      method: 'PUT',
      headers: {
        'Authorization': `token ${this.apiKey}:${this.apiSecret}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(reconciliationData)
    });

    if (!response.ok) {
      throw new Error(`Failed to update stock reconciliation: ${response.statusText}`);
    }

    return response.json();
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
  const api = await createERPNextAPI();
  if (!api) return null;

  try {
    const companiesResult = await api.getCompanies();
    if (companiesResult.data && companiesResult.data.length > 0) {
      return companiesResult.data[0].name;
    }
  } catch (error) {
    console.error('Failed to get default company:', error);
  }

  return null;
}

// Re-export types
export type * from './types';

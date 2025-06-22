import { ERPNextBaseAPI } from './baseApi';
import { ERPNextSalesAPI } from './salesApi';
import { ERPNextPurchaseAPI } from './purchaseApi';
import { ERPNextStockAPI } from './stockApi';
import { ERPNextStockEntryAPI } from './stockEntryApi';
import { ERPNextItemsAPI } from './itemsApi';
import { ERPNextWarehouseAPI } from './warehouseApi';
import { ERPNextCompanyAPI } from './companyApi';
import { ERPNextMaterialAPI } from './materialApi';
import { ERPNextDashboardAPI } from './dashboardApi';
import { ERPNextOtherAPIs } from './otherApis';

export class ERPNextAPI extends ERPNextBaseAPI {
  public sales: ERPNextSalesAPI;
  public purchase: ERPNextPurchaseAPI;
  public stock: ERPNextStockAPI;
  public stockEntry: ERPNextStockEntryAPI;
  public items: ERPNextItemsAPI;
  public warehouse: ERPNextWarehouseAPI;
  public company: ERPNextCompanyAPI;
  public material: ERPNextMaterialAPI;
  public dashboard: ERPNextDashboardAPI;
  public other: ERPNextOtherAPIs;

  constructor(baseURL: string, apiKey: string, apiSecret: string) {
    super(baseURL, apiKey, apiSecret);
    
    this.sales = new ERPNextSalesAPI(baseURL, apiKey, apiSecret);
    this.purchase = new ERPNextPurchaseAPI(baseURL, apiKey, apiSecret);
    this.stock = new ERPNextStockAPI(baseURL, apiKey, apiSecret);
    this.stockEntry = new ERPNextStockEntryAPI(baseURL, apiKey, apiSecret);
    this.items = new ERPNextItemsAPI(baseURL, apiKey, apiSecret);
    this.warehouse = new ERPNextWarehouseAPI(baseURL, apiKey, apiSecret);
    this.company = new ERPNextCompanyAPI(baseURL, apiKey, apiSecret);
    this.material = new ERPNextMaterialAPI(baseURL, apiKey, apiSecret);
    this.dashboard = new ERPNextDashboardAPI(baseURL, apiKey, apiSecret);
    this.other = new ERPNextOtherAPIs(baseURL, apiKey, apiSecret);
  }

  // Legacy methods for backward compatibility
  async getSalesOrders(filters?: any, fields?: string[], limitPageLength?: number) {
    return this.sales.getSalesOrders(filters, undefined, limitPageLength);
  }

  async getPurchaseOrders(filters?: any, fields?: string[], limitPageLength?: number) {
    return this.purchase.getPurchaseOrders(filters, undefined, limitPageLength);
  }

  async getStockEntries(filters?: any, fields?: string[], limitPageLength?: number) {
    return this.stockEntry.getStockEntries(filters, undefined, limitPageLength);
  }

  async getDeliveryNotes(filters?: any, fields?: string[], limitPageLength?: number) {
    return this.sales.getDeliveryNotes(filters, undefined, limitPageLength);
  }

  async getPurchaseReceipts(filters?: any, fields?: string[], limitPageLength?: number) {
    return this.purchase.getPurchaseReceipts(filters, undefined, limitPageLength);
  }

  async getMaterialRequests(filters?: any, fields?: string[], limitPageLength?: number) {
    return this.material.getMaterialRequests(filters, undefined, limitPageLength);
  }

  async getItems(filters?: any, fields?: string[], limitPageLength?: number) {
    return this.items.getItems(filters, undefined, limitPageLength);
  }

  async getWarehouses(filters?: any, fields?: string[], limitPageLength?: number) {
    return this.warehouse.getWarehouses(filters, undefined, limitPageLength);
  }

  async getBinData(filters?: any, fields?: string[], limitPageLength: number = 50) {
    return this.stock.getBinData(filters, fields, limitPageLength.toString());
  }

  async getStockBalance(filters?: any, fields?: string[], limitPageLength?: number) {
    return this.stock.getStockBalance(filters, fields, limitPageLength?.toString());
  }

  async getStockLedger(filters?: any, fields?: string[], limitPageLength?: number) {
    return this.stock.getStockLedger(filters, fields, limitPageLength?.toString());
  }

  async getSerialNo(filters?: any, fields?: string[], limitPageLength?: number) {
    return this.stock.getSerialNo(filters, fields, limitPageLength?.toString());
  }

  async getBatchData(filters?: any, fields?: string[], limitPageLength?: number) {
    return this.stock.getBatchData(filters, fields, limitPageLength?.toString());
  }

  async getCompanies() {
    return this.company.getCompanies();
  }

  async getQualityInspections(filters?: any, limitPageLength?: number) {
    return this.other.getQualityInspections(filters, limitPageLength);
  }
}

// Re-export types
export * from './types';

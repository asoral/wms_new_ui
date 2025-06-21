
import { ERPNextBaseAPI } from './baseApi';
import { ERPNextSalesAPI } from './salesApi';
import { ERPNextPurchaseAPI } from './purchaseApi';
import { ERPNextStockAPI } from './stockApi';
import { ERPNextItemsAPI } from './itemsApi';
import { ERPNextMaterialAPI } from './materialApi';
import { ERPNextWarehouseAPI } from './warehouseApi';

export class ERPNextAPI {
  public sales: ERPNextSalesAPI;
  public purchase: ERPNextPurchaseAPI;
  public stock: ERPNextStockAPI;
  public item: ERPNextItemsAPI;
  public material: ERPNextMaterialAPI;
  public warehouse: ERPNextWarehouseAPI;

  constructor(
    private baseURL: string,
    private apiKey: string,
    private apiSecret: string
  ) {
    this.sales = new ERPNextSalesAPI(baseURL, apiKey, apiSecret);
    this.purchase = new ERPNextPurchaseAPI(baseURL, apiKey, apiSecret);
    this.stock = new ERPNextStockAPI(baseURL, apiKey, apiSecret);
    this.item = new ERPNextItemsAPI(baseURL, apiKey, apiSecret);
    this.material = new ERPNextMaterialAPI(baseURL, apiKey, apiSecret);
    this.warehouse = new ERPNextWarehouseAPI(baseURL, apiKey, apiSecret);
  }

  // Expose base API properties for backward compatibility
  getBaseURL() {
    return this.baseURL;
  }

  getApiKey() {
    return this.apiKey;
  }

  getApiSecret() {
    return this.apiSecret;
  }

  // Item API methods
  async searchItems(searchTerm: string, limitPageLength: number = 20) {
    return this.item.searchItems(searchTerm, limitPageLength);
  }

  async searchItemsByBarcode(barcode: string) {
    return this.item.searchItemsByBarcode(barcode);
  }

  async getItemDetails(itemCode: string) {
    return this.item.getItemDetails(itemCode);
  }

  async getItems(filters?: any, searchText?: string, limit?: number, offset?: number) {
    return this.item.getItems(filters, searchText, limit, offset);
  }

  // Warehouse API methods
  async getWarehouses(filters?: any, company?: string, includeDisabled?: boolean) {
    return this.warehouse.getWarehouses(filters, company, includeDisabled);
  }

  // Stock API methods
  async getBinStock(itemCode?: string, warehouse?: string) {
    return this.stock.getBinStock(itemCode, warehouse);
  }

  async getStockBalance(company?: string) {
    return this.stock.getStockBalance(company);
  }

  async getSalesOrders(filters?: any, company?: string, limitPageLength?: number) {
    return this.sales.getSalesOrders(filters, company, limitPageLength);
  }

  async getDeliveryNotes(filters?: any, company?: string, limitPageLength?: number) {
    return this.sales.getDeliveryNotes(filters, company, limitPageLength);
  }

  async getPurchaseOrders(filters?: any, company?: string, limitPageLength?: number) {
    return this.purchase.getPurchaseOrders(filters, company, limitPageLength);
  }

  async getPurchaseReceipts(filters?: any, company?: string, limitPageLength?: number) {
    return this.purchase.getPurchaseReceipts(filters, company, limitPageLength);
  }

  async getCompanies() {
    const response = await fetch(`${this.baseURL}/api/resource/Company`, {
      headers: {
        'Authorization': `token ${this.apiKey}:${this.apiSecret}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch companies: ${response.statusText}`);
    }

    return response.json();
  }

  // Material Request API methods
  async getMaterialRequests(filters?: any, company?: string, limitPageLength?: number) {
    return this.material.getMaterialRequests(filters, company, limitPageLength);
  }

  async getMaterialRequest(name: string) {
    return this.material.getMaterialRequest(name);
  }

  async createMaterialRequest(data: any) {
    return this.material.createMaterialRequest(data);
  }

  async updateMaterialRequest(name: string, data: any) {
    return this.material.updateMaterialRequest(name, data);
  }

  async searchMaterialRequests(searchTerm: string, company?: string, limitPageLength?: number) {
    return this.material.searchMaterialRequests(searchTerm, company, limitPageLength);
  }

  // Placeholder methods for other functionality
  async getStockEntries() { return { data: [] }; }
  async getPickLists() { return { data: [] }; }  
  async getPackingSlips() { return { data: [] }; }
  async getQualityInspections() { return { data: [] }; }
  async getProductBundles() { return { data: [] }; }
  async createStockReconciliation(data: any) { return { data: {} }; }
  async updateStockReconciliation(name: string, data: any) { return { data: {} }; }
}

export * from './types';

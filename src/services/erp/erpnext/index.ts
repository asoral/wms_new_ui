
import { ERPNextBaseAPI } from './baseApi';
import { ERPNextSalesAPI } from './salesApi';
import { ERPNextStockAPI } from './stockApi';
import { ERPNextMaterialAPI } from './materialApi';
import { ERPNextPurchaseAPI } from './purchaseApi';
import { ERPNextItemsAPI } from './itemsApi';

export class ERPNextAPI extends ERPNextBaseAPI {
  private salesAPI: ERPNextSalesAPI;
  private stockAPI: ERPNextStockAPI;
  private materialAPI: ERPNextMaterialAPI;
  private purchaseAPI: ERPNextPurchaseAPI;
  private itemsAPI: ERPNextItemsAPI;

  constructor(baseURL: string, apiKey: string, apiSecret: string) {
    super(baseURL, apiKey, apiSecret);
    this.salesAPI = new ERPNextSalesAPI(baseURL, apiKey, apiSecret);
    this.stockAPI = new ERPNextStockAPI(baseURL, apiKey, apiSecret);
    this.materialAPI = new ERPNextMaterialAPI(baseURL, apiKey, apiSecret);
    this.purchaseAPI = new ERPNextPurchaseAPI(baseURL, apiKey, apiSecret);
    this.itemsAPI = new ERPNextItemsAPI(baseURL, apiKey, apiSecret);
  }

  // Public getters for API properties
  get getBaseURL() { return this.baseURL; }
  get getApiKey() { return this.apiKey; }
  get getApiSecret() { return this.apiSecret; }

  // Item methods - delegate to itemsAPI
  async getItems(filters?: any, limitPageLength?: number) {
    return this.itemsAPI.getItems(filters, limitPageLength);
  }

  async getItemDetails(itemCode: string) {
    return this.itemsAPI.getItemDetails(itemCode);
  }

  async searchItems(searchTerm: string, limitPageLength?: number) {
    return this.itemsAPI.searchItems(searchTerm, limitPageLength);
  }

  async searchItemsByBarcode(barcode: string) {
    return this.itemsAPI.searchItemsByBarcode(barcode);
  }

  // Sales methods
  async getSalesOrders(filters?: any, company?: string, limitPageLength?: number) {
    return this.salesAPI.getSalesOrders(filters, company, limitPageLength);
  }

  async getSalesOrder(soNumber: string) {
    return this.salesAPI.getSalesOrder(soNumber);
  }

  async searchSalesOrders(searchTerm: string, company?: string, limitPageLength?: number) {
    return this.salesAPI.searchSalesOrders(searchTerm, company, limitPageLength);
  }

  async createDeliveryNote(deliveryData: any) {
    return this.salesAPI.createDeliveryNote(deliveryData);
  }

  async getDeliveryNotes(filters?: any, company?: string, limitPageLength?: number) {
    return this.salesAPI.getDeliveryNotes(filters, company, limitPageLength);
  }

  async getDeliveryNote(name: string) {
    return this.callAPI(`Delivery Note/${name}`, 'GET');
  }

  // Stock methods
  async getStockBalance(filters?: any) {
    return this.stockAPI.getStockBalance(filters);
  }

  async getCurrentStock(itemCode: string, warehouse: string) {
    return this.stockAPI.getCurrentStock(itemCode, warehouse);
  }

  async createStockEntry(stockEntryData: any) {
    return this.callAPI('Stock Entry', 'POST', stockEntryData);
  }

  async updateStockEntry(name: string, data: any) {
    return this.callAPI(`Stock Entry/${name}`, 'PUT', data);
  }

  async getStockEntries(filters?: any, company?: string, limitPageLength?: number) {
    return this.stockAPI.getStockEntries(filters, company, limitPageLength);
  }

  async getStockEntry(name: string) {
    return this.callAPI(`Stock Entry/${name}`, 'GET');
  }

  async submitStockEntry(stockEntryName: string) {
    return this.callAPI(`Stock Entry/${stockEntryName}`, 'PUT', { docstatus: 1 });
  }

  async getStockReconciliations(filters?: any, limitPageLength?: number) {
    return this.callAPI('Stock Reconciliation', 'GET', undefined, filters, limitPageLength);
  }

  async getWarehouses(filters?: any, company?: string, limitPageLength?: number) {
    return this.callAPI('Warehouse', 'GET', undefined, filters, limitPageLength);
  }

  async getBinStock(itemCode: string, warehouse?: string) {
    const filters = [['item_code', '=', itemCode]];
    if (warehouse) {
      filters.push(['warehouse', '=', warehouse]);
    }
    return this.callAPI('Bin', 'GET', undefined, filters);
  }

  async getCompanies(filters?: any, limitPageLength?: number) {
    return this.callAPI('Company', 'GET', undefined, filters, limitPageLength);
  }

  // Material Request methods
  async getMaterialRequests(filters?: any, company?: string, limitPageLength?: number) {
    return this.materialAPI.getMaterialRequests(filters, company, limitPageLength);
  }

  async getMaterialRequest(name: string) {
    return this.materialAPI.getMaterialRequest(name);
  }

  async createMaterialRequest(data: any) {
    return this.materialAPI.createMaterialRequest(data);
  }

  async updateMaterialRequest(name: string, data: any) {
    return this.materialAPI.updateMaterialRequest(name, data);
  }

  async searchMaterialRequests(searchTerm: string, company?: string, limitPageLength?: number) {
    return this.materialAPI.searchMaterialRequests(searchTerm, company, limitPageLength);
  }

  async searchMaterialRequestsForStockEntry(searchTerm: string, company?: string, limitPageLength?: number) {
    return this.materialAPI.searchMaterialRequests(searchTerm, company, limitPageLength);
  }

  // Purchase methods
  async getPurchaseOrders(filters?: any, company?: string, limitPageLength?: number) {
    return this.purchaseAPI.getPurchaseOrders(filters, company, limitPageLength);
  }

  async getPurchaseOrder(poNumber: string) {
    return this.purchaseAPI.getPurchaseOrder(poNumber);
  }

  async searchPurchaseOrders(searchTerm: string, company?: string, limitPageLength?: number) {
    return this.purchaseAPI.getPurchaseOrders([['name', 'like', `%${searchTerm}%`]], company, limitPageLength);
  }

  async searchPurchaseOrdersForStockEntry(searchTerm: string, company?: string, limitPageLength?: number) {
    return this.purchaseAPI.getPurchaseOrders([['name', 'like', `%${searchTerm}%`]], company, limitPageLength);
  }

  async searchSalesOrdersForStockEntry(searchTerm: string, company?: string, limitPageLength?: number) {
    return this.salesAPI.searchSalesOrders(searchTerm, company, limitPageLength);
  }

  async searchBOMs(searchTerm: string, limitPageLength?: number) {
    return this.callAPI('BOM', 'GET', undefined, [['name', 'like', `%${searchTerm}%`]], limitPageLength);
  }

  async createPurchaseReceipt(receiptData: any) {
    return this.purchaseAPI.createPurchaseReceipt(receiptData);
  }

  async updatePurchaseReceipt(name: string, data: any) {
    return this.purchaseAPI.updatePurchaseReceipt(name, data);
  }

  async getPurchaseReceipt(name: string) {
    return this.purchaseAPI.getPurchaseReceipt(name);
  }

  async getPurchaseReceipts(filters?: any, company?: string, limitPageLength?: number) {
    return this.purchaseAPI.getPurchaseReceipts(filters, company, limitPageLength);
  }

  async submitPurchaseReceipt(name: string) {
    return this.purchaseAPI.submitPurchaseReceipt(name);
  }

  // Pick List methods
  async getPickLists(filters?: any, company?: string, limitPageLength?: number) {
    return this.callAPI('Pick List', 'GET', undefined, filters, limitPageLength);
  }

  async getPickList(name: string) {
    return this.callAPI(`Pick List/${name}`, 'GET');
  }

  async searchPickLists(searchTerm: string, company?: string, limitPageLength?: number) {
    return this.callAPI('Pick List', 'GET', undefined, [['name', 'like', `%${searchTerm}%`]], limitPageLength);
  }

  async createPickList(data: any) {
    return this.callAPI('Pick List', 'POST', data);
  }

  async updatePickList(name: string, data: any) {
    return this.callAPI(`Pick List/${name}`, 'PUT', data);
  }

  async getPickListItems(pickListName: string) {
    const response = await this.getPickList(pickListName);
    return response?.data?.locations || [];
  }

  async createPickListFromDocument(data: any) {
    return this.callAPI('Pick List', 'POST', data);
  }

  // Quality Inspections
  async getQualityInspections(filters?: any, limitPageLength?: number) {
    return this.callAPI('Quality Inspection', 'GET', undefined, filters, limitPageLength);
  }

  // Product Bundles
  async getProductBundles(filters?: any, limitPageLength?: number) {
    return this.callAPI('Product Bundle', 'GET', undefined, filters, limitPageLength);
  }

  // Packing Slips
  async getPackingSlips(filters?: any, limitPageLength?: number) {
    return this.callAPI('Packing Slip', 'GET', undefined, filters, limitPageLength);
  }

  // Generic API call method
  async callAPI(endpoint: string, method: string = 'GET', data?: any, filters?: any, limitPageLength?: number) {
    const params = this.buildQueryParams(filters, undefined, limitPageLength);
    const url = `${this.baseURL}/api/resource/${endpoint}${params ? '?' + params : ''}`;
    
    const options: RequestInit = {
      method,
      headers: this.getHeaders(),
    };

    if (data && method !== 'GET') {
      options.headers = {
        ...options.headers,
        'Content-Type': 'application/json'
      };
      options.body = JSON.stringify(data);
    }

    const response = await fetch(url, options);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`${endpoint} API Error:`, response.status, errorText);
      throw new Error(`Failed to ${method} ${endpoint}: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }
}

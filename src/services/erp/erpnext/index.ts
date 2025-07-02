
import { ERPNextBaseAPI } from './baseApi';
import { ERPNextItemAPI } from './itemApi';
import { ERPNextSalesAPI } from './salesApi';
import { ERPNextStockAPI } from './stockApi';
import { ERPNextMaterialAPI } from './materialApi';
import { ERPNextPurchaseAPI } from './purchaseApi';
import { ERPNextPickListAPI } from './pickListApi';

export class ERPNextAPI extends ERPNextBaseAPI {
  private itemAPI: ERPNextItemAPI;
  private salesAPI: ERPNextSalesAPI;
  private stockAPI: ERPNextStockAPI;
  private materialAPI: ERPNextMaterialAPI;
  private purchaseAPI: ERPNextPurchaseAPI;
  private pickListAPI: ERPNextPickListAPI;

  constructor(baseURL: string, apiKey: string, apiSecret: string) {
    super(baseURL, apiKey, apiSecret);
    this.itemAPI = new ERPNextItemAPI(baseURL, apiKey, apiSecret);
    this.salesAPI = new ERPNextSalesAPI(baseURL, apiKey, apiSecret);
    this.stockAPI = new ERPNextStockAPI(baseURL, apiKey, apiSecret);
    this.materialAPI = new ERPNextMaterialAPI(baseURL, apiKey, apiSecret);
    this.purchaseAPI = new ERPNextPurchaseAPI(baseURL, apiKey, apiSecret);
    this.pickListAPI = new ERPNextPickListAPI(baseURL, apiKey, apiSecret);
  }

  // Item methods
  async getItems(filters?: any, limitPageLength?: number) {
    return this.itemAPI.getItems(filters, limitPageLength);
  }

  async getItemDetails(itemCode: string) {
    return this.itemAPI.getItemDetails(itemCode);
  }

  async searchItems(searchTerm: string, limitPageLength?: number) {
    return this.itemAPI.searchItems(searchTerm, limitPageLength);
  }

  async searchItemsByBarcode(barcode: string) {
    return this.itemAPI.searchItemsByBarcode(barcode);
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

  // Stock methods
  async getStockBalance(filters?: any) {
    return this.stockAPI.getStockBalance(filters);
  }

  async getCurrentStock(itemCode: string, warehouse: string) {
    return this.stockAPI.getCurrentStock(itemCode, warehouse);
  }

  async createStockEntry(stockEntryData: any) {
    return this.stockAPI.createStockEntry(stockEntryData);
  }

  async updateStockEntry(name: string, data: any) {
    return this.stockAPI.updateStockEntry(name, data);
  }

  async getStockEntries(filters?: any, company?: string, limitPageLength?: number) {
    return this.stockAPI.getStockEntries(filters, company, limitPageLength);
  }

  async submitStockEntry(stockEntryName: string) {
    return this.stockAPI.submitStockEntry(stockEntryName);
  }

  async getStockReconciliations(filters?: any, limitPageLength?: number) {
    return this.stockAPI.getStockReconciliations(filters, limitPageLength);
  }

  async getWarehouses(filters?: any, company?: string, limitPageLength?: number) {
    return this.stockAPI.getWarehouses(filters, company, limitPageLength);
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

  // Purchase methods
  async getPurchaseOrders(filters?: any, company?: string, limitPageLength?: number) {
    return this.purchaseAPI.getPurchaseOrders(filters, company, limitPageLength);
  }

  async getPurchaseOrder(poNumber: string) {
    return this.purchaseAPI.getPurchaseOrder(poNumber);
  }

  async searchPurchaseOrders(searchTerm: string, company?: string, limitPageLength?: number) {
    return this.purchaseAPI.searchPurchaseOrders(searchTerm, company, limitPageLength);
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
    return this.pickListAPI.getPickLists(filters, company, limitPageLength);
  }

  async getPickList(name: string) {
    return this.pickListAPI.getPickList(name);
  }

  async searchPickLists(searchTerm: string, company?: string, limitPageLength?: number) {
    return this.pickListAPI.searchPickLists(searchTerm, company, limitPageLength);
  }

  async createPickList(data: any) {
    return this.pickListAPI.createPickList(data);
  }

  async updatePickList(name: string, data: any) {
    return this.pickListAPI.updatePickList(name, data);
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

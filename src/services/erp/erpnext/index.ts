import { ERPNextBaseAPI } from './baseApi';
import { ERPNextSalesAPI } from './salesApi';
import { ERPNextPurchaseAPI } from './purchaseApi';
import { ERPNextStockAPI from './stockApi';
import { ERPNextItemAPI } from './itemApi';
import { ERPNextMaterialAPI } from './materialApi';

export class ERPNextAPI {
  public sales: ERPNextSalesAPI;
  public purchase: ERPNextPurchaseAPI;
  public stock: ERPNextStockAPI;
  public item: ERPNextItemAPI;
  public material: ERPNextMaterialAPI;

  constructor(
    private baseURL: string,
    private apiKey: string,
    private apiSecret: string
  ) {
    this.sales = new ERPNextSalesAPI(baseURL, apiKey, apiSecret);
    this.purchase = new ERPNextPurchaseAPI(baseURL, apiKey, apiSecret);
    this.stock = new ERPNextStockAPI(baseURL, apiKey, apiSecret);
    this.item = new ERPNextItemAPI(baseURL, apiKey, apiSecret);
    this.material = new ERPNextMaterialAPI(baseURL, apiKey, apiSecret);
  }

  getBaseURL() {
    return this.baseURL;
  }

  getApiKey() {
    return this.apiKey;
  }

  getApiSecret() {
    return this.apiSecret
  }

  async searchItems(searchTerm: string, limitPageLength: number = 20) {
    return this.item.searchItems(searchTerm, limitPageLength);
  }

  async searchItemsByBarcode(barcode: string) {
    return this.item.searchItemsByBarcode(barcode);
  }

  async getItemDetails(itemCode: string) {
    return this.item.getItemDetails(itemCode);
  }

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
}

export * from './types';

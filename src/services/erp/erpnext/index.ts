
import { ERPNextBaseAPI } from './baseApi';
import { ERPNextMaterialAPI } from './materialApi';
import { ERPNextItemsAPI } from './itemsApi';
import { ERPNextStockAPI } from './stockApi';
import { ERPNextWarehouseAPI } from './warehouseApi';
import { ERPNextPurchaseAPI } from './purchaseApi';
import { ERPNextSalesAPI } from './salesApi';
import { ERPNextCompanyAPI } from './companyApi';
import { ERPNextDashboardAPI } from './dashboardApi';
import { ERPNextStockEntryAPI } from './stockEntryApi';

export class ERPNextAPI extends ERPNextBaseAPI {
  private materialsAPI: ERPNextMaterialAPI;
  private itemsAPI: ERPNextItemsAPI;
  private stockAPI: ERPNextStockAPI;
  private warehouseAPI: ERPNextWarehouseAPI;
  private purchaseAPI: ERPNextPurchaseAPI;
  private salesAPI: ERPNextSalesAPI;
  private companyAPI: ERPNextCompanyAPI;
  private dashboardAPI: ERPNextDashboardAPI;
  public stockEntryAPI: ERPNextStockEntryAPI; // Make this public

  constructor(baseURL: string, apiKey: string, apiSecret: string) {
    super(baseURL, apiKey, apiSecret);
    this.materialsAPI = new ERPNextMaterialAPI(baseURL, apiKey, apiSecret);
    this.itemsAPI = new ERPNextItemsAPI(baseURL, apiKey, apiSecret);
    this.stockAPI = new ERPNextStockAPI(baseURL, apiKey, apiSecret);
    this.warehouseAPI = new ERPNextWarehouseAPI(baseURL, apiKey, apiSecret);
    this.purchaseAPI = new ERPNextPurchaseAPI(baseURL, apiKey, apiSecret);
    this.salesAPI = new ERPNextSalesAPI(baseURL, apiKey, apiSecret);
    this.companyAPI = new ERPNextCompanyAPI(baseURL, apiKey, apiSecret);
    this.dashboardAPI = new ERPNextDashboardAPI(baseURL, apiKey, apiSecret);
    this.stockEntryAPI = new ERPNextStockEntryAPI(baseURL, apiKey, apiSecret);
  }

  // Expose API instances for direct access
  get sales() {
    return this.salesAPI;
  }

  get purchase() {
    return this.purchaseAPI;
  }

  get stock() {
    return this.stockAPI;
  }

  get warehouse() {
    return this.warehouseAPI;
  }

  // Material Request methods
  async getMaterialRequests(filters?: any, company?: string, limitPageLength?: number) {
    return this.materialsAPI.getMaterialRequests(filters, company, limitPageLength);
  }

  async getMaterialRequest(name: string) {
    return this.materialsAPI.getMaterialRequest(name);
  }

  async createMaterialRequest(data: any) {
    return this.materialsAPI.createMaterialRequest(data);
  }

  async updateMaterialRequest(name: string, data: any) {
    return this.materialsAPI.updateMaterialRequest(name, data);
  }

  async searchMaterialRequests(searchTerm: string, company?: string, limitPageLength?: number) {
    return this.materialsAPI.searchMaterialRequests(searchTerm, company || '', limitPageLength || 20);
  }

  // Item methods
  async getItems(filters?: any, limitPageLength?: number) {
    return this.itemsAPI.getItems(filters, limitPageLength);
  }

  async searchItems(search: string, limit?: number) {
    return this.itemsAPI.searchItems(search, limit);
  }

  async searchItemsByBarcode(barcode: string) {
    return this.itemsAPI.searchItemsByBarcode(barcode);
  }

  async getItemsPaginated(filters?: any, fields?: string[], limit?: number, page?: number) {
    return this.itemsAPI.getItemsPaginated(filters, fields, limit, page);
  }

  async getItemDetails(itemCode: string) {
    return this.itemsAPI.getItemDetails(itemCode);
  }

  async getItemByBarcode(barcode: string) {
    return this.itemsAPI.getItemByBarcode(barcode);
  }

  // Stock methods
  async getStockBalance(itemCode?: string, company?: string, warehouse?: string) {
    return this.stockAPI.getStockBalance(itemCode, company, warehouse);
  }

  async getCurrentStock(itemCode: string, warehouse?: string) {
    return this.stockAPI.getCurrentStock(itemCode, warehouse);
  }

  async getBatches(itemCode: string, warehouse?: string) {
    return this.stockAPI.getBatches(itemCode, warehouse);
  }

  async getSerialNumbers(itemCode: string, warehouse?: string) {
    return this.stockAPI.getSerialNumbers(itemCode, warehouse);
  }

  async getStockLedgerEntries(itemCode: string, warehouse?: string, fromDate?: string, toDate?: string) {
    return this.stockAPI.getStockLedgerEntries(itemCode, warehouse, fromDate, toDate);
  }

  async getBinStock(itemCode?: string, warehouse?: string, company?: string) {
    return this.stockAPI.getBinStock(itemCode, warehouse, company);
  }

  async getStockAgingReport() {
    return this.stockAPI.getStockAgingReport();
  }

  async createStockReconciliation(reconciliationData: any) {
    return this.stockAPI.createStockReconciliation(reconciliationData);
  }

  async updateStockReconciliation(name: string, reconciliationData: any) {
    return this.stockAPI.updateStockReconciliation(name, reconciliationData);
  }

  async getSerialBatchBundle(name: string) {
    return this.stockAPI.getSerialBatchBundle(name);
  }

  async createSerialBatchBundle(bundleData: any) {
    return this.stockAPI.createSerialBatchBundle(bundleData);
  }

  // Warehouse methods
  async getWarehouses(filters?: any, fields?: string[], limitPageLength?: number) {
    return this.warehouseAPI.getWarehouses(filters, company, limitPageLength);
  }

  // Purchase methods
  async getPurchaseOrders(filters?: any, company?: string, limitPageLength?: number, limitStart?: number) {
    return this.purchaseAPI.getPurchaseOrders(filters, company, limitPageLength, limitStart);
  }

  async getPurchaseOrder(name: string) {
    return this.purchaseAPI.getPurchaseOrder(name);
  }

  async getPurchaseReceipts(filters?: any, company?: string, limitPageLength?: number) {
    return this.purchaseAPI.getPurchaseReceipts(filters, company, limitPageLength);
  }

  // Sales methods
  async getSalesOrders(filters?: any, company?: string, limitPageLength?: number, limitStart?: number) {
    return this.salesAPI.getSalesOrders(filters, company, limitPageLength, limitStart);
  }

  async getDeliveryNotes(filters?: any, company?: string) {
    return this.salesAPI.getDeliveryNotes(filters, company);
  }

  // Company methods
  async getCompanies() {
    return this.companyAPI.getCompanies();
  }

  // Dashboard methods
  async getDashboardData(doctype: string, filters?: any) {
    return this.dashboardAPI.getDashboardData(doctype, filters);
  }

  // Stock Entry methods
  async getStockEntries(filters?: any, company?: string, limitPageLength?: number) {
    return this.stockEntryAPI.getStockEntries(filters, company, limitPageLength);
  }

  async getStockEntry(name: string) {
    return this.stockEntryAPI.getStockEntry(name);
  }

  async createStockEntry(data: any) {
    return this.stockEntryAPI.createStockEntry(data);
  }

  async updateStockEntry(name: string, data: any) {
    return this.stockEntryAPI.updateStockEntry(name, data);
  }

  async submitStockEntry(name: string) {
    return this.stockEntryAPI.submitStockEntry(name);
  }

  async cancelStockEntry(name: string) {
    return this.stockEntryAPI.cancelStockEntry(name);
  }

  async getStockEntryTypes() {
    return this.stockEntryAPI.getStockEntryTypes();
  }

  async getItemsFromDocument(doctype: string, docname: string) {
    return this.stockEntryAPI.getItemsFromDocument(doctype, docname);
  }

  // New method to fetch items from Material Request
  async getItemsFromMaterialRequest(materialRequestName: string) {
    return this.stockEntryAPI.getItemsFromMaterialRequest(materialRequestName);
  }

  // Document selector methods for Stock Entry
  async searchMaterialRequestsForStockEntry(stockEntryType: string, company?: string) {
    return this.stockEntryAPI.searchMaterialRequestsForStockEntry(stockEntryType, company);
  }

  async searchPurchaseOrdersForStockEntry(company?: string) {
    return this.stockEntryAPI.searchPurchaseOrdersForStockEntry(company);
  }

  async searchSalesOrdersForStockEntry(company?: string) {
    return this.stockEntryAPI.searchSalesOrdersForStockEntry(company);
  }

  async searchBOMs(company?: string) {
    return this.stockEntryAPI.searchBOMs(company);
  }

  // Legacy methods for backward compatibility - placeholder implementations
  async getPickLists(filters?: any, company?: string, limitPageLength?: number) {
    return { data: [] };
  }

  async getPackingSlips(filters?: any, company?: string, limitPageLength?: number) {
    return { data: [] };
  }

  async getQualityInspections(filters?: any, company?: string, limitPageLength?: number) {
    return { data: [] };
  }

  async getProductBundles(filters?: any, company?: string, limitPageLength?: number) {
    return { data: [] };
  }
}

export { ERPNextBaseAPI, ERPNextItemsAPI, ERPNextMaterialAPI, ERPNextStockAPI };

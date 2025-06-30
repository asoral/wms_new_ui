
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
  public stockEntryAPI: ERPNextStockEntryAPI;

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
  async getWarehouses(filters?: any, company?: string, limitPageLength?: number) {
    return this.warehouseAPI.getWarehouses(filters, company, limitPageLength);
  }

  // Purchase methods
  async getPurchaseOrders(filters?: any, company?: string, limitPageLength?: number) {
    return this.purchaseAPI.getPurchaseOrders(filters, company, limitPageLength);
  }

  async getPurchaseOrder(name: string) {
    return this.purchaseAPI.getPurchaseOrder(name);
  }

  async getPurchaseReceipts(filters?: any, company?: string, limitPageLength?: number) {
    return this.purchaseAPI.getPurchaseReceipts(filters, company, limitPageLength);
  }

  // Sales methods
  async getSalesOrders(filters?: any, company?: string, limitPageLength?: number) {
    return this.salesAPI.getSalesOrders(filters, company, limitPageLength);
  }

  async getDeliveryNotes(filters?: any, company?: string, limitPageLength?: number) {
    return this.salesAPI.getDeliveryNotes(filters, company, limitPageLength);
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

  // Pick List methods - Enhanced ERPNext API integration
  async getPickLists(filters?: any, company?: string, limitPageLength?: number) {
    const finalFilters = [];
    if (filters) {
      finalFilters.push(...this.convertToFrappeFilters(filters));
    }
    if (company) {
      finalFilters.push(['company', '=', company]);
    }
    
    const params = this.buildQueryParams(finalFilters, undefined, limitPageLength);
    
    const response = await fetch(`${this.baseURL}/api/resource/Pick List?${params}`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch pick lists: ${response.statusText}`);
    }

    return response.json();
  }

  async createPickList(data: any) {
    const response = await fetch(`${this.baseURL}/api/resource/Pick List`, {
      method: 'POST',
      headers: {
        ...this.getHeaders(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to create pick list: ${response.statusText} - ${errorText}`);
    }

    return response.json();
  }

  async getPickList(name: string) {
    const response = await fetch(`${this.baseURL}/api/resource/Pick List/${encodeURIComponent(name)}`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch pick list: ${response.statusText}`);
    }

    return response.json();
  }

  // Enhanced Pick List creation with ERPNext picking strategy
  async createPickListFromDocument(pickListData: {
    purpose: string;
    company: string;
    document_type: string;
    document_name: string;
    locations?: any[];
  }) {
    const response = await fetch(`${this.baseURL}/api/resource/Pick List`, {
      method: 'POST',
      headers: {
        ...this.getHeaders(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        purpose: pickListData.purpose,
        company: pickListData.company,
        locations: pickListData.locations || [],
        work_order: pickListData.document_type === 'Work Order' ? pickListData.document_name : undefined,
        material_request: pickListData.document_type === 'Material Request' ? pickListData.document_name : undefined,
        docstatus: 0, // Draft status
        ...pickListData
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to create pick list from document: ${response.statusText} - ${errorText}`);
    }

    return response.json();
  }

  // Get items with picking details from ERPNext
  async getPickListItems(pickListName: string) {
    const response = await fetch(`${this.baseURL}/api/resource/Pick List/${encodeURIComponent(pickListName)}?fields=["*"]`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch pick list items: ${response.statusText}`);
    }

    const result = await response.json();
    return result.data?.locations || [];
  }

  // Call ERPNext method to get items for picking
  async getItemsForPicking(doctype: string, docname: string, company: string) {
    const response = await fetch(`${this.baseURL}/api/method/erpnext.stock.doctype.pick_list.pick_list.get_items_for_pick_list`, {
      method: 'POST',
      headers: {
        ...this.getHeaders(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        doctype: doctype,
        docname: docname,
        company: company
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to get items for picking: ${response.statusText}`);
    }

    return response.json();
  }

  // Get Pick List statistics for dashboard
  async getPickListStats(company?: string) {
    try {
      // Get pending pick lists
      const pendingFilters = [['docstatus', '=', '0']]; // Draft status
      if (company) {
        pendingFilters.push(['company', '=', company]);
      }
      
      const pendingPickLists = await this.getPickLists(pendingFilters, company, 100);
      
      // Get completed pick lists for today
      const today = new Date().toISOString().split('T')[0];
      const completedFilters = [
        ['docstatus', '=', '1'], // Submitted status
        ['creation', '>=', today]
      ];
      if (company) {
        completedFilters.push(['company', '=', company]);
      }
      
      const completedToday = await this.getPickLists(completedFilters, company, 100);
      
      return {
        pendingCount: pendingPickLists.data?.length || 0,
        completedToday: completedToday.data?.length || 0,
        pendingPickLists: pendingPickLists.data || []
      };
    } catch (error) {
      console.error('Error fetching pick list stats:', error);
      return {
        pendingCount: 0,
        completedToday: 0,
        pendingPickLists: []
      };
    }
  }

  // Legacy methods for backward compatibility - placeholder implementations
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

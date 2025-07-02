
import axios, { AxiosInstance } from 'axios';

export class ERPNextAPI {
  private api: AxiosInstance;
  private apiKey: string;
  private apiSecret: string;
  private baseURL: string;

  constructor(baseURL: string, apiKey: string, apiSecret: string) {
    this.baseURL = baseURL;
    this.apiKey = apiKey;
    this.apiSecret = apiSecret;

    this.api = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    this.api.interceptors.request.use(config => {
      config.headers['Authorization'] = `token ${this.apiKey}:${this.apiSecret}`;
      return config;
    });
  }

  // Getter methods for accessing private properties
  get getBaseURL() { return this.baseURL; }
  get getApiKey() { return this.apiKey; }
  get getApiSecret() { return this.apiSecret; }

  async get(endpoint: string, params?: any) {
    try {
      const response = await this.api.get(endpoint, { params });
      return response.data;
    } catch (error: any) {
      console.error(`GET request failed for ${endpoint}:`, error.response ? error.response.data : error.message);
      throw error;
    }
  }

  async post(endpoint: string, data: any) {
    try {
      const response = await this.api.post(endpoint, data);
      return response.data;
    } catch (error: any) {
      console.error(`POST request failed for ${endpoint}:`, error.response ? error.response.data : error.message);
      throw error;
    }
  }

  async put(endpoint: string, data: any) {
    try {
      const response = await this.api.put(endpoint, data);
      return response.data;
    } catch (error: any) {
      console.error(`PUT request failed for ${endpoint}:`, error.response ? error.response.data : error.message);
      throw error;
    }
  }

  async delete(endpoint: string) {
    try {
      const response = await this.api.delete(endpoint);
      return response.data;
    } catch (error: any) {
      console.error(`DELETE request failed for ${endpoint}:`, error.response ? error.response.data : error.message);
      throw error;
    }
  }

  // Sales Order Methods
  async getSalesOrders(filters?: any[], company?: string) {
    const params: any = {};
    if (filters) params.filters = JSON.stringify(filters);
    if (company) params.company = company;
    
    return this.get('/api/resource/Sales Order', params);
  }

  async getSalesOrder(soNumber: string) {
    return this.get(`/api/resource/Sales Order/${soNumber}`);
  }

  async searchSalesOrders(searchTerm: string, company?: string) {
    const filters = [
      ['name', 'like', `%${searchTerm}%`]
    ];
    if (company) {
      filters.push(['company', '=', company]);
    }
    return this.getSalesOrders(filters);
  }

  async searchSalesOrdersForStockEntry(company?: string) {
    const filters = [
      ['docstatus', '=', 1],
      ['status', 'in', ['To Deliver', 'To Deliver and Bill']]
    ];
    if (company) filters.push(['company', '=', company]);
    return this.getSalesOrders(filters);
  }

  async createDeliveryNote(deliveryData: any) {
    return this.post('/api/resource/Delivery Note', deliveryData);
  }

  async getDeliveryNotes(filters?: any[], company?: string) {
    const params: any = {};
    if (filters) params.filters = JSON.stringify(filters);
    if (company) params.company = company;
    return this.get('/api/resource/Delivery Note', params);
  }

  async getDeliveryNote(dnNumber: string) {
    return this.get(`/api/resource/Delivery Note/${dnNumber}`);
  }

  // Item Methods
  async searchItems(searchTerm: string) {
    const filters = [
      ['item_name', 'like', `%${searchTerm}%`]
    ];
    return this.get('/api/resource/Item', { 
      filters: JSON.stringify(filters),
      fields: JSON.stringify(['name', 'item_code', 'item_name', 'item_group', 'stock_uom', 'description'])
    });
  }

  async getItems(filters?: any[], limitPageLength?: number) {
    const params: any = {
      fields: JSON.stringify(['name', 'item_code', 'item_name', 'item_group', 'stock_uom'])
    };
    if (filters) params.filters = JSON.stringify(filters);
    if (limitPageLength) params.limit_page_length = limitPageLength;
    return this.get('/api/resource/Item', params);
  }

  async getItemDetails(itemCode: string) {
    return this.get(`/api/resource/Item/${itemCode}`);
  }

  async searchItemsByBarcode(barcode: string) {
    const filters = [
      ['barcodes.barcode', '=', barcode]
    ];
    return this.get('/api/resource/Item', { 
      filters: JSON.stringify(filters),
      fields: JSON.stringify(['name', 'item_code', 'item_name', 'item_group', 'stock_uom'])
    });
  }

  // Stock Methods
  async getStockBalance(filters?: any[], company?: string) {
    const params: any = {};
    if (filters) params.filters = JSON.stringify(filters);
    if (company) params.company = company;
    return this.get('/api/resource/Bin', params);
  }

  async getBinStock(itemCode?: string, warehouse?: string) {
    const filters = [];
    if (itemCode) filters.push(['item_code', '=', itemCode]);
    if (warehouse) filters.push(['warehouse', '=', warehouse]);
    return this.getStockBalance(filters);
  }

  async getCurrentStock(itemCode: string, warehouse: string) {
    const filters = [
      ['item_code', '=', itemCode],
      ['warehouse', '=', warehouse]
    ];
    return this.get('/api/resource/Bin', { 
      filters: JSON.stringify(filters) 
    });
  }

  async createStockEntry(stockEntryData: any) {
    return this.post('/api/resource/Stock Entry', stockEntryData);
  }

  async getStockEntries(filters?: any[], company?: string, limitPageLength?: number) {
    const params: any = {};
    if (filters) params.filters = JSON.stringify(filters);
    if (company) params.company = company;
    if (limitPageLength) params.limit_page_length = limitPageLength;
    return this.get('/api/resource/Stock Entry', params);
  }

  async getStockEntry(stockEntryName: string) {
    return this.get(`/api/resource/Stock Entry/${stockEntryName}`);
  }

  async submitStockEntry(stockEntryName: string) {
    return this.put(`/api/resource/Stock Entry/${stockEntryName}`, {
      docstatus: 1
    });
  }

  async getStockReconciliations(filters?: any[]) {
    const params: any = {};
    if (filters) params.filters = JSON.stringify(filters);
    return this.get('/api/resource/Stock Reconciliation', params);
  }

  // Material Request Methods
  async getMaterialRequests(filters?: any[], company?: string, limitPageLength?: number) {
    const params: any = {};
    if (filters) params.filters = JSON.stringify(filters);
    if (company) params.company = company;
    if (limitPageLength) params.limit_page_length = limitPageLength;
    return this.get('/api/resource/Material Request', params);
  }

  async getMaterialRequest(mrNumber: string) {
    return this.get(`/api/resource/Material Request/${mrNumber}`);
  }

  async createMaterialRequest(requestData: any) {
    return this.post('/api/resource/Material Request', requestData);
  }

  async updateMaterialRequest(name: string, requestData: any) {
    return this.put(`/api/resource/Material Request/${name}`, requestData);
  }

  async searchMaterialRequestsForStockEntry(stockEntryType: string, company?: string) {
    const filters = [
      ['docstatus', '=', 1],
      ['status', '!=', 'Stopped']
    ];
    if (company) filters.push(['company', '=', company]);
    return this.getMaterialRequests(filters);
  }

  // Pick List Methods
  async getPickLists(filters?: any[], company?: string, limitPageLength?: number) {
    const params: any = {};
    if (filters) params.filters = JSON.stringify(filters);
    if (company) params.company = company;
    if (limitPageLength) params.limit_page_length = limitPageLength;
    return this.get('/api/resource/Pick List', params);
  }

  async getPickList(pickListName: string) {
    return this.get(`/api/resource/Pick List/${pickListName}`);
  }

  async getPickListItems(pickListName: string) {
    const response = await this.getPickList(pickListName);
    return response?.locations || [];
  }

  async createPickListFromDocument(documentType: string, documentName: string) {
    return this.post('/api/method/erpnext.stock.doctype.pick_list.pick_list.create_pick_list', {
      doctype: documentType,
      name: documentName
    });
  }

  async getPickListAnalytics(company?: string) {
    const params: any = {};
    if (company) params.company = company;
    return this.get('/api/method/erpnext.stock.dashboard.get_data', params);
  }

  // Purchase Order Methods
  async getPurchaseOrders(filters?: any[], company?: string) {
    const params: any = {};
    if (filters) params.filters = JSON.stringify(filters);
    if (company) params.company = company;
    return this.get('/api/resource/Purchase Order', params);
  }

  async getPurchaseOrder(poNumber: string) {
    return this.get(`/api/resource/Purchase Order/${poNumber}`);
  }

  async searchPurchaseOrdersForStockEntry(company?: string) {
    const filters = [
      ['docstatus', '=', 1],
      ['status', 'in', ['To Receive', 'To Receive and Bill']]
    ];
    if (company) filters.push(['company', '=', company]);
    return this.getPurchaseOrders(filters);
  }

  // Purchase Receipt Methods
  async getPurchaseReceipts(filters?: any[], company?: string) {
    const params: any = {};
    if (filters) params.filters = JSON.stringify(filters);
    if (company) params.company = company;
    return this.get('/api/resource/Purchase Receipt', params);
  }

  async getPurchaseReceipt(prNumber: string) {
    return this.get(`/api/resource/Purchase Receipt/${prNumber}`);
  }

  async createPurchaseReceipt(receiptData: any) {
    return this.post('/api/resource/Purchase Receipt', receiptData);
  }

  async updatePurchaseReceipt(name: string, receiptData: any) {
    return this.put(`/api/resource/Purchase Receipt/${name}`, receiptData);
  }

  async submitPurchaseReceipt(receiptName: string) {
    return this.put(`/api/resource/Purchase Receipt/${receiptName}`, {
      docstatus: 1
    });
  }

  // BOM Methods
  async searchBOMs(company?: string) {
    const filters = [
      ['docstatus', '=', 1],
      ['is_active', '=', 1]
    ];
    if (company) filters.push(['company', '=', company]);
    const params: any = { filters: JSON.stringify(filters) };
    return this.get('/api/resource/BOM', params);
  }

  // Warehouse Methods
  async getWarehouses(filters?: any[], company?: string) {
    const params: any = {};
    if (filters) params.filters = JSON.stringify(filters);
    if (company) params.company = company;
    return this.get('/api/resource/Warehouse', params);
  }

  // Company Methods
  async getCompanies() {
    return this.get('/api/resource/Company', {
      fields: JSON.stringify(['name', 'company_name'])
    });
  }

  async getDefaultCompany() {
    const companies = await this.getCompanies();
    return companies?.data?.[0]?.name || null;
  }

  // Additional methods for missing functionality
  async getPackingSlips(filters?: any[]) {
    const params: any = {};
    if (filters) params.filters = JSON.stringify(filters);
    return this.get('/api/resource/Packing Slip', params);
  }

  async getQualityInspections(filters?: any[]) {
    const params: any = {};
    if (filters) params.filters = JSON.stringify(filters);
    return this.get('/api/resource/Quality Inspection', params);
  }

  async getProductBundles(filters?: any[]) {
    const params: any = {};
    if (filters) params.filters = JSON.stringify(filters);
    return this.get('/api/resource/Product Bundle', params);
  }

  // Generic API call method
  async callAPI(method: string, params?: any) {
    return this.get(`/api/method/${method}`, params);
  }
}

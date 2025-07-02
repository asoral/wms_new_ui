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

  async createDeliveryNote(deliveryData: any) {
    return this.post('/api/resource/Delivery Note', deliveryData);
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

  async getItemDetails(itemCode: string) {
    return this.get(`/api/resource/Item/${itemCode}`);
  }

  // Stock Methods
  async getStockBalance(filters?: any) {
    const params: any = {};
    if (filters) params.filters = JSON.stringify(filters);
    return this.get('/api/resource/Bin', params);
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

  async getStockEntries(filters?: any) {
    const params: any = {};
    if (filters) params.filters = JSON.stringify(filters);
    return this.get('/api/resource/Stock Entry', params);
  }

  async submitStockEntry(stockEntryName: string) {
    return this.put(`/api/resource/Stock Entry/${stockEntryName}`, {
      docstatus: 1
    });
  }

  async getStockReconciliations(filters?: any) {
    const params: any = {};
    if (filters) params.filters = JSON.stringify(filters);
    return this.get('/api/resource/Stock Reconciliation', params);
  }

  // Material Request Methods
  async getMaterialRequests(filters?: any) {
    const params: any = {};
    if (filters) params.filters = JSON.stringify(filters);
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

  // Pick List Methods
  async getPickLists(filters?: any) {
    const params: any = {};
    if (filters) params.filters = JSON.stringify(filters);
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
      source_name: documentName,
      target_doc: null,
      purpose: 'Delivery'
    });
  }

  async getPickListAnalytics(company?: string) {
    const params: any = {};
    if (company) params.company = company;
    return this.get('/api/method/erpnext.stock.dashboard.get_data', params);
  }

  // Purchase Order Methods
  async getPurchaseOrders(filters?: any, company?: string) {
    const params: any = {};
    if (filters) params.filters = JSON.stringify(filters);
    if (company) params.company = company;
    return this.get('/api/resource/Purchase Order', params);
  }

  async getPurchaseOrder(poNumber: string) {
    return this.get(`/api/resource/Purchase Order/${poNumber}`);
  }

  // Warehouse Methods
  async getWarehouses(filters?: any) {
    const params: any = {};
    if (filters) params.filters = JSON.stringify(filters);
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

  // Generic API call method
  async callAPI(method: string, params?: any) {
    return this.get(`/api/method/${method}`, params);
  }
}

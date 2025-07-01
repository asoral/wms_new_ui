
interface ERPNextResponse<T = any> {
  data: T;
  message?: string;
}

export class ERPNextAPI {
  private baseURL: string;
  private apiKey: string;
  private apiSecret: string;

  constructor(baseURL: string, apiKey: string, apiSecret: string) {
    this.baseURL = baseURL.replace(/\/$/, '');
    this.apiKey = apiKey;
    this.apiSecret = apiSecret;
  }

  // Public getters for accessing private properties
  get getBaseURL(): string {
    return this.baseURL;
  }

  get getApiKey(): string {
    return this.apiKey;
  }

  get getApiSecret(): string {
    return this.apiSecret;
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}): Promise<ERPNextResponse> {
    const url = `${this.baseURL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `token ${this.apiKey}:${this.apiSecret}`,
      ...options.headers,
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return { data: data.data || data };
    } catch (error) {
      console.error('ERPNext API Error:', error);
      throw error;
    }
  }

  async get(endpoint: string, params?: Record<string, string>): Promise<ERPNextResponse> {
    const url = new URL(`${this.baseURL}${endpoint}`);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, value);
        }
      });
    }
    return this.makeRequest(url.pathname + url.search);
  }

  async post(endpoint: string, data: any): Promise<ERPNextResponse> {
    return this.makeRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async put(endpoint: string, data: any): Promise<ERPNextResponse> {
    return this.makeRequest(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async delete(endpoint: string): Promise<ERPNextResponse> {
    return this.makeRequest(endpoint, {
      method: 'DELETE',
    });
  }

  // Company APIs
  async getCompanies(): Promise<ERPNextResponse> {
    return this.get('/api/resource/Company', {
      fields: JSON.stringify(['name', 'company_name']),
      limit_page_length: '50'
    });
  }

  // Item APIs
  async getItems(filters?: any, limit?: number): Promise<ERPNextResponse> {
    const params: Record<string, string> = {
      fields: JSON.stringify(['name', 'item_name', 'item_code', 'description', 'stock_uom']),
      limit_page_length: limit?.toString() || '20'
    };
    
    if (filters) {
      params.filters = JSON.stringify(filters);
    }

    return this.get('/api/resource/Item', params);
  }

  async getItemDetails(itemCode: string): Promise<ERPNextResponse> {
    return this.get(`/api/resource/Item/${itemCode}`);
  }

  async searchItems(query: string): Promise<ERPNextResponse> {
    return this.get('/api/resource/Item', {
      filters: JSON.stringify([['item_name', 'like', `%${query}%`]]),
      or_filters: JSON.stringify([['item_code', 'like', `%${query}%`]]),
      fields: JSON.stringify(['name', 'item_name', 'item_code']),
      limit_page_length: '20'
    });
  }

  async searchItemsByBarcode(barcode: string): Promise<ERPNextResponse> {
    return this.get('/api/resource/Item', {
      filters: JSON.stringify([['barcodes.barcode', '=', barcode]]),
      fields: JSON.stringify(['name', 'item_name', 'item_code']),
      limit_page_length: '5'
    });
  }

  // Warehouse APIs
  async getWarehouses(filters?: any, company?: string, limit?: number): Promise<ERPNextResponse> {
    const filterArray = [];
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        filterArray.push([key, '=', value]);
      });
    }
    if (company) {
      filterArray.push(['company', '=', company]);
    }

    return this.get('/api/resource/Warehouse', {
      filters: JSON.stringify(filterArray),
      fields: JSON.stringify(['name', 'warehouse_name', 'company']),
      limit_page_length: limit?.toString() || '50'
    });
  }

  // Stock APIs
  async getStockBalance(warehouse?: string, company?: string): Promise<ERPNextResponse> {
    const filters = [];
    if (warehouse) filters.push(['warehouse', '=', warehouse]);
    if (company) filters.push(['company', '=', company]);

    return this.get('/api/resource/Bin', {
      filters: JSON.stringify(filters),
      fields: JSON.stringify(['item_code', 'warehouse', 'actual_qty', 'reserved_qty']),
      limit_page_length: '1000'
    });
  }

  async getBinStock(warehouse: string, itemCode?: string): Promise<ERPNextResponse> {
    const filters = [['warehouse', '=', warehouse]];
    if (itemCode) {
      filters.push(['item_code', '=', itemCode]);
    }

    return this.get('/api/resource/Bin', {
      filters: JSON.stringify(filters),
      fields: JSON.stringify(['item_code', 'warehouse', 'actual_qty', 'reserved_qty']),
      limit_page_length: '1000'
    });
  }

  async getCurrentStock(itemCode: string, warehouse: string): Promise<ERPNextResponse> {
    return this.getBinStock(warehouse, itemCode);
  }

  // Material Request APIs
  async getMaterialRequests(filters?: any, company?: string, limit?: number): Promise<ERPNextResponse> {
    const filterArray = [];
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          filterArray.push([key, value[0], value[1]]);
        } else {
          filterArray.push([key, '=', value]);
        }
      });
    }
    if (company) {
      filterArray.push(['company', '=', company]);
    }

    return this.get('/api/resource/Material Request', {
      filters: JSON.stringify(filterArray),
      limit_page_length: limit?.toString() || '20',
      fields: JSON.stringify(['name', 'transaction_date', 'status', 'material_request_type', 'company', 'owner', 'total_qty', 'docstatus', 'items'])
    });
  }

  async getMaterialRequest(name: string): Promise<ERPNextResponse> {
    return this.get(`/api/resource/Material Request/${name}`);
  }

  async createMaterialRequest(data: any): Promise<ERPNextResponse> {
    return this.post('/api/resource/Material Request', data);
  }

  async updateMaterialRequest(name: string, data: any): Promise<ERPNextResponse> {
    return this.put(`/api/resource/Material Request/${name}`, data);
  }

  // Purchase Order APIs
  async getPurchaseOrders(filters?: any, company?: string, limit?: number): Promise<ERPNextResponse> {
    const filterArray = [];
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        filterArray.push([key, '=', value]);
      });
    }
    if (company) {
      filterArray.push(['company', '=', company]);
    }

    return this.get('/api/resource/Purchase Order', {
      filters: JSON.stringify(filterArray),
      limit_page_length: limit?.toString() || '20',
      fields: JSON.stringify(['name', 'supplier', 'transaction_date', 'status', 'grand_total'])
    });
  }

  async getPurchaseOrder(name: string): Promise<ERPNextResponse> {
    return this.get(`/api/resource/Purchase Order/${name}`);
  }

  async getPurchaseReceipts(filters?: any, company?: string, limit?: number): Promise<ERPNextResponse> {
    const filterArray = [];
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        filterArray.push([key, '=', value]);
      });
    }
    if (company) {
      filterArray.push(['company', '=', company]);
    }

    return this.get('/api/resource/Purchase Receipt', {
      filters: JSON.stringify(filterArray),
      limit_page_length: limit?.toString() || '20',
      fields: JSON.stringify(['name', 'supplier', 'posting_date', 'status', 'grand_total'])
    });
  }

  async getPurchaseReceipt(name: string): Promise<ERPNextResponse> {
    return this.get(`/api/resource/Purchase Receipt/${name}`);
  }

  // Sales Order APIs
  async getSalesOrders(filters?: any, company?: string, limit?: number): Promise<ERPNextResponse> {
    const filterArray = [];
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          filterArray.push([key, value[0], value[1]]);
        } else {
          filterArray.push([key, '=', value]);
        }
      });
    }
    if (company) {
      filterArray.push(['company', '=', company]);
    }

    return this.get('/api/resource/Sales Order', {
      filters: JSON.stringify(filterArray),
      limit_page_length: limit?.toString() || '20',
      fields: JSON.stringify(['name', 'customer', 'customer_name', 'transaction_date', 'delivery_date', 'status', 'grand_total', 'per_delivered'])
    });
  }

  async getSalesOrder(name: string): Promise<ERPNextResponse> {
    return this.get(`/api/resource/Sales Order/${name}`);
  }

  async searchSalesOrders(query: string, company?: string, limit?: number): Promise<ERPNextResponse> {
    const filters = [
      ['status', 'in', ['To Deliver', 'To Deliver and Bill', 'Partially Delivered']]
    ];
    
    if (company) {
      filters.push(['company', '=', company]);
    }

    return this.get('/api/resource/Sales Order', {
      filters: JSON.stringify(filters),
      or_filters: JSON.stringify([
        ['name', 'like', `%${query}%`],
        ['customer', 'like', `%${query}%`],
        ['customer_name', 'like', `%${query}%`]
      ]),
      limit_page_length: limit?.toString() || '20',
      fields: JSON.stringify(['name', 'customer', 'customer_name', 'transaction_date', 'delivery_date', 'status', 'grand_total'])
    });
  }

  // Delivery Note APIs
  async getDeliveryNotes(filters?: any, company?: string, limit?: number): Promise<ERPNextResponse> {
    const filterArray = [];
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          filterArray.push([key, value[0], value[1]]);
        } else {
          filterArray.push([key, '=', value]);
        }
      });
    }
    if (company) {
      filterArray.push(['company', '=', company]);
    }

    return this.get('/api/resource/Delivery Note', {
      filters: JSON.stringify(filterArray),
      limit_page_length: limit?.toString() || '20',
      fields: JSON.stringify(['name', 'customer', 'customer_name', 'posting_date', 'docstatus', 'sales_order', 'total_qty', 'grand_total'])
    });
  }

  async getDeliveryNote(name: string): Promise<ERPNextResponse> {
    return this.get(`/api/resource/Delivery Note/${name}`);
  }

  async createDeliveryNote(data: any): Promise<ERPNextResponse> {
    return this.post('/api/resource/Delivery Note', data);
  }

  async updateDeliveryNote(name: string, data: any): Promise<ERPNextResponse> {
    return this.put(`/api/resource/Delivery Note/${name}`, data);
  }

  async submitDeliveryNote(name: string): Promise<ERPNextResponse> {
    return this.put(`/api/resource/Delivery Note/${name}`, { docstatus: 1 });
  }

  // Pick List APIs
  async getPickLists(filters?: any, company?: string, limit?: number): Promise<ERPNextResponse> {
    const filterArray = [];
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          filterArray.push([key, value[0], value[1]]);
        } else {
          filterArray.push([key, '=', value]);
        }
      });
    }
    if (company) {
      filterArray.push(['company', '=', company]);
    }

    return this.get('/api/resource/Pick List', {
      filters: JSON.stringify(filterArray),
      limit_page_length: limit?.toString() || '20',
      fields: JSON.stringify(['name', 'purpose', 'company', 'docstatus', 'creation', 'owner', 'locations'])
    });
  }

  async getPickList(name: string): Promise<ERPNextResponse> {
    return this.get(`/api/resource/Pick List/${name}`);
  }

  async updatePickList(name: string, data: any): Promise<ERPNextResponse> {
    return this.put(`/api/resource/Pick List/${name}`, data);
  }

  async createPickListFromDocument(data: any): Promise<ERPNextResponse> {
    return this.post('/api/resource/Pick List', data);
  }

  async getPickListItems(pickListName: string): Promise<ERPNextResponse> {
    const result = await this.get(`/api/resource/Pick List/${pickListName}`, {
      fields: JSON.stringify(['locations'])
    });
    
    // Return the locations array directly
    return {
      data: result.data?.locations || []
    };
  }

  // Stock Entry APIs
  async getStockEntries(filters?: any, company?: string, limit?: number): Promise<ERPNextResponse> {
    const filterArray = [];
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          filterArray.push([key, value[0], value[1]]);
        } else {
          filterArray.push([key, '=', value]);
        }
      });
    }
    if (company) {
      filterArray.push(['company', '=', company]);
    }

    return this.get('/api/resource/Stock Entry', {
      filters: JSON.stringify(filterArray),
      limit_page_length: limit?.toString() || '20',
      fields: JSON.stringify(['name', 'stock_entry_type', 'docstatus', 'creation', 'owner', 'total_outgoing_value', 'total_incoming_value'])
    });
  }

  async getStockEntry(name: string): Promise<ERPNextResponse> {
    return this.get(`/api/resource/Stock Entry/${name}`);
  }

  async createStockEntry(data: any): Promise<ERPNextResponse> {
    return this.post('/api/resource/Stock Entry', data);
  }

  async updateStockEntry(name: string, data: any): Promise<ERPNextResponse> {
    return this.put(`/api/resource/Stock Entry/${name}`, data);
  }

  async submitStockEntry(name: string): Promise<ERPNextResponse> {
    return this.put(`/api/resource/Stock Entry/${name}`, { docstatus: 1 });
  }

  // Stock Reconciliation APIs
  async createStockReconciliation(data: any): Promise<ERPNextResponse> {
    return this.post('/api/resource/Stock Reconciliation', data);
  }

  async updateStockReconciliation(name: string, data: any): Promise<ERPNextResponse> {
    return this.put(`/api/resource/Stock Reconciliation/${name}`, data);
  }

  // Document Search APIs for Stock Entry
  async searchMaterialRequestsForStockEntry(stockEntryType: string, company?: string): Promise<ERPNextResponse> {
    const filters = [['docstatus', '=', 1]];
    if (company) filters.push(['company', '=', company]);

    return this.get('/api/resource/Material Request', {
      filters: JSON.stringify(filters),
      fields: JSON.stringify(['name', 'material_request_type', 'transaction_date', 'status']),
      limit_page_length: '50'
    });
  }

  async searchPurchaseOrdersForStockEntry(company?: string): Promise<ERPNextResponse> {
    const filters = [['docstatus', '=', 1], ['status', '!=', 'Completed']];
    if (company) filters.push(['company', '=', company]);

    return this.get('/api/resource/Purchase Order', {
      filters: JSON.stringify(filters),
      fields: JSON.stringify(['name', 'supplier', 'transaction_date', 'status']),
      limit_page_length: '50'
    });
  }

  async searchSalesOrdersForStockEntry(company?: string): Promise<ERPNextResponse> {
    const filters = [['docstatus', '=', 1], ['status', '!=', 'Completed']];
    if (company) filters.push(['company', '=', company]);

    return this.get('/api/resource/Sales Order', {
      filters: JSON.stringify(filters),
      fields: JSON.stringify(['name', 'customer', 'transaction_date', 'status']),
      limit_page_length: '50'
    });
  }

  async searchBOMs(company?: string): Promise<ERPNextResponse> {
    const filters = [['docstatus', '=', 1]];
    if (company) filters.push(['company', '=', company]);

    return this.get('/api/resource/BOM', {
      filters: JSON.stringify(filters),
      fields: JSON.stringify(['name', 'item', 'item_name']),
      limit_page_length: '50'
    });
  }

  // Other APIs for completeness
  async getPackingSlips(filters?: any, company?: string, limit?: number): Promise<ERPNextResponse> {
    return this.get('/api/resource/Packing Slip', {
      limit_page_length: limit?.toString() || '20'
    });
  }

  async getQualityInspections(filters?: any, company?: string, limit?: number): Promise<ERPNextResponse> {
    return this.get('/api/resource/Quality Inspection', {
      limit_page_length: limit?.toString() || '20'
    });
  }

  async getProductBundles(filters?: any, company?: string, limit?: number): Promise<ERPNextResponse> {
    return this.get('/api/resource/Product Bundle', {
      limit_page_length: limit?.toString() || '20'
    });
  }

  // Dashboard analytics methods
  async getPickListAnalytics(company?: string): Promise<ERPNextResponse> {
    try {
      const filters = company ? [['company', '=', company]] : [];
      
      // Get pending pick lists
      const pendingFilters = [...filters, ['docstatus', '=', 0]];
      const pendingResponse = await this.get('/api/resource/Pick List', {
        filters: JSON.stringify(pendingFilters),
        limit_page_length: '1000',
        fields: JSON.stringify(['name', 'purpose'])
      });

      // Get completed pick lists (today)
      const today = new Date().toISOString().split('T')[0];
      const completedFilters = [...filters, ['docstatus', '=', 1], ['creation', '>=', today]];
      const completedResponse = await this.get('/api/resource/Pick List', {
        filters: JSON.stringify(completedFilters),
        limit_page_length: '1000',
        fields: JSON.stringify(['name'])
      });

      return {
        data: {
          pending: pendingResponse.data?.length || 0,
          completed: completedResponse.data?.length || 0,
          typeAnalytics: []
        }
      };
    } catch (error) {
      console.error('Error fetching pick list analytics:', error);
      return { data: { pending: 0, completed: 0, typeAnalytics: [] } };
    }
  }
}

export * from './types';

import { supabase } from "@/integrations/supabase/client";

export interface ItemDetails {
  item_code: string;
  item_name: string;
  description: string;
  stock_uom: string;
  default_warehouse: string;
}

export interface ItemStock {
  item_code: string;
  actual_qty: number;
  warehouse: string;
}

export interface StockReconciliationItem {
  item_code: string;
  warehouse: string;
  qty: number;
  valuation_rate: number;
  batch_no?: string;
  serial_no?: string;
  serial_and_batch_bundle?: string;
}

export interface APIConfig {
  apiKey: string;
  apiSecret: string;
  baseURL: string;
}

export const createERPNextAPI = async (): Promise<ERPNextAPI | null> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      console.error('createERPNextAPI: No user found');
      return null;
    }

    // First try to get credentials from the profiles table
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('erpnext_url, erpnext_api_key, erpnext_api_secret')
      .eq('id', user.id)
      .single();

    let erpnext_url, erpnext_api_key, erpnext_api_secret;

    if (profile && !profileError && profile.erpnext_url && profile.erpnext_api_key && profile.erpnext_api_secret) {
      // Use profile table data (most up-to-date)
      erpnext_url = profile.erpnext_url;
      erpnext_api_key = profile.erpnext_api_key;
      erpnext_api_secret = profile.erpnext_api_secret;
      console.log('createERPNextAPI: Using profile table credentials for URL:', erpnext_url);
    } else {
      // Fallback to user metadata
      erpnext_url = user.user_metadata.erpnext_url;
      erpnext_api_key = user.user_metadata.erpnext_api_key;
      erpnext_api_secret = user.user_metadata.erpnext_api_secret;
      console.log('createERPNextAPI: Using user metadata credentials for URL:', erpnext_url);
    }

    if (!erpnext_url || !erpnext_api_key || !erpnext_api_secret) {
      console.error('createERPNextAPI: ERPNext configuration missing for user');
      return null;
    }

    console.log('createERPNextAPI: Creating API instance with URL:', erpnext_url);

    const api = new ERPNextAPI({
      apiKey: erpnext_api_key,
      apiSecret: erpnext_api_secret,
      baseURL: erpnext_url,
    });
    
    return api;
  } catch (error) {
    console.error('createERPNextAPI: Error creating ERPNextAPI:', error);
    return null;
  }
};

export const getUserDefaultCompany = async (): Promise<string | null> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      console.error('No user found');
      return null;
    }

    // First try to get the default company from profiles table
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('erpnext_default_company, erpnext_url, erpnext_api_key, erpnext_api_secret')
      .eq('id', user.id)
      .single();

    let erpnext_url, erpnext_api_key, erpnext_api_secret;

    if (profile && !profileError) {
      if (profile.erpnext_default_company) {
        console.log('getUserDefaultCompany: Using profile table default company:', profile.erpnext_default_company);
        return profile.erpnext_default_company;
      }
      
      // Use profile credentials if available
      if (profile.erpnext_url && profile.erpnext_api_key && profile.erpnext_api_secret) {
        erpnext_url = profile.erpnext_url;
        erpnext_api_key = profile.erpnext_api_key;
        erpnext_api_secret = profile.erpnext_api_secret;
      }
    }

    // Fallback to user metadata if profile data is not available
    if (!erpnext_url || !erpnext_api_key || !erpnext_api_secret) {
      erpnext_url = user.user_metadata.erpnext_url;
      erpnext_api_key = user.user_metadata.erpnext_api_key;
      erpnext_api_secret = user.user_metadata.erpnext_api_secret;
    }

    if (!erpnext_url || !erpnext_api_key || !erpnext_api_secret) {
      console.error('getUserDefaultCompany: ERPNext configuration missing');
      return null;
    }

    const erpnextAPI = new ERPNextAPI({
      apiKey: erpnext_api_key,
      apiSecret: erpnext_api_secret,
      baseURL: erpnext_url,
    });

    const response = await fetch(`${erpnextAPI.baseURL}/api/method/frappe.client.get_value?doctype=User&fieldname=company&filters=%7B%22name%22:%22${user.email}%22%7D`, {
      method: 'GET',
      headers: {
        'Authorization': `token ${erpnextAPI.apiKey}:${erpnextAPI.apiSecret}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('Failed to fetch user default company:', response.statusText);
      return null;
    }

    const result = await response.json();
    if (result.message && result.message.company) {
      return result.message.company;
    } else {
      console.warn('User default company not found in response');
      return null;
    }
  } catch (error) {
    console.error('Error fetching user default company:', error);
    return null;
  }
};

export class ERPNextAPI {
  public apiKey: string;
  public apiSecret: string;
  public baseURL: string;

  constructor(config: APIConfig) {
    this.apiKey = config.apiKey;
    this.apiSecret = config.apiSecret;
    this.baseURL = config.baseURL;
  }

  async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${this.baseURL}/api/method/frappe.auth.get_logged_user`, {
        method: 'GET',
        headers: {
          'Authorization': `token ${this.apiKey}:${this.apiSecret}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        return { success: false, error: `HTTP ${response.status}: ${response.statusText}` };
      }

      const result = await response.json();
      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async getCompanies(): Promise<any> {
    return this.makeRequest('Company', 'GET', null, { fields: ['name', 'company_name'] });
  }

  async makeRequest(doctype: string, method: string = 'GET', data?: any, params?: any): Promise<any> {
    let url = `${this.baseURL}/api/resource/${doctype}`;
    
    console.log('makeRequest called with:', { doctype, method, params });
    
    if (params) {
      const searchParams = new URLSearchParams();
      Object.keys(params).forEach(key => {
        const value = params[key];
        if (Array.isArray(value) || (typeof value === 'object' && value !== null)) {
          searchParams.append(key, JSON.stringify(value));
        } else if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });
      
      if (searchParams.toString()) {
        url += `?${searchParams.toString()}`;
      }
    }

    console.log('Final request URL:', url);

    const options: RequestInit = {
      method,
      headers: {
        'Authorization': `token ${this.apiKey}:${this.apiSecret}`,
        'Content-Type': 'application/json',
      },
    };

    if (data && (method === 'POST' || method === 'PUT')) {
      options.body = JSON.stringify(data);
    }

    try {
      const response = await fetch(url, options);
      console.log('Response status:', response.status, response.statusText);

      if (!response.ok) {
        console.error(`Request failed: ${response.status} ${response.statusText}`);
        const errorText = await response.text();
        console.error('Error response body:', errorText);
        throw new Error(`Failed to ${method} ${doctype}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('API response for', doctype, ':', result);
      return result;
    } catch (error) {
      console.error('Fetch error:', error);
      throw error;
    }
  }

  async getItemDetails(itemCode: string): Promise<any> {
    const response = await fetch(`${this.baseURL}/api/resource/Item/${itemCode}?fields=["item_code","item_name", "description", "stock_uom", "default_warehouse", "has_batch_no", "has_serial_no"]`, {
      method: 'GET',
      headers: {
        'Authorization': `token ${this.apiKey}:${this.apiSecret}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get item details: ${response.statusText}`);
    }

    return response.json();
  }

  async getItem(itemCode: string): Promise<any> {
    return this.getItemDetails(itemCode);
  }

  async getItems(filters?: any, fields?: string[], company?: string): Promise<any> {
    console.log('getItems called with filters:', filters, 'fields:', fields, 'company:', company);
    
    const params: any = {
      limit_page_length: 50
    };
    
    if (fields && fields.length > 0) {
      params.fields = fields;
    }
    
    if (filters || company) {
      const finalFilters = [];
      
      if (filters && Array.isArray(filters)) {
        finalFilters.push(...filters);
      }
      
      if (company) {
        finalFilters.push(['company', '=', company]);
      }
      
      if (finalFilters.length > 0) {
        params.filters = finalFilters;
      }
    }
    
    console.log('getItems final params:', params);
    return this.makeRequest('Item', 'GET', null, params);
  }

  async getItemsPaginated(filters?: any, fields?: string[], company?: string, limit: number = 20, page: number = 1): Promise<any> {
    console.log('getItemsPaginated called with:', { filters, fields, company, limit, page });
    
    const params: any = {
      limit_page_length: limit,
      limit_start: (page - 1) * limit
    };
    
    if (fields && fields.length > 0) {
      params.fields = fields;
    }
    
    if (filters || company) {
      const finalFilters = [];
      
      if (filters && Array.isArray(filters)) {
        finalFilters.push(...filters);
      }
      
      if (finalFilters.length > 0) {
        params.filters = finalFilters;
      }
    }
    
    console.log('getItemsPaginated final params:', params);
    return this.makeRequest('Item', 'GET', null, params);
  }

  async searchItems(searchTerm: string, company?: string, limit: number = 20): Promise<any> {
    console.log('searchItems called with:', { searchTerm, company, limit });
    
    const filters = [
      ['disabled', '=', 0]
    ];
    
    if (searchTerm && searchTerm.trim()) {
      // Use separate API calls for OR conditions since ERPNext filters don't support complex OR easily
      // For now, search by item_code and item_name separately and combine results
      const searchValue = `%${searchTerm}%`;
      filters.push(['item_code', 'like', searchValue]);
    }
    
    console.log('searchItems filters:', filters);
    return this.getItemsPaginated(filters, ['item_code', 'item_name', 'stock_uom'], company, limit);
  }

  async getStockBalance(filters?: any, company?: string): Promise<any> {
    console.log('getStockBalance called with filters:', filters, 'company:', company);
    
    try {
      // First get warehouses for the company if company is specified
      let warehouseFilters: string[] = [];
      
      if (company && company.trim()) {
        console.log('Getting warehouses for company:', company);
        try {
          const warehousesResult = await this.getWarehouses([['company', '=', company]]);
          if (warehousesResult.data && warehousesResult.data.length > 0) {
            warehouseFilters = warehousesResult.data.map((wh: any) => wh.name);
            console.log('Found warehouses for company:', warehouseFilters);
          }
        } catch (whError) {
          console.error('Error getting warehouses, proceeding without warehouse filter:', whError);
        }
      }

      // Build filters for Bin doctype
      const params: any = {
        fields: ['item_code', 'warehouse', 'actual_qty', 'stock_value', 'valuation_rate'],
        limit_page_length: 1000
      };
      
      const finalFilters = [];
      
      // Add item filters if provided
      if (filters && Array.isArray(filters)) {
        finalFilters.push(...filters);
      }
      
      // Add warehouse filter if we have company-specific warehouses
      if (warehouseFilters.length > 0) {
        finalFilters.push(['warehouse', 'in', warehouseFilters]);
      }
      
      if (finalFilters.length > 0) {
        params.filters = finalFilters;
      }
      
      console.log('Getting stock from Bin with params:', params);
      
      const result = await this.makeRequest('Bin', 'GET', null, params);
      console.log('Bin result:', result);
      
      if (result.data && Array.isArray(result.data)) {
        const transformedData = result.data
          .filter((item: any) => item.actual_qty > 0)
          .map((item: any) => ({
            item_code: item.item_code,
            warehouse: item.warehouse,
            actual_qty: item.actual_qty,
            stock_uom: 'Nos',
            stock_value: item.stock_value || (item.actual_qty * (item.valuation_rate || 0))
          }));
        
        console.log('Transformed Bin data:', transformedData);
        return { data: transformedData };
      }
      
      return result;
    } catch (error) {
      console.error('getStockBalance error:', error);
      throw new Error(`Stock balance access failed. Please check your ERPNext permissions. Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getItemByBarcode(barcode: string, company?: string): Promise<any> {
    console.log('getItemByBarcode called with:', { barcode, company });
    
    try {
      // Query the tabItem Barcode child table to find items with this barcode
      const response = await fetch(`${this.baseURL}/api/resource/tabItem Barcode?filters=[["barcode", "=", "${barcode}"]]&fields=["parent", "barcode"]`, {
        method: 'GET',
        headers: {
          'Authorization': `token ${this.apiKey}:${this.apiSecret}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        console.error('getItemByBarcode failed:', response.status, response.statusText);
        return { data: [] };
      }

      const result = await response.json();
      console.log('Barcode lookup result:', result);

      if (!result.data || result.data.length === 0) {
        console.log('No items found with barcode:', barcode);
        return { data: [] };
      }

      // Get the parent item code from the first matching barcode
      const parentItemCode = result.data[0].parent;
      console.log('Found parent item code:', parentItemCode);

      // Now fetch the full item details using the parent item code
      const itemDetails = await this.getItemDetails(parentItemCode);
      console.log('Item details for barcode:', itemDetails);

      // Return in the expected format
      return { data: [itemDetails.data] };

    } catch (error) {
      console.error('getItemByBarcode error:', error);
      return { data: [] };
    }
  }

  async getItemStock(itemCode: string): Promise<ItemStock[]> {
    console.log('getItemStock called for item:', itemCode);
    
    try {
      const response = await fetch(`${this.baseURL}/api/resource/Bin?filters=[["item_code", "=", "${itemCode}"]]&fields=["item_code", "actual_qty", "warehouse"]`, {
        method: 'GET',
        headers: {
          'Authorization': `token ${this.apiKey}:${this.apiSecret}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        console.error('getItemStock failed:', response.status, response.statusText);
        const errorText = await response.text();
        console.error('getItemStock error response:', errorText);
        throw new Error(`Failed to get item stock: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('getItemStock result:', result);
      return result;
    } catch (error) {
      console.error('getItemStock error:', error);
      throw error;
    }
  }

  async getWarehouses(filters?: any, company?: string): Promise<any> {
    console.log('getWarehouses called with filters:', filters, 'company:', company);
    
    const params: any = {
      limit_page_length: 50,
      fields: ['name', 'warehouse_name', 'company', 'is_group']
    };
    
    if (filters || company) {
      const finalFilters = [];
      
      if (filters && Array.isArray(filters)) {
        finalFilters.push(...filters);
      }
      
      if (company) {
        finalFilters.push(['company', '=', company]);
      }
      
      if (finalFilters.length > 0) {
        params.filters = finalFilters;
      }
    }
    
    console.log('getWarehouses final params:', params);
    return this.makeRequest('Warehouse', 'GET', null, params);
  }

  async getSalesOrders(filters?: any, company?: string): Promise<any> {
    const params: any = {};
    if (filters) params.filters = filters;
    if (company) {
      if (!filters) filters = [];
      filters.push(['company', '=', company]);
      params.filters = filters;
    }
    
    return this.makeRequest('Sales Order', 'GET', null, params);
  }

  async getSalesOrder(soNumber: string): Promise<any> {
    const response = await fetch(`${this.baseURL}/api/resource/Sales Order/${soNumber}`, {
      method: 'GET',
      headers: {
        'Authorization': `token ${this.apiKey}:${this.apiSecret}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get sales order: ${response.statusText}`);
    }

    return response.json();
  }

  async getDeliveryNotes(filters?: any, company?: string): Promise<any> {
    const params: any = {};
    if (filters) params.filters = filters;
    if (company) {
      if (!filters) filters = [];
      filters.push(['company', '=', company]);
      params.filters = filters;
    }
    
    return this.makeRequest('Delivery Note', 'GET', null, params);
  }

  async getPurchaseOrders(filters?: any, company?: string): Promise<any> {
    const params: any = {};
    if (filters) params.filters = filters;
    if (company) {
      if (!filters) filters = [];
      filters.push(['company', '=', company]);
      params.filters = filters;
    }
    
    return this.makeRequest('Purchase Order', 'GET', null, params);
  }

  async getPurchaseOrder(poNumber: string): Promise<any> {
    const response = await fetch(`${this.baseURL}/api/resource/Purchase Order/${poNumber}`, {
      method: 'GET',
      headers: {
        'Authorization': `token ${this.apiKey}:${this.apiSecret}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get purchase order: ${response.statusText}`);
    }

    return response.json();
  }

  async getPurchaseReceipts(filters?: any, company?: string): Promise<any> {
    const params: any = {};
    if (filters) params.filters = filters;
    if (company) {
      if (!filters) filters = [];
      filters.push(['company', '=', company]);
      params.filters = filters;
    }
    
    return this.makeRequest('Purchase Receipt', 'GET', null, params);
  }

  async createPurchaseReceipt(data: any): Promise<any> {
    return this.makeRequest('Purchase Receipt', 'POST', data);
  }

  async getMaterialRequests(filters?: any, company?: string): Promise<any> {
    const params: any = {};
    if (filters) params.filters = filters;
    if (company) {
      if (!filters) filters = [];
      filters.push(['company', '=', company]);
      params.filters = params.filters || [];
      params.filters.push(['company', '=', company]);
    }
    
    return this.makeRequest('Material Request', 'GET', null, params);
  }

  async getStockEntries(filters?: any, company?: string): Promise<any> {
    const params: any = {};
    if (filters) params.filters = filters;
    if (company) {
      if (!filters) filters = [];
      filters.push(['company', '=', company]);
      params.filters = filters;
    }
    
    return this.makeRequest('Stock Entry', 'GET', null, params);
  }

  async getPickLists(filters?: any, company?: string): Promise<any> {
    const params: any = {};
    if (filters) params.filters = filters;
    if (company) {
      if (!filters) filters = [];
      filters.push(['company', '=', company]);
      params.filters = filters;
    }
    
    return this.makeRequest('Pick List', 'GET', null, params);
  }

  async getPackingSlips(filters?: any, company?: string): Promise<any> {
    const params: any = {};
    if (filters) params.filters = filters;
    if (company) {
      if (!filters) filters = [];
      filters.push(['company', '=', company]);
      params.filters = filters;
    }
    
    return this.makeRequest('Packing Slip', 'GET', null, params);
  }

  async getQualityInspections(filters?: any, company?: string): Promise<any> {
    const params: any = {};
    if (filters) params.filters = filters;
    if (company) {
      if (!filters) filters = [];
      filters.push(['company', '=', company]);
      params.filters = filters;
    }
    
    return this.makeRequest('Quality Inspection', 'GET', null, params);
  }

  async getProductBundles(filters?: any, company?: string): Promise<any> {
    const params: any = {};
    if (filters) params.filters = filters;
    if (company) {
      if (!filters) filters = [];
      filters.push(['company', '=', company]);
      params.filters = filters;
    }
    
    return this.makeRequest('Product Bundle', 'GET', null, params);
  }

  async getStockAgingReport(filters?: any): Promise<any> {
    const response = await fetch(`${this.baseURL}/api/method/erpnext.stock.report.stock_ageing.stock_ageing.execute`, {
      method: 'POST',
      headers: {
        'Authorization': `token ${this.apiKey}:${this.apiSecret}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ filters: filters || {} })
    });

    if (!response.ok) {
      throw new Error(`Failed to get stock aging report: ${response.statusText}`);
    }

    return response.json();
  }

  async getBinDetails(bin: string): Promise<any> {
     const response = await fetch(`${this.baseURL}/api/resource/Bin?fields=["*"]&filters=[["name", "=", "${bin}"] ]`, {
      method: 'GET',
      headers: {
        'Authorization': `token ${this.apiKey}:${this.apiSecret}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get bin details: ${response.statusText}`);
    }

    return response.json();
  }

  async getCurrentStock(itemCode: string, warehouse: string, batch?: string, serial?: string): Promise<number> {
    let filters = `[["item_code", "=", "${itemCode}"], ["warehouse", "=", "${warehouse}"]`;
    if (batch) {
      filters += `, ["batch_no", "=", "${batch}"]`;
    }
    if (serial) {
      filters += `, ["serial_no", "=", "${serial}"]`;
    }
    filters += `]`;

    const response = await fetch(`${this.baseURL}/api/resource/Stock Ledger Entry?filters=${filters}&fields=["actual_qty"]&order_by=posting_date desc, posting_time desc&limit=1`, {
      method: 'GET',
      headers: {
        'Authorization': `token ${this.apiKey}:${this.apiSecret}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get current stock: ${response.statusText}`);
    }

    const data = await response.json();
    if (data.data && data.data.length > 0) {
      return data.data[0].actual_qty;
    } else {
      return 0;
    }
  }

  async createStockReconciliation(data: {
    purpose: string;
    set_warehouse: string;
    company: string;
    posting_date: string;
    posting_time: string;
    items: StockReconciliationItem[];
  }) {
    console.log('Creating Stock Reconciliation with data:', data);
    
    const response = await fetch(`${this.baseURL}/api/resource/Stock Reconciliation`, {
      method: 'POST',
      headers: {
        'Authorization': `token ${this.apiKey}:${this.apiSecret}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to create Stock Reconciliation:', errorText);
      throw new Error(`Failed to create Stock Reconciliation: ${response.statusText}`);
    }

    const result = await response.json();
    return result;
  }

  async updateStockReconciliation(name: string, data: { items: StockReconciliationItem[] }) {
    console.log('Updating Stock Reconciliation:', name, 'with data:', data);
    
    const response = await fetch(`${this.baseURL}/api/resource/Stock Reconciliation/${name}`, {
      method: 'PUT',
      headers: {
        'Authorization': `token ${this.apiKey}:${this.apiSecret}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to update Stock Reconciliation:', errorText);
      throw new Error(`Failed to update Stock Reconciliation: ${response.statusText}`);
    }

    const result = await response.json();
    return result;
  }

  async createBatch(batchData: {
    batch_id: string;
    item: string;
    manufacturing_date?: string;
    expiry_date?: string;
  }): Promise<any> {
    console.log('Creating new batch:', batchData);
    
    const data = {
      batch_id: batchData.batch_id,
      item: batchData.item,
      manufacturing_date: batchData.manufacturing_date || new Date().toISOString().split('T')[0],
      expiry_date: batchData.expiry_date
    };

    const response = await fetch(`${this.baseURL}/api/resource/Batch`, {
      method: 'POST',
      headers: {
        'Authorization': `token ${this.apiKey}:${this.apiSecret}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to create batch:', errorText);
      throw new Error(`Failed to create batch: ${response.statusText}`);
    }

    const result = await response.json();
    console.log('Batch created successfully:', result);
    return result;
  }

  async createSerialNo(serialData: {
    serial_no: string;
    item_code: string;
    warehouse?: string;
  }): Promise<any> {
    console.log('Creating new serial number:', serialData);
    
    const data = {
      serial_no: serialData.serial_no,
      item_code: serialData.item_code,
      warehouse: serialData.warehouse
    };

    const response = await fetch(`${this.baseURL}/api/resource/Serial No`, {
      method: 'POST',
      headers: {
        'Authorization': `token ${this.apiKey}:${this.apiSecret}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to create serial number:', errorText);
      throw new Error(`Failed to create serial number: ${response.statusText}`);
    }

    const result = await response.json();
    console.log('Serial number created successfully:', result);
    return result;
  }

  async validateBatch(batchNo: string, itemCode: string): Promise<boolean> {
    if (!batchNo || !itemCode) return true;
    
    try {
      // Check if batch exists
      const response = await fetch(`${this.baseURL}/api/resource/Batch/${batchNo}`, {
        headers: {
          'Authorization': `token ${this.apiKey}:${this.apiSecret}`,
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        const batch = await response.json();
        return batch.data.item === itemCode;
      } else if (response.status === 404) {
        // Batch doesn't exist, create it
        console.log('Batch not found, creating new batch:', batchNo);
        await this.createBatch({
          batch_id: batchNo,
          item: itemCode
        });
        return true;
      } else {
        return false;
      }
    } catch (error) {
      console.error('Batch validation/creation error:', error);
      // Try to create the batch if validation fails
      try {
        await this.createBatch({
          batch_id: batchNo,
          item: itemCode
        });
        return true;
      } catch (createError) {
        console.error('Failed to create batch:', createError);
        return false;
      }
    }
  }

  async validateSerial(serialNo: string, itemCode: string, warehouse?: string): Promise<boolean> {
    if (!serialNo || !itemCode) return true;
    
    try {
      // Check if serial exists
      const response = await fetch(`${this.baseURL}/api/resource/Serial No/${serialNo}`, {
        headers: {
          'Authorization': `token ${this.apiKey}:${this.apiSecret}`,
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        const serial = await response.json();
        return serial.data.item_code === itemCode;
      } else if (response.status === 404) {
        // Serial doesn't exist, create it
        console.log('Serial not found, creating new serial:', serialNo);
        await this.createSerialNo({
          serial_no: serialNo,
          item_code: itemCode,
          warehouse: warehouse
        });
        return true;
      } else {
        return false;
      }
    } catch (error) {
      console.error('Serial validation/creation error:', error);
      // Try to create the serial if validation fails
      try {
        await this.createSerialNo({
          serial_no: serialNo,
          item_code: itemCode,
          warehouse: warehouse
        });
        return true;
      } catch (createError) {
        console.error('Failed to create serial:', createError);
        return false;
      }
    }
  }
}

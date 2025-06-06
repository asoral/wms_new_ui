import { supabase } from '@/integrations/supabase/client';

export interface ERPNextConfig {
  url: string;
  apiKey: string;
  apiSecret: string;
}

export class ERPNextAPI {
  private config: ERPNextConfig;

  constructor(config: ERPNextConfig) {
    this.config = config;
  }

  private getAuthHeaders() {
    const credentials = btoa(`${this.config.apiKey}:${this.config.apiSecret}`);
    return {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
  }

  private cleanUrl(url: string): string {
    return url.replace(/\/+$/, '');
  }

  public async makeRequest(endpoint: string, method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET', data?: any, params?: any) {
    const baseUrl = this.cleanUrl(this.config.url);
    let url = `${baseUrl}/api/resource/${endpoint}`;
    
    console.log('Making ERPNext API request to:', url);
    console.log('Method:', method);
    
    if (params && method === 'GET') {
      const searchParams = new URLSearchParams();
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null) {
          if (key === 'filters' && Array.isArray(params[key])) {
            // Handle filters as JSON string
            searchParams.append('filters', JSON.stringify(params[key]));
          } else {
            searchParams.append(key, typeof params[key] === 'object' ? JSON.stringify(params[key]) : params[key]);
          }
        }
      });
      if (searchParams.toString()) {
        url += `?${searchParams.toString()}`;
      }
    }
    
    const options: RequestInit = {
      method,
      headers: this.getAuthHeaders(),
      mode: 'cors',
    };

    if (data && method !== 'GET') {
      options.body = JSON.stringify(data);
    }

    console.log('Full request URL:', url);
    console.log('Request headers:', options.headers);

    try {
      const response = await fetch(url, options);
      
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('ERPNext API Error Response:', errorText);
        
        if (response.status === 403) {
          throw new Error('Authentication failed. Please check your API Key and Secret.');
        }
        if (response.status === 404) {
          throw new Error('ERPNext endpoint not found. Please check your server URL.');
        }
        if (response.status === 417) {
          throw new Error('ERPNext server configuration issue. Please check if the API endpoint supports the requested filters.');
        }
        
        throw new Error(`ERPNext API Error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      console.log('ERPNext API Response:', result);
      return result;
    } catch (error) {
      console.error('ERPNext API Request Failed:', error);
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        throw new Error('Cannot connect to ERPNext server. Please check your URL and ensure CORS is enabled.');
      }
      throw error;
    }
  }

  // New method to call Stock Balance Report with warehouse filter
  public async getStockBalanceReport(filters?: any[], company?: string) {
    const baseUrl = this.cleanUrl(this.config.url);
    let url = `${baseUrl}/api/method/erpnext.stock.report.stock_balance.stock_balance.execute`;
    
    console.log('Making Stock Balance Report API request to:', url);
    
    // Extract warehouse filter if provided
    let warehouseFilter = '';
    if (filters && filters.length > 0) {
      const warehouseFilterItem = filters.find(f => f[0] === 'warehouse');
      if (warehouseFilterItem) {
        warehouseFilter = warehouseFilterItem[2];
      }
    }
    
    const reportFilters = {
      company: company || '',
      from_date: '2020-01-01', // Use a far back date to get all stock
      to_date: new Date().toISOString().split('T')[0], // Today's date
      item_code: '',
      warehouse: warehouseFilter, // Apply warehouse filter directly
      item_group: '',
      include_uom: 1,
      show_variant_attributes: 0,
      show_stock_ageing_data: 1
    };

    const options: RequestInit = {
      method: 'POST',
      headers: this.getAuthHeaders(),
      mode: 'cors',
      body: JSON.stringify({ filters: reportFilters })
    };

    console.log('Stock Balance Report request body:', reportFilters);

    try {
      const response = await fetch(url, options);
      
      console.log('Stock Balance Report response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Stock Balance Report API Error Response:', errorText);
        
        // If Stock Balance Report is not available, throw a specific error to fallback to Bin
        if (response.status === 403) {
          throw new Error('STOCK_REPORT_NOT_AVAILABLE');
        }
        
        throw new Error(`Stock Balance Report API Error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      console.log('Stock Balance Report API Response:', result);
      
      // Transform the report data to match our expected format
      if (result.message && result.message.result && Array.isArray(result.message.result)) {
        const stockData = result.message.result.map((row: any[]) => {
          // The columns are typically: [item_code, item_name, item_group, stock_uom, opening_qty, in_qty, out_qty, bal_qty, val_rate, bal_val, warehouse]
          return {
            item_code: row[0],
            item_name: row[1], 
            item_group: row[2],
            stock_uom: row[3],
            opening_qty: parseFloat(row[4]) || 0,
            in_qty: parseFloat(row[5]) || 0,
            out_qty: parseFloat(row[6]) || 0,
            bal_qty: parseFloat(row[7]) || 0,
            val_rate: parseFloat(row[8]) || 0,
            bal_val: parseFloat(row[9]) || 0,
            warehouse: row[10] || warehouseFilter,
            actual_qty: parseFloat(row[7]) || 0, // bal_qty is the actual quantity
            stock_value: parseFloat(row[9]) || 0, // bal_val is the stock value
          };
        }).filter((item: any) => item.actual_qty > 0); // Only items with positive stock

        return { data: stockData };
      }
      
      return { data: [] };
    } catch (error) {
      console.error('Stock Balance Report Request Failed:', error);
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        throw new Error('Cannot connect to ERPNext server. Please check your URL and ensure CORS is enabled.');
      }
      throw error;
    }
  }

  async getStockAgingReport(filters?: any[], company?: string) {
    const baseUrl = this.cleanUrl(this.config.url);
    let url = `${baseUrl}/api/method/erpnext.stock.report.stock_ageing.stock_ageing.execute`;
    
    console.log('Making Stock Aging Report API request to:', url);
    
    const reportFilters = {
      company: company || '',
      from_date: '2020-01-01', // Use a far back date to get all stock
      to_date: new Date().toISOString().split('T')[0], // Today's date
      warehouse: '',
      item_code: '',
      item_group: '',
      brand: '',
      show_warehouse_wise_stock: 0,
      filter_total_zero_qty: 1
    };

    const options: RequestInit = {
      method: 'POST',
      headers: this.getAuthHeaders(),
      mode: 'cors',
      body: JSON.stringify({ filters: reportFilters })
    };

    console.log('Stock Aging Report request body:', reportFilters);

    try {
      const response = await fetch(url, options);
      
      console.log('Stock Aging Report response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Stock Aging Report API Error Response:', errorText);
        throw new Error(`Stock Aging Report API Error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      console.log('Stock Aging Report API Response:', result);
      
      // Transform the report data to calculate aging percentages
      if (result.message && result.message.result && Array.isArray(result.message.result)) {
        const agingData = {
          range_0_30: 0,
          range_31_60: 0,
          range_61_90: 0,
          range_90_plus: 0,
          totalValue: 0
        };

        result.message.result.forEach((row: any[]) => {
          // Stock Aging Report columns: [item_code, item_name, item_group, description, qty, uom, age_0_30, age_31_60, age_61_90, age_90_above, total_value]
          const age_0_30 = parseFloat(row[6]) || 0;
          const age_31_60 = parseFloat(row[7]) || 0;
          const age_61_90 = parseFloat(row[8]) || 0;
          const age_90_plus = parseFloat(row[9]) || 0;
          const totalValue = parseFloat(row[10]) || 0;

          agingData.range_0_30 += age_0_30;
          agingData.range_31_60 += age_31_60;
          agingData.range_61_90 += age_61_90;
          agingData.range_90_plus += age_90_plus;
          agingData.totalValue += totalValue;
        });

        // Calculate percentages
        const total = agingData.range_0_30 + agingData.range_31_60 + agingData.range_61_90 + agingData.range_90_plus;
        
        return {
          data: {
            range_0_30_percent: total > 0 ? Math.round((agingData.range_0_30 / total) * 100) : 0,
            range_31_60_percent: total > 0 ? Math.round((agingData.range_31_60 / total) * 100) : 0,
            range_61_90_percent: total > 0 ? Math.round((agingData.range_61_90 / total) * 100) : 0,
            range_90_plus_percent: total > 0 ? Math.round((agingData.range_90_plus / total) * 100) : 0,
            totalValue: agingData.totalValue
          }
        };
      }
      
      return { data: null };
    } catch (error) {
      console.error('Stock Aging Report Request Failed:', error);
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        throw new Error('Cannot connect to ERPNext server. Please check your URL and ensure CORS is enabled.');
      }
      throw error;
    }
  }

  async testConnection() {
    try {
      console.log('Testing ERPNext connection...');
      
      const result = await this.makeRequest('Company', 'GET', null, { 
        limit_page_length: 1,
        fields: JSON.stringify(['name'])
      });
      
      if (result && result.data) {
        console.log('Connection test successful:', result);
        return { success: true, data: result };
      } else {
        return { success: false, error: 'No data returned from ERPNext' };
      }
    } catch (error) {
      console.error('Connection test failed:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Connection failed' };
    }
  }

  async getCompanies() {
    return this.makeRequest('Company', 'GET', null, { 
      fields: JSON.stringify(['name', 'company_name']),
      limit_page_length: 100
    });
  }

  async getItems(filters?: any[], fields?: string[], company?: string) {
    const params: any = {
      limit_page_length: 20,
      fields: JSON.stringify(fields || ['name', 'item_name', 'item_code', 'stock_uom'])
    };
    
    let allFilters: any[] = [
      ['disabled', '=', 0] // Only enabled items
    ];
    if (filters) allFilters = [...allFilters, ...filters];
    
    if (allFilters.length > 0) {
      params.filters = allFilters;
    }
    
    return this.makeRequest('Item', 'GET', null, params);
  }

  async getItemsPaginated(filters?: any[], fields?: string[], company?: string, limit: number = 20, page: number = 1) {
    const params: any = {
      limit_page_length: limit,
      limit_start: (page - 1) * limit,
      fields: JSON.stringify(fields || ['name', 'item_name', 'item_code', 'stock_uom'])
    };
    
    let allFilters: any[] = [
      ['disabled', '=', 0] // Only enabled items
    ];
    if (filters) allFilters = [...allFilters, ...filters];
    
    if (allFilters.length > 0) {
      params.filters = allFilters;
    }
    
    return this.makeRequest('Item', 'GET', null, params);
  }

  async searchItems(searchTerm: string, company?: string, limit: number = 20) {
    const params: any = {
      limit_page_length: limit,
      fields: JSON.stringify(['name', 'item_name', 'item_code', 'stock_uom'])
    };
    
    let allFilters: any[] = [
      ['disabled', '=', 0] // Only enabled items
    ];
    
    if (searchTerm.trim()) {
      // Search in both item_code and item_name
      allFilters.push([
        ['item_code', 'like', `%${searchTerm}%`],
        'or',
        ['item_name', 'like', `%${searchTerm}%`]
      ]);
    }
    
    if (allFilters.length > 0) {
      params.filters = allFilters;
    }
    
    return this.makeRequest('Item', 'GET', null, params);
  }

  async getItem(itemCode: string) {
    return this.makeRequest(`Item/${itemCode}`);
  }

  async getStockBalance(filters?: any[], company?: string) {
    try {
      // First try Stock Balance Report with warehouse filter
      return await this.getStockBalanceReport(filters, company);
    } catch (error) {
      console.log('Stock Balance Report failed, falling back to Bin doctype:', error);
      
      // Fallback to Bin doctype if Stock Balance Report is not available
      const params: any = {
        limit_page_length: 0, // Get all records
        fields: JSON.stringify(['item_code', 'warehouse', 'actual_qty', 'stock_value', 'stock_uom'])
      };
      
      let allFilters: any[] = [
        ['actual_qty', '>', 0] // Only positive stock
      ];
      
      if (filters) {
        allFilters = [...allFilters, ...filters];
      }
      
      if (allFilters.length > 0) {
        params.filters = allFilters;
      }
      
      const result = await this.makeRequest('Bin', 'GET', null, params);
      
      if (result.data) {
        // Transform Bin data to match Stock Balance Report format
        const transformedData = result.data.map((bin: any) => ({
          item_code: bin.item_code,
          item_name: bin.item_code, // Bin doesn't have item_name, use item_code as fallback
          warehouse: bin.warehouse,
          actual_qty: parseFloat(bin.actual_qty) || 0,
          stock_value: parseFloat(bin.stock_value) || 0,
          stock_uom: bin.stock_uom || 'Nos'
        }));
        
        return { data: transformedData };
      }
      
      return { data: [] };
    }
  }

  async getWarehouses(filters?: any[], company?: string) {
    const params: any = {
      limit_page_length: 100,
      fields: JSON.stringify(['name', 'warehouse_name', 'company', 'is_group'])
    };
    
    let allFilters: any[] = [];
    if (filters) {
      // Handle complex OR filters properly
      allFilters = filters.map(filter => {
        if (Array.isArray(filter) && filter.some(f => Array.isArray(f))) {
          // This is a complex OR filter
          return filter;
        }
        return filter;
      });
    }
    if (company) allFilters.push(['company', '=', company]);
    
    if (allFilters.length > 0) {
      params.filters = allFilters;
    }
    
    console.log('Warehouse API params:', params);
    
    return this.makeRequest('Warehouse', 'GET', null, params);
  }

  async getSalesOrders(filters?: any[], company?: string) {
    const params: any = {
      limit_page_length: 50,
      fields: JSON.stringify(['name', 'customer', 'status', 'delivery_date', 'grand_total'])
    };
    
    let allFilters: any[] = [];
    if (filters) allFilters = [...filters];
    if (company) allFilters.push(['company', '=', company]);
    
    if (allFilters.length > 0) {
      params.filters = allFilters;
    }
    
    return this.makeRequest('Sales Order', 'GET', null, params);
  }

  async getSalesOrder(name: string) {
    return this.makeRequest(`Sales Order/${name}`);
  }

  async getPurchaseOrders(filters?: any[], company?: string) {
    const params: any = {
      limit_page_length: 50,
      fields: JSON.stringify(['name', 'supplier', 'status', 'schedule_date', 'grand_total'])
    };
    
    let allFilters: any[] = [];
    if (filters) allFilters = [...filters];
    if (company) allFilters.push(['company', '=', company]);
    
    if (allFilters.length > 0) {
      params.filters = allFilters;
    }
    
    return this.makeRequest('Purchase Order', 'GET', null, params);
  }

  async getPurchaseOrder(name: string) {
    return this.makeRequest(`Purchase Order/${name}`);
  }

  async getDeliveryNotes(filters?: any[], company?: string) {
    const params: any = {
      limit_page_length: 50,
      fields: JSON.stringify(['name', 'customer', 'status', 'posting_date'])
    };
    
    let allFilters: any[] = [];
    if (filters) allFilters = [...filters];
    if (company) allFilters.push(['company', '=', company]);
    
    if (allFilters.length > 0) {
      params.filters = allFilters;
    }
    
    return this.makeRequest('Delivery Note', 'GET', null, params);
  }

  async createDeliveryNote(data: any) {
    return this.makeRequest('Delivery Note', 'POST', data);
  }

  async getPurchaseReceipts(filters?: any[], company?: string) {
    const params: any = {
      limit_page_length: 50,
      fields: JSON.stringify(['name', 'supplier', 'status', 'posting_date'])
    };
    
    let allFilters: any[] = [];
    if (filters) allFilters = [...filters];
    if (company) allFilters.push(['company', '=', company]);
    
    if (allFilters.length > 0) {
      params.filters = allFilters;
    }
    
    return this.makeRequest('Purchase Receipt', 'GET', null, params);
  }

  async createPurchaseReceipt(data: any) {
    return this.makeRequest('Purchase Receipt', 'POST', data);
  }

  async getMaterialRequests(filters?: any[], company?: string) {
    const params: any = {
      limit_page_length: 50,
      fields: JSON.stringify(['name', 'material_request_type', 'status', 'schedule_date'])
    };
    
    let allFilters: any[] = [];
    if (filters) allFilters = [...filters];
    if (company) allFilters.push(['company', '=', company]);
    
    if (allFilters.length > 0) {
      params.filters = allFilters;
    }
    
    return this.makeRequest('Material Request', 'GET', null, params);
  }

  async createMaterialRequest(data: any) {
    return this.makeRequest('Material Request', 'POST', data);
  }

  async getStockEntries(filters?: any[], company?: string) {
    const params: any = {
      limit_page_length: 50,
      fields: JSON.stringify(['name', 'stock_entry_type', 'status', 'posting_date'])
    };
    
    let allFilters: any[] = [];
    if (filters) allFilters = [...filters];
    if (company) allFilters.push(['company', '=', company]);
    
    if (allFilters.length > 0) {
      params.filters = allFilters;
    }
    
    return this.makeRequest('Stock Entry', 'GET', null, params);
  }

  async createStockEntry(data: any) {
    return this.makeRequest('Stock Entry', 'POST', data);
  }

  async getPickLists(filters?: any[], company?: string) {
    const params: any = {
      limit_page_length: 50,
      fields: JSON.stringify(['name', 'purpose', 'status', 'date'])
    };
    
    let allFilters: any[] = [];
    if (filters) allFilters = [...filters];
    if (company) allFilters.push(['company', '=', company]);
    
    if (allFilters.length > 0) {
      params.filters = allFilters;
    }
    
    return this.makeRequest('Pick List', 'GET', null, params);
  }

  async createPickList(data: any) {
    return this.makeRequest('Pick List', 'POST', data);
  }

  async getPackingSlips(filters?: any[], company?: string) {
    const params: any = {
      limit_page_length: 50,
      fields: JSON.stringify(['name', 'delivery_note', 'status', 'creation'])
    };
    
    let allFilters: any[] = [];
    if (filters) allFilters = [...filters];
    if (company) allFilters.push(['company', '=', company]);
    
    if (allFilters.length > 0) {
      params.filters = allFilters;
    }
    
    return this.makeRequest('Packing Slip', 'GET', null, params);
  }

  async createPackingSlip(data: any) {
    return this.makeRequest('Packing Slip', 'POST', data);
  }

  async getQualityInspections(filters?: any[], company?: string) {
    const params: any = {
      limit_page_length: 50,
      fields: JSON.stringify(['name', 'item_code', 'status', 'inspection_type'])
    };
    
    let allFilters: any[] = [];
    if (filters) allFilters = [...filters];
    if (company) allFilters.push(['company', '=', company]);
    
    if (allFilters.length > 0) {
      params.filters = allFilters;
    }
    
    return this.makeRequest('Quality Inspection', 'GET', null, params);
  }

  async getProductBundles(filters?: any[], company?: string) {
    const params: any = {
      limit_page_length: 50,
      fields: JSON.stringify(['name', 'new_item_code', 'description'])
    };
    
    let allFilters: any[] = [];
    if (filters) allFilters = [...filters];
    if (company) allFilters.push(['company', '=', company]);
    
    if (allFilters.length > 0) {
      params.filters = allFilters;
    }
    
    return this.makeRequest('Product Bundle', 'GET', null, params);
  }

  async getItemByBarcode(barcode: string, company?: string) {
    const params: any = {
      limit_page_length: 10,
      fields: JSON.stringify(['item_code', 'item_name', 'stock_uom'])
    };
    
    let allFilters: any[] = [
      ['disabled', '=', 0], // Only enabled items
      ['barcodes.barcode', '=', barcode]
    ];
    
    if (allFilters.length > 0) {
      params.filters = allFilters;
    }
    
    return this.makeRequest('Item', 'GET', null, params);
  }

  async getAllEnabledItems(company?: string) {
    const params: any = {
      limit_page_length: 0, // 0 means no limit, fetch all records
      fields: JSON.stringify(['item_code', 'item_name', 'stock_uom', 'disabled'])
    };
    
    let allFilters: any[] = [
      ['disabled', '=', 0] // Only fetch enabled items
    ];
    
    if (allFilters.length > 0) {
      params.filters = allFilters;
    }
    
    return this.makeRequest('Item', 'GET', null, params);
  }
}

export async function getUserERPNextConfig(): Promise<ERPNextConfig | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('erpnext_url, erpnext_api_key, erpnext_api_secret')
      .eq('id', user.id)
      .single();

    if (error) {
      throw error;
    }

    if (!profile?.erpnext_url || !profile?.erpnext_api_key || !profile?.erpnext_api_secret) {
      return null;
    }

    return {
      url: profile.erpnext_url,
      apiKey: profile.erpnext_api_key,
      apiSecret: profile.erpnext_api_secret
    };
  } catch (error) {
    console.error('Failed to get ERPNext config:', error);
    return null;
  }
}

export async function getUserDefaultCompany(): Promise<string | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('erpnext_default_company')
      .eq('id', user.id)
      .single();

    if (error) {
      throw error;
    }

    return profile?.erpnext_default_company || null;
  } catch (error) {
    console.error('Failed to get default company:', error);
    return null;
  }
}

export async function createERPNextAPI(): Promise<ERPNextAPI | null> {
  const config = await getUserERPNextConfig();
  
  if (!config) {
    return null;
  }

  return new ERPNextAPI(config);
}

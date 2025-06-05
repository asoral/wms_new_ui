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
      limit_page_length: 100,
      fields: JSON.stringify(fields || ['name', 'item_name', 'item_code', 'stock_uom'])
    };
    
    let allFilters: any[] = [];
    if (filters) allFilters = [...filters];
    if (company) allFilters.push(['company', '=', company]);
    
    if (allFilters.length > 0) {
      params.filters = allFilters;
    }
    
    return this.makeRequest('Item', 'GET', null, params);
  }

  async getItem(itemCode: string) {
    return this.makeRequest(`Item/${itemCode}`);
  }

  async getStockBalance(filters?: any[], company?: string) {
    const params: any = {
      fields: JSON.stringify(['item_code', 'warehouse', 'actual_qty', 'reserved_qty', 'projected_qty']),
      limit_page_length: 1000
    };
    
    let allFilters: any[] = [];
    if (filters) allFilters = [...filters];
    if (company) allFilters.push(['company', '=', company]);
    
    if (allFilters.length > 0) {
      params.filters = allFilters;
    }
    
    return this.makeRequest('Bin', 'GET', null, params);
  }

  async getWarehouses(filters?: any[], company?: string) {
    const params: any = {
      limit_page_length: 100,
      fields: JSON.stringify(['name', 'warehouse_name', 'company'])
    };
    
    let allFilters: any[] = [];
    if (filters) allFilters = [...filters];
    if (company) allFilters.push(['company', '=', company]);
    
    if (allFilters.length > 0) {
      params.filters = allFilters;
    }
    
    return this.makeRequest('Warehouse', 'GET', null, params);
  }

  async getSalesOrders(filters?: any[], company?: string) {
    const params: any = {
      limit_page_length: 100,
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
      limit_page_length: 100,
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
      limit_page_length: 100,
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
      limit_page_length: 100,
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
      limit_page_length: 100,
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
      limit_page_length: 100,
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
      limit_page_length: 100,
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
      limit_page_length: 100,
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
      limit_page_length: 100,
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
      limit_page_length: 100,
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

  async getStockBalanceReport(filters?: any[], company?: string, includeStockAgeing?: boolean) {
    // For stock balance, we need to use the Bin doctype which has the actual stock quantities
    const params: any = {
      fields: JSON.stringify([
        'item_code', 
        'warehouse', 
        'actual_qty', 
        'stock_value',
        'stock_uom'
      ]),
      limit_page_length: 1000
    };
    
    let allFilters: any[] = [];
    if (filters) allFilters = [...filters];
    if (company) allFilters.push(['company', '=', company]);
    
    // Only include bins with positive stock
    allFilters.push(['actual_qty', '>', 0]);
    
    if (allFilters.length > 0) {
      params.filters = allFilters;
    }
    
    // Use Bin doctype for stock balance queries
    return this.makeRequest('Bin', 'GET', null, params);
  }

  async getItemByBarcode(barcode: string, company?: string) {
    const params: any = {
      limit_page_length: 10,
      fields: JSON.stringify(['item_code', 'item_name', 'stock_uom'])
    };
    
    let allFilters: any[] = [
      ['barcodes.barcode', '=', barcode]
    ];
    if (company) allFilters.push(['company', '=', company]);
    
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

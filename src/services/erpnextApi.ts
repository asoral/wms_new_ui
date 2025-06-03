
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
    // Use Basic Authentication with base64 encoded api_key:api_secret
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
    console.log('Using Basic Auth with credentials');
    
    if (params) {
      const searchParams = new URLSearchParams();
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null) {
          searchParams.append(key, typeof params[key] === 'object' ? JSON.stringify(params[key]) : params[key]);
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

    console.log('Request options:', { url, method, headers: options.headers });

    try {
      const response = await fetch(url, options);
      
      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('ERPNext API Error Response:', errorText);
        
        if (response.status === 403) {
          throw new Error('Authentication failed. Please check your API Key and Secret.');
        }
        if (response.status === 404) {
          throw new Error('ERPNext endpoint not found. Please check your server URL.');
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

  // Test connection using a simple doctype query
  async testConnection() {
    try {
      console.log('Testing ERPNext connection...');
      
      // Try to fetch a single Company record to test connection
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

  // Get list of companies
  async getCompanies() {
    return this.makeRequest('Company', 'GET', null, { 
      fields: JSON.stringify(['name', 'company_name']),
      limit_page_length: 100
    });
  }

  // Item Management
  async getItems(filters?: any, fields?: string[], company?: string) {
    const params: any = {
      limit_page_length: 100,
      fields: JSON.stringify(fields || ['name', 'item_name', 'item_code', 'stock_uom'])
    };
    if (filters) params.filters = JSON.stringify(filters);
    if (company) {
      const companyFilter = [['company', '=', company]];
      const existingFilters = filters ? JSON.parse(JSON.stringify(filters)) : [];
      params.filters = JSON.stringify([...existingFilters, ...companyFilter]);
    }
    return this.makeRequest('Item', 'GET', null, params);
  }

  async getItem(itemCode: string) {
    return this.makeRequest(`Item/${itemCode}`);
  }

  // Stock Management
  async getStockBalance(filters?: any, company?: string) {
    const params: any = {
      fields: JSON.stringify(['item_code', 'warehouse', 'actual_qty', 'reserved_qty', 'projected_qty']),
      limit_page_length: 1000
    };
    if (filters) params.filters = JSON.stringify(filters);
    if (company) {
      const companyFilter = [['company', '=', company]];
      const existingFilters = filters ? JSON.parse(JSON.stringify(filters)) : [];
      params.filters = JSON.stringify([...existingFilters, ...companyFilter]);
    }
    return this.makeRequest('Bin', 'GET', null, params);
  }

  async getWarehouses(filters?: any, company?: string) {
    const params: any = {
      limit_page_length: 100,
      fields: JSON.stringify(['name', 'warehouse_name', 'company'])
    };
    if (filters) params.filters = JSON.stringify(filters);
    if (company) {
      const companyFilter = [['company', '=', company]];
      const existingFilters = filters ? JSON.parse(JSON.stringify(filters)) : [];
      params.filters = JSON.stringify([...existingFilters, ...companyFilter]);
    }
    return this.makeRequest('Warehouse', 'GET', null, params);
  }

  // Sales Orders
  async getSalesOrders(filters?: any, company?: string) {
    const params: any = {
      limit_page_length: 100,
      fields: JSON.stringify(['name', 'customer', 'status', 'delivery_date', 'grand_total'])
    };
    if (filters) params.filters = JSON.stringify(filters);
    if (company) {
      const companyFilter = [['company', '=', company]];
      const existingFilters = filters ? JSON.parse(JSON.stringify(filters)) : [];
      params.filters = JSON.stringify([...existingFilters, ...companyFilter]);
    }
    return this.makeRequest('Sales Order', 'GET', null, params);
  }

  async getSalesOrder(name: string) {
    return this.makeRequest(`Sales Order/${name}`);
  }

  // Purchase Orders
  async getPurchaseOrders(filters?: any, company?: string) {
    const params: any = {
      limit_page_length: 100,
      fields: JSON.stringify(['name', 'supplier', 'status', 'schedule_date', 'grand_total'])
    };
    if (filters) params.filters = JSON.stringify(filters);
    if (company) {
      const companyFilter = [['company', '=', company]];
      const existingFilters = filters ? JSON.parse(JSON.stringify(filters)) : [];
      params.filters = JSON.stringify([...existingFilters, ...companyFilter]);
    }
    return this.makeRequest('Purchase Order', 'GET', null, params);
  }

  async getPurchaseOrder(name: string) {
    return this.makeRequest(`Purchase Order/${name}`);
  }

  // Delivery Notes
  async getDeliveryNotes(filters?: any, company?: string) {
    const params: any = {
      limit_page_length: 100,
      fields: JSON.stringify(['name', 'customer', 'status', 'posting_date'])
    };
    if (filters) params.filters = JSON.stringify(filters);
    if (company) {
      const companyFilter = [['company', '=', company]];
      const existingFilters = filters ? JSON.parse(JSON.stringify(filters)) : [];
      params.filters = JSON.stringify([...existingFilters, ...companyFilter]);
    }
    return this.makeRequest('Delivery Note', 'GET', null, params);
  }

  async createDeliveryNote(data: any) {
    return this.makeRequest('Delivery Note', 'POST', data);
  }

  // Purchase Receipts
  async getPurchaseReceipts(filters?: any, company?: string) {
    const params: any = {
      limit_page_length: 100,
      fields: JSON.stringify(['name', 'supplier', 'status', 'posting_date'])
    };
    if (filters) params.filters = JSON.stringify(filters);
    if (company) {
      const companyFilter = [['company', '=', company]];
      const existingFilters = filters ? JSON.parse(JSON.stringify(filters)) : [];
      params.filters = JSON.stringify([...existingFilters, ...companyFilter]);
    }
    return this.makeRequest('Purchase Receipt', 'GET', null, params);
  }

  async createPurchaseReceipt(data: any) {
    return this.makeRequest('Purchase Receipt', 'POST', data);
  }

  // Material Requests
  async getMaterialRequests(filters?: any, company?: string) {
    const params: any = {
      limit_page_length: 100,
      fields: JSON.stringify(['name', 'material_request_type', 'status', 'schedule_date'])
    };
    if (filters) params.filters = JSON.stringify(filters);
    if (company) {
      const companyFilter = [['company', '=', company]];
      const existingFilters = filters ? JSON.parse(JSON.stringify(filters)) : [];
      params.filters = JSON.stringify([...existingFilters, ...companyFilter]);
    }
    return this.makeRequest('Material Request', 'GET', null, params);
  }

  async createMaterialRequest(data: any) {
    return this.makeRequest('Material Request', 'POST', data);
  }

  // Stock Entries
  async getStockEntries(filters?: any, company?: string) {
    const params: any = {
      limit_page_length: 100,
      fields: JSON.stringify(['name', 'stock_entry_type', 'status', 'posting_date'])
    };
    if (filters) params.filters = JSON.stringify(filters);
    if (company) {
      const companyFilter = [['company', '=', company]];
      const existingFilters = filters ? JSON.parse(JSON.stringify(filters)) : [];
      params.filters = JSON.stringify([...existingFilters, ...companyFilter]);
    }
    return this.makeRequest('Stock Entry', 'GET', null, params);
  }

  async createStockEntry(data: any) {
    return this.makeRequest('Stock Entry', 'POST', data);
  }

  // Pick Lists
  async getPickLists(filters?: any, company?: string) {
    const params: any = {
      limit_page_length: 100,
      fields: JSON.stringify(['name', 'purpose', 'status', 'date'])
    };
    if (filters) params.filters = JSON.stringify(filters);
    if (company) {
      const companyFilter = [['company', '=', company]];
      const existingFilters = filters ? JSON.parse(JSON.stringify(filters)) : [];
      params.filters = JSON.stringify([...existingFilters, ...companyFilter]);
    }
    return this.makeRequest('Pick List', 'GET', null, params);
  }

  async createPickList(data: any) {
    return this.makeRequest('Pick List', 'POST', data);
  }

  // Packing Slips
  async getPackingSlips(filters?: any, company?: string) {
    const params: any = {
      limit_page_length: 100,
      fields: JSON.stringify(['name', 'delivery_note', 'status', 'creation'])
    };
    if (filters) params.filters = JSON.stringify(filters);
    if (company) {
      const companyFilter = [['company', '=', company]];
      const existingFilters = filters ? JSON.parse(JSON.stringify(filters)) : [];
      params.filters = JSON.stringify([...existingFilters, ...companyFilter]);
    }
    return this.makeRequest('Packing Slip', 'GET', null, params);
  }

  async createPackingSlip(data: any) {
    return this.makeRequest('Packing Slip', 'POST', data);
  }
}

// Helper function to get user's ERPNext configuration
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

// Helper function to get user's default company
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

// Factory function to create ERPNext API instance
export async function createERPNextAPI(): Promise<ERPNextAPI | null> {
  const config = await getUserERPNextConfig();
  
  if (!config) {
    return null;
  }

  return new ERPNextAPI(config);
}

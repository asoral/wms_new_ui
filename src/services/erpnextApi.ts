
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
    // Correct Frappe token authentication format: "token api_key:api_secret"
    return {
      'Authorization': `token ${this.config.apiKey}:${this.config.apiSecret}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
  }

  private cleanUrl(url: string): string {
    // Remove trailing slash and ensure proper format
    return url.replace(/\/+$/, '');
  }

  public async makeRequest(endpoint: string, method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET', data?: any, params?: any) {
    const baseUrl = this.cleanUrl(this.config.url);
    let url = `${baseUrl}/api/resource/${endpoint}`;
    
    console.log('Making Frappe API request to:', url);
    console.log('Using token format: token api_key:api_secret');
    
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

    console.log('Request options:', { 
      url, 
      method, 
      headers: options.headers,
      hasBody: !!options.body 
    });

    try {
      const response = await fetch(url, options);
      
      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Frappe API Error Response:', errorText);
        
        // Parse Frappe error format if possible
        try {
          const errorJson = JSON.parse(errorText);
          if (errorJson.exc) {
            throw new Error(`Frappe API Error: ${errorJson.exc}`);
          }
          if (errorJson.message) {
            throw new Error(`Frappe API Error: ${errorJson.message}`);
          }
        } catch (parseError) {
          // If not JSON, use raw error text
        }
        
        throw new Error(`Frappe API Error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const result = await response.json();
      console.log('Frappe API Response:', result);
      return result;
    } catch (error) {
      console.error('Frappe API Request Failed:', error);
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        throw new Error('Network error: Unable to connect to ERPNext server. Please check your URL and ensure CORS is enabled on your ERPNext server.');
      }
      throw error;
    }
  }

  // Test connection to ERPNext using the /api/method/frappe.auth.get_logged_user endpoint
  async testConnection() {
    try {
      console.log('Testing Frappe connection...');
      
      // Use the auth endpoint to test connection as per Frappe docs
      const baseUrl = this.cleanUrl(this.config.url);
      const url = `${baseUrl}/api/method/frappe.auth.get_logged_user`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getAuthHeaders(),
        mode: 'cors',
      });
      
      console.log('Auth test response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Auth test failed:', errorText);
        return { success: false, error: `Authentication failed: ${response.status} ${response.statusText}` };
      }
      
      const result = await response.json();
      console.log('Auth test successful:', result);
      
      return { success: true, data: result };
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
      limit_page_length: 100
    };
    if (filters) params.filters = JSON.stringify(filters);
    if (fields) params.fields = JSON.stringify(fields);
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
      limit_page_length: 100
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
      limit_page_length: 100
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

  // Delivery Notes
  async getDeliveryNotes(filters?: any, company?: string) {
    const params: any = {
      limit_page_length: 100
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

  // Purchase Orders
  async getPurchaseOrders(filters?: any, company?: string) {
    const params: any = {
      limit_page_length: 100
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

  // Purchase Receipts
  async getPurchaseReceipts(filters?: any, company?: string) {
    const params: any = {
      limit_page_length: 100
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
      limit_page_length: 100
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
      limit_page_length: 100
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
      limit_page_length: 100
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
      limit_page_length: 100
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

  // Quality Inspections
  async getQualityInspections(filters?: any, company?: string) {
    const params: any = {
      limit_page_length: 100
    };
    if (filters) params.filters = JSON.stringify(filters);
    if (company) {
      const companyFilter = [['company', '=', company]];
      const existingFilters = filters ? JSON.parse(JSON.stringify(filters)) : [];
      params.filters = JSON.stringify([...existingFilters, ...companyFilter]);
    }
    return this.makeRequest('Quality Inspection', 'GET', null, params);
  }

  async createQualityInspection(data: any) {
    return this.makeRequest('Quality Inspection', 'POST', data);
  }

  // Product Bundles (for Pallets)
  async getProductBundles(filters?: any, company?: string) {
    const params: any = {
      limit_page_length: 100
    };
    if (filters) params.filters = JSON.stringify(filters);
    if (company) {
      const companyFilter = [['company', '=', company]];
      const existingFilters = filters ? JSON.parse(JSON.stringify(filters)) : [];
      params.filters = JSON.stringify([...existingFilters, ...companyFilter]);
    }
    return this.makeRequest('Product Bundle', 'GET', null, params);
  }

  async createProductBundle(data: any) {
    return this.makeRequest('Product Bundle', 'POST', data);
  }

  // Stock Reconciliation
  async getStockReconciliations(filters?: any, company?: string) {
    const params: any = {
      limit_page_length: 100
    };
    if (filters) params.filters = JSON.stringify(filters);
    if (company) {
      const companyFilter = [['company', '=', company]];
      const existingFilters = filters ? JSON.parse(JSON.stringify(filters)) : [];
      params.filters = JSON.stringify([...existingFilters, ...companyFilter]);
    }
    return this.makeRequest('Stock Reconciliation', 'GET', null, params);
  }

  async createStockReconciliation(data: any) {
    return this.makeRequest('Stock Reconciliation', 'POST', data);
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


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
    return {
      'Authorization': `token ${this.config.apiKey}:${this.config.apiSecret}`,
      'Content-Type': 'application/json',
    };
  }

  public async makeRequest(endpoint: string, method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET', data?: any, params?: any) {
    let url = `${this.config.url}/api/resource/${endpoint}`;
    
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
    };

    if (data) {
      options.body = JSON.stringify(data);
    }

    try {
      const response = await fetch(url, options);
      
      if (!response.ok) {
        throw new Error(`ERPNext API Error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('ERPNext API Request Failed:', error);
      throw error;
    }
  }

  // Test connection to ERPNext
  async testConnection() {
    try {
      const response = await this.makeRequest('Company', 'GET', null, { limit_page_length: 1 });
      return { success: true, data: response };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Connection failed' };
    }
  }

  // Get list of companies
  async getCompanies() {
    return this.makeRequest('Company', 'GET', null, { fields: JSON.stringify(['name', 'company_name']) });
  }

  // Item Management
  async getItems(filters?: any, fields?: string[], company?: string) {
    const params: any = {};
    if (filters) params.filters = filters;
    if (fields) params.fields = JSON.stringify(fields);
    if (company) {
      const companyFilter = [['company', '=', company]];
      params.filters = filters ? [...filters, ...companyFilter] : companyFilter;
    }
    return this.makeRequest('Item', 'GET', null, params);
  }

  async getItem(itemCode: string) {
    return this.makeRequest(`Item/${itemCode}`);
  }

  // Stock Management
  async getStockBalance(filters?: any, company?: string) {
    const params: any = {};
    if (filters) params.filters = filters;
    if (company) {
      const companyFilter = [['company', '=', company]];
      params.filters = filters ? [...filters, ...companyFilter] : companyFilter;
    }
    return this.makeRequest('Bin', 'GET', null, params);
  }

  async getWarehouses(filters?: any, company?: string) {
    const params: any = {};
    if (filters) params.filters = filters;
    if (company) {
      const companyFilter = [['company', '=', company]];
      params.filters = filters ? [...filters, ...companyFilter] : companyFilter;
    }
    return this.makeRequest('Warehouse', 'GET', null, params);
  }

  // Sales Orders
  async getSalesOrders(filters?: any, company?: string) {
    const params: any = {};
    if (filters) params.filters = filters;
    if (company) {
      const companyFilter = [['company', '=', company]];
      params.filters = filters ? [...filters, ...companyFilter] : companyFilter;
    }
    return this.makeRequest('Sales Order', 'GET', null, params);
  }

  async getSalesOrder(name: string) {
    return this.makeRequest(`Sales Order/${name}`);
  }

  // Delivery Notes
  async getDeliveryNotes(filters?: any, company?: string) {
    const params: any = {};
    if (filters) params.filters = filters;
    if (company) {
      const companyFilter = [['company', '=', company]];
      params.filters = filters ? [...filters, ...companyFilter] : companyFilter;
    }
    return this.makeRequest('Delivery Note', 'GET', null, params);
  }

  async createDeliveryNote(data: any) {
    return this.makeRequest('Delivery Note', 'POST', data);
  }

  // Purchase Orders
  async getPurchaseOrders(filters?: any, company?: string) {
    const params: any = {};
    if (filters) params.filters = filters;
    if (company) {
      const companyFilter = [['company', '=', company]];
      params.filters = filters ? [...filters, ...companyFilter] : companyFilter;
    }
    return this.makeRequest('Purchase Order', 'GET', null, params);
  }

  async getPurchaseOrder(name: string) {
    return this.makeRequest(`Purchase Order/${name}`);
  }

  // Purchase Receipts
  async getPurchaseReceipts(filters?: any, company?: string) {
    const params: any = {};
    if (filters) params.filters = filters;
    if (company) {
      const companyFilter = [['company', '=', company]];
      params.filters = filters ? [...filters, ...companyFilter] : companyFilter;
    }
    return this.makeRequest('Purchase Receipt', 'GET', null, params);
  }

  async createPurchaseReceipt(data: any) {
    return this.makeRequest('Purchase Receipt', 'POST', data);
  }

  // Material Requests
  async getMaterialRequests(filters?: any, company?: string) {
    const params: any = {};
    if (filters) params.filters = filters;
    if (company) {
      const companyFilter = [['company', '=', company]];
      params.filters = filters ? [...filters, ...companyFilter] : companyFilter;
    }
    return this.makeRequest('Material Request', 'GET', null, params);
  }

  async createMaterialRequest(data: any) {
    return this.makeRequest('Material Request', 'POST', data);
  }

  // Stock Entries
  async getStockEntries(filters?: any, company?: string) {
    const params: any = {};
    if (filters) params.filters = filters;
    if (company) {
      const companyFilter = [['company', '=', company]];
      params.filters = filters ? [...filters, ...companyFilter] : companyFilter;
    }
    return this.makeRequest('Stock Entry', 'GET', null, params);
  }

  async createStockEntry(data: any) {
    return this.makeRequest('Stock Entry', 'POST', data);
  }

  // Pick Lists
  async getPickLists(filters?: any, company?: string) {
    const params: any = {};
    if (filters) params.filters = filters;
    if (company) {
      const companyFilter = [['company', '=', company]];
      params.filters = filters ? [...filters, ...companyFilter] : companyFilter;
    }
    return this.makeRequest('Pick List', 'GET', null, params);
  }

  async createPickList(data: any) {
    return this.makeRequest('Pick List', 'POST', data);
  }

  // Packing Slips
  async getPackingSlips(filters?: any, company?: string) {
    const params: any = {};
    if (filters) params.filters = filters;
    if (company) {
      const companyFilter = [['company', '=', company]];
      params.filters = filters ? [...filters, ...companyFilter] : companyFilter;
    }
    return this.makeRequest('Packing Slip', 'GET', null, params);
  }

  async createPackingSlip(data: any) {
    return this.makeRequest('Packing Slip', 'POST', data);
  }

  // Quality Inspections
  async getQualityInspections(filters?: any, company?: string) {
    const params: any = {};
    if (filters) params.filters = filters;
    if (company) {
      const companyFilter = [['company', '=', company]];
      params.filters = filters ? [...filters, ...companyFilter] : companyFilter;
    }
    return this.makeRequest('Quality Inspection', 'GET', null, params);
  }

  async createQualityInspection(data: any) {
    return this.makeRequest('Quality Inspection', 'POST', data);
  }

  // Product Bundles (for Pallets)
  async getProductBundles(filters?: any, company?: string) {
    const params: any = {};
    if (filters) params.filters = filters;
    if (company) {
      const companyFilter = [['company', '=', company]];
      params.filters = filters ? [...filters, ...companyFilter] : companyFilter;
    }
    return this.makeRequest('Product Bundle', 'GET', null, params);
  }

  async createProductBundle(data: any) {
    return this.makeRequest('Product Bundle', 'POST', data);
  }

  // Stock Reconciliation
  async getStockReconciliations(filters?: any, company?: string) {
    const params: any = {};
    if (filters) params.filters = filters;
    if (company) {
      const companyFilter = [['company', '=', company]];
      params.filters = filters ? [...filters, ...companyFilter] : companyFilter;
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

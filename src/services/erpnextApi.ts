
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

  private async makeRequest(endpoint: string, method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET', data?: any) {
    const url = `${this.config.url}/api/resource/${endpoint}`;
    
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

  // Item Management
  async getItems(filters?: any) {
    const params = filters ? `?filters=${JSON.stringify(filters)}` : '';
    return this.makeRequest(`Item${params}`);
  }

  async getItem(itemCode: string) {
    return this.makeRequest(`Item/${itemCode}`);
  }

  // Stock Management
  async getStockBalance(filters?: any) {
    const params = filters ? `?filters=${JSON.stringify(filters)}` : '';
    return this.makeRequest(`Bin${params}`);
  }

  async getWarehouses(filters?: any) {
    const params = filters ? `?filters=${JSON.stringify(filters)}` : '';
    return this.makeRequest(`Warehouse${params}`);
  }

  // Stock Reconciliation
  async getStockReconciliations(filters?: any) {
    const params = filters ? `?filters=${JSON.stringify(filters)}` : '';
    return this.makeRequest(`Stock Reconciliation${params}`);
  }

  async createStockReconciliation(data: any) {
    return this.makeRequest('Stock Reconciliation', 'POST', data);
  }

  // Sales Orders
  async getSalesOrders(filters?: any) {
    const params = filters ? `?filters=${JSON.stringify(filters)}` : '';
    return this.makeRequest(`Sales Order${params}`);
  }

  async getSalesOrder(name: string) {
    return this.makeRequest(`Sales Order/${name}`);
  }

  // Delivery Notes
  async getDeliveryNotes(filters?: any) {
    const params = filters ? `?filters=${JSON.stringify(filters)}` : '';
    return this.makeRequest(`Delivery Note${params}`);
  }

  async createDeliveryNote(data: any) {
    return this.makeRequest('Delivery Note', 'POST', data);
  }

  // Purchase Orders
  async getPurchaseOrders(filters?: any) {
    const params = filters ? `?filters=${JSON.stringify(filters)}` : '';
    return this.makeRequest(`Purchase Order${params}`);
  }

  async getPurchaseOrder(name: string) {
    return this.makeRequest(`Purchase Order/${name}`);
  }

  // Purchase Receipts
  async getPurchaseReceipts(filters?: any) {
    const params = filters ? `?filters=${JSON.stringify(filters)}` : '';
    return this.makeRequest(`Purchase Receipt${params}`);
  }

  async createPurchaseReceipt(data: any) {
    return this.makeRequest('Purchase Receipt', 'POST', data);
  }

  // Material Requests
  async getMaterialRequests(filters?: any) {
    const params = filters ? `?filters=${JSON.stringify(filters)}` : '';
    return this.makeRequest(`Material Request${params}`);
  }

  async createMaterialRequest(data: any) {
    return this.makeRequest('Material Request', 'POST', data);
  }

  // Stock Entries
  async getStockEntries(filters?: any) {
    const params = filters ? `?filters=${JSON.stringify(filters)}` : '';
    return this.makeRequest(`Stock Entry${params}`);
  }

  async createStockEntry(data: any) {
    return this.makeRequest('Stock Entry', 'POST', data);
  }

  // Pick Lists
  async getPickLists(filters?: any) {
    const params = filters ? `?filters=${JSON.stringify(filters)}` : '';
    return this.makeRequest(`Pick List${params}`);
  }

  async createPickList(data: any) {
    return this.makeRequest('Pick List', 'POST', data);
  }

  // Packing Slips
  async getPackingSlips(filters?: any) {
    const params = filters ? `?filters=${JSON.stringify(filters)}` : '';
    return this.makeRequest(`Packing Slip${params}`);
  }

  async createPackingSlip(data: any) {
    return this.makeRequest('Packing Slip', 'POST', data);
  }

  // Quality Inspections
  async getQualityInspections(filters?: any) {
    const params = filters ? `?filters=${JSON.stringify(filters)}` : '';
    return this.makeRequest(`Quality Inspection${params}`);
  }

  async createQualityInspection(data: any) {
    return this.makeRequest('Quality Inspection', 'POST', data);
  }

  // Product Bundles (for Pallets)
  async getProductBundles(filters?: any) {
    const params = filters ? `?filters=${JSON.stringify(filters)}` : '';
    return this.makeRequest(`Product Bundle${params}`);
  }

  async createProductBundle(data: any) {
    return this.makeRequest('Product Bundle', 'POST', data);
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
      console.error('Failed to get ERPNext config from profiles:', error);
      throw new Error('ERPNext API not configured. Please check your connection settings.');
    }

    if (!profile?.erpnext_url || !profile?.erpnext_api_key || !profile?.erpnext_api_secret) {
      throw new Error('ERPNext API not configured. Please check your connection settings.');
    }

    return {
      url: profile.erpnext_url,
      apiKey: profile.erpnext_api_key,
      apiSecret: profile.erpnext_api_secret
    };
  } catch (error) {
    console.error('Failed to get ERPNext config:', error);
    throw error;
  }
}

// Factory function to create ERPNext API instance
export async function createERPNextAPI(): Promise<ERPNextAPI> {
  const config = await getUserERPNextConfig();
  
  if (!config) {
    throw new Error('ERPNext API not configured. Please check your connection settings.');
  }

  return new ERPNextAPI(config);
}

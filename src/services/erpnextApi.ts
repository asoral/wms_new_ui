import { getSupabaseClient } from "@/integrations/supabase";

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
    const supabase = getSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      console.error('No user found');
      return null;
    }

    const erpnext_url = user.user_metadata.erpnext_url;
    const erpnext_api_key = user.user_metadata.erpnext_api_key;
    const erpnext_api_secret = user.user_metadata.erpnext_api_secret;

    if (!erpnext_url || !erpnext_api_key || !erpnext_api_secret) {
      console.error('ERPNext configuration missing for user');
      return null;
    }

    return new ERPNextAPI({
      apiKey: erpnext_api_key,
      apiSecret: erpnext_api_secret,
      baseURL: erpnext_url,
    });
  } catch (error) {
    console.error('Error creating ERPNextAPI:', error);
    return null;
  }
};

export const getUserDefaultCompany = async (): Promise<string | null> => {
  try {
    const supabase = getSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      console.error('No user found');
      return null;
    }

    const erpnextAPI = new ERPNextAPI({
      apiKey: user.user_metadata.erpnext_api_key,
      apiSecret: user.user_metadata.erpnext_api_secret,
      baseURL: user.user_metadata.erpnext_url,
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

class ERPNextAPI {
  private apiKey: string;
  private apiSecret: string;
  public baseURL: string;

  constructor(config: APIConfig) {
    this.apiKey = config.apiKey;
    this.apiSecret = config.apiSecret;
    this.baseURL = config.baseURL;
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

  async getItemStock(itemCode: string): Promise<ItemStock[]> {
    const response = await fetch(`${this.baseURL}/api/resource/Stock Balance?filters=[["item_code", "=", "${itemCode}"] ]&fields=["item_code", "actual_qty", "warehouse"]`, {
      method: 'GET',
      headers: {
        'Authorization': `token ${this.apiKey}:${this.apiSecret}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get item stock: ${response.statusText}`);
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
}

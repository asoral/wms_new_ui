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

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('erpnext_url, erpnext_api_key, erpnext_api_secret')
      .eq('id', user.id)
      .single();

    let erpnext_url, erpnext_api_key, erpnext_api_secret;

    if (profile && !profileError && profile.erpnext_url && profile.erpnext_api_key && profile.erpnext_api_secret) {
      erpnext_url = profile.erpnext_url;
      erpnext_api_key = profile.erpnext_api_key;
      erpnext_api_secret = profile.erpnext_api_secret;
      console.log('createERPNextAPI: Using profile table credentials for URL:', erpnext_url);
    } else {
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
      
      if (profile.erpnext_url && profile.erpnext_api_key && profile.erpnext_api_secret) {
        erpnext_url = profile.erpnext_url;
        erpnext_api_key = profile.erpnext_api_key;
        erpnext_api_secret = profile.erpnext_api_secret;
      }
    }

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

  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseURL}/api/method/frappe.ping`, {
        headers: {
          'Authorization': `token ${this.apiKey}:${this.apiSecret}`,
          'Content-Type': 'application/json',
        },
      });
      return response.ok;
    } catch (error) {
      console.error('Failed to connect to ERPNext:', error);
      return false;
    }
  }

  async getItems(filters?: any, fields?: string[], company?: string): Promise<any> {
    let filterString = '';
    if (filters) {
      filterString = '&filters=' + encodeURIComponent(JSON.stringify(filters));
    }
  
    let fieldsString = '';
    if (fields) {
      fieldsString = '&fields=' + encodeURIComponent(JSON.stringify(fields));
    }
  
    let companyFilter = '';
    if (company) {
      companyFilter = `&company=${encodeURIComponent(company)}`;
    }
  
    const response = await fetch(`${this.baseURL}/api/resource/Item?limit_page_length=500${filterString}${fieldsString}${companyFilter}`, {
      method: 'GET',
      headers: {
        'Authorization': `token ${this.apiKey}:${this.apiSecret}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get items: ${response.statusText}`);
    }

    return response.json();
  }

  async getItemDetails(itemCode: string): Promise<any> {
    const response = await fetch(`${this.baseURL}/api/resource/Item/${encodeURIComponent(itemCode)}`, {
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

  async getItemByBarcode(barcode: string): Promise<any> {
    const response = await fetch(`${this.baseURL}/api/resource/Item?fields=["item_code", "item_name", "stock_uom", "has_batch_no", "has_serial_no"]&filters=[["Item", "barcode", "=", "${barcode}"]]`, {
      method: 'GET',
      headers: {
        'Authorization': `token ${this.apiKey}:${this.apiSecret}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get item by barcode: ${response.statusText}`);
    }

    return response.json();
  }

  async getWarehouses(filters?: any, company?: string): Promise<any> {
    let filterString = '';
    if (filters) {
      filterString = '&filters=' + encodeURIComponent(JSON.stringify(filters));
    }
  
    let companyFilter = '';
    if (company) {
      companyFilter = `&company=${encodeURIComponent(company)}`;
    }
  
    const response = await fetch(`${this.baseURL}/api/resource/Warehouse?limit_page_length=500${filterString}${companyFilter}`, {
      method: 'GET',
      headers: {
        'Authorization': `token ${this.apiKey}:${this.apiSecret}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get warehouses: ${response.statusText}`);
    }

    return response.json();
  }

  async getStockBalance(filters?: any, company?: string): Promise<any> {
    let filterString = '';
    if (filters) {
      filterString = '&filters=' + encodeURIComponent(JSON.stringify(filters));
    }
  
    let companyFilter = '';
    if (company) {
      companyFilter = `&company=${encodeURIComponent(company)}`;
    }
  
    const response = await fetch(`${this.baseURL}/api/resource/Stock Balance?limit_page_length=500${filterString}${companyFilter}`, {
      method: 'GET',
      headers: {
        'Authorization': `token ${this.apiKey}:${this.apiSecret}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get stock balance: ${response.statusText}`);
    }

    return response.json();
  }

  async getCurrentStock(itemCode: string, warehouse: string, batch?: string, serial?: string): Promise<number> {
    let filters = [
      ["item_code", "=", itemCode],
      ["warehouse", "=", warehouse]
    ];
  
    if (batch) {
      filters.push(["batch_no", "=", batch]);
    }
  
    if (serial) {
      filters.push(["serial_no", "=", serial]);
    }
  
    const filterString = encodeURIComponent(JSON.stringify(filters));
  
    const response = await fetch(`${this.baseURL}/api/resource/Stock Ledger Entry?fields=["actual_qty"]&filters=${filterString}&order_by=posting_date%20desc,posting_time%20desc&limit=1`, {
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
    if (data && data.data && data.data.length > 0) {
      return data.data[0].actual_qty || 0;
    } else {
      return 0;
    }
  }

  async getSalesOrders(filters?: any, company?: string): Promise<any> {
    let filterString = '';
    if (filters) {
      filterString = '&filters=' + encodeURIComponent(JSON.stringify(filters));
    }
  
    let companyFilter = '';
    if (company) {
      companyFilter = `&company=${encodeURIComponent(company)}`;
    }
  
    const response = await fetch(`${this.baseURL}/api/resource/Sales Order?limit_page_length=500${filterString}${companyFilter}`, {
      method: 'GET',
      headers: {
        'Authorization': `token ${this.apiKey}:${this.apiSecret}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get sales orders: ${response.statusText}`);
    }

    return response.json();
  }

  async getDeliveryNotes(filters?: any, company?: string): Promise<any> {
    let filterString = '';
    if (filters) {
      filterString = '&filters=' + encodeURIComponent(JSON.stringify(filters));
    }
  
    let companyFilter = '';
    if (company) {
      companyFilter = `&company=${encodeURIComponent(company)}`;
    }
  
    const response = await fetch(`${this.baseURL}/api/resource/Delivery Note?limit_page_length=500${filterString}${companyFilter}`, {
      method: 'GET',
      headers: {
        'Authorization': `token ${this.apiKey}:${this.apiSecret}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get delivery notes: ${response.statusText}`);
    }

    return response.json();
  }

  async getPurchaseOrders(filters?: any, company?: string): Promise<any> {
    let filterString = '';
    if (filters) {
      filterString = '&filters=' + encodeURIComponent(JSON.stringify(filters));
    }
  
    let companyFilter = '';
    if (company) {
      companyFilter = `&company=${encodeURIComponent(company)}`;
    }
  
    const response = await fetch(`${this.baseURL}/api/resource/Purchase Order?limit_page_length=500${filterString}${companyFilter}`, {
      method: 'GET',
      headers: {
        'Authorization': `token ${this.apiKey}:${this.apiSecret}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get purchase orders: ${response.statusText}`);
    }

    return response.json();
  }

  async getPurchaseReceipts(filters?: any, company?: string): Promise<any> {
    let filterString = '';
    if (filters) {
      filterString = '&filters=' + encodeURIComponent(JSON.stringify(filters));
    }
  
    let companyFilter = '';
    if (company) {
      companyFilter = `&company=${encodeURIComponent(company)}`;
    }
  
    const response = await fetch(`${this.baseURL}/api/resource/Purchase Receipt?limit_page_length=500${filterString}${companyFilter}`, {
      method: 'GET',
      headers: {
        'Authorization': `token ${this.apiKey}:${this.apiSecret}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get purchase receipts: ${response.statusText}`);
    }

    return response.json();
  }

  async getMaterialRequests(filters?: any, company?: string): Promise<any> {
    let filterString = '';
    if (filters) {
      filterString = '&filters=' + encodeURIComponent(JSON.stringify(filters));
    }
  
    let companyFilter = '';
    if (company) {
      companyFilter = `&company=${encodeURIComponent(company)}`;
    }
  
    const response = await fetch(`${this.baseURL}/api/resource/Material Request?limit_page_length=500${filterString}${companyFilter}`, {
      method: 'GET',
      headers: {
        'Authorization': `token ${this.apiKey}:${this.apiSecret}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get material requests: ${response.statusText}`);
    }

    return response.json();
  }

  async getStockEntries(filters?: any, company?: string): Promise<any> {
    let filterString = '';
    if (filters) {
      filterString = '&filters=' + encodeURIComponent(JSON.stringify(filters));
    }
  
    let companyFilter = '';
    if (company) {
      companyFilter = `&company=${encodeURIComponent(company)}`;
    }
  
    const response = await fetch(`${this.baseURL}/api/resource/Stock Entry?limit_page_length=500${filterString}${companyFilter}`, {
      method: 'GET',
      headers: {
        'Authorization': `token ${this.apiKey}:${this.apiSecret}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get stock entries: ${response.statusText}`);
    }

    return response.json();
  }

  async getPickLists(filters?: any, company?: string): Promise<any> {
    let filterString = '';
    if (filters) {
      filterString = '&filters=' + encodeURIComponent(JSON.stringify(filters));
    }
  
    let companyFilter = '';
    if (company) {
      companyFilter = `&company=${encodeURIComponent(company)}`;
    }
  
    const response = await fetch(`${this.baseURL}/api/resource/Pick List?limit_page_length=500${filterString}${companyFilter}`, {
      method: 'GET',
      headers: {
        'Authorization': `token ${this.apiKey}:${this.apiSecret}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get pick lists: ${response.statusText}`);
    }

    return response.json();
  }

  async getPackingSlips(filters?: any, company?: string): Promise<any> {
    let filterString = '';
    if (filters) {
      filterString = '&filters=' + encodeURIComponent(JSON.stringify(filters));
    }
  
    let companyFilter = '';
    if (company) {
      companyFilter = `&company=${encodeURIComponent(company)}`;
    }
  
    const response = await fetch(`${this.baseURL}/api/resource/Packing Slip?limit_page_length=500${filterString}${companyFilter}`, {
      method: 'GET',
      headers: {
        'Authorization': `token ${this.apiKey}:${this.apiSecret}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get packing slips: ${response.statusText}`);
    }

    return response.json();
  }

  async getQualityInspections(filters?: any, company?: string): Promise<any> {
    let filterString = '';
    if (filters) {
      filterString = '&filters=' + encodeURIComponent(JSON.stringify(filters));
    }
  
    let companyFilter = '';
    if (company) {
      companyFilter = `&company=${encodeURIComponent(company)}`;
    }
  
    const response = await fetch(`${this.baseURL}/api/resource/Quality Inspection?limit_page_length=500${filterString}${companyFilter}`, {
      method: 'GET',
      headers: {
        'Authorization': `token ${this.apiKey}:${this.apiSecret}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get quality inspections: ${response.statusText}`);
    }

    return response.json();
  }

  async getProductBundles(filters?: any, company?: string): Promise<any> {
    let filterString = '';
    if (filters) {
      filterString = '&filters=' + encodeURIComponent(JSON.stringify(filters));
    }
  
    let companyFilter = '';
    if (company) {
      companyFilter = `&company=${encodeURIComponent(company)}`;
    }
  
    const response = await fetch(`${this.baseURL}/api/resource/Product Bundle?limit_page_length=500${filterString}${companyFilter}`, {
      method: 'GET',
      headers: {
        'Authorization': `token ${this.apiKey}:${this.apiSecret}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get product bundles: ${response.statusText}`);
    }

    return response.json();
  }

  async createBatch(batchData: {
    batch_id: string;
    item: string;
    manufacturing_date?: string;
    expiry_date?: string;
  }): Promise<any> {
    console.log('Creating new batch:', batchData);
    
    const company = await getUserDefaultCompany();
    
    const data = {
      batch_id: batchData.batch_id,
      item: batchData.item,
      manufacturing_date: batchData.manufacturing_date || new Date().toISOString().split('T')[0],
      expiry_date: batchData.expiry_date,
      company: company || ''
    };

    console.log('Formatted batch data for creation:', data);

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
      throw new Error(`Failed to create batch: ${response.statusText} - ${errorText}`);
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
    
    const company = await getUserDefaultCompany();
    
    const data = {
      serial_no: serialData.serial_no,
      item_code: serialData.item_code,
      warehouse: serialData.warehouse,
      company: company || '',
      status: 'Active'
    };

    console.log('Formatted serial data for creation:', data);

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
      throw new Error(`Failed to create serial number: ${response.statusText} - ${errorText}`);
    }

    const result = await response.json();
    console.log('Serial number created successfully:', result);
    return result;
  }

  async validateBatch(batchNo: string, itemCode: string): Promise<boolean> {
    if (!batchNo || !itemCode) return true;
    
    try {
      console.log('Validating batch:', batchNo, 'for item:', itemCode);
      
      // Check if batch exists
      const response = await fetch(`${this.baseURL}/api/resource/Batch/${batchNo}`, {
        headers: {
          'Authorization': `token ${this.apiKey}:${this.apiSecret}`,
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        const batch = await response.json();
        console.log('Batch found:', batch);
        const isValid = batch.data.item === itemCode;
        console.log('Batch validation result:', isValid);
        return isValid;
      } else if (response.status === 404) {
        // Batch doesn't exist, create it
        console.log('Batch not found, creating new batch:', batchNo);
        await this.createBatch({
          batch_id: batchNo,
          item: itemCode
        });
        console.log('Batch created successfully');
        return true;
      } else {
        console.error('Batch validation failed with status:', response.status);
        return false;
      }
    } catch (error) {
      console.error('Batch validation/creation error:', error);
      // Try to create the batch if validation fails
      try {
        console.log('Attempting to create batch after validation error');
        await this.createBatch({
          batch_id: batchNo,
          item: itemCode
        });
        console.log('Batch created successfully after error');
        return true;
      } catch (createError) {
        console.error('Failed to create batch after validation error:', createError);
        return false;
      }
    }
  }

  async validateSerial(serialNo: string, itemCode: string, warehouse?: string): Promise<boolean> {
    if (!serialNo || !itemCode) return true;
    
    try {
      console.log('Validating serial:', serialNo, 'for item:', itemCode);
      
      // Check if serial exists
      const response = await fetch(`${this.baseURL}/api/resource/Serial No/${serialNo}`, {
        headers: {
          'Authorization': `token ${this.apiKey}:${this.apiSecret}`,
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        const serial = await response.json();
        console.log('Serial found:', serial);
        const isValid = serial.data.item_code === itemCode;
        console.log('Serial validation result:', isValid);
        return isValid;
      } else if (response.status === 404) {
        // Serial doesn't exist, create it
        console.log('Serial not found, creating new serial:', serialNo);
        await this.createSerialNo({
          serial_no: serialNo,
          item_code: itemCode,
          warehouse: warehouse
        });
        console.log('Serial created successfully');
        return true;
      } else {
        console.error('Serial validation failed with status:', response.status);
        return false;
      }
    } catch (error) {
      console.error('Serial validation/creation error:', error);
      // Try to create the serial if validation fails
      try {
        console.log('Attempting to create serial after validation error');
        await this.createSerialNo({
          serial_no: serialNo,
          item_code: itemCode,
          warehouse: warehouse
        });
        console.log('Serial created successfully after error');
        return true;
      } catch (createError) {
        console.error('Failed to create serial after validation error:', createError);
        return false;
      }
    }
  }

  async createStockReconciliation(data: {
    purpose: string;
    set_warehouse: string;
    company: string;
    posting_date: string;
    posting_time: string;
    use_serial_batch_fields?: number;
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

  async updateStockReconciliation(name: string, data: { 
    use_serial_batch_fields?: number;
    items: StockReconciliationItem[] 
  }) {
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

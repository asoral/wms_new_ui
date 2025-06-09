
import { getAccessToken } from './authService';
import { offlineStorage } from './offlineStorage';

interface ERPNextConfig {
  baseURL: string;
  apiKey: string;
  apiSecret: string;
}

interface ERPNextResponse<T> {
  data: T;
  message?: string;
}

interface Item {
  item_code: string;
  item_name: string;
  stock_uom: string;
  has_batch_no?: number;
  has_serial_no?: number;
}

interface Warehouse {
  name: string;
  is_group: number;
  warehouse_name?: string;
}

interface StockBalance {
  item_code: string;
  warehouse: string;
  actual_qty: number;
}

interface SalesOrder {
  name: string;
  customer: string;
  customer_name?: string;
  company: string;
  base_grand_total: number;
  grand_total?: number;
  currency: string;
  status: string;
  delivery_date?: string;
  transaction_date?: string;
  items?: any[];
}

interface DeliveryNote {
  name: string;
  customer: string;
  company: string;
  grand_total: number;
  currency: string;
  status: string;
}

interface PurchaseOrder {
  name: string;
  supplier: string;
  supplier_name?: string;
  schedule_date?: string;
  transaction_date?: string;
  grand_total?: number;
  status?: string;
  items?: any[];
  company: string;
  base_grand_total: number;
  currency: string;
}

interface PurchaseReceipt {
  name: string;
  supplier: string;
  company: string;
  grand_total: number;
  currency: string;
  status: string;
}

interface MaterialRequest {
  name: string;
  company: string;
  material_request_type: string;
  status: string;
}

interface StockEntry {
  name: string;
  company: string;
  purpose: string;
  status: string;
}

interface PickList {
  name: string;
  company: string;
  status: string;
}

interface PackingSlip {
  name: string;
  customer: string;
  company: string;
  status: string;
}

interface QualityInspection {
  name: string;
  company: string;
  status: string;
}

interface ProductBundle {
  name: string;
  product_bundle_id: string;
  description: string;
}

interface Company {
  name: string;
  company_name: string;
}

let erpnextConfig: ERPNextConfig | null = null;

export const configureERPNextAPI = (config: ERPNextConfig) => {
  erpnextConfig = config;
};

export const createERPNextAPI = async (): Promise<ERPNextAPI | null> => {
  if (!erpnextConfig) {
    console.warn('ERPNext API not configured. Call configureERPNextAPI first.');
    return null;
  }

  const accessToken = await getAccessToken();
  if (!accessToken) {
    console.warn('Access token not available. Ensure user is authenticated.');
    return null;
  }

  return new ERPNextAPI(erpnextConfig.baseURL, erpnextConfig.apiKey, erpnextConfig.apiSecret);
};

export const getUserDefaultCompany = async (): Promise<string | null> => {
  try {
    const erpnextAPI = await createERPNextAPI();
    if (!erpnextAPI) {
      console.error('ERPNext API not configured');
      return null;
    }

    const userDetails = await erpnextAPI.getLoggedInUserDetails();
    if (userDetails && userDetails.data && userDetails.data.defaults && userDetails.data.defaults.company) {
      return userDetails.data.defaults.company;
    } else {
      console.warn('Unable to retrieve default company from user details.');
      return null;
    }
  } catch (error) {
    console.error('Error fetching user details:', error);
    return null;
  }
};

class ERPNextAPI {
  constructor(public baseURL: string, public apiKey: string, public apiSecret: string) {
    this.baseURL = baseURL;
    this.apiKey = apiKey;
    this.apiSecret = apiSecret;
  }

  private getHeaders() {
    return {
      'Authorization': `token ${this.apiKey}:${this.apiSecret}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseURL}/api/method/frappe.auth.get_logged_in_user_details`, {
        headers: this.getHeaders(),
      });
      return response.ok;
    } catch (error) {
      console.error('Connection test failed:', error);
      return false;
    }
  }

  async getLoggedInUserDetails(): Promise<ERPNextResponse<any>> {
    const response = await fetch(`${this.baseURL}/api/method/frappe.auth.get_logged_in_user_details`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch user details: ${response.statusText}`);
    }

    return response.json();
  }

  async getCompanies(): Promise<ERPNextResponse<Company[]>> {
    const response = await fetch(`${this.baseURL}/api/resource/Company`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch companies: ${response.statusText}`);
    }

    return response.json();
  }

  async getItemByBarcode(barcode: string): Promise<ERPNextResponse<Item[]>> {
    const params = new URLSearchParams({
      fields: '["item_code", "item_name", "stock_uom", "has_batch_no", "has_serial_no"]',
      filters: JSON.stringify({ barcode: barcode }),
    });

    const response = await fetch(`${this.baseURL}/api/resource/Item?${params}`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch item by barcode: ${response.statusText}`);
    }

    return response.json();
  }

  async getItemDetails(itemCode: string): Promise<ERPNextResponse<Item>> {
    const response = await fetch(`${this.baseURL}/api/resource/Item/${encodeURIComponent(itemCode)}`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch item details: ${response.statusText}`);
    }

    return response.json();
  }

  async getItems(filters?: any, searchTerm?: string, company?: string): Promise<ERPNextResponse<Item[]>> {
    const params = new URLSearchParams();
    
    // Always filter for stock items only in stock count context
    const stockItemFilters = {
      is_stock_item: 1,
      ...filters
    };
    
    if (stockItemFilters) {
      params.append('filters', JSON.stringify(stockItemFilters));
    }
    if (searchTerm) {
      params.append('or_filters', JSON.stringify([
        { item_code: ['like', `%${searchTerm}%`] },
        { item_name: ['like', `%${searchTerm}%`] }
      ]));
    }
    if (company) {
      params.append('company', company);
    }

    const response = await fetch(`${this.baseURL}/api/resource/Item?${params}`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch items: ${response.statusText}`);
    }

    return response.json();
  }

  async searchItems(searchTerm: string, company?: string, limit: number = 20): Promise<ERPNextResponse<Item[]>> {
    return this.getItems(undefined, searchTerm, company);
  }

  async getItemsPaginated(filters?: any, fields?: string[], company?: string, limit: number = 20, page: number = 1): Promise<ERPNextResponse<Item[]>> {
    const params = new URLSearchParams();
    
    const stockItemFilters = {
      is_stock_item: 1,
      ...filters
    };
    
    if (stockItemFilters) {
      params.append('filters', JSON.stringify(stockItemFilters));
    }
    if (fields) {
      params.append('fields', JSON.stringify(fields));
    }
    if (company) {
      params.append('company', company);
    }
    params.append('limit', limit.toString());
    params.append('offset', ((page - 1) * limit).toString());

    const response = await fetch(`${this.baseURL}/api/resource/Item?${params}`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch items: ${response.statusText}`);
    }

    return response.json();
  }

  async getWarehouses(filters?: any, company?: string): Promise<ERPNextResponse<Warehouse[]>> {
    const params = new URLSearchParams();
    
    // Always filter for leaf warehouses only (is_group = 0)
    const warehouseFilters = {
      is_group: 0,
      ...filters
    };
    
    if (warehouseFilters) {
      params.append('filters', JSON.stringify(warehouseFilters));
    }
    if (company) {
      params.append('company', company);
    }

    const response = await fetch(`${this.baseURL}/api/resource/Warehouse?${params}`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch warehouses: ${response.statusText}`);
    }

    return response.json();
  }

  async getCurrentStock(itemCode: string, warehouse: string, batch?: string, serial?: string): Promise<number> {
    let filters: any = {
      item_code: itemCode,
      warehouse: warehouse
    };

    if (batch) {
      filters.batch_no = batch;
    }

    if (serial) {
      filters.serial_no = serial;
    }

    const params = new URLSearchParams({
      fields: '["actual_qty"]',
      filters: JSON.stringify(filters)
    });

    const response = await fetch(`${this.baseURL}/api/resource/Stock Balance?${params}`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch stock balance: ${response.statusText}`);
    }

    const result = await response.json() as ERPNextResponse<StockBalance[]>;

    if (Array.isArray(result.data) && result.data.length > 0) {
      return result.data[0].actual_qty;
    } else {
      return 0;
    }
  }

  async getStockBalance(filters?: any, company?: string): Promise<ERPNextResponse<StockBalance[]>> {
    const params = new URLSearchParams();
    if (filters) {
      params.append('filters', JSON.stringify(filters));
    }
    if (company) {
      params.append('company', company);
    }

    const response = await fetch(`${this.baseURL}/api/resource/Stock Balance?${params}`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch stock balance: ${response.statusText}`);
    }

    return response.json();
  }

  async getSalesOrders(filters?: any, company?: string): Promise<ERPNextResponse<SalesOrder[]>> {
    const params = new URLSearchParams();
    if (filters) {
      params.append('filters', JSON.stringify(filters));
    }
    if (company) {
      params.append('company', company);
    }

    const response = await fetch(`${this.baseURL}/api/resource/Sales Order?${params}`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch sales orders: ${response.statusText}`);
    }

    return response.json();
  }

  async getSalesOrder(salesOrderName: string): Promise<ERPNextResponse<SalesOrder>> {
    const response = await fetch(`${this.baseURL}/api/resource/Sales Order/${encodeURIComponent(salesOrderName)}`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch sales order: ${response.statusText}`);
    }

    return response.json();
  }

  async getDeliveryNotes(filters?: any, company?: string): Promise<ERPNextResponse<DeliveryNote[]>> {
    const params = new URLSearchParams();
    if (filters) {
      params.append('filters', JSON.stringify(filters));
    }
    if (company) {
      params.append('company', company);
    }

    const response = await fetch(`${this.baseURL}/api/resource/Delivery Note?${params}`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch delivery notes: ${response.statusText}`);
    }

    return response.json();
  }

  async getPurchaseOrders(filters?: any, company?: string): Promise<ERPNextResponse<PurchaseOrder[]>> {
    const params = new URLSearchParams();
    if (filters) {
      params.append('filters', JSON.stringify(filters));
    }
    if (company) {
      params.append('company', company);
    }

    const response = await fetch(`${this.baseURL}/api/resource/Purchase Order?${params}`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch purchase orders: ${response.statusText}`);
    }

    return response.json();
  }

  async getPurchaseOrder(purchaseOrderName: string): Promise<ERPNextResponse<PurchaseOrder>> {
    const response = await fetch(`${this.baseURL}/api/resource/Purchase Order/${encodeURIComponent(purchaseOrderName)}`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch purchase order: ${response.statusText}`);
    }

    return response.json();
  }

  async getPurchaseReceipts(filters?: any, company?: string): Promise<ERPNextResponse<PurchaseReceipt[]>> {
    const params = new URLSearchParams();
    if (filters) {
      params.append('filters', JSON.stringify(filters));
    }
    if (company) {
      params.append('company', company);
    }

    const response = await fetch(`${this.baseURL}/api/resource/Purchase Receipt?${params}`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch purchase receipts: ${response.statusText}`);
    }

    return response.json();
  }

  async createPurchaseReceipt(data: any): Promise<ERPNextResponse<any>> {
    const response = await fetch(`${this.baseURL}/api/resource/Purchase Receipt`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to create Purchase Receipt:', errorText);
      throw new Error(`Failed to create Purchase Receipt: ${response.statusText}`);
    }

    return response.json();
  }

  async getMaterialRequests(filters?: any, company?: string): Promise<ERPNextResponse<MaterialRequest[]>> {
    const params = new URLSearchParams();
    if (filters) {
      params.append('filters', JSON.stringify(filters));
    }
    if (company) {
      params.append('company', company);
    }

    const response = await fetch(`${this.baseURL}/api/resource/Material Request?${params}`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch material requests: ${response.statusText}`);
    }

    return response.json();
  }

  async getStockEntries(filters?: any, company?: string): Promise<ERPNextResponse<StockEntry[]>> {
    const params = new URLSearchParams();
    if (filters) {
      params.append('filters', JSON.stringify(filters));
    }
    if (company) {
      params.append('company', company);
    }

    const response = await fetch(`${this.baseURL}/api/resource/Stock Entry?${params}`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch stock entries: ${response.statusText}`);
    }

    return response.json();
  }

  async getPickLists(filters?: any, company?: string): Promise<ERPNextResponse<PickList[]>> {
    const params = new URLSearchParams();
    if (filters) {
      params.append('filters', JSON.stringify(filters));
    }
    if (company) {
      params.append('company', company);
    }

    const response = await fetch(`${this.baseURL}/api/resource/Pick List?${params}`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch pick lists: ${response.statusText}`);
    }

    return response.json();
  }

  async getPackingSlips(filters?: any, company?: string): Promise<ERPNextResponse<PackingSlip[]>> {
    const params = new URLSearchParams();
    if (filters) {
      params.append('filters', JSON.stringify(filters));
    }
    if (company) {
      params.append('company', company);
    }

    const response = await fetch(`${this.baseURL}/api/resource/Packing Slip?${params}`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch packing slips: ${response.statusText}`);
    }

    return response.json();
  }

  async getQualityInspections(filters?: any, company?: string): Promise<ERPNextResponse<QualityInspection[]>> {
    const params = new URLSearchParams();
    if (filters) {
      params.append('filters', JSON.stringify(filters));
    }
    if (company) {
      params.append('company', company);
    }

    const response = await fetch(`${this.baseURL}/api/resource/Quality Inspection?${params}`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch quality inspections: ${response.statusText}`);
    }

    return response.json();
  }

  async getProductBundles(filters?: any, company?: string): Promise<ERPNextResponse<ProductBundle[]>> {
    const params = new URLSearchParams();
    if (filters) {
      params.append('filters', JSON.stringify(filters));
    }
    if (company) {
      params.append('company', company);
    }

    const response = await fetch(`${this.baseURL}/api/resource/Product Bundle?${params}`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch product bundles: ${response.statusText}`);
    }

    return response.json();
  }

  async getStockAgingReport(filters?: any): Promise<ERPNextResponse<any[]>> {
    const params = new URLSearchParams();
    if (filters) {
      params.append('filters', JSON.stringify(filters));
    }

    const response = await fetch(`${this.baseURL}/api/method/erpnext.stock.report.stock_ageing.stock_ageing.execute?${params}`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch stock aging report: ${response.statusText}`);
    }

    return response.json();
  }

  async createStockReconciliation(data: any): Promise<ERPNextResponse<any>> {
    const response = await fetch(`${this.baseURL}/api/resource/Stock Reconciliation`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to create Stock Reconciliation:', errorText);
      throw new Error(`Failed to create Stock Reconciliation: ${response.statusText}`);
    }

    return response.json();
  }

  async updateStockReconciliation(name: string, data: any): Promise<ERPNextResponse<any>> {
    const response = await fetch(`${this.baseURL}/api/resource/Stock Reconciliation/${name}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to update Stock Reconciliation:', errorText);
      throw new Error(`Failed to update Stock Reconciliation: ${response.statusText}`);
    }

    return response.json();
  }

  async validateBatch(batchNo: string, itemCode: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseURL}/api/method/erpnext.stock.doctype.batch.batch.create_new_batch`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          batch_id: batchNo,
          item_code: itemCode
        })
      });

      if (response.ok) {
        const result = await response.json();
        return result.message === "Batch Created";
      } else {
        console.error('Failed to create/validate batch:', response.statusText);
        return false;
      }
    } catch (error) {
      console.error('Error creating/validating batch:', error);
      return false;
    }
  }

  async validateSerial(serialNo: string, itemCode: string, warehouse: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseURL}/api/method/erpnext.stock.doctype.serial_no.serial_no.create_new_serial_no`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          serial_no: serialNo,
          item_code: itemCode,
          warehouse: warehouse
        })
      });

      if (response.ok) {
        const result = await response.json();
        return result.message === "Serial No Created";
      } else {
        console.error('Failed to create/validate serial:', response.statusText);
        return false;
      }
    } catch (error) {
      console.error('Error creating/validating serial:', error);
      return false;
    }
  }
}

// Export both default and named export for compatibility
export { ERPNextAPI };
export default ERPNextAPI;

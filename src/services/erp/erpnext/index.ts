import { ERPNextItemsAPI } from './itemsApi';
import { ERPNextStockAPI } from './stockApi';
import { ERPNextPurchaseAPI } from './purchaseApi';
import { ERPNextSalesAPI } from './salesApi';
import { ERPNextWarehouseAPI } from './warehouseApi';
import { ERPNextResponse } from './types';

export class ERPNextAPI extends ERPNextItemsAPI {
  private stockAPI: ERPNextStockAPI;
  private purchaseAPI: ERPNextPurchaseAPI;
  private salesAPI: ERPNextSalesAPI;
  private warehouseAPI: ERPNextWarehouseAPI;

  constructor(baseURL: string, apiKey: string, apiSecret: string) {
    super(baseURL, apiKey, apiSecret);
    this.stockAPI = new ERPNextStockAPI(baseURL, apiKey, apiSecret);
    this.purchaseAPI = new ERPNextPurchaseAPI(baseURL, apiKey, apiSecret);
    this.salesAPI = new ERPNextSalesAPI(baseURL, apiKey, apiSecret);
    this.warehouseAPI = new ERPNextWarehouseAPI(baseURL, apiKey, apiSecret);
  }

  // Stock API methods
  async getStockBalance(filters?: any[], company?: string) {
    return this.stockAPI.getStockBalance(filters, company);
  }

  async getBinStock(itemCode: string, warehouse?: string) {
    return this.stockAPI.getBinStock(itemCode, warehouse);
  }

  async getStockLedger(filters?: any[], company?: string) {
    return this.stockAPI.getStockLedger(filters, company);
  }

  async createStockEntry(data: any) {
    return this.stockAPI.createStockEntry(data);
  }

  async getStockEntries(filters?: any[], company?: string) {
    return this.stockAPI.getStockEntries(filters, company);
  }

  // Purchase API methods
  async getPurchaseOrders(filters?: any, company?: string) {
    return this.purchaseAPI.getPurchaseOrders(filters, company);
  }

  async getPurchaseOrder(name: string) {
    return this.purchaseAPI.getPurchaseOrder(name);
  }

  async getPurchaseReceipts(filters?: any[], company?: string) {
    return this.purchaseAPI.getPurchaseReceipts(filters, company);
  }

  async getPurchaseReceipt(name: string) {
    return this.purchaseAPI.getPurchaseReceipt(name);
  }

  async createPurchaseReceipt(data: any) {
    return this.purchaseAPI.createPurchaseReceipt(data);
  }

  async updatePurchaseReceipt(name: string, data: any) {
    return this.purchaseAPI.updatePurchaseReceipt(name, data);
  }

  async submitPurchaseReceipt(name: string) {
    return this.purchaseAPI.submitPurchaseReceipt(name);
  }

  async deletePurchaseReceipt(name: string) {
    return this.purchaseAPI.deletePurchaseReceipt(name);
  }

  // Sales API methods
  async getSalesOrders(filters?: any, company?: string) {
    return this.salesAPI.getSalesOrders(filters, company);
  }

  async getSalesOrder(name: string) {
    return this.salesAPI.getSalesOrder(name);
  }

  async getDeliveryNotes(filters?: any[], company?: string) {
    return this.salesAPI.getDeliveryNotes(filters, company);
  }

  async getDeliveryNote(name: string) {
    return this.salesAPI.getDeliveryNote(name);
  }

  async createDeliveryNote(data: any) {
    return this.salesAPI.createDeliveryNote(data);
  }

  async updateDeliveryNote(name: string, data: any) {
    return this.salesAPI.updateDeliveryNote(name, data);
  }

  async submitDeliveryNote(name: string) {
    return this.salesAPI.submitDeliveryNote(name);
  }

  async deleteDeliveryNote(name: string) {
    return this.salesAPI.deleteDeliveryNote(name);
  }

  // Warehouse API methods
  async getWarehouses(filters?: any, company?: string) {
    return this.warehouseAPI.getWarehouses(filters, company);
  }

  async getWarehouse(name: string) {
    return this.warehouseAPI.getWarehouse(name);
  }

  // Company API methods
  async getCompanies(): Promise<ERPNextResponse<any[]>> {
    const response = await fetch(
      `${this.baseURL}/api/resource/Company`,
      { headers: this.getHeaders() }
    );
    
    if (!response.ok) {
      throw new Error(`Failed to fetch companies: ${response.statusText}`);
    }

    const result = await response.json();
    return { data: result.data || [] };
  }

  async getCompany(name: string): Promise<ERPNextResponse<any>> {
    const response = await fetch(
      `${this.baseURL}/api/resource/Company/${encodeURIComponent(name)}`,
      { headers: this.getHeaders() }
    );
    
    if (!response.ok) {
      throw new Error(`Failed to fetch company: ${response.statusText}`);
    }

    const result = await response.json();
    return { data: result.data };
  }

  // Stock Reconciliation methods
  async getStockReconciliations(filters?: any[], company?: string): Promise<ERPNextResponse<any[]>> {
    const conditions: string[][] = [];
    
    if (filters && Array.isArray(filters)) {
      conditions.push(...filters);
    }
    
    if (company) {
      conditions.push(['company', '=', company]);
    }

    const params = new URLSearchParams();
    if (conditions.length > 0) {
      params.append('filters', JSON.stringify(conditions));
    }
    params.append('fields', JSON.stringify(['name', 'posting_date', 'expense_account', 'company']));

    const response = await fetch(
      `${this.baseURL}/api/resource/Stock Reconciliation?${params.toString()}`,
      { headers: this.getHeaders() }
    );
    
    if (!response.ok) {
      throw new Error(`Failed to fetch stock reconciliations: ${response.statusText}`);
    }

    const result = await response.json();
    return { data: result.data || [] };
  }

  async createStockReconciliation(data: any): Promise<ERPNextResponse<any>> {
    const response = await fetch(
      `${this.baseURL}/api/resource/Stock Reconciliation`,
      {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(data)
      }
    );
    
    if (!response.ok) {
      throw new Error(`Failed to create stock reconciliation: ${response.statusText}`);
    }

    const result = await response.json();
    return { data: result.data };
  }

  async submitStockReconciliation(name: string): Promise<ERPNextResponse<any>> {
    const response = await fetch(
      `${this.baseURL}/api/resource/Stock Reconciliation/${encodeURIComponent(name)}`,
      {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify({ docstatus: 1 })
      }
    );
    
    if (!response.ok) {
      throw new Error(`Failed to submit stock reconciliation: ${response.statusText}`);
    }

    const result = await response.json();
    return { data: result.data };
  }

  // Test connection method
  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(
        `${this.baseURL}/api/method/frappe.auth.get_logged_user`,
        { headers: this.getHeaders() }
      );
      return response.ok;
    } catch (error) {
      console.error('Connection test failed:', error);
      return false;
    }
  }

  // Generic method to call any ERPNext API
  async callAPI(method: string, params?: any): Promise<ERPNextResponse<any>> {
    const url = params 
      ? `${this.baseURL}/api/method/${method}?${new URLSearchParams(params).toString()}`
      : `${this.baseURL}/api/method/${method}`;

    const response = await fetch(url, { headers: this.getHeaders() });
    
    if (!response.ok) {
      throw new Error(`API call failed: ${response.statusText}`);
    }

    const result = await response.json();
    return { data: result.message || result.data };
  }
}

// Re-export types for convenience
export * from './types';


import { ERPNextBaseAPI } from './baseApi';
import { ERPNextResponse, StockBalance, StockEntry } from './types';

export class ERPNextStockAPI extends ERPNextBaseAPI {
  async getStockBalance(filters?: any, company?: string): Promise<ERPNextResponse<StockBalance[]>> {
    let finalFilters = this.convertToFrappeFilters(filters);
    if (company) {
      finalFilters.push(['company', '=', company]);
    }
    
    const params = this.buildQueryParams(finalFilters, undefined, 1000);

    const response = await fetch(`${this.baseURL}/api/resource/Bin?${params}`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch stock balance: ${response.statusText}`);
    }

    return response.json();
  }

  async getBinStock(filters?: any): Promise<ERPNextResponse<any[]>> {
    let finalFilters = this.convertToFrappeFilters(filters);
    
    const params = this.buildQueryParams(finalFilters, undefined, 1000);

    const response = await fetch(`${this.baseURL}/api/resource/Bin?${params}`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch bin stock: ${response.statusText}`);
    }

    return response.json();
  }

  async getCurrentStock(itemCode: string, warehouse: string, batch?: string, serial?: string): Promise<ERPNextResponse<any>> {
    const filters = [
      ['item_code', '=', itemCode],
      ['warehouse', '=', warehouse]
    ];

    if (batch) {
      filters.push(['batch_no', '=', batch]);
    }
    if (serial) {
      filters.push(['serial_no', '=', serial]);
    }

    const params = this.buildQueryParams(filters);

    const response = await fetch(`${this.baseURL}/api/resource/Bin?${params}`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch current stock: ${response.statusText}`);
    }

    return response.json();
  }

  async getStockLedgerEntries(filters?: any, company?: string): Promise<ERPNextResponse<any[]>> {
    let finalFilters = this.convertToFrappeFilters(filters);
    if (company) {
      finalFilters.push(['company', '=', company]);
    }
    
    const params = this.buildQueryParams(finalFilters);

    const response = await fetch(`${this.baseURL}/api/resource/Stock Ledger Entry?${params}`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch stock ledger entries: ${response.statusText}`);
    }

    return response.json();
  }

  async getStockAgingReport(filters?: any): Promise<ERPNextResponse<any[]>> {
    const params = new URLSearchParams({
      cmd: 'erpnext.stock.report.stock_ageing.stock_ageing.execute',
      filters: JSON.stringify(filters || {})
    });

    const response = await fetch(`${this.baseURL}/api/method/frappe.desk.query_report.run?${params}`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch stock aging report: ${response.statusText}`);
    }

    return response.json();
  }

  async getStockEntries(filters?: any, company?: string, limitPageLength?: number): Promise<ERPNextResponse<StockEntry[]>> {
    let finalFilters = this.convertToFrappeFilters(filters);
    if (company) {
      finalFilters.push(['company', '=', company]);
    }
    
    const params = this.buildQueryParams(finalFilters, undefined, limitPageLength);

    const response = await fetch(`${this.baseURL}/api/resource/Stock Entry?${params}`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch stock entries: ${response.statusText}`);
    }

    return response.json();
  }

  async createStockReconciliation(reconciliationData: any): Promise<ERPNextResponse<any>> {
    const response = await fetch(`${this.baseURL}/api/resource/Stock Reconciliation`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(reconciliationData),
    });

    if (!response.ok) {
      throw new Error(`Failed to create stock reconciliation: ${response.statusText}`);
    }

    return response.json();
  }

  async updateStockReconciliation(name: string, reconciliationData: any): Promise<ERPNextResponse<any>> {
    const response = await fetch(`${this.baseURL}/api/resource/Stock Reconciliation/${name}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(reconciliationData),
    });

    if (!response.ok) {
      throw new Error(`Failed to update stock reconciliation: ${response.statusText}`);
    }

    return response.json();
  }
}

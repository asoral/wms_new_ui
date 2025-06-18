
import { ERPNextBaseAPI } from './baseApi';
import { ERPNextResponse, StockBalance, StockEntry } from './types';

export class ERPNextStockAPI extends ERPNextBaseAPI {
  /**
   * Fetch stock balance with optional filters
   */
  async getStockBalance(
    filters: Record<string, any> = {},
    company?: string
  ): Promise<ERPNextResponse<StockBalance[]>> {
    const conditions: any[] = this.convertToFrappeFilters(filters);
    if (company) {
      conditions.push(['company', '=', company]);
    }

    const params = new URLSearchParams();
    params.append('filters', JSON.stringify(conditions));

    const response = await fetch(
      `${this.baseURL}/api/resource/Stock Balance?${params.toString()}`,
      { headers: this.getHeaders() }
    );
    if (!response.ok) {
      throw new Error(`Failed to fetch stock balance: ${response.statusText}`);
    }
    return response.json();
  }

  /**
   * Fetch bin stock data
   */
  async getBinStock(filters: Record<string, any> = {}): Promise<ERPNextResponse<any[]>> {
    const conditions: any[] = this.convertToFrappeFilters(filters);

    const params = new URLSearchParams();
    params.append('filters', JSON.stringify(conditions));

    const response = await fetch(
      `${this.baseURL}/api/resource/Bin?${params.toString()}`,
      { headers: this.getHeaders() }
    );
    if (!response.ok) {
      throw new Error(`Failed to fetch bin stock: ${response.statusText}`);
    }
    return response.json();
  }

  /**
   * Get current stock for a specific item, warehouse, batch, and serial
   */
  async getCurrentStock(
    itemCode: string,
    warehouse: string,
    batch?: string,
    serial?: string
  ): Promise<ERPNextResponse<any>> {
    const params = new URLSearchParams();
    params.append('item_code', itemCode);
    params.append('warehouse', warehouse);
    if (batch) params.append('batch_no', batch);
    if (serial) params.append('serial_no', serial);

    const response = await fetch(
      `${this.baseURL}/api/method/erpnext.stock.utils.get_stock_balance?${params.toString()}`,
      { headers: this.getHeaders() }
    );
    if (!response.ok) {
      throw new Error(`Failed to fetch current stock: ${response.statusText}`);
    }
    return response.json();
  }

  /**
   * Fetch stock ledger entries
   */
  async getStockLedgerEntries(
    filters: Record<string, any> = {},
    company?: string
  ): Promise<ERPNextResponse<any[]>> {
    const conditions: any[] = this.convertToFrappeFilters(filters);
    if (company) {
      conditions.push(['company', '=', company]);
    }

    const params = new URLSearchParams();
    params.append('filters', JSON.stringify(conditions));

    const response = await fetch(
      `${this.baseURL}/api/resource/Stock Ledger Entry?${params.toString()}`,
      { headers: this.getHeaders() }
    );
    if (!response.ok) {
      throw new Error(`Failed to fetch stock ledger entries: ${response.statusText}`);
    }
    return response.json();
  }

  /**
   * Get stock aging report
   */
  async getStockAgingReport(filters: Record<string, any> = {}): Promise<ERPNextResponse<any[]>> {
    const params = new URLSearchParams();
    
    // Add filters to params
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        params.append(key, String(value));
      }
    });

    const response = await fetch(
      `${this.baseURL}/api/method/erpnext.stock.report.stock_ageing.stock_ageing.execute?${params.toString()}`,
      { headers: this.getHeaders() }
    );
    
    if (!response.ok) {
      throw new Error(`Failed to fetch stock aging report: ${response.statusText}`);
    }
    
    const result = await response.json();
    
    // Handle the response format from stock aging report
    if (result.message && Array.isArray(result.message)) {
      return {
        data: result.message,
        message: result.message || 'Stock aging report fetched successfully'
      };
    }
    
    return result;
  }

  /**
   * Fetch stock entries with optional filters
   */
  async getStockEntries(
    filters: Record<string, any> = {},
    company?: string,
    limitPageLength: number = 20
  ): Promise<ERPNextResponse<StockEntry[]>> {
    const conditions: any[] = this.convertToFrappeFilters(filters);
    if (company) {
      conditions.push(['company', '=', company]);
    }

    const params = new URLSearchParams();
    params.append('filters', JSON.stringify(conditions));
    params.append('limit_page_length', String(limitPageLength));

    const response = await fetch(
      `${this.baseURL}/api/resource/Stock Entry?${params.toString()}`,
      { headers: this.getHeaders() }
    );
    if (!response.ok) {
      throw new Error(`Failed to fetch stock entries: ${response.statusText}`);
    }
    return response.json();
  }

  /**
   * Create a new Stock Reconciliation
   */
  async createStockReconciliation(reconciliationData: any): Promise<ERPNextResponse<any>> {
    const response = await fetch(
      `${this.baseURL}/api/resource/Stock Reconciliation`,
      {
        method: 'POST',
        headers: {
          ...this.getHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(reconciliationData)
      }
    );
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to create stock reconciliation: ${response.status} ${response.statusText} - ${errorText}`);
    }
    return response.json();
  }

  /**
   * Update an existing Stock Reconciliation
   */
  async updateStockReconciliation(name: string, reconciliationData: any): Promise<ERPNextResponse<any>> {
    const response = await fetch(
      `${this.baseURL}/api/resource/Stock Reconciliation/${encodeURIComponent(name)}`,
      {
        method: 'PUT',
        headers: {
          ...this.getHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(reconciliationData)
      }
    );
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to update stock reconciliation: ${response.status} ${response.statusText} - ${errorText}`);
    }
    return response.json();
  }
}

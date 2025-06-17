
import { ERPNextBaseAPI } from './baseApi';
import { APIResponse, StockBalanceItem, StockLedgerEntry, BinStockItem } from './types';

export class ERPNextStockAPI extends ERPNextBaseAPI {
  /**
   * Get stock balance for multiple items in specific warehouses
   */
  async getStockBalance(
    filters?: any,
    company?: string
  ): Promise<APIResponse<StockBalanceItem[]>> {
    try {
      let endpoint = `${this.baseURL}/api/resource/Stock Ledger Entry`;
      const params = new URLSearchParams();

      if (filters) {
        params.append('filters', JSON.stringify(filters));
      }
      if (company) {
        params.append('company', company);
      }

      const response = await fetch(`${endpoint}?${params.toString()}`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      return this.handleResponse(response);
    } catch (error) {
      console.error('Error fetching stock balance:', error);
      throw error;
    }
  }

  /**
   * Get bin stock information
   */
  async getBinStock(itemCode: string, warehouse: string): Promise<APIResponse<BinStockItem[]>> {
    try {
      const filters = [
        ['item_code', '=', itemCode],
        ['warehouse', '=', warehouse]
      ];
      
      const params = new URLSearchParams({
        filters: JSON.stringify(filters),
        fields: JSON.stringify(['item_code', 'warehouse', 'actual_qty', 'reserved_qty', 'projected_qty'])
      });

      const response = await fetch(`${this.baseURL}/api/resource/Bin?${params.toString()}`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      return this.handleResponse(response);
    } catch (error) {
      console.error('Error fetching bin stock:', error);
      throw error;
    }
  }

  /**
   * Get current stock for an item
   */
  async getCurrentStock(itemCode: string, warehouse?: string): Promise<APIResponse<any>> {
    try {
      const filters = [['item_code', '=', itemCode]];
      if (warehouse) {
        filters.push(['warehouse', '=', warehouse]);
      }

      const params = new URLSearchParams({
        filters: JSON.stringify(filters)
      });

      const response = await fetch(`${this.baseURL}/api/resource/Stock Ledger Entry?${params.toString()}`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      return this.handleResponse(response);
    } catch (error) {
      console.error('Error fetching current stock:', error);
      throw error;
    }
  }

  /**
   * Get stock ledger entries
   */
  async getStockLedgerEntries(filters?: any, limit?: number, offset?: number): Promise<APIResponse<StockLedgerEntry[]>> {
    try {
      const params = new URLSearchParams();
      
      if (filters) {
        params.append('filters', JSON.stringify(filters));
      }
      if (limit) {
        params.append('limit_page_length', limit.toString());
      }
      if (offset) {
        params.append('limit_start', offset.toString());
      }

      const response = await fetch(`${this.baseURL}/api/resource/Stock Ledger Entry?${params.toString()}`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      return this.handleResponse(response);
    } catch (error) {
      console.error('Error fetching stock ledger entries:', error);
      throw error;
    }
  }

  /**
   * Create stock entry
   */
  async createStockEntry(entryData: any): Promise<APIResponse<any>> {
    try {
      const response = await fetch(`${this.baseURL}/api/resource/Stock Entry`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(entryData),
      });

      return this.handleResponse(response);
    } catch (error) {
      console.error('Error creating stock entry:', error);
      throw error;
    }
  }

  /**
   * Get available stock
   */
  async getAvailableStock(itemCode: string, warehouse: string, posting_date?: string): Promise<APIResponse<any>> {
    try {
      const params = new URLSearchParams({
        item_code: itemCode,
        warehouse: warehouse
      });
      
      if (posting_date) {
        params.append('posting_date', posting_date);
      }

      const response = await fetch(`${this.baseURL}/api/method/frappe.stock.get_item_details.get_available_qty?${params.toString()}`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      return this.handleResponse(response);
    } catch (error) {
      console.error('Error fetching available stock:', error);
      throw error;
    }
  }

  /**
   * Get stock summary
   */
  async getStockSummary(company?: string, warehouse?: string, item_group?: string): Promise<APIResponse<any>> {
    try {
      const params = new URLSearchParams();
      
      if (company) params.append('company', company);
      if (warehouse) params.append('warehouse', warehouse);
      if (item_group) params.append('item_group', item_group);

      const response = await fetch(`${this.baseURL}/api/method/erpnext.stock.dashboard.item_dashboard.get_data?${params.toString()}`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      return this.handleResponse(response);
    } catch (error) {
      console.error('Error fetching stock summary:', error);
      throw error;
    }
  }

  /**
   * Get stock entries
   */
  async getStockEntries(filters?: any, company?: string, limitPageLength?: number): Promise<APIResponse<any[]>> {
    try {
      const params = new URLSearchParams();
      
      if (filters) {
        params.append('filters', JSON.stringify(filters));
      }
      if (company) {
        params.append('company', company);
      }
      if (limitPageLength) {
        params.append('limit_page_length', limitPageLength.toString());
      }

      const response = await fetch(`${this.baseURL}/api/resource/Stock Entry?${params.toString()}`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      return this.handleResponse(response);
    } catch (error) {
      console.error('Error fetching stock entries:', error);
      throw error;
    }
  }

  /**
   * Get stock aging report
   */
  async getStockAgingReport(filters?: any): Promise<APIResponse<any[]>> {
    try {
      const params = new URLSearchParams();
      
      if (filters) {
        params.append('filters', JSON.stringify(filters));
      }

      const response = await fetch(`${this.baseURL}/api/method/erpnext.stock.report.stock_ageing.stock_ageing.execute?${params.toString()}`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      return this.handleResponse(response);
    } catch (error) {
      console.error('Error fetching stock aging report:', error);
      throw error;
    }
  }

  /**
   * Create stock reconciliation
   */
  async createStockReconciliation(reconciliationData: any): Promise<APIResponse<any>> {
    try {
      const response = await fetch(`${this.baseURL}/api/resource/Stock Reconciliation`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(reconciliationData),
      });

      return this.handleResponse(response);
    } catch (error) {
      console.error('Error creating stock reconciliation:', error);
      throw error;
    }
  }

  /**
   * Update stock reconciliation
   */
  async updateStockReconciliation(name: string, reconciliationData: any): Promise<APIResponse<any>> {
    try {
      const response = await fetch(`${this.baseURL}/api/resource/Stock Reconciliation/${name}`, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify(reconciliationData),
      });

      return this.handleResponse(response);
    } catch (error) {
      console.error('Error updating stock reconciliation:', error);
      throw error;
    }
  }
}

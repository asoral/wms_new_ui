
import { ERPNextBaseAPI } from './baseApi';
import { ERPNextResponse } from './types';

export interface StockBalanceItem {
  item_code: string;
  warehouse: string;
  actual_qty: number;
  valuation_rate?: number;
  stock_value?: number;
  stock_uom?: string;
}

export interface APIResponse<T> {
  data: T;
  message?: string;
}

export class ERPNextStockAPI extends ERPNextBaseAPI {
  /**
   * Get stock balance for a specific item across all warehouses
   */
  async getItemStockBalance(itemCode: string): Promise<APIResponse<StockBalanceItem[]>> {
    try {
      const params = new URLSearchParams({
        item_code: itemCode
      });

      const response = await fetch(
        `${this.baseURL}/api/method/erpnext.stock.utils.get_stock_balance?${params.toString()}`,
        { headers: this.getHeaders() }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch stock balance: ${response.statusText}`);
      }

      const result = await response.json();
      return {
        data: result.message || [],
        message: result.message || null
      };
    } catch (error) {
      console.error('Error fetching stock balance:', error);
      throw error;
    }
  }

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
        headers: this.getHeaders()
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch stock balance: ${response.statusText}`);
      }

      const result = await response.json();
      return {
        data: result.data || [],
        message: result.message || null
      };
    } catch (error) {
      console.error('Error fetching stock balance:', error);
      throw error;
    }
  }

  /**
   * Get current stock levels for an item
   */
  async getCurrentStock(itemCode: string, warehouse?: string): Promise<APIResponse<StockBalanceItem[]>> {
    try {
      const params = new URLSearchParams({
        item_code: itemCode
      });

      if (warehouse) {
        params.append('warehouse', warehouse);
      }

      const response = await fetch(
        `${this.baseURL}/api/method/erpnext.stock.utils.get_stock_balance?${params.toString()}`,
        { headers: this.getHeaders() }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch current stock: ${response.statusText}`);
      }

      const result = await response.json();
      return {
        data: result.message || [],
        message: result.message || null
      };
    } catch (error) {
      console.error('Error fetching current stock:', error);
      throw error;
    }
  }

  /**
   * Get bin-wise stock for an item
   */
  async getBinStock(itemCode: string, warehouse: string): Promise<APIResponse<any[]>> {
    try {
      const params = new URLSearchParams();
      const filters = [
        ['item_code', '=', itemCode],
        ['warehouse', '=', warehouse]
      ];
      params.append('filters', JSON.stringify(filters));

      const response = await fetch(
        `${this.baseURL}/api/resource/Bin?${params.toString()}`,
        { headers: this.getHeaders() }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch bin stock: ${response.statusText}`);
      }

      const result = await response.json();
      return {
        data: result.data || [],
        message: result.message || null
      };
    } catch (error) {
      console.error('Error fetching bin stock:', error);
      throw error;
    }
  }

  /**
   * Get stock ledger entries
   */
  async getStockLedgerEntries(
    filters: any = {},
    limit: number = 20,
    offset: number = 0
  ): Promise<APIResponse<any[]>> {
    try {
      const params = new URLSearchParams();
      if (Object.keys(filters).length > 0) {
        params.append('filters', JSON.stringify(filters));
      }
      params.append('limit_page_length', String(limit));
      params.append('limit_start', String(offset));

      const response = await fetch(
        `${this.baseURL}/api/resource/Stock Ledger Entry?${params.toString()}`,
        { headers: this.getHeaders() }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch stock ledger entries: ${response.statusText}`);
      }

      const result = await response.json();
      return {
        data: result.data || [],
        message: result.message || null
      };
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
      const response = await fetch(
        `${this.baseURL}/api/resource/Stock Entry`,
        {
          method: 'POST',
          headers: {
            ...this.getHeaders(),
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(entryData)
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to create stock entry: ${response.statusText}`);
      }

      const result = await response.json();
      return {
        data: result.data || result,
        message: result.message || null
      };
    } catch (error) {
      console.error('Error creating stock entry:', error);
      throw error;
    }
  }

  /**
   * Get available stock for item in warehouse
   */
  async getAvailableStock(
    itemCode: string,
    warehouse: string,
    posting_date?: string
  ): Promise<APIResponse<number>> {
    try {
      const params = new URLSearchParams({
        item_code: itemCode,
        warehouse: warehouse
      });

      if (posting_date) {
        params.append('posting_date', posting_date);
      }

      const response = await fetch(
        `${this.baseURL}/api/method/erpnext.stock.utils.get_latest_stock_qty?${params.toString()}`,
        { headers: this.getHeaders() }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch available stock: ${response.statusText}`);
      }

      const result = await response.json();
      return {
        data: result.message?.message?.[0]?.[1] || 0,
        message: result.message?.message ? `Stock: ${result.message.message[0][1]}` : null
      };
    } catch (error) {
      console.error('Error fetching available stock:', error);
      throw error;
    }
  }

  /**
   * Get stock summary report
   */
  async getStockSummary(
    company?: string,
    warehouse?: string,
    item_group?: string
  ): Promise<APIResponse<any[]>> {
    try {
      const params = new URLSearchParams();
      const filters: any[] = [];

      if (company) {
        filters.push(['company', '=', company]);
      }
      if (warehouse) {
        filters.push(['warehouse', '=', warehouse]);
      }
      if (item_group) {
        filters.push(['item_group', '=', item_group]);
      }

      if (filters.length > 0) {
        params.append('filters', JSON.stringify(filters));
      }

      const response = await fetch(
        `${this.baseURL}/api/method/erpnext.stock.report.stock_summary.stock_summary.execute?${params.toString()}`,
        { headers: this.getHeaders() }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch stock summary: ${response.statusText}`);
      }

      const result = await response.json();
      const message = result.message;
      
      return {
        data: message && message.result ? message.result : [],
        message: message && message.columns ? `Columns: ${message.columns.length}` : null
      };
    } catch (error) {
      console.error('Error fetching stock summary:', error);
      throw error;
    }
  }
}

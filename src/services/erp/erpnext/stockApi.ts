import { ERPNextBaseAPI } from './baseApi';
import { ERPNextResponse, Item, StockBalance, StockEntry, Warehouse } from './types';
import { ERPNextItemsAPI } from './itemsApi';

export class ERPNextStockAPI extends ERPNextBaseAPI {
  private itemsAPI: ERPNextItemsAPI;

  constructor(baseURL: string, apiKey: string, apiSecret: string) {
    super(baseURL, apiKey, apiSecret);
    this.itemsAPI = new ERPNextItemsAPI(baseURL, apiKey, apiSecret);
  }

  // Delegate item-related methods to ItemsAPI
  async searchItems(query: string, company?: string, limit?: number) {
    return this.itemsAPI.searchItems(query, company, limit);
  }

  async searchItemsByBarcode(barcode: string) {
    return this.itemsAPI.searchItemsByBarcode(barcode);
  }

  async getItemsPaginated(filters?: any, fields?: string[], company?: string, limit?: number, page?: number) {
    return this.itemsAPI.getItemsPaginated(filters, fields, company, limit, page);
  }

  async getItemDetails(itemCode: string) {
    return this.itemsAPI.getItemDetails(itemCode);
  }

  async getItemByBarcode(barcode: string) {
    return this.itemsAPI.getItemByBarcode(barcode);
  }

  /**
   * Get items with filters
   */
  async getItems(
    filters: any[] | Record<string, any> = {},
    company?: string,
    limitPageLength?: number
  ): Promise<ERPNextResponse<Item[]>> {
    const conditions: any[] = [
      ['is_stock_item', '=', 1],
      ['disabled', '=', 0]
    ];

    // Handle filters properly - check if it's already in Frappe format or needs conversion
    if (Array.isArray(filters)) {
      // If filters is already an array of Frappe filters, add them directly
      conditions.push(...filters);
    } else if (filters && typeof filters === 'object') {
      // Convert object format to Frappe array format
      for (const [field, value] of Object.entries(filters)) {
        if (value !== undefined && value !== null) {
          conditions.push([field, '=', value]);
        }
      }
    }

    // Apply company filter if provided
    if (company) {
      conditions.push(['company', '=', company]);
    }

    const params = new URLSearchParams();
    params.append('filters', JSON.stringify(conditions));
    params.append('fields', JSON.stringify([
      'name',
      'item_code',
      'item_name',
      'stock_uom',
      'item_group',
      'description',
      'has_batch_no',
      'has_serial_no'
    ]));
    
    if (limitPageLength) {
      params.append('limit_page_length', String(limitPageLength));
    }

    const response = await fetch(
      `${this.baseURL}/api/resource/Item?${params.toString()}`,
      { headers: this.getHeaders() }
    );
    
    if (!response.ok) {
      throw new Error(`Failed to fetch items: ${response.statusText}`);
    }

    const result = await response.json();
    return { data: result.data || [] };
  }

  /**
   * Get stock balance for items
   */
  async getStockBalance(
    itemCode?: string,
    warehouse?: string
  ): Promise<ERPNextResponse<StockBalance[]>> {
    try {
      // Use the Stock Ledger Entry doctype instead of non-existent Stock Balance
      const conditions: any[] = [
        ['is_cancelled', '=', 0]
      ];

      if (itemCode) {
        conditions.push(['item_code', '=', itemCode]);
      }
      if (warehouse) {
        conditions.push(['warehouse', '=', warehouse]);
      }

      const params = new URLSearchParams();
      params.append('filters', JSON.stringify(conditions));
      params.append('fields', JSON.stringify([
        'item_code',
        'warehouse', 
        'actual_qty',
        'valuation_rate',
        'stock_value',
        'stock_uom'
      ]));
      params.append('limit_page_length', '1000');

      const response = await fetch(
        `${this.baseURL}/api/resource/Stock Ledger Entry?${params.toString()}`,
        { headers: this.getHeaders() }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch stock balance: ${response.statusText}`);
      }

      const result = await response.json();
      
      // Group by item_code and warehouse to get current balance
      const stockMap = new Map();
      
      if (result.data) {
        result.data.forEach((entry: any) => {
          const key = `${entry.item_code}-${entry.warehouse}`;
          if (!stockMap.has(key) || new Date(entry.posting_date) > new Date(stockMap.get(key).posting_date)) {
            stockMap.set(key, {
              item_code: entry.item_code,
              warehouse: entry.warehouse,
              actual_qty: entry.actual_qty || 0,
              valuation_rate: entry.valuation_rate || 0,
              stock_value: entry.stock_value || 0,
              stock_uom: entry.stock_uom
            });
          }
        });
      }

      return { data: Array.from(stockMap.values()) };
    } catch (error) {
      console.error('Stock balance fetch error:', error);
      return { data: [] };
    }
  }

  /**
   * Get current stock for an item
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
      throw new Error(`Failed to get current stock: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get bin stock data
   */
  async getBinStock(
    itemCode?: string,
    warehouse?: string
  ): Promise<ERPNextResponse<any[]>> {
    try {
      const conditions: any[] = [];

      if (itemCode) {
        conditions.push(['item_code', '=', itemCode]);
      }
      if (warehouse) {
        conditions.push(['warehouse', '=', warehouse]);
      }

      const params = new URLSearchParams();
      if (conditions.length > 0) {
        params.append('filters', JSON.stringify(conditions));
      }
      params.append('fields', JSON.stringify([
        'item_code',
        'item_name',
        'warehouse',
        'actual_qty',
        'valuation_rate'
      ]));

      const response = await fetch(
        `${this.baseURL}/api/resource/Bin?${params.toString()}`,
        { headers: this.getHeaders() }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch bin stock: ${response.statusText}`);
      }

      const result = await response.json();
      return { data: result.data || [] };
    } catch (error) {
      console.error('Bin stock fetch error:', error);
      return { data: [] };
    }
  }

  async getStockEntries(
    filters: Record<string, any> = {},
    company?: string
  ): Promise<ERPNextResponse<StockEntry[]>> {
    const conditions: any[] = [];

    // Apply filters
    for (const [field, value] of Object.entries(filters)) {
      if (value !== undefined && value !== null) {
        conditions.push([field, '=', value]);
      }
    }

    // Apply company filter if provided
    if (company) {
      conditions.push(['company', '=', company]);
    }

    const params = new URLSearchParams();
    if (conditions.length > 0) {
      params.append('filters', JSON.stringify(conditions));
    }

    const response = await fetch(
      `${this.baseURL}/api/resource/Stock Entry?${params.toString()}`,
      { headers: this.getHeaders() }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch stock entries: ${response.statusText}`);
    }

    const result = await response.json();
    return { data: result.data || [] };
  }

  async getStockAgingReport(): Promise<ERPNextResponse<any>> {
    try {
      const filters = {
        company: 'Your Company', // This should be dynamic
        to_date: new Date().toISOString().split('T')[0]
      };

      return this.runReport('Stock Ageing', filters);
    } catch (error) {
      console.error('Stock aging report error:', error);
      return { data: [] };
    }
  }

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
      throw new Error(`Failed to create stock reconciliation: ${response.statusText}`);
    }

    return response.json();
  }

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
      throw new Error(`Failed to update stock reconciliation: ${response.statusText}`);
    }

    return response.json();
  }
}

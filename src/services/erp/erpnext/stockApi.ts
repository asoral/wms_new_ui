import { ERPNextBaseAPI } from './baseApi';
import { ERPNextResponse, StockBalance, StockEntry, Item } from './types';

export class ERPNextStockAPI extends ERPNextBaseAPI {
  /**
   * Fetch items with filters, pagination, and optional text search
   */
  async getItems(
    filters: Record<string, any> = {},
    company?: string,
    limitPageLength: number = 20
  ): Promise<ERPNextResponse<Item[]>> {
    const conditions: any[] = [
      ['is_stock_item', '=', 1],
      ['disabled', '=', 0]
    ];

    // Apply extra filters
    for (const [field, value] of Object.entries(filters)) {
      conditions.push([field, '=', value]);
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
      'has_batch_no',
      'has_serial_no'
    ]));
    params.append('limit_page_length', String(limitPageLength));

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
   * Search items by query string
   */
  async searchItems(query: string, company?: string, limit: number = 20): Promise<ERPNextResponse<Item[]>> {
    const params = new URLSearchParams();
    params.append('doctype', 'Item');
    params.append('txt', query);
    params.append('page_length', String(limit));
    params.append('filters', JSON.stringify([
      ['Item', 'disabled', '=', 0],
      ['Item', 'is_stock_item', '=', 1],
    ]));

    const response = await fetch(
      `${this.baseURL}/api/method/frappe.desk.search.search_link?${params.toString()}`,
      { headers: this.getHeaders() }
    );

    if (!response.ok) {
      throw new Error(`Failed to search items: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();

    if (!Array.isArray(result.message)) {
      throw new Error("Unexpected API response format");
    }

    const items: Item[] = await Promise.all(
      result.message.slice(0, limit).map(async (item) => {
        if (!item.value) {
          throw new Error("Invalid item data: Missing 'value'");
        }
        const details = await this.getItemDetails(item.value as string);
        return details.data;
      })
    );

    return { data: items };
  }

  /**
   * Search items by barcode
   */
  async searchItemsByBarcode(barcode: string): Promise<ERPNextResponse<Item[]>> {
    try {
      const itemResult = await this.getItemByBarcode(barcode);
      if (itemResult.data) {
        return { data: [itemResult.data] };
      }
      return { data: [] };
    } catch (error) {
      console.error('Barcode search failed:', error);
      return { data: [] };
    }
  }

  /**
   * Get items with pagination support
   */
  async getItemsPaginated(
    filters?: any,
    fields?: string[],
    company?: string,
    limit: number = 20,
    page: number = 1
  ): Promise<ERPNextResponse<Item[]>> {
    const conditions: any[] = [
      ['is_stock_item', '=', 1],
      ['disabled', '=', 0]
    ];

    // Apply extra filters
    if (filters) {
      for (const [field, value] of Object.entries(filters)) {
        conditions.push([field, '=', value]);
      }
    }

    // Apply company filter if provided
    if (company) {
      conditions.push(['company', '=', company]);
    }

    const params = new URLSearchParams();
    params.append('filters', JSON.stringify(conditions));
    params.append('fields', JSON.stringify(fields || [
      'name',
      'item_code',
      'item_name',
      'stock_uom',
      'has_batch_no',
      'has_serial_no'
    ]));
    params.append('limit_page_length', String(limit));
    params.append('limit_start', String((page - 1) * limit));

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
   * Fetch detailed item record
   */
  async getItemDetails(itemCode: string): Promise<ERPNextResponse<Item>> {
    const params = new URLSearchParams({
      fields: JSON.stringify([
        'name',
        'item_code',
        'item_name',
        'stock_uom',
        'has_batch_no',
        'has_serial_no',
        'barcodes',
        'description',
        'item_group',
        'image'
      ])
    });

    const response = await fetch(
      `${this.baseURL}/api/resource/Item/${encodeURIComponent(itemCode)}?${params.toString()}`,
      { headers: this.getHeaders() }
    );
    if (!response.ok) {
      throw new Error(`Failed to fetch item details: ${response.statusText}`);
    }

    const result = await response.json();
    return { data: result.data };
  }

  /**
   * Lookup an item by barcode
   */
  async getItemByBarcode(barcode: string): Promise<ERPNextResponse<Item | undefined>> {
    console.log('Fetching item by barcode:', barcode);
    try {
      const params = new URLSearchParams({
        fields: JSON.stringify([
          'name',
          'item_code',
          'item_name',
          'stock_uom',
          'has_batch_no',
          'has_serial_no',
          'barcodes'
        ]),
      });

      const response = await fetch(
        `${this.baseURL}/api/resource/Item/${encodeURIComponent(barcode)}?${params.toString()}`,
        { headers: this.getHeaders() }
      );

      if (!response.ok) {
        if (response.status === 404) {
          console.log('Item not found for barcode:', barcode);
          return { data: undefined };
        }
        throw new Error(`Failed to fetch item by barcode: ${response.statusText}`);
      }

      const result = await response.json();
      return { data: result.data || undefined };
    } catch (error) {
      console.error('Error in getItemByBarcode:', error);
      throw error;
    }
  }

  /**
   * Fetch stock balance with optional filters
   */
  async getStockBalance(
    itemCode?: string,
    warehouse?: string
  ): Promise<ERPNextResponse<StockBalance[]>> {
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
  async getBinStock(itemCode?: string, warehouse?: string): Promise<ERPNextResponse<any[]>> {
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

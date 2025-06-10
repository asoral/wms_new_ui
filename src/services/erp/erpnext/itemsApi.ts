import { ERPNextBaseAPI } from './baseApi';
import { ERPNextResponse, Item } from './types';

export class ERPNextItemsAPI extends ERPNextBaseAPI {
  /**
   * Search items by code or name using ERPNext's search_link endpoint
   */
  async searchItems(query: string, limit: number = 20): Promise<ERPNextResponse<Item[]>> {
    const params = new URLSearchParams();
    params.append('doctype', 'Item');
    params.append('txt', query);
    params.append('page_length', String(limit));  // always numeric
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
    // result.message is [[name, label], ...]
    const items: Item[] = await Promise.all(
      result.message.slice(0, limit).map(async ([name]) => {
        const details = await this.getItemDetails(name as string);
        return details.data;
      })
    );

    return { data: items };
  }

  /**
   * Fetch detailed item record, including batch/serial flags and barcodes
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
        'barcodes'
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
   * Lookup an item by barcode through the Item Barcode doctype
   */
  async getItemByBarcode(barcode: string): Promise<ERPNextResponse<Item>> {
    const params = new URLSearchParams();
    params.append('fields', JSON.stringify(['parent']));
    params.append('filters', JSON.stringify([['barcode', '=', barcode]]));

    const response = await fetch(
      `${this.baseURL}/api/resource/Item Barcode?${params.toString()}`,
      { headers: this.getHeaders() }
    );
    if (!response.ok) {
      throw new Error(`Failed to fetch barcode record: ${response.statusText}`);
    }

    const result = await response.json();
    if (!result.data || result.data.length === 0) {
      return { data: [] };
    }

    // Parent field contains the Item code
    return this.getItemDetails(result.data[0].parent);
  }

  /**
   * Fetch items with filters, pagination, and optional text search
   */
  async getItems(
    filters: Record<string, any> = {},
    searchText?: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<ERPNextResponse<Item[]>> {
    const conditions: any[] = [
      ['is_stock_item', '=', 1]
    ];

    // apply extra filters
    for (const [field, value] of Object.entries(filters)) {
      conditions.push([field, '=', value]);
    }
    // apply searchText filters
    if (searchText) {
      conditions.push(['item_code', 'like', `%${searchText}%`]);
      conditions.push(['item_name', 'like', `%${searchText}%`]);
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
    params.append('limit_page_length', String(limit));  // always numeric
    params.append('limit_start', String(offset));       // always numeric

    const response = await fetch(
      `${this.baseURL}/api/resource/Item?${params.toString()}`,
      { headers: this.getHeaders() }
    );
    if (!response.ok) {
      throw new Error(`Failed to fetch items: ${response.statusText}`);
    }

    const result = await response.json();
    return { data: result.data };
  }
}

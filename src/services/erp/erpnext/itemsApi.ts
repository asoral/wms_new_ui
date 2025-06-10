import { ERPNextBaseAPI } from './baseApi';
import { ERPNextResponse, Item } from './types';

export class ERPNextItemsAPI extends ERPNextBaseAPI {
  /**
   * Search items by code or name using ERPNext's search_link endpoint
   */
  async searchItems(query: string, limit: number = 20): Promise<ERPNextResponse<Item[]>> {
    const params = new URLSearchParams({
      doctype: 'Item',
      txt: query,
      page_length: limit.toString(),
      filters: JSON.stringify([['Item', 'disabled', '=', '0'], ['Item', 'is_stock_item', '=', '1']]),
    });

    const response = await fetch(`${this.baseURL}/api/method/frappe.desk.search.search_link?${params}`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to search items: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    // result.message contains an array of [name, label] tuples
    const items: Item[] = await Promise.all(
      result.message.slice(0, limit).map(async ([name]) => {
        const details = await this.getItemDetails(name as string);
        return details.data as Item;
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
      `${this.baseURL}/api/resource/Item/${encodeURIComponent(itemCode)}?${params}`,
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
    const params = new URLSearchParams({
      fields: JSON.stringify(['parent']),
      filters: JSON.stringify([['barcode', '=', barcode]])
    });

    const response = await fetch(
      `${this.baseURL}/api/resource/Item Barcode?${params}`,
      { headers: this.getHeaders() }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch barcode record: ${response.statusText}`);
    }

    const result = await response.json();
    if (!result.data || result.data.length === 0) {
      throw new Error(`No item found for barcode ${barcode}`);
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
    const conditions: any[] = [['is_stock_item', '=', '1']];
    Object.entries(filters).forEach(([field, val]) => {
      conditions.push([field, '=', val]);
    });
    if (searchText) {
      conditions.push(['item_code', 'like', `%${searchText}%`]);
      conditions.push(['item_name', 'like', `%${searchText}%`]);
    }

    const params = new URLSearchParams({
      filters: JSON.stringify(conditions),
      fields: JSON.stringify([
        'name',
        'item_code',
        'item_name',
        'stock_uom',
        'has_batch_no',
        'has_serial_no'
      ]),
      limit_page_length: limit.toString(),
      limit_start: offset.toString(),
    });

    const response = await fetch(
      `${this.baseURL}/api/resource/Item?${params}`,
      { headers: this.getHeaders() }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch items: ${response.statusText}`);
    }

    const result = await response.json();
    return { data: result.data };
  }
}

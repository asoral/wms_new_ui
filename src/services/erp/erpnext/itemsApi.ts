
import { ERPNextBaseAPI } from './baseApi';
import { ERPNextResponse, Item } from './types';

export class ERPNextItemsAPI extends ERPNextBaseAPI {
  /**
   * Search items by code or name using ERPNext's search_link endpoint
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
   * Search items by barcode
   */
  async searchItemsByBarcode(barcode: string): Promise<ERPNextResponse<Item[]>> {
    try {
      const itemResult = await this.getItemByBarcode(barcode);
      if (itemResult.data && !Array.isArray(itemResult.data)) {
        return { data: [itemResult.data] };
      }
      return { data: itemResult.data || [] };
    } catch (error) {
      console.error('Barcode search failed:', error);
      return { data: [] };
    }
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
  // async getItemByBarcode(barcode: string): Promise<ERPNextResponse<Item>> {
  //   const params = new URLSearchParams();
  //   params.append('fields', JSON.stringify(['parent']));
  //   params.append('filters', JSON.stringify([['barcode', '=', barcode]]));

  //   const response = await fetch(
  //     `${this.baseURL}/api/resource/Item Barcode?${params.toString()}`,
  //     { headers: this.getHeaders() }
  //   );
  //   if (!response.ok) {
  //     throw new Error(`Failed to fetch barcode record: ${response.statusText}`);
  //   }

  //   const result = await response.json();
  //   if (!result.data || result.data.length === 0) {
  //     return { data: [] };
  //   }

  //   // Parent field contains the Item code
  //   return this.getItemDetails(result.data[0].parent);
  // }
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
      console.log('API response status:', response.status);
  
      if (!response.ok) {
        if (response.status === 404) {
          console.log('Item not found for barcode:', barcode);
          return { data: undefined };
        }
        throw new Error(`Failed to fetch item by barcode: ${response.statusText}`);
      }
  
      const result = await response.json();
      console.log('API response data:', result);
      return { data: result.data|| undefined };
    } catch (error) {
      console.error('Error in getItemByBarcode:', error);
      throw error;
    }
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
    params.append('limit_page_length', String(limit));
    params.append('limit_start', String(offset));

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


import { ERPNextBaseAPI } from './baseApi';
import { ERPNextResponse, Item } from './types';

export class ERPNextItemsAPI extends ERPNextBaseAPI {

  /**
   * Search items using Frappe's search_link API
   */
  async searchItems(query: string, limit: number = 20): Promise<ERPNextResponse<Item[]>> {
    const params = new URLSearchParams();
    params.append('doctype', 'Item');
    params.append('txt', query);
    params.append('page_length', String(limit));
    params.append('filters', JSON.stringify([
      ['Item', 'disabled', '=', 0],
      ['Item', 'maintain_stock', '=', 1],
      ['Item', 'has_variants', '=', 0]
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
   * Get items with pagination support using proper Frappe filters
   */
  async getItemsPaginated(
    filters?: any,
    fields?: string[],
    limit: number = 20,
    page: number = 1
  ): Promise<ERPNextResponse<Item[]>> {
    const conditions: any[] = [
      ['disabled', '=', 0],
      ['maintain_stock', '=', 1],
      ['has_variants', '=', 0]
    ];

    // Apply extra filters if provided
    if (filters && Array.isArray(filters)) {
      conditions.push(...filters);
    }

    const params = new URLSearchParams();
    params.append('filters', JSON.stringify(conditions));
    params.append('fields', JSON.stringify(fields || [
      'name',
      'item_code',
      'item_name',
      'stock_uom',
      'has_batch_no',
      'has_serial_no',
      'item_group'
    ]));
    params.append('limit_page_length', String(limit));
    params.append('limit_start', String((page - 1) * limit));

    console.log('Fetching items with filters:', conditions);
    console.log('API URL:', `${this.baseURL}/api/resource/Item?${params.toString()}`);

    const response = await fetch(
      `${this.baseURL}/api/resource/Item?${params.toString()}`,
      { headers: this.getHeaders() }
    );
    
    if (!response.ok) {
      throw new Error(`Failed to fetch items: ${response.statusText}`);
    }

    const result = await response.json();
    console.log('Raw API response:', result);
    
    // Transform the data to ensure proper structure
    const transformedItems = (result.data || []).map((item: any) => ({
      name: item.name,
      item_code: item.item_code || item.name,
      item_name: item.item_name || item.item_code || item.name,
      stock_uom: item.stock_uom || 'Nos',
      has_batch_no: item.has_batch_no || false,
      has_serial_no: item.has_serial_no || false,
      item_group: item.item_group || 'All Item Groups'
    }));

    console.log('Transformed items:', transformedItems);
    return { data: transformedItems };
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
        'item_group',
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
    
    // Transform the data to ensure proper structure
    const transformedItem = {
      name: result.data.name,
      item_code: result.data.item_code || result.data.name,
      item_name: result.data.item_name || result.data.item_code || result.data.name,
      stock_uom: result.data.stock_uom || 'Nos',
      has_batch_no: result.data.has_batch_no || false,
      has_serial_no: result.data.has_serial_no || false,
      item_group: result.data.item_group || 'All Item Groups'
    };
    
    return { data: transformedItem };
  }

  /**
   * Lookup an item by barcode through direct item fetch
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
          'item_group',
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
      
      // Transform the data to ensure proper structure
      const transformedItem = {
        name: result.data.name,
        item_code: result.data.item_code || result.data.name,
        item_name: result.data.item_name || result.data.item_code || result.data.name,
        stock_uom: result.data.stock_uom || 'Nos',
        has_batch_no: result.data.has_batch_no || false,
        has_serial_no: result.data.has_serial_no || false,
        item_group: result.data.item_group || 'All Item Groups'
      };
      
      return { data: transformedItem };
    } catch (error) {
      console.error('Error in getItemByBarcode:', error);
      throw error;
    }
  }

  /**
   * Fetch items with proper filters - CORRECTED VERSION
   * Now properly constructs ERPNext/Frappe filter arrays
   */
  async getItems(
    filters: Record<string, any> = {},
    searchText?: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<ERPNextResponse<Item[]>> {
    
    // For text search, use the search_link API which handles OR logic properly
    if (searchText && searchText.trim()) {
      return this.searchItems(searchText.trim(), limit);
    }

    // Build base conditions as proper Frappe filter arrays
    const conditions: string[][] = [
      ['disabled', '=', '0'],
      ['maintain_stock', '=', '1'],
      ['has_variants', '=', '0']
    ];

    // Apply additional filters correctly - each as separate filter array
    for (const [field, value] of Object.entries(filters)) {
      conditions.push([field, '=', String(value)]);
    }

    const params = new URLSearchParams();
    params.append('filters', JSON.stringify(conditions));
    params.append('fields', JSON.stringify([
      'name',
      'item_code',
      'item_name',
      'stock_uom',
      'has_batch_no',
      'has_serial_no',
      'item_group'
    ]));
    params.append('limit_page_length', String(limit));
    params.append('limit_start', String(offset));

    console.log('Fetching items with conditions:', conditions);
    console.log('API URL:', `${this.baseURL}/api/resource/Item?${params.toString()}`);

    const response = await fetch(
      `${this.baseURL}/api/resource/Item?${params.toString()}`,
      { headers: this.getHeaders() }
    );
    
    if (!response.ok) {
      throw new Error(`Failed to fetch items: ${response.statusText}`);
    }

    const result = await response.json();
    
    // Transform the data to ensure proper structure
    const transformedItems = (result.data || []).map((item: any) => ({
      name: item.name,
      item_code: item.item_code || item.name,
      item_name: item.item_name || item.item_code || item.name,
      stock_uom: item.stock_uom || 'Nos',
      has_batch_no: item.has_batch_no || false,
      has_serial_no: item.has_serial_no || false,
      item_group: item.item_group || 'All Item Groups'
    }));

    return { data: transformedItems };
  }
}

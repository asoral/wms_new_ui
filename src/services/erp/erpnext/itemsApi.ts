
import { ERPNextBaseAPI } from './baseApi';
import { ERPNextResponse, Item } from './types';

export class ERPNextItemsAPI extends ERPNextBaseAPI {

  /**
   * Get company details including currency
   */
  async getCompanyDetails(companyName: string): Promise<ERPNextResponse<any>> {
    const response = await fetch(
      `${this.baseURL}/api/resource/Company/${encodeURIComponent(companyName)}`,
      { headers: this.getHeaders() }
    );
    
    if (!response.ok) {
      throw new Error(`Failed to fetch company details: ${response.statusText}`);
    }

    const result = await response.json();
    return { data: result.data };
  }

  /**
   * Search items using Frappe's search_link API - SIMPLIFIED VERSION
   */
  async searchItems(query: string, limit: number = 20): Promise<ERPNextResponse<Item[]>> {
    const params = new URLSearchParams();
    params.append('doctype', 'Item');
    params.append('txt', query);
    params.append('page_length', String(limit));
    // Only use basic filters that definitely exist
    params.append('filters', JSON.stringify([
      ['disabled', '=', 0],
      ['is_stock_item', '=', 1] // Only show stock items
    ]));
  
    console.log('Search API URL:', `${this.baseURL}/api/method/frappe.desk.search.search_link?${params.toString()}`);

    const response = await fetch(
      `${this.baseURL}/api/method/frappe.desk.search.search_link?${params.toString()}`,
      { headers: this.getHeaders() }
    );
  
    if (!response.ok) {
      throw new Error(`Failed to search items: ${response.status} ${response.statusText}`);
    }
  
    const result = await response.json();
    console.log('Search API response:', result);
  
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
   * Get items with pagination support - SIMPLIFIED VERSION
   */
  async getItemsPaginated(
    filters?: any,
    fields?: string[],
    limit: number = 20,
    page: number = 1
  ): Promise<ERPNextResponse<Item[]>> {
    // Basic conditions that should exist in all ERPNext instances
    const conditions: string[][] = [
      ['disabled', '=', '0'],
      ['is_stock_item', '=', '1'] // Only show stock items
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
      'item_group',
      'has_batch_no',
      'has_serial_no'
    ]));
    params.append('limit_page_length', String(limit));
    params.append('limit_start', String((page - 1) * limit));

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
   * Fetch detailed item record with tracking information
   */
  async getItemDetails(itemCode: string): Promise<ERPNextResponse<Item>> {
    const params = new URLSearchParams({
      fields: JSON.stringify([
        'name',
        'item_code',
        'item_name',
        'stock_uom',
        'item_group',
        'has_batch_no',
        'has_serial_no',
        'has_variants'
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
      item_group: result.data.item_group || 'All Item Groups',
      has_variants: result.data.has_variants || false
    };
    
    return { data: transformedItem };
  }

  /**
   * Lookup an item by barcode using ERPNext search API
   */
  async getItemByBarcode(barcode: string): Promise<ERPNextResponse<Item | undefined>> {
    console.log('Fetching item by barcode:', barcode);
    try {
      // Use ERPNext's search_link API to find items by barcode
      // This searches through the barcodes child table without needing direct access
      const searchParams = new URLSearchParams();
      searchParams.append('doctype', 'Item');
      searchParams.append('txt', barcode);
      searchParams.append('query', 'erpnext.controllers.queries.item_query');
      searchParams.append('searchfield', 'barcodes.barcode');
      
      console.log('Searching items by barcode using search_link API:', `${this.baseURL}/api/method/frappe.desk.search.search_link?${searchParams.toString()}`);
      
      const searchResponse = await fetch(
        `${this.baseURL}/api/method/frappe.desk.search.search_link?${searchParams.toString()}`,
        { headers: this.getHeaders() }
      );
      
      if (searchResponse.ok) {
        const searchResult = await searchResponse.json();
        console.log('Search result:', searchResult);
        
        if (searchResult.message && searchResult.message.length > 0) {
          // Found item(s), get the first one's details
          const itemCode = searchResult.message[0].value;
          console.log('Found item code from barcode search:', itemCode);
          
          return this.getItemDetails(itemCode);
        }
      }
      
      // Alternative approach: use the item query with barcode filter
      console.log('Search API failed, trying item query with barcode filter');
      const params = new URLSearchParams();
      params.append('filters', JSON.stringify([
        ['Item', 'barcodes', 'like', `%${barcode}%`]
      ]));
      params.append('fields', JSON.stringify([
        'name',
        'item_code',
        'item_name',
        'stock_uom',
        'item_group',
        'has_batch_no',
        'has_serial_no'
      ]));
      params.append('limit_page_length', '1');
      
      const queryResponse = await fetch(
        `${this.baseURL}/api/resource/Item?${params.toString()}`,
        { headers: this.getHeaders() }
      );
      
      if (queryResponse.ok) {
        const queryResult = await queryResponse.json();
        console.log('Item query result:', queryResult);
        
        if (queryResult.data && queryResult.data.length > 0) {
          const item = queryResult.data[0];
          const transformedItem = {
            name: item.name,
            item_code: item.item_code || item.name,
            item_name: item.item_name || item.item_code || item.name,
            stock_uom: item.stock_uom || 'Nos',
            has_batch_no: item.has_batch_no || false,
            has_serial_no: item.has_serial_no || false,
            item_group: item.item_group || 'All Item Groups'
          };
          
          return { data: transformedItem };
        }
      }
      
      // Final fallback: try direct item lookup (in case barcode matches item code)
      console.log('No item found with barcode filter, trying direct item lookup');
      const directParams = new URLSearchParams({
        fields: JSON.stringify([
          'name',
          'item_code',
          'item_name',
          'stock_uom',
          'item_group',
          'has_batch_no',
          'has_serial_no'
        ]),
      });
  
      const directResponse = await fetch(
        `${this.baseURL}/api/resource/Item/${encodeURIComponent(barcode)}?${directParams.toString()}`,
        { headers: this.getHeaders() }
      );
      console.log('Direct item lookup response status:', directResponse.status);
  
      if (!directResponse.ok) {
        if (directResponse.status === 404) {
          console.log('Item not found for barcode:', barcode);
          return { data: undefined };
        }
        throw new Error(`Failed to fetch item by barcode: ${directResponse.statusText}`);
      }
  
      const directResult = await directResponse.json();
      console.log('Direct item lookup response data:', directResult);
      
      // Transform the data to ensure proper structure
      const transformedItem = {
        name: directResult.data.name,
        item_code: directResult.data.item_code || directResult.data.name,
        item_name: directResult.data.item_name || directResult.data.item_code || directResult.data.name,
        stock_uom: directResult.data.stock_uom || 'Nos',
        has_batch_no: directResult.data.has_batch_no || false,
        has_serial_no: directResult.data.has_serial_no || false,
        item_group: directResult.data.item_group || 'All Item Groups'
      };
      
      return { data: transformedItem };
    } catch (error) {
      console.error('Error in getItemByBarcode:', error);
      throw error;
    }
  }

  /**
   * Fetch items with proper filters - SIMPLIFIED VERSION without problematic fields
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

    // Build base conditions as proper Frappe filter arrays - only basic filters
    const conditions: string[][] = [
      ['disabled', '=', '0'],
      ['is_stock_item', '=', '1'] // Only show stock items
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
      'item_group',
      'has_batch_no',
      'has_serial_no'
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

  /**
   * Get all variants of a template item
   */
  async getItemVariants(templateItem: string): Promise<ERPNextResponse<Item[]>> {
    console.log('Fetching variants for template item:', templateItem);
    
    const conditions: string[][] = [
      ['disabled', '=', '0'],
      ['is_stock_item', '=', '1'],
      ['variant_of', '=', templateItem]
    ];

    const params = new URLSearchParams();
    params.append('filters', JSON.stringify(conditions));
    params.append('fields', JSON.stringify([
      'name',
      'item_code',
      'item_name',
      'stock_uom',
      'item_group',
      'has_batch_no',
      'has_serial_no',
      'variant_of'
    ]));

    console.log('Fetching variants with URL:', `${this.baseURL}/api/resource/Item?${params.toString()}`);

    const response = await fetch(
      `${this.baseURL}/api/resource/Item?${params.toString()}`,
      { headers: this.getHeaders() }
    );
    
    if (!response.ok) {
      throw new Error(`Failed to fetch item variants: ${response.statusText}`);
    }

    const result = await response.json();
    console.log('Variants API response:', result);
    
    // Transform the data to ensure proper structure
    const transformedItems = (result.data || []).map((item: any) => ({
      name: item.name,
      item_code: item.item_code || item.name,
      item_name: item.item_name || item.item_code || item.name,
      stock_uom: item.stock_uom || 'Nos',
      has_batch_no: item.has_batch_no || false,
      has_serial_no: item.has_serial_no || false,
      item_group: item.item_group || 'All Item Groups',
      variant_of: item.variant_of
    }));

    console.log('Transformed variants:', transformedItems);
    return { data: transformedItems };
  }
}

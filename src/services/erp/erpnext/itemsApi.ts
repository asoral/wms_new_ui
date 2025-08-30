
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
   * Lookup an item by barcode using Resource API for Item Barcode child table
   */
  async getItemByBarcode(barcode: string): Promise<ERPNextResponse<Item | undefined>> {
    console.log('=== Starting barcode search for:', barcode);
    
    try {
      // Method 1: Direct Resource API call to Item Barcode child table
      console.log('Method 1: Accessing Item Barcode resource directly');
      const barcodeParams = new URLSearchParams();
      barcodeParams.append('filters', JSON.stringify([
        ['barcode', '=', barcode]
      ]));
      barcodeParams.append('fields', JSON.stringify(['parent', 'barcode']));
      barcodeParams.append('limit_page_length', '1');
      
      const barcodeUrl = `${this.baseURL}/api/resource/Item%20Barcode?${barcodeParams.toString()}`;
      console.log('Item Barcode resource URL:', barcodeUrl);
      
      const barcodeResponse = await fetch(barcodeUrl, { headers: this.getHeaders() });
      console.log('Item Barcode resource response status:', barcodeResponse.status);
      
      if (barcodeResponse.ok) {
        const barcodeResult = await barcodeResponse.json();
        console.log('Item Barcode resource result:', barcodeResult);
        
        if (barcodeResult.data && barcodeResult.data.length > 0) {
          const parentItemCode = barcodeResult.data[0].parent;
          console.log('Found parent item code from barcode:', parentItemCode);
          return this.getItemDetails(parentItemCode);
        }
      } else {
        const errorText = await barcodeResponse.text();
        console.log('Item Barcode resource error:', barcodeResponse.status, errorText);
      }
      
      // Method 2: Try using the database query approach
      console.log('Method 2: Trying database query via method call');
      const dbQueryResponse = await fetch(
        `${this.baseURL}/api/method/frappe.desk.query_report.run`,
        {
          method: 'POST',
          headers: {
            ...this.getHeaders(),
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            report_name: 'Stock Balance',
            filters: {
              item_code: barcode // Try treating barcode as item_code first
            }
          })
        }
      );
      
      console.log('DB query response status:', dbQueryResponse.status);
      
      if (dbQueryResponse.ok) {
        const dbQueryResult = await dbQueryResponse.json();
        console.log('DB query result:', dbQueryResult);
        
        if (dbQueryResult.message && dbQueryResult.message.result && dbQueryResult.message.result.length > 0) {
          const itemCode = dbQueryResult.message.result[0][0]; // First column should be item_code
          console.log('Found item code from DB query:', itemCode);
          return this.getItemDetails(itemCode);
        }
      } else {
        const errorText = await dbQueryResponse.text();
        console.log('DB query error:', dbQueryResponse.status, errorText);
      }
      
      // Method 3: Use frappe.client.get_value to find item by barcode
      console.log('Method 3: Using frappe.client.get_value');
      const getValueResponse = await fetch(
        `${this.baseURL}/api/method/frappe.client.get_value`,
        {
          method: 'POST',
          headers: {
            ...this.getHeaders(),
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            doctype: 'Item Barcode',
            filters: { barcode: barcode },
            fieldname: 'parent'
          })
        }
      );
      
      console.log('get_value response status:', getValueResponse.status);
      
      if (getValueResponse.ok) {
        const getValueResult = await getValueResponse.json();
        console.log('get_value result:', getValueResult);
        
        if (getValueResult.message && getValueResult.message.parent) {
          const parentItemCode = getValueResult.message.parent;
          console.log('Found parent item code via get_value:', parentItemCode);
          return this.getItemDetails(parentItemCode);
        }
      } else {
        const errorText = await getValueResponse.text();
        console.log('get_value error:', getValueResponse.status, errorText);
      }
      
      // Method 4: Try direct item code match as last resort
      console.log('Method 4: Trying direct item lookup (barcode as item_code)');
      try {
        const directResult = await this.getItemDetails(barcode);
        if (directResult.data) {
          console.log('Found item via direct lookup:', directResult.data);
          return directResult;
        }
      } catch (directError) {
        console.log('Direct lookup failed:', directError);
      }
      
      console.log('All barcode search methods failed for:', barcode);
      return { data: undefined };
      
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

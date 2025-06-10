
import { ERPNextBaseAPI } from './baseApi';
import { ERPNextResponse, Item } from './types';

export class ERPNextItemsAPI extends ERPNextBaseAPI {
  async searchItems(searchTerm: string, company?: string, limitPageLength: number = 20): Promise<ERPNextResponse<Item[]>> {
    try {
      // Use frappe search_link method for better search results
      const response = await fetch(`${this.baseURL}/api/method/frappe.desk.search.search_link`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          doctype: 'Item',
          txt: searchTerm,
          filters: {
            is_stock_item: 1,
            ...(company && { company: company })
          },
          page_len: limitPageLength
        })
      });

      if (!response.ok) {
        // Fallback to resource API if search_link fails
        return this.getItems({ item_code: ['like', `%${searchTerm}%`] }, searchTerm, company);
      }

      const result = await response.json();
      
      if (result.message && Array.isArray(result.message)) {
        const items = result.message.map((item: any) => ({
          item_code: item.value,
          item_name: item.description || item.value,
          stock_uom: 'Nos' // Default, will be enriched by getItemDetails if needed
        }));
        
        return { data: items };
      }
      
      return { data: [] };
    } catch (error) {
      console.error('Error searching items:', error);
      // Fallback to basic search
      return this.getItems({ item_code: ['like', `%${searchTerm}%`] }, searchTerm, company);
    }
  }

  async getItems(filters?: any, searchTerm?: string, company?: string): Promise<ERPNextResponse<Item[]>> {
    let finalFilters = [['is_stock_item', '=', '1']];
    if (filters) {
      finalFilters = [...finalFilters, ...this.convertToFrappeFilters(filters)];
    }
    if (company) {
      finalFilters.push(['company', '=', company]);
    }
    
    const params = this.buildQueryParams(finalFilters);
    
    if (searchTerm) {
      const orFilters = [
        ['item_code', 'like', `%${searchTerm}%`],
        ['item_name', 'like', `%${searchTerm}%`]
      ];
      params.append('or_filters', JSON.stringify(orFilters));
    }

    const response = await fetch(`${this.baseURL}/api/resource/Item?${params}`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch items: ${response.statusText}`);
    }

    return response.json();
  }

  async getItemsPaginated(filters?: any, fields?: string[], company?: string, limitPageLength: number = 20, page: number = 1): Promise<ERPNextResponse<Item[]>> {
    let finalFilters = [['is_stock_item', '=', '1']];
    if (filters) {
      finalFilters = [...finalFilters, ...this.convertToFrappeFilters(filters)];
    }
    if (company) {
      finalFilters.push(['company', '=', company]);
    }
    
    const params = this.buildQueryParams(finalFilters, fields, limitPageLength);
    params.append('start', ((page - 1) * limitPageLength).toString());

    const response = await fetch(`${this.baseURL}/api/resource/Item?${params}`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch paginated items: ${response.statusText}`);
    }

    return response.json();
  }

  async getItemByBarcode(barcode: string): Promise<ERPNextResponse<Item[]>> {
    try {
      // First try to find item through barcode table
      const params = this.buildQueryParams([['barcode', '=', barcode]]);

      const response = await fetch(`${this.baseURL}/api/resource/Item Barcode?${params}`, {
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch item by barcode: ${response.statusText}`);
      }

      const barcodeResult = await response.json();
      
      if (barcodeResult.data && barcodeResult.data.length > 0) {
        const itemCode = barcodeResult.data[0].parent;
        return this.getItemDetails(itemCode);
      }

      // If not found in barcode table, try direct item code match
      const directSearch = await this.getItems({ item_code: barcode });
      if (directSearch.data && directSearch.data.length > 0) {
        return directSearch;
      }

      return { data: [] };
    } catch (error) {
      console.error('Error fetching item by barcode:', error);
      return { data: [] };
    }
  }

  async getItemDetails(itemCode: string): Promise<ERPNextResponse<any>> {
    // Use the correct format for fetching item with barcodes (child table)
    const response = await fetch(`${this.baseURL}/api/resource/Item/${itemCode}?fields=["name","item_name","item_code","stock_uom","has_batch_no","has_serial_no","barcodes"]`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch item details: ${response.statusText}`);
    }

    const result = await response.json();
    return { data: result.data };
  }
}

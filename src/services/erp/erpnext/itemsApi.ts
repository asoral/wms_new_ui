
import { ERPNextBaseAPI } from './baseApi';
import { ERPNextResponse, Item } from './types';

export class ERPNextItemsAPI extends ERPNextBaseAPI {
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

  async searchItems(searchTerm: string, company?: string, limitPageLength: number = 20): Promise<ERPNextResponse<Item[]>> {
    let filters = [['is_stock_item', '=', '1']];
    
    if (company) {
      filters.push(['company', '=', company]);
    }
    
    const params = this.buildQueryParams(filters, undefined, limitPageLength);
    
    const orFilters = [
      ['item_code', 'like', `%${searchTerm}%`],
      ['item_name', 'like', `%${searchTerm}%`]
    ];
    params.append('or_filters', JSON.stringify(orFilters));

    const response = await fetch(`${this.baseURL}/api/resource/Item?${params}`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to search items: ${response.statusText}`);
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

    return { data: [] };
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

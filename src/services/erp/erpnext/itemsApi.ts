
import { ERPNextBaseAPI } from './baseApi';
import { ERPNextResponse, Item } from './types';

export class ERPNextItemsAPI extends ERPNextBaseAPI {
  async getItems(filters?: any, searchTerm?: string, company?: string): Promise<ERPNextResponse<Item[]>> {
    let finalFilters = [['is_stock_item', '=', '1']];
    if (filters) {
      finalFilters = [...finalFilters, ...this.convertToFrappeFilters(filters)];
    }
    // Remove company filter from item search as it's not permitted
    
    const fields = ['name', 'item_code', 'item_name', 'stock_uom', 'has_batch_no', 'has_serial_no'];
    const params = this.buildQueryParams(finalFilters, fields);
    
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
    // Remove company filter from item search as it's not permitted
    
    const fields = ['name', 'item_code', 'item_name', 'stock_uom', 'has_batch_no', 'has_serial_no'];
    const params = this.buildQueryParams(filters, fields, limitPageLength);
    
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
    // Remove company filter from item search as it's not permitted
    
    const defaultFields = ['name', 'item_code', 'item_name', 'stock_uom', 'has_batch_no', 'has_serial_no'];
    const params = this.buildQueryParams(finalFilters, fields || defaultFields, limitPageLength);
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

  async searchItemsByBarcode(barcode: string): Promise<ERPNextResponse<Item[]>> {
    // First try to find the item through Item Barcode doctype
    try {
      const barcodeParams = this.buildQueryParams([['barcode', '=', barcode]]);
      const barcodeResponse = await fetch(`${this.baseURL}/api/resource/Item Barcode?${barcodeParams}`, {
        headers: this.getHeaders(),
      });

      if (barcodeResponse.ok) {
        const barcodeResult = await barcodeResponse.json();
        if (barcodeResult.data && barcodeResult.data.length > 0) {
          const itemCode = barcodeResult.data[0].parent;
          const itemDetails = await this.getItemDetails(itemCode);
          return { data: itemDetails.data ? [itemDetails.data] : [] };
        }
      }
    } catch (error) {
      console.log('Barcode search failed, trying direct item search');
    }

    // If barcode search fails, try searching items directly
    return this.searchItems(barcode);
  }
}

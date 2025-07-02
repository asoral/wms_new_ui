
import { ERPNextBaseAPI } from './baseApi';
import { ERPNextResponse } from './types';

export class ERPNextStockAPI extends ERPNextBaseAPI {
  async getStockBalance(filters?: any): Promise<ERPNextResponse<any[]>> {
    const params = this.buildQueryParams(filters);
    const response = await fetch(`${this.baseURL}/api/resource/Bin?${params}`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Stock Balance API Error:', response.status, errorText);
      throw new Error(`Failed to fetch stock balance: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async getCurrentStock(itemCode: string, warehouse: string): Promise<ERPNextResponse<any>> {
    const filters = [
      ['item_code', '=', itemCode],
      ['warehouse', '=', warehouse]
    ];
    
    // Include all necessary fields for stock data
    const fields = [
      'name',
      'item_code', 
      'warehouse',
      'actual_qty',
      'reserved_qty',
      'planned_qty',
      'ordered_qty',
      'projected_qty',
      'valuation_rate',
      'stock_value'
    ];
    
    const params = this.buildQueryParams(filters, fields);
    
    const response = await fetch(`${this.baseURL}/api/resource/Bin?${params}`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Current Stock API Error:', response.status, errorText);
      throw new Error(`Failed to fetch current stock: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async getStockEntries(filters?: any, company?: string, limitPageLength?: number): Promise<ERPNextResponse<any[]>> {
    let finalFilters = this.convertToFrappeFilters(filters);
    if (company) {
      finalFilters.push(['company', '=', company]);
    }
    
    const params = this.buildQueryParams(finalFilters, undefined, limitPageLength);

    const response = await fetch(`${this.baseURL}/api/resource/Stock Entry?${params}`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Stock Entry API Error:', response.status, errorText);
      throw new Error(`Failed to fetch stock entries: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }
}

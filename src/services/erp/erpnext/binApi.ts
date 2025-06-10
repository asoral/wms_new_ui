
import { ERPNextBaseAPI } from './baseApi';
import { ERPNextResponse } from './types';

export interface BinData {
  name: string;
  item_code: string;
  warehouse: string;
  actual_qty: number;
  valuation_rate: number;
  stock_value: number;
  reserved_qty?: number;
  ordered_qty?: number;
  planned_qty?: number;
  projected_qty?: number;
}

export class ERPNextBinAPI extends ERPNextBaseAPI {
  async getBinData(filters?: any, company?: string, limitPageLength?: number): Promise<ERPNextResponse<BinData[]>> {
    try {
      let finalFilters = [];
      
      if (filters) {
        finalFilters = [...finalFilters, ...this.convertToFrappeFilters(filters)];
      }

      const params = this.buildQueryParams(finalFilters, undefined, limitPageLength);

      const response = await fetch(`${this.baseURL}/api/resource/Bin?${params}`, {
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch bin data: ${response.statusText}`);
      }

      return response.json();
    } catch (error) {
      console.error('Error fetching bin data:', error);
      return { data: [] };
    }
  }

  async getBinByItem(itemCode: string, warehouses?: string[]): Promise<ERPNextResponse<BinData[]>> {
    try {
      let filters = [['item_code', '=', itemCode]];
      
      if (warehouses && warehouses.length > 0) {
        filters.push(['warehouse', 'in', warehouses]);
      }

      return this.getBinData(filters);
    } catch (error) {
      console.error('Error fetching bin data for item:', error);
      return { data: [] };
    }
  }
}

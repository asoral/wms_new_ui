
import { ERPNextBaseAPI } from './baseApi';
import { ERPNextResponse, Warehouse } from './types';

export class ERPNextWarehouseAPI extends ERPNextBaseAPI {
  async getWarehouses(filters?: any, company?: string): Promise<ERPNextResponse<Warehouse[]>> {
    let finalFilters = [['is_group', '=', '0']];
    if (filters) {
      finalFilters = [...finalFilters, ...this.convertToFrappeFilters(filters)];
    }
    if (company) {
      finalFilters.push(['company', '=', company]);
    }
    
    const params = this.buildQueryParams(finalFilters);

    const response = await fetch(`${this.baseURL}/api/resource/Warehouse?${params}`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch warehouses: ${response.statusText}`);
    }

    return response.json();
  }
}

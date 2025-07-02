
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
    
    // Use only basic fields that are typically accessible
    const fields = [
      'name',
      'item_code', 
      'warehouse',
      'actual_qty',
      'reserved_qty',
      'planned_qty',
      'ordered_qty',
      'projected_qty'
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

  async getBinStockForCompany(itemCode: string, company: string): Promise<ERPNextResponse<any[]>> {
    try {
      // First, get warehouses for the company
      const warehouseFilters = [['company', '=', company]];
      const warehouseParams = this.buildQueryParams(warehouseFilters, ['name']);
      
      const warehouseResponse = await fetch(`${this.baseURL}/api/resource/Warehouse?${warehouseParams}`, {
        headers: this.getHeaders(),
      });

      if (!warehouseResponse.ok) {
        throw new Error(`Failed to fetch warehouses: ${warehouseResponse.statusText}`);
      }

      const warehouseData = await warehouseResponse.json();
      const warehouses = warehouseData.data?.map((w: any) => w.name) || [];
      
      if (warehouses.length === 0) {
        return { data: [] };
      }

      // Now get bins for this item in company warehouses
      const binFilters = [
        ['item_code', '=', itemCode],
        ['warehouse', 'in', warehouses]
      ];

      const binFields = [
        'name',
        'item_code',
        'warehouse', 
        'actual_qty',
        'reserved_qty',
        'planned_qty',
        'ordered_qty',
        'projected_qty'
      ];

      const binParams = this.buildQueryParams(binFilters, binFields);
      
      const binResponse = await fetch(`${this.baseURL}/api/resource/Bin?${binParams}`, {
        headers: this.getHeaders(),
      });

      if (!binResponse.ok) {
        const errorText = await binResponse.text();
        console.error('Bin API Error:', binResponse.status, errorText);
        throw new Error(`Failed to fetch bin stock: ${binResponse.status} ${binResponse.statusText}`);
      }

      return binResponse.json();

    } catch (error) {
      console.error('Error in getBinStockForCompany:', error);
      throw error;
    }
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

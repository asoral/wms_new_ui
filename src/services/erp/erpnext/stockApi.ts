
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
      console.log('Getting bin stock for company:', company);
      
      // First, get warehouses for the company
      const warehouseFilters = [['company', '=', company]];
      const warehouseParams = this.buildQueryParams(warehouseFilters, ['name']);
      
      console.log('Fetching warehouses with URL:', `${this.baseURL}/api/resource/Warehouse?${warehouseParams}`);
      
      const warehouseResponse = await fetch(`${this.baseURL}/api/resource/Warehouse?${warehouseParams}`, {
        headers: this.getHeaders(),
      });

      if (!warehouseResponse.ok) {
        const errorText = await warehouseResponse.text();
        console.error('Warehouse API Error:', warehouseResponse.status, errorText);
        throw new Error(`Failed to fetch warehouses: ${warehouseResponse.statusText}`);
      }

      const warehouseData = await warehouseResponse.json();
      console.log('Warehouse data received:', warehouseData);
      
      const warehouses = warehouseData.data?.map((w: any) => w.name) || [];
      console.log('Company warehouses:', warehouses);
      
      if (warehouses.length === 0) {
        console.log('No warehouses found for company:', company);
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
        'projected_qty',
        'creation',
        'modified'
      ];

      const binParams = this.buildQueryParams(binFilters, binFields);
      console.log('Fetching bins with URL:', `${this.baseURL}/api/resource/Bin?${binParams}`);
      
      const binResponse = await fetch(`${this.baseURL}/api/resource/Bin?${binParams}`, {
        headers: this.getHeaders(),
      });

      if (!binResponse.ok) {
        const errorText = await binResponse.text();
        console.error('Bin API Error:', binResponse.status, errorText);
        throw new Error(`Failed to fetch bin stock: ${binResponse.status} ${binResponse.statusText}`);
      }

      const binResult = await binResponse.json();
      console.log('Bin data received:', binResult);
      
      return binResult;

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

  async getStockLedgerEntries(itemCode: string, warehouses: string[]): Promise<ERPNextResponse<any[]>> {
    try {
      const filters = [
        ['item_code', '=', itemCode],
        ['warehouse', 'in', warehouses]
      ];

      const fields = [
        'name',
        'item_code',
        'warehouse',
        'valuation_rate',
        'stock_value',
        'qty_after_transaction',
        'posting_date',
        'posting_time'
      ];

      const params = this.buildQueryParams(filters, fields, 20);
      
      console.log('Fetching stock ledger with URL:', `${this.baseURL}/api/resource/Stock Ledger Entry?${params}`);
      
      const response = await fetch(`${this.baseURL}/api/resource/Stock Ledger Entry?${params}`, {
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Stock Ledger API Error:', response.status, errorText);
        // Don't throw error, just return empty data
        return { data: [] };
      }

      const result = await response.json();
      console.log('Stock ledger data received:', result);
      
      return result;
    } catch (error) {
      console.error('Error in getStockLedgerEntries:', error);
      return { data: [] };
    }
  }

  async getPickLists(filters?: any, company?: string, limitPageLength?: number): Promise<ERPNextResponse<any[]>> {
    let finalFilters = this.convertToFrappeFilters(filters);
    if (company) {
      finalFilters.push(['company', '=', company]);
    }
    
    const params = this.buildQueryParams(finalFilters, undefined, limitPageLength);

    const response = await fetch(`${this.baseURL}/api/resource/Pick List?${params}`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Pick List API Error:', response.status, errorText);
      throw new Error(`Failed to fetch pick lists: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async getPickList(name: string): Promise<ERPNextResponse<any>> {
    const response = await fetch(`${this.baseURL}/api/resource/Pick List/${encodeURIComponent(name)}`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Pick List Detail API Error:', response.status, errorText);
      throw new Error(`Failed to fetch pick list: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async createPickList(data: any): Promise<ERPNextResponse<any>> {
    console.log('Creating Pick List with data:', data);
    
    const response = await fetch(`${this.baseURL}/api/resource/Pick List`, {
      method: 'POST',
      headers: {
        ...this.getHeaders(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Create Pick List API Error:', response.status, errorText);
      throw new Error(`Failed to create pick list: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const result = await response.json();
    console.log('Pick List created successfully:', result);
    return result;
  }

  async updatePickList(name: string, data: any): Promise<ERPNextResponse<any>> {
    const response = await fetch(`${this.baseURL}/api/resource/Pick List/${encodeURIComponent(name)}`, {
      method: 'PUT',
      headers: {
        ...this.getHeaders(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Update Pick List API Error:', response.status, errorText);
      throw new Error(`Failed to update pick list: ${response.status} ${response.statusText} - ${errorText}`);
    }

    return response.json();
  }

  async submitPickList(name: string): Promise<ERPNextResponse<any>> {
    const response = await fetch(`${this.baseURL}/api/resource/Pick List/${encodeURIComponent(name)}`, {
      method: 'PUT',
      headers: {
        ...this.getHeaders(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        docstatus: 1
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Submit Pick List API Error:', response.status, errorText);
      throw new Error(`Failed to submit pick list: ${response.status} ${response.statusText} - ${errorText}`);
    }

    return response.json();
  }
}

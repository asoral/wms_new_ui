
import { ERPNextBaseAPI } from './baseApi';
import { ERPNextResponse, StockBalance, StockEntry } from './types';

export class ERPNextStockAPI extends ERPNextBaseAPI {
  async getStockBalance(filters?: any, company?: string): Promise<ERPNextResponse<StockBalance[]>> {
    let finalFilters = this.convertToFrappeFilters(filters);
    
    // If company is specified, get warehouses for that company first
    if (company) {
      try {
        const warehouseResponse = await fetch(`${this.baseURL}/api/resource/Warehouse?filters=${JSON.stringify([['company', '=', company]])}&fields=["name"]&limit_page_length=1000`, {
          headers: this.getHeaders(),
        });
        
        if (warehouseResponse.ok) {
          const warehouseData = await warehouseResponse.json();
          if (warehouseData.data && warehouseData.data.length > 0) {
            const warehouseNames = warehouseData.data.map((w: any) => w.name);
            finalFilters.push(['warehouse', 'in', warehouseNames]);
          }
        }
      } catch (error) {
        console.warn('Failed to fetch warehouses for company filter:', error);
      }
    }
    
    const params = this.buildQueryParams(finalFilters, undefined, 1000);

    const response = await fetch(`${this.baseURL}/api/resource/Bin?${params}`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch stock balance: ${response.statusText}`);
    }

    return response.json();
  }

  async getBinStock(filters?: any): Promise<ERPNextResponse<any[]>> {
    let finalFilters = this.convertToFrappeFilters(filters);
    
    const params = this.buildQueryParams(finalFilters, undefined, 1000);

    const response = await fetch(`${this.baseURL}/api/resource/Bin?${params}`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch bin stock: ${response.statusText}`);
    }

    return response.json();
  }

  async getCurrentStock(itemCode: string, warehouse: string, batch?: string, serial?: string): Promise<ERPNextResponse<any>> {
    const filters = [
      ['item_code', '=', itemCode],
      ['warehouse', '=', warehouse]
    ];

    if (batch) {
      filters.push(['batch_no', '=', batch]);
    }
    if (serial) {
      filters.push(['serial_no', '=', serial]);
    }

    const params = this.buildQueryParams(filters);

    const response = await fetch(`${this.baseURL}/api/resource/Bin?${params}`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch current stock: ${response.statusText}`);
    }

    return response.json();
  }

  async getStockLedgerEntries(filters?: any, company?: string): Promise<ERPNextResponse<any[]>> {
    let finalFilters = this.convertToFrappeFilters(filters);
    if (company) {
      finalFilters.push(['company', '=', company]);
    }
    
    const params = this.buildQueryParams(finalFilters);

    const response = await fetch(`${this.baseURL}/api/resource/Stock Ledger Entry?${params}`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch stock ledger entries: ${response.statusText}`);
    }

    return response.json();
  }

  async getStockAgingReport(filters?: any): Promise<ERPNextResponse<any[]>> {
    // This method is not accessible due to permission restrictions
    // Return empty data with a warning
    console.warn('Stock aging report is not accessible due to ERPNext permissions');
    return { data: [] };
  }

  async getStockEntries(filters?: any, company?: string, limitPageLength?: number): Promise<ERPNextResponse<StockEntry[]>> {
    let finalFilters = this.convertToFrappeFilters(filters);
    if (company) {
      finalFilters.push(['company', '=', company]);
    }
    
    const params = this.buildQueryParams(finalFilters, undefined, limitPageLength);

    const response = await fetch(`${this.baseURL}/api/resource/Stock Entry?${params}`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch stock entries: ${response.statusText}`);
    }

    return response.json();
  }

  async createStockReconciliation(reconciliationData: any): Promise<ERPNextResponse<any>> {
    const response = await fetch(`${this.baseURL}/api/resource/Stock Reconciliation`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(reconciliationData),
    });

    if (!response.ok) {
      throw new Error(`Failed to create stock reconciliation: ${response.statusText}`);
    }

    return response.json();
  }

  async updateStockReconciliation(name: string, reconciliationData: any): Promise<ERPNextResponse<any>> {
    const response = await fetch(`${this.baseURL}/api/resource/Stock Reconciliation/${name}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(reconciliationData),
    });

    if (!response.ok) {
      throw new Error(`Failed to update stock reconciliation: ${response.statusText}`);
    }

    return response.json();
  }
}

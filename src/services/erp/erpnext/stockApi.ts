
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
    try {
      // Prepare filters for the Stock Ageing report
      const reportFilters: any = {};
      
      // Set default date range if not provided
      const today = new Date();
      const fromDate = new Date(today.getFullYear(), 0, 1); // Start of current year
      
      reportFilters.from_date = fromDate.toISOString().split('T')[0];
      reportFilters.to_date = today.toISOString().split('T')[0];
      
      // Add any additional filters
      if (filters) {
        Object.assign(reportFilters, filters);
      }

      console.log('Running Stock Ageing report with filters:', reportFilters);
      
      // Use the generic report runner
      const result = await this.runReport('Stock Ageing', reportFilters);
      
      console.log('Stock Ageing report result:', result);
      
      // Transform the report data to match expected format
      // The runReport method returns ERPNextResponse<any>, so we need to check the structure
      if (result && typeof result === 'object' && 'message' in result) {
        const message = result.message;
        if (message && typeof message === 'object' && 'result' in message) {
          return {
            data: message.result || []
          };
        }
      }
      
      // If result has data directly
      if (result && typeof result === 'object' && 'data' in result) {
        return {
          data: result.data || []
        };
      }
      
      return { data: [] };
      
    } catch (error) {
      console.error('Failed to fetch stock aging report:', error);
      // Return empty data if there's an error instead of throwing
      return { data: [] };
    }
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

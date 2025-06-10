import { ERPNextBaseAPI } from './baseApi';
import { ERPNextResponse, StockBalance } from './types';

export class ERPNextStockAPI extends ERPNextBaseAPI {
  async getStockBalance(filters?: any, company?: string): Promise<ERPNextResponse<StockBalance[]>> {
    try {
      // Use Bin doctype instead of Stock Balance report for accurate data
      let finalFilters = [];
      
      if (company) {
        finalFilters.push(['company', '=', company]);
      }
      
      // Handle specific filter conditions
      if (filters) {
        const frappeFilters = this.convertToFrappeFilters(filters);
        finalFilters = [...finalFilters, ...frappeFilters];
      }
      
      const params = this.buildQueryParams(finalFilters, ['item_code', 'warehouse', 'actual_qty', 'valuation_rate', 'stock_uom'], 100);

      const response = await fetch(`${this.baseURL}/api/resource/Bin?${params}`, {
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch stock balance: ${response.statusText}`);
      }

      const result = await response.json();
      
      // Transform Bin data to match expected StockBalance format
      if (result.data && Array.isArray(result.data)) {
        const stockData = result.data.map((bin: any) => ({
          item_code: bin.item_code,
          warehouse: bin.warehouse,
          actual_qty: parseFloat(bin.actual_qty) || 0,
          valuation_rate: parseFloat(bin.valuation_rate) || 0,
          stock_value: (parseFloat(bin.actual_qty) || 0) * (parseFloat(bin.valuation_rate) || 0),
          stock_uom: bin.stock_uom || 'Nos'
        }));
        
        return { data: stockData };
      }
      
      return { data: [] };
    } catch (error) {
      console.error('Error fetching stock balance:', error);
      return { data: [] };
    }
  }

  async getCurrentStock(itemCode: string, warehouse: string, batch?: string, serial?: string): Promise<number> {
    let filters = [
      ['item_code', '=', itemCode],
      ['warehouse', '=', warehouse]
    ];

    if (batch) {
      filters.push(['batch_no', '=', batch]);
    }

    if (serial) {
      filters.push(['serial_no', '=', serial]);
    }

    const params = new URLSearchParams({
      fields: '["actual_qty"]',
      filters: JSON.stringify(filters)
    });

    const response = await fetch(`${this.baseURL}/api/resource/Stock Balance?${params}`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch stock balance: ${response.statusText}`);
    }

    const result = await response.json() as ERPNextResponse<StockBalance[]>;

    if (Array.isArray(result.data) && result.data.length > 0) {
      return result.data[0].actual_qty;
    } else {
      return 0;
    }
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
      const stockBalance = await this.getStockBalance(filters);
      
      const agingData = stockBalance.data?.map((item: any) => ({
        item_code: item.item_code,
        warehouse: item.warehouse,
        actual_qty: item.actual_qty,
        valuation_rate: item.valuation_rate,
        value: (item.actual_qty || 0) * (item.valuation_rate || 0),
        age: 30,
        posting_date: new Date().toISOString().split('T')[0]
      })) || [];

      return {
        data: agingData,
        message: 'Stock aging data processed from stock balance'
      };
    } catch (error) {
      console.error('Error fetching stock aging report:', error);
      return {
        data: [],
        message: 'Stock aging report not available'
      };
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
      throw new Error(`Failed to fetch stock entries: ${response.statusText}`);
    }

    return response.json();
  }

  async createStockReconciliation(reconciliationData: any): Promise<ERPNextResponse<any>> {
    const response = await fetch(`${this.baseURL}/api/resource/Stock Reconciliation`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(reconciliationData)
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
      body: JSON.stringify(reconciliationData)
    });

    if (!response.ok) {
      throw new Error(`Failed to update stock reconciliation: ${response.statusText}`);
    }

    return response.json();
  }
}

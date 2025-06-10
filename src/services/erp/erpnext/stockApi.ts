
import { ERPNextBaseAPI } from './baseApi';
import { ERPNextResponse, StockBalance } from './types';

export class ERPNextStockAPI extends ERPNextBaseAPI {
  async getStockBalance(filters?: any, company?: string): Promise<ERPNextResponse<StockBalance[]>> {
    try {
      // Use Stock Balance script report with POST request
      const today = new Date().toISOString().split('T')[0];
      
      const reportFilters: any = {
        from_date: today,
        to_date: today,
      };
      
      if (company) {
        reportFilters.company = company;
      }
      
      // Handle specific filter conditions
      if (filters) {
        if (filters.item_code) {
          reportFilters.item_code = filters.item_code;
        }
        if (filters.warehouse) {
          reportFilters.warehouse = filters.warehouse;
        }
        // Handle other filters as needed
        Object.keys(filters).forEach(key => {
          if (!reportFilters[key] && filters[key]) {
            reportFilters[key] = filters[key];
          }
        });
      }

      const response = await fetch(`${this.baseURL}/api/method/erpnext.stock.report.stock_balance.stock_balance.execute`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          filters: reportFilters
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch stock balance: ${response.statusText}`);
      }

      const result = await response.json();
      
      // Parse script report response format
      if (result.message && result.message.result && Array.isArray(result.message.result)) {
        const columns = result.message.columns || [];
        const rows = result.message.result;
        
        // Map column names to indices for easier data extraction
        const columnMap: { [key: string]: number } = {};
        columns.forEach((col: any, index: number) => {
          const fieldname = col.fieldname || col.label?.toLowerCase().replace(/\s+/g, '_');
          if (fieldname) {
            columnMap[fieldname] = index;
          }
        });
        
        // Transform script report data to match expected StockBalance format
        const stockData = rows.map((row: any[]) => ({
          item_code: row[columnMap.item_code] || row[0] || '',
          warehouse: row[columnMap.warehouse] || row[columnMap.warehouse_name] || row[1] || '',
          actual_qty: parseFloat(row[columnMap.bal_qty] || row[columnMap.actual_qty] || row[2] || '0') || 0,
          valuation_rate: parseFloat(row[columnMap.val_rate] || row[columnMap.valuation_rate] || row[3] || '0') || 0,
          stock_value: parseFloat(row[columnMap.bal_val] || row[columnMap.stock_value] || row[4] || '0') || 0,
          stock_uom: row[columnMap.stock_uom] || row[columnMap.uom] || row[5] || 'Nos'
        })).filter((item: any) => item.item_code); // Filter out empty rows
        
        return { data: stockData };
      }
      
      return { data: [] };
    } catch (error) {
      console.error('Error fetching stock balance:', error);
      return { data: [] };
    }
  }

  async getBinSummary(itemCode: string, warehouse?: string): Promise<ERPNextResponse<any>> {
    try {
      const payload: any = { item_code: itemCode };
      if (warehouse) {
        payload.warehouse = warehouse;
      }

      const response = await fetch(`${this.baseURL}/api/method/erpnext.stock.get_bin_summary`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch bin summary: ${response.statusText}`);
      }

      return response.json();
    } catch (error) {
      console.error('Error fetching bin summary:', error);
      return { data: [] };
    }
  }

  async getCurrentStock(itemCode: string, warehouse: string, batch?: string, serial?: string): Promise<number> {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const reportFilters: any = {
        from_date: today,
        to_date: today,
        item_code: itemCode,
        warehouse: warehouse
      };

      if (batch) {
        reportFilters.batch_no = batch;
      }

      if (serial) {
        reportFilters.serial_no = serial;
      }

      const response = await fetch(`${this.baseURL}/api/method/erpnext.stock.report.stock_balance.stock_balance.execute`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          filters: reportFilters
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch stock balance: ${response.statusText}`);
      }

      const result = await response.json();

      if (result.message && result.message.result && Array.isArray(result.message.result)) {
        const columns = result.message.columns || [];
        const rows = result.message.result;
        
        // Find the balance quantity column
        const columnMap: { [key: string]: number } = {};
        columns.forEach((col: any, index: number) => {
          const fieldname = col.fieldname || col.label?.toLowerCase().replace(/\s+/g, '_');
          if (fieldname) {
            columnMap[fieldname] = index;
          }
        });

        if (rows.length > 0) {
          const row = rows[0];
          return parseFloat(row[columnMap.bal_qty] || row[columnMap.actual_qty] || row[2] || '0') || 0;
        }
      }

      return 0;
    } catch (error) {
      console.error('Error fetching current stock:', error);
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
      const response = await fetch(`${this.baseURL}/api/method/erpnext.stock.report.stock_ageing.stock_ageing.execute`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          filters: filters || {}
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch stock aging report: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.message && result.message.result) {
        return { data: result.message.result };
      }
      
      return { data: [] };
    } catch (error) {
      console.error('Error fetching stock aging report:', error);
      return { data: [] };
    }
  }

  async getItemShortageReport(filters?: any): Promise<ERPNextResponse<any[]>> {
    try {
      const response = await fetch(`${this.baseURL}/api/method/erpnext.stock.report.item_shortage_report.item_shortage_report.execute`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          filters: filters || {}
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch item shortage report: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.message && result.message.result) {
        return { data: result.message.result };
      }
      
      return { data: [] };
    } catch (error) {
      console.error('Error fetching item shortage report:', error);
      return { data: [] };
    }
  }

  async getStockProjectedQtyReport(filters?: any): Promise<ERPNextResponse<any[]>> {
    try {
      const response = await fetch(`${this.baseURL}/api/method/erpnext.stock.report.stock_projected_qty.stock_projected_qty.execute`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          filters: filters || {}
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch stock projected qty report: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.message && result.message.result) {
        return { data: result.message.result };
      }
      
      return { data: [] };
    } catch (error) {
      console.error('Error fetching stock projected qty report:', error);
      return { data: [] };
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

  async createStockEntry(entryData: any): Promise<ERPNextResponse<any>> {
    const response = await fetch(`${this.baseURL}/api/resource/Stock Entry`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(entryData)
    });

    if (!response.ok) {
      throw new Error(`Failed to create stock entry: ${response.statusText}`);
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

  async submitStockReconciliation(name: string): Promise<ERPNextResponse<any>> {
    const response = await fetch(`${this.baseURL}/api/resource/Stock Reconciliation/${name}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify({
        docstatus: 1
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to submit stock reconciliation: ${response.statusText}`);
    }

    return response.json();
  }
}

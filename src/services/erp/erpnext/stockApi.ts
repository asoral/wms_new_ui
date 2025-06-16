
import { ERPNextBaseAPI } from './baseApi';
import { APIResponse } from './types';

export interface BinStockItem {
  item_code: string;
  warehouse: string;
  actual_qty: number;
  reserved_qty: number;
  available_qty: number;
  valuation_rate: number;
  stock_value: number;
}

export interface BinInfo {
  item_code: string;
  item_name: string;
  warehouse: string;
  actual_qty: number;
  reserved_qty: number;
  available_qty: number;
  valuation_rate: number;
  stock_value: number;
}

export interface StockBalanceItem {
  item_code: string;
  warehouse: string;
  projected_qty: number;
  actual_qty?: number;
  valuation_rate?: number;
}

export interface WarehouseStockItem {
  item_code: string;
  warehouse: string;
  actual_qty: number;
  reserved_qty: number;
  available_qty: number;
  valuation_rate: number;
  stock_value: number;
}

export interface StockLedgerEntry {
  name: string;
  item_code: string;
  warehouse: string;
  posting_date: string;
  qty_change: number;
  valuation_rate: number;
  stock_value: number;
}

export interface StockEntry {
  name: string;
  posting_date: string;
  purpose: string;
  status: string;
  from_warehouse?: string;
  to_warehouse?: string;
}

export class ERPNextStockAPI extends ERPNextBaseAPI {
  async getBinStock(itemCode: string, warehouse: string): Promise<APIResponse<BinStockItem[]>> {
    try {
      const endpoint = this.getEndpoint('/api/resource/Bin', {
        fields: '["item_code", "warehouse", "actual_qty", "reserved_qty", "available_qty", "valuation_rate", "stock_value"]',
        item_code: itemCode,
        warehouse: warehouse,
        actual_qty: [">", 0]
      });
      const response = await this.makeRequest(endpoint);
      return {
        success: true,
        data: response.data.data as BinStockItem[]
      };
    } catch (error) {
      return this.handleError('getBinStock', error);
    }
  }

  async getBinInfo(itemCode: string, warehouse: string): Promise<APIResponse<BinInfo>> {
    try {
      const endpoint = this.getEndpoint('/api/resource/Bin', {
        fields: '["item_code", "item_name", "warehouse", "actual_qty", "reserved_qty", "available_qty", "valuation_rate", "stock_value"]',
        item_code: itemCode,
        warehouse: warehouse
      });
      const response = await this.makeRequest(endpoint);
      return {
        success: true,
        data: response.data.data as BinInfo
      };
    } catch (error) {
      return this.handleError('getBinInfo', error);
    }
  }

  async getStockBalance(itemCode: string, warehouses: string[]): Promise<APIResponse<StockBalanceItem[]>>;
  async getStockBalance(filters?: any, company?: string): Promise<APIResponse<StockBalanceItem[]>>;
  async getStockBalance(filterOrItemCode?: any, warehousesOrCompany?: string[] | string): Promise<APIResponse<StockBalanceItem[]>> {
    try {
      let filters: any = {};
      
      if (typeof filterOrItemCode === 'string') {
        // First overload: itemCode and warehouses
        filters = {
          item_code: filterOrItemCode,
          warehouse: ["in", warehousesOrCompany as string[]]
        };
      } else {
        // Second overload: filters and company
        filters = filterOrItemCode || {};
        if (warehousesOrCompany && typeof warehousesOrCompany === 'string') {
          filters.company = warehousesOrCompany;
        }
      }

      const endpoint = this.getEndpoint('/api/resource/Stock Balance', filters);
      const response = await this.makeRequest(endpoint);

      if (response.data?.data) {
        return {
          success: true,
          data: response.data.data as StockBalanceItem[]
        };
      }

      return {
        success: true,
        data: []
      };
    } catch (error) {
      return this.handleError('getStockBalance', error);
    }
  }

  async getCurrentStock(itemCode: string, warehouse: string, batch?: string, serial?: string): Promise<APIResponse<any>> {
    try {
      const filters: any = {
        item_code: itemCode,
        warehouse: warehouse
      };
      
      if (batch) filters.batch_no = batch;
      if (serial) filters.serial_no = serial;

      const endpoint = this.getEndpoint('/api/resource/Bin', filters);
      const response = await this.makeRequest(endpoint);
      
      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      return this.handleError('getCurrentStock', error);
    }
  }

  async getStockLedgerEntries(filters?: any, company?: string): Promise<APIResponse<StockLedgerEntry[]>> {
    try {
      const queryFilters = filters || {};
      if (company) {
        queryFilters.company = company;
      }

      const endpoint = this.getEndpoint('/api/resource/Stock Ledger Entry', queryFilters);
      const response = await this.makeRequest(endpoint);
      
      return {
        success: true,
        data: response.data.data as StockLedgerEntry[]
      };
    } catch (error) {
      return this.handleError('getStockLedgerEntries', error);
    }
  }

  async getStockAgingReport(filters?: any): Promise<APIResponse<any[]>> {
    try {
      const endpoint = this.getEndpoint('/api/method/erpnext.stock.report.stock_ageing.stock_ageing.execute', filters);
      const response = await this.makeRequest(endpoint);
      
      return {
        success: true,
        data: response.data.message || []
      };
    } catch (error) {
      return this.handleError('getStockAgingReport', error);
    }
  }

  async getStockEntries(filters?: any, company?: string, limitPageLength?: number): Promise<APIResponse<StockEntry[]>> {
    try {
      const queryFilters = filters || {};
      if (company) {
        queryFilters.company = company;
      }
      if (limitPageLength) {
        queryFilters.limit_page_length = limitPageLength;
      }

      const endpoint = this.getEndpoint('/api/resource/Stock Entry', queryFilters);
      const response = await this.makeRequest(endpoint);
      
      return {
        success: true,
        data: response.data.data as StockEntry[]
      };
    } catch (error) {
      return this.handleError('getStockEntries', error);
    }
  }

  async createStockReconciliation(reconciliationData: any): Promise<APIResponse<any>> {
    try {
      const endpoint = this.getEndpoint('/api/resource/Stock Reconciliation');
      const response = await this.makeRequest(endpoint, {
        method: 'POST',
        body: JSON.stringify(reconciliationData)
      });
      
      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      return this.handleError('createStockReconciliation', error);
    }
  }

  async updateStockReconciliation(name: string, reconciliationData: any): Promise<APIResponse<any>> {
    try {
      const endpoint = this.getEndpoint(`/api/resource/Stock Reconciliation/${name}`);
      const response = await this.makeRequest(endpoint, {
        method: 'PUT',
        body: JSON.stringify(reconciliationData)
      });
      
      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      return this.handleError('updateStockReconciliation', error);
    }
  }

  async getWarehouseStockBalance(warehouse: string, item?: string): Promise<APIResponse<WarehouseStockItem[]>> {
    try {
      const filters: Record<string, any> = {
        warehouse: warehouse
      };
      
      if (item) {
        filters.item_code = item;
      }

      const endpoint = this.getEndpoint('/api/resource/Bin', filters);
      const response = await this.makeRequest(endpoint);
      
      if (response.data?.message) {
        const bins = Array.isArray(response.data.message) ? response.data.message : [];
        
        // Group by item and sum quantities
        const stockMap = new Map<string, WarehouseStockItem>();
        
        bins.forEach((bin: any) => {
          if (bin.actual_qty > 0) {
            const key = bin.item_code;
            if (stockMap.has(key)) {
              const existing = stockMap.get(key)!;
              existing.actual_qty += bin.actual_qty;
              existing.reserved_qty += bin.reserved_qty || 0;
              existing.available_qty = existing.actual_qty - existing.reserved_qty;
            } else {
              stockMap.set(key, {
                item_code: bin.item_code,
                warehouse: bin.warehouse,
                actual_qty: bin.actual_qty,
                reserved_qty: bin.reserved_qty || 0,
                available_qty: bin.actual_qty - (bin.reserved_qty || 0),
                valuation_rate: bin.valuation_rate || 0,
                stock_value: (bin.actual_qty || 0) * (bin.valuation_rate || 0)
              });
            }
          }
        });

        return {
          success: true,
          data: Array.from(stockMap.values())
        };
      }

      return {
        success: true,
        data: []
      };
    } catch (error) {
      return this.handleError('getWarehouseStockBalance', error);
    }
  }
}

// Legacy export for backward compatibility
export class StockAPI extends ERPNextStockAPI {}

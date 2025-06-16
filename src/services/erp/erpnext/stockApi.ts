
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

  async getStockBalance(itemCode: string, warehouses: string[]): Promise<APIResponse<StockBalanceItem[]>> {
    try {
      const filters = {
        item_code: itemCode,
        warehouse: ["in", warehouses]
      };
  
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

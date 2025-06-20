
import { ERPNextBaseAPI } from './baseApi';
import { ERPNextResponse, StockBalance, Item } from './types';

export class ERPNextStockAPI extends ERPNextBaseAPI {
  async getStockBalance(itemCode?: string, company?: string, warehouse?: string) {
    try {
      const filters: string[][] = [];

      if (itemCode) {
        filters.push(['item_code', '=', itemCode]);
      }

      if (warehouse) {
        filters.push(['warehouse', '=', warehouse]);
      }

      // If company is provided but no specific warehouse, get all warehouses for that company first
      if (company && !warehouse) {
        // Get warehouses for the company first
        const warehouseResponse = await fetch(`${this.baseURL}/api/resource/Warehouse?${new URLSearchParams({
          filters: JSON.stringify([['company', '=', company], ['disabled', '=', 0]]),
          fields: JSON.stringify(['name'])
        })}`, {
          headers: this.getHeaders(),
        });
        
        if (warehouseResponse.ok) {
          const warehouseData = await warehouseResponse.json();
          if (warehouseData.data && warehouseData.data.length > 0) {
            const warehouseNames = warehouseData.data.map((w: any) => w.name);
            filters.push(['warehouse', 'in', warehouseNames]);
          }
        }
      }

      const response = await fetch(`${this.baseURL}/api/resource/Stock Balance?${new URLSearchParams({
        filters: JSON.stringify(filters),
        fields: JSON.stringify(['item_code', 'warehouse', 'actual_qty', 'stock_value'])
      })}`, {
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch stock balance: ${response.statusText}`);
      }

      const result = await response.json();
      return {
        data: result.data || [],
        message: result.message || 'Stock balance fetched successfully'
      };
    } catch (error) {
      console.error('Error fetching stock balance:', error);
      throw error;
    }
  }

  async getCurrentStock(itemCode: string, warehouse?: string) {
    try {
      const params = new URLSearchParams({
        item_code: itemCode
      });
      
      if (warehouse) {
        params.append('warehouse', warehouse);
      }

      const response = await fetch(`${this.baseURL}/api/method/erpnext.stock.utils.get_item_current_stock?${params}`, {
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch current stock: ${response.statusText}`);
      }

      const result = await response.json();
      return {
        data: result.message || null,
        message: result.message || 'Current stock fetched successfully'
      };
    } catch (error) {
      console.error('Error fetching current stock:', error);
      throw error;
    }
  }

  async getBatches(itemCode: string, warehouse?: string) {
    try {
      const filters = [
        ['item', '=', itemCode],
        ['disabled', '=', 0]
      ];
      
      // Don't filter by warehouse directly since batches are not warehouse-specific
      // Instead, we'll get all batches for the item and then check stock ledger entries if needed

      const response = await fetch(`${this.baseURL}/api/resource/Batch?${new URLSearchParams({
        filters: JSON.stringify(filters),
        fields: JSON.stringify(['name', 'batch_id', 'batch_qty', 'expiry_date'])
      })}`, {
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch batches: ${response.statusText}`);
      }

      const result = await response.json();
      
      // If warehouse is specified, we can optionally filter batches that have stock in that warehouse
      if (warehouse && result.data && result.data.length > 0) {
        // Get stock ledger entries to check which batches have stock in the specified warehouse
        try {
          const stockLedgerFilters = [
            ['item_code', '=', itemCode],
            ['warehouse', '=', warehouse],
            ['actual_qty', '>', 0]
          ];
          
          const stockLedgerResponse = await fetch(`${this.baseURL}/api/resource/Stock Ledger Entry?${new URLSearchParams({
            filters: JSON.stringify(stockLedgerFilters),
            fields: JSON.stringify(['batch_no']),
            group_by: 'batch_no'
          })}`, {
            headers: this.getHeaders(),
          });
          
          if (stockLedgerResponse.ok) {
            const stockLedgerResult = await stockLedgerResponse.json();
            if (stockLedgerResult.data && stockLedgerResult.data.length > 0) {
              const batchesWithStock = stockLedgerResult.data.map((entry: any) => entry.batch_no).filter(Boolean);
              // Filter batches to only include those with stock in the warehouse
              result.data = result.data.filter((batch: any) => 
                batchesWithStock.includes(batch.batch_id || batch.name)
              );
            }
          }
        } catch (error) {
          console.warn('Could not filter batches by warehouse stock:', error);
          // Continue with all batches if warehouse filtering fails
        }
      }
      
      return {
        data: result.data || [],
        message: result.message || 'Batches fetched successfully'
      };
    } catch (error) {
      console.error('Error fetching batches:', error);
      throw error;
    }
  }

  async getSerialNumbers(itemCode: string, warehouse?: string) {
    try {
      const filters = [
        ['item_code', '=', itemCode],
        ['status', '=', 'Active']
      ];
      
      if (warehouse) {
        filters.push(['warehouse', '=', warehouse]);
      }

      const response = await fetch(`${this.baseURL}/api/resource/Serial No?${new URLSearchParams({
        filters: JSON.stringify(filters),
        fields: JSON.stringify(['name', 'serial_no', 'warehouse'])
      })}`, {
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch serial numbers: ${response.statusText}`);
      }

      const result = await response.json();
      return {
        data: result.data || [],
        message: result.message || 'Serial numbers fetched successfully'
      };
    } catch (error) {
      console.error('Error fetching serial numbers:', error);
      throw error;
    }
  }

  async getStockLedgerEntries(itemCode: string, warehouse?: string, fromDate?: string, toDate?: string) {
    try {
      const filters = [['item_code', '=', itemCode]];
      
      if (warehouse) {
        filters.push(['warehouse', '=', warehouse]);
      }
      
      if (fromDate) {
        filters.push(['posting_date', '>=', fromDate]);
      }
      
      if (toDate) {
        filters.push(['posting_date', '<=', toDate]);
      }

      const response = await fetch(`${this.baseURL}/api/resource/Stock Ledger Entry?${new URLSearchParams({
        filters: JSON.stringify(filters),
        fields: JSON.stringify([
          'posting_date', 'voucher_type', 'voucher_no', 
          'actual_qty', 'qty_after_transaction', 'stock_value', 'batch_no'
        ]),
        order_by: 'posting_date desc'
      })}`, {
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch stock ledger entries: ${response.statusText}`);
      }

      const result = await response.json();
      return {
        data: result.data || [],
        message: result.message || 'Stock ledger entries fetched successfully'
      };
    } catch (error) {
      console.error('Error fetching stock ledger entries:', error);
      throw error;
    }
  }

  // Delegate all item-related methods to the items API instead of duplicating logic
  async getItems(filters?: any, limitPageLength?: number): Promise<ERPNextResponse<Item[]>> {
    // Import the items API dynamically to avoid circular dependencies
    const { ERPNextItemsAPI } = await import('./itemsApi');
    const itemsAPI = new ERPNextItemsAPI(this.baseURL, this.apiKey, this.apiSecret);
    
    if (filters && typeof filters === 'object' && !Array.isArray(filters)) {
      // Convert object filters to proper format and delegate to items API
      return itemsAPI.getItems(filters, undefined, limitPageLength);
    }
    
    return itemsAPI.getItemsPaginated(filters, undefined, limitPageLength);
  }

  async searchItems(search: string, limit?: number): Promise<ERPNextResponse<Item[]>> {
    const { ERPNextItemsAPI } = await import('./itemsApi');
    const itemsAPI = new ERPNextItemsAPI(this.baseURL, this.apiKey, this.apiSecret);
    return itemsAPI.searchItems(search, limit);
  }

  async searchItemsByBarcode(barcode: string): Promise<ERPNextResponse<Item[]>> {
    const { ERPNextItemsAPI } = await import('./itemsApi');
    const itemsAPI = new ERPNextItemsAPI(this.baseURL, this.apiKey, this.apiSecret);
    return itemsAPI.searchItemsByBarcode(barcode);
  }

  async getItemsPaginated(filters?: any, fields?: string[], limit?: number, page?: number): Promise<ERPNextResponse<Item[]>> {
    const { ERPNextItemsAPI } = await import('./itemsApi');
    const itemsAPI = new ERPNextItemsAPI(this.baseURL, this.apiKey, this.apiSecret);
    return itemsAPI.getItemsPaginated(filters, fields, limit, page);
  }

  async getItemDetails(itemCode: string): Promise<ERPNextResponse<Item>> {
    const { ERPNextItemsAPI } = await import('./itemsApi');
    const itemsAPI = new ERPNextItemsAPI(this.baseURL, this.apiKey, this.apiSecret);
    return itemsAPI.getItemDetails(itemCode);
  }

  async getItemByBarcode(barcode: string): Promise<ERPNextResponse<Item>> {
    const { ERPNextItemsAPI } = await import('./itemsApi');
    const itemsAPI = new ERPNextItemsAPI(this.baseURL, this.apiKey, this.apiSecret);
    return itemsAPI.getItemByBarcode(barcode);
  }

  async getBinStock(itemCode?: string, warehouse?: string, company?: string): Promise<ERPNextResponse<any[]>> {
    const filters = [];
    if (itemCode) {
      filters.push(['item_code', '=', itemCode]);
    }
    
    if (warehouse) {
      filters.push(['warehouse', '=', warehouse]);
    }
    
    // If company is provided, get warehouses for that company first
    if (company && !warehouse) {
      const warehouseResponse = await fetch(`${this.baseURL}/api/resource/Warehouse?${new URLSearchParams({
        filters: JSON.stringify([['company', '=', company], ['disabled', '=', 0]]),
        fields: JSON.stringify(['name'])
      })}`, {
        headers: this.getHeaders(),
      });
      
      if (warehouseResponse.ok) {
        const warehouseData = await warehouseResponse.json();
        if (warehouseData.data && warehouseData.data.length > 0) {
          const warehouseNames = warehouseData.data.map((w: any) => w.name);
          filters.push(['warehouse', 'in', warehouseNames]);
        }
      }
    }

    const params = this.buildQueryParams(filters, ['item_code', 'warehouse', 'actual_qty', 'projected_qty', 'stock_value']);
    const response = await fetch(`${this.baseURL}/api/resource/Bin?${params}`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch bin stock: ${response.statusText}`);
    }

    return response.json();
  }

  async getStockEntries(filters?: any, company?: string): Promise<ERPNextResponse<any[]>> {
    let finalFilters = [];
    if (filters) {
      finalFilters = this.convertToFrappeFilters(filters);
    }
    
    if (company) {
      finalFilters.push(['company', '=', company]);
    }
    
    const params = this.buildQueryParams(finalFilters);
    const response = await fetch(`${this.baseURL}/api/resource/Stock Entry?${params}`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch stock entries: ${response.statusText}`);
    }

    return response.json();
  }

  async getStockAgingReport(): Promise<ERPNextResponse<any[]>> {
    return { data: [] };
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

  async getSerialBatchBundle(name: string): Promise<ERPNextResponse<any>> {
    const response = await fetch(`${this.baseURL}/api/resource/Serial and Batch Bundle/${name}`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch serial batch bundle: ${response.statusText}`);
    }

    return response.json();
  }

  async createSerialBatchBundle(bundleData: any): Promise<ERPNextResponse<any>> {
    const response = await fetch(`${this.baseURL}/api/resource/Serial and Batch Bundle`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(bundleData)
    });

    if (!response.ok) {
      throw new Error(`Failed to create serial batch bundle: ${response.statusText}`);
    }

    return response.json();
  }
}

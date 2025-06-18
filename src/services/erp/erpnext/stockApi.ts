
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
        const warehouseResponse = await this.get('/api/resource/Warehouse', {
          filters: JSON.stringify([['company', '=', company], ['disabled', '=', 0]]),
          fields: JSON.stringify(['name'])
        });
        
        if (warehouseResponse.data?.data && warehouseResponse.data.data.length > 0) {
          const warehouseNames = warehouseResponse.data.data.map((w: any) => w.name);
          filters.push(['warehouse', 'in', warehouseNames]);
        }
      }

      const result = await this.get('/api/resource/Stock Balance', {
        filters: JSON.stringify(filters),
        fields: JSON.stringify(['item_code', 'warehouse', 'actual_qty', 'stock_value'])
      });

      return {
        data: result.data?.data || [],
        message: result.message || 'Stock balance fetched successfully'
      };
    } catch (error) {
      console.error('Error fetching stock balance:', error);
      throw error;
    }
  }

  async getCurrentStock(itemCode: string, warehouse: string) {
    try {
      const result = await this.get('/api/method/erpnext.stock.utils.get_item_current_stock', {
        item_code: itemCode,
        warehouse: warehouse
      });

      return {
        data: result.data?.message || null,
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
      
      if (warehouse) {
        filters.push(['warehouse', '=', warehouse]);
      }

      const result = await this.get('/api/resource/Batch', {
        filters: JSON.stringify(filters),
        fields: JSON.stringify(['name', 'batch_id', 'batch_qty', 'expiry_date'])
      });

      return {
        data: result.data?.data || [],
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

      const result = await this.get('/api/resource/Serial No', {
        filters: JSON.stringify(filters),
        fields: JSON.stringify(['name', 'serial_no', 'warehouse'])
      });

      return {
        data: result.data?.data || [],
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

      const result = await this.get('/api/resource/Stock Ledger Entry', {
        filters: JSON.stringify(filters),
        fields: JSON.stringify([
          'posting_date', 'voucher_type', 'voucher_no', 
          'actual_qty', 'qty_after_transaction', 'stock_value'
        ]),
        order_by: 'posting_date desc'
      });

      return {
        data: result.data?.data || [],
        message: result.message || 'Stock ledger entries fetched successfully'
      };
    } catch (error) {
      console.error('Error fetching stock ledger entries:', error);
      throw error;
    }
  }

  async getItems(filters?: any, limitPageLength?: number): Promise<ERPNextResponse<Item[]>> {
    let finalFilters = [];
    if (filters) {
      finalFilters = this.convertToFrappeFilters(filters);
    }
    
    const params = this.buildQueryParams(finalFilters, undefined, limitPageLength);

    const response = await fetch(`${this.baseURL}/api/resource/Item?${params}`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch items: ${response.statusText}`);
    }

    return response.json();
  }

  async searchItems(search: string, limit?: number): Promise<ERPNextResponse<Item[]>> {
    const filters = [
      ['item_code', 'like', `%${search}%`],
      ['item_name', 'like', `%${search}%`]
    ];
    
    return this.getItems({ filters }, limit);
  }

  async searchItemsByBarcode(barcode: string): Promise<ERPNextResponse<Item[]>> {
    const filters = [['barcodes.barcode', '=', barcode]];
    return this.getItems({ filters });
  }

  async getItemsPaginated(filters?: any, fields?: string[], limit?: number, page?: number): Promise<ERPNextResponse<Item[]>> {
    return this.getItems(filters, limit);
  }

  async getItemDetails(itemCode: string): Promise<ERPNextResponse<Item>> {
    const response = await fetch(`${this.baseURL}/api/resource/Item/${itemCode}`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch item details: ${response.statusText}`);
    }

    return response.json();
  }

  async getItemByBarcode(barcode: string): Promise<ERPNextResponse<Item>> {
    const result = await this.searchItemsByBarcode(barcode);
    if (result.data && result.data.length > 0) {
      return { data: result.data[0] };
    }
    throw new Error('Item not found');
  }

  async getBinStock(itemCode?: string, warehouse?: string, company?: string): Promise<ERPNextResponse<any[]>> {
    const filters = [];
    if (itemCode) {
      filters.push(['item_code', '=', itemCode]);
    }
    
    // If company is provided, get warehouses for that company first
    if (company && !warehouse) {
      const warehouseResponse = await this.get('/api/resource/Warehouse', {
        filters: JSON.stringify([['company', '=', company], ['disabled', '=', 0]]),
        fields: JSON.stringify(['name'])
      });
      
      if (warehouseResponse.data?.data && warehouseResponse.data.data.length > 0) {
        const warehouseNames = warehouseResponse.data.data.map((w: any) => w.name);
        filters.push(['warehouse', 'in', warehouseNames]);
      }
    } else if (warehouse) {
      filters.push(['warehouse', '=', warehouse]);
    }

    const params = this.buildQueryParams(filters);
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

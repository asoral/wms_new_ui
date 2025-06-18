import { BaseERPNextAPI } from './baseApi';

export class ERPNextStockAPI extends BaseERPNextAPI {
  async getStockBalance(itemCode?: string, company?: string, warehouse?: string) {
    try {
      const filters: string[][] = [];

      if (itemCode) {
        filters.push(['item_code', '=', itemCode]);
      }

      if (company) {
        filters.push(['company', '=', company]);
      }

       if (warehouse) {
        filters.push(['warehouse', '=', warehouse]);
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
}

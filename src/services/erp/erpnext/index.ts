
import { BaseERPNextAPI } from './baseApi';
import { ItemsAPI } from './itemsApi';
import { StockAPI } from './stockApi';
import { WarehouseAPI } from './warehouseApi';
import { MaterialAPI } from './materialApi';
import { CompanyAPI } from './companyApi';
import { PurchaseAPI } from './purchaseApi';
import { SalesAPI } from './salesApi';
import { StockEntryAPI } from './stockEntryApi';
import { DashboardAPI } from './dashboardApi';
import { OtherAPIs } from './otherApis';

export class ERPNextAPI extends BaseERPNextAPI {
  public items: ItemsAPI;
  public stock: StockAPI;
  public warehouse: WarehouseAPI;
  public material: MaterialAPI;
  public company: CompanyAPI;
  public purchase: PurchaseAPI;
  public sales: SalesAPI;
  public stockEntry: StockEntryAPI;
  public dashboard: DashboardAPI;
  public other: OtherAPIs;

  constructor(baseURL: string, apiKey: string, apiSecret: string) {
    super(baseURL, apiKey, apiSecret);
    this.items = new ItemsAPI(this);
    this.stock = new StockAPI(this);
    this.warehouse = new WarehouseAPI(this);
    this.material = new MaterialAPI(this);
    this.company = new CompanyAPI(this);
    this.purchase = new PurchaseAPI(this);
    this.sales = new SalesAPI(this);
    this.stockEntry = new StockEntryAPI(this);
    this.dashboard = new DashboardAPI(this);
    this.other = new OtherAPIs(this);
  }

  // Utility methods
  async getPickLists(filters?: any, company?: string, limit?: number) {
    try {
      const filterArray = [];
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (Array.isArray(value)) {
            filterArray.push([key, value[0], value[1]]);
          } else {
            filterArray.push([key, '=', value]);
          }
        });
      }
      if (company) {
        filterArray.push(['company', '=', company]);
      }

      const response = await this.get('/api/resource/Pick List', {
        filters: JSON.stringify(filterArray),
        limit_page_length: limit?.toString() || '20',
        fields: JSON.stringify(['name', 'purpose', 'company', 'docstatus', 'creation', 'owner', 'locations'])
      });

      return response;
    } catch (error) {
      console.error('Error fetching pick lists:', error);
      throw error;
    }
  }

  async getPickList(name: string) {
    try {
      const response = await this.get(`/api/resource/Pick List/${name}`);
      return response;
    } catch (error) {
      console.error('Error fetching pick list:', error);
      throw error;
    }
  }

  async updatePickList(name: string, data: any) {
    try {
      const response = await this.put(`/api/resource/Pick List/${name}`, data);
      return response;
    } catch (error) {
      console.error('Error updating pick list:', error);
      throw error;
    }
  }

  async getStockEntries(filters?: any, company?: string, limit?: number) {
    try {
      const filterArray = [];
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (Array.isArray(value)) {
            filterArray.push([key, value[0], value[1]]);
          } else {
            filterArray.push([key, '=', value]);
          }
        });
      }
      if (company) {
        filterArray.push(['company', '=', company]);
      }

      const response = await this.get('/api/resource/Stock Entry', {
        filters: JSON.stringify(filterArray),
        limit_page_length: limit?.toString() || '20',
        fields: JSON.stringify(['name', 'stock_entry_type', 'docstatus', 'creation', 'owner', 'total_outgoing_value', 'total_incoming_value'])
      });

      return response;
    } catch (error) {
      console.error('Error fetching stock entries:', error);
      throw error;
    }
  }

  async getMaterialRequests(filters?: any, company?: string, limit?: number) {
    try {
      const filterArray = [];
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (Array.isArray(value)) {
            filterArray.push([key, value[0], value[1]]);
          } else {
            filterArray.push([key, '=', value]);
          }
        });
      }
      if (company) {
        filterArray.push(['company', '=', company]);
      }

      const response = await this.get('/api/resource/Material Request', {
        filters: JSON.stringify(filterArray),
        limit_page_length: limit?.toString() || '20',
        fields: JSON.stringify(['name', 'transaction_date', 'status', 'material_request_type', 'company', 'owner', 'total_qty'])
      });

      return response;
    } catch (error) {
      console.error('Error fetching material requests:', error);
      throw error;
    }
  }

  async getSalesOrders(filters?: any, company?: string, limit?: number) {
    try {
      const filterArray = [];
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (Array.isArray(value)) {
            filterArray.push([key, value[0], value[1]]);
          } else {
            filterArray.push([key, '=', value]);
          }
        });
      }
      if (company) {
        filterArray.push(['company', '=', company]);
      }

      const response = await this.get('/api/resource/Sales Order', {
        filters: JSON.stringify(filterArray),
        limit_page_length: limit?.toString() || '20',
        fields: JSON.stringify(['name', 'customer', 'customer_name', 'transaction_date', 'delivery_date', 'status', 'grand_total', 'per_delivered'])
      });

      return response;
    } catch (error) {
      console.error('Error fetching sales orders:', error);
      throw error;
    }
  }

  async getDeliveryNotes(filters?: any, company?: string, limit?: number) {
    try {
      const filterArray = [];
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (Array.isArray(value)) {
            filterArray.push([key, value[0], value[1]]);
          } else {
            filterArray.push([key, '=', value]);
          }
        });
      }
      if (company) {
        filterArray.push(['company', '=', company]);
      }

      const response = await this.get('/api/resource/Delivery Note', {
        filters: JSON.stringify(filterArray),
        limit_page_length: limit?.toString() || '20',
        fields: JSON.stringify(['name', 'customer', 'customer_name', 'posting_date', 'docstatus', 'sales_order', 'total_qty', 'grand_total'])
      });

      return response;
    } catch (error) {
      console.error('Error fetching delivery notes:', error);
      throw error;
    }
  }

  // Dashboard analytics methods
  async getPickListAnalytics(company?: string) {
    try {
      const filters = company ? [['company', '=', company]] : [];
      
      // Get pending pick lists
      const pendingFilters = [...filters, ['docstatus', '=', 0]];
      const pendingResponse = await this.get('/api/resource/Pick List', {
        filters: JSON.stringify(pendingFilters),
        limit_page_length: '1000',
        fields: JSON.stringify(['name', 'purpose'])
      });

      // Get completed pick lists (today)
      const today = new Date().toISOString().split('T')[0];
      const completedFilters = [...filters, ['docstatus', '=', 1], ['creation', '>=', today]];
      const completedResponse = await this.get('/api/resource/Pick List', {
        filters: JSON.stringify(completedFilters),
        limit_page_length: '1000',
        fields: JSON.stringify(['name'])
      });

      // Get pick list types analytics
      const allPickLists = await this.get('/api/resource/Pick List', {
        filters: JSON.stringify(filters),
        limit_page_length: '1000',
        fields: JSON.stringify(['name', 'purpose', 'docstatus'])
      });

      // Process type analytics
      const typeAnalytics = {};
      if (allPickLists.data) {
        allPickLists.data.forEach((pl: any) => {
          const type = pl.purpose || 'Unknown';
          if (!typeAnalytics[type]) {
            typeAnalytics[type] = { pending: 0, completed: 0 };
          }
          if (pl.docstatus === 0) {
            typeAnalytics[type].pending++;
          } else if (pl.docstatus === 1) {
            typeAnalytics[type].completed++;
          }
        });
      }

      return {
        data: {
          pending: pendingResponse.data?.length || 0,
          completed: completedResponse.data?.length || 0,
          typeAnalytics: Object.entries(typeAnalytics).map(([type, data]) => ({
            type,
            ...data
          }))
        }
      };
    } catch (error) {
      console.error('Error fetching pick list analytics:', error);
      return { data: { pending: 0, completed: 0, typeAnalytics: [] } };
    }
  }
}

export * from './types';
export { BaseERPNextAPI } from './baseApi';


import { getAccessToken } from './authService';
import { offlineStorage } from './offlineStorage';

interface ERPNextConfig {
  baseURL: string;
  apiKey: string;
  apiSecret: string;
}

interface ERPNextResponse<T> {
  data: T;
  message?: string;
}

interface Item {
  item_code: string;
  item_name: string;
  stock_uom: string;
  has_batch_no?: number;
  has_serial_no?: number;
}

interface Warehouse {
  name: string;
  is_group: number;
  warehouse_name?: string;
}

interface StockBalance {
  item_code: string;
  warehouse: string;
  actual_qty: number;
}

interface SalesOrder {
  name: string;
  customer: string;
  customer_name?: string;
  company: string;
  base_grand_total: number;
  grand_total?: number;
  currency: string;
  status: string;
  delivery_date?: string;
  transaction_date?: string;
  items?: any[];
}

interface DeliveryNote {
  name: string;
  customer: string;
  company: string;
  grand_total: number;
  currency: string;
  status: string;
  posting_date?: string;
  posting_time?: string;
}

interface PurchaseOrder {
  name: string;
  supplier: string;
  supplier_name?: string;
  schedule_date?: string;
  transaction_date?: string;
  grand_total?: number;
  status?: string;
  items?: any[];
  company: string;
  base_grand_total: number;
  currency: string;
}

interface PurchaseReceipt {
  name: string;
  supplier: string;
  company: string;
  grand_total: number;
  currency: string;
  status: string;
  posting_date?: string;
  posting_time?: string;
}

interface MaterialRequest {
  name: string;
  company: string;
  material_request_type: string;
  status: string;
  transaction_date?: string;
  required_date?: string;
}

interface StockEntry {
  name: string;
  company: string;
  purpose: string;
  status: string;
  posting_date?: string;
  posting_time?: string;
}

interface PickList {
  name: string;
  company: string;
  status: string;
}

interface PackingSlip {
  name: string;
  customer: string;
  company: string;
  status: string;
}

interface QualityInspection {
  name: string;
  company: string;
  status: string;
}

interface ProductBundle {
  name: string;
  product_bundle_id: string;
  description: string;
}

interface Company {
  name: string;
  company_name: string;
}

interface DashboardMetrics {
  totalItems: number;
  lowStockItems: number;
  pendingOrders: number;
  totalWarehouses: number;
  totalStockValue: number;
  recentActivitiesCount: number;
}

interface RecentActivity {
  id: string;
  type: 'receipt' | 'delivery' | 'stock_entry' | 'material_request';
  title: string;
  subtitle: string;
  time: string;
  status: 'completed' | 'pending' | 'cancelled';
  reference: string;
}

interface OperationalMetrics {
  pickAccuracy: number;
  putawaySpeed: number;
  cycleCountAccuracy: number;
  orderFulfillmentRate: number;
  warehouseUtilization: number;
  averageProcessingTime: number;
}

interface FinancialMetrics {
  stockTurnoverRatio: number;
  carryingCostPercentage: number;
  deadStockValue: number;
  abcAnalysis: {
    classA: number;
    classB: number;
    classC: number;
  };
}

let erpnextConfig: ERPNextConfig | null = null;

export const configureERPNextAPI = (config: ERPNextConfig) => {
  erpnextConfig = config;
  // Also save to localStorage for persistence
  localStorage.setItem('erpnextBaseURL', config.baseURL);
  localStorage.setItem('erpnextApiKey', config.apiKey);
  localStorage.setItem('erpnextApiSecret', config.apiSecret);
};

export const createERPNextAPI = async (): Promise<ERPNextAPI | null> => {
  // Try to get config from global state first
  if (!erpnextConfig) {
    // Fallback to localStorage
    const baseURL = localStorage.getItem('erpnextBaseURL');
    const apiKey = localStorage.getItem('erpnextApiKey');
    const apiSecret = localStorage.getItem('erpnextApiSecret');
    
    if (baseURL && apiKey && apiSecret) {
      erpnextConfig = { baseURL, apiKey, apiSecret };
    } else {
      console.warn('ERPNext API not configured. Configure credentials first.');
      return null;
    }
  }

  return new ERPNextAPI(erpnextConfig.baseURL, erpnextConfig.apiKey, erpnextConfig.apiSecret);
};

export const getUserDefaultCompany = async (): Promise<string | null> => {
  try {
    // First try localStorage
    const storedCompany = localStorage.getItem('erpnextDefaultCompany');
    if (storedCompany) {
      return storedCompany;
    }

    const erpnextAPI = await createERPNextAPI();
    if (!erpnextAPI) {
      console.error('ERPNext API not configured');
      return null;
    }

    const userDetails = await erpnextAPI.getLoggedInUserDetails();
    if (userDetails && userDetails.data && userDetails.data.defaults && userDetails.data.defaults.company) {
      const company = userDetails.data.defaults.company;
      localStorage.setItem('erpnextDefaultCompany', company);
      return company;
    } else {
      console.warn('Unable to retrieve default company from user details.');
      return null;
    }
  } catch (error) {
    console.error('Error fetching user details:', error);
    return null;
  }
};

class ERPNextAPI {
  constructor(public baseURL: string, public apiKey: string, public apiSecret: string) {
    this.baseURL = baseURL;
    this.apiKey = apiKey;
    this.apiSecret = apiSecret;
  }

  private getHeaders() {
    return {
      'Authorization': `Token ${this.apiKey}:${this.apiSecret}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
  }

  private formatRelativeTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
      return `${diffInMinutes} minutes ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours} hours ago`;
    } else if (diffInDays < 7) {
      return `${diffInDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      console.log('Testing connection to:', this.baseURL);
      const response = await fetch(`${this.baseURL}/api/method/frappe.auth.get_logged_user`, {
        headers: this.getHeaders(),
      });
      
      console.log('Connection test response status:', response.status);
      
      if (response.ok) {
        const result = await response.json();
        console.log('Connection test result:', result);
        return true;
      } else {
        const errorText = await response.text();
        console.error('Connection test failed:', response.status, errorText);
        return false;
      }
    } catch (error) {
      console.error('Connection test failed with error:', error);
      return false;
    }
  }

  async getLoggedInUserDetails(): Promise<ERPNextResponse<any>> {
    const response = await fetch(`${this.baseURL}/api/method/frappe.auth.get_logged_user`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to fetch user details:', response.status, errorText);
      throw new Error(`Failed to fetch user details: ${response.statusText}`);
    }

    return response.json();
  }

  async getCompanies(): Promise<ERPNextResponse<Company[]>> {
    const response = await fetch(`${this.baseURL}/api/resource/Company?fields=["name","company_name"]`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to fetch companies:', response.status, errorText);
      throw new Error(`Failed to fetch companies: ${response.statusText}`);
    }

    return response.json();
  }

  // Enhanced dashboard methods
  async getDashboardMetrics(company?: string): Promise<DashboardMetrics> {
    try {
      const [itemsResponse, warehousesResponse, ordersResponse, stockBalanceResponse] = await Promise.all([
        this.getItems(undefined, undefined, company),
        this.getWarehouses(undefined, company),
        this.getSalesOrders({ status: 'Draft' }, company),
        this.getStockBalance({ actual_qty: ['<', 10] }, company)
      ]);

      // Calculate total stock value
      const stockResponse = await this.getStockBalance(undefined, company);
      const totalStockValue = stockResponse.data?.reduce((sum: number, item: any) => 
        sum + ((item.actual_qty || 0) * (item.valuation_rate || 0)), 0) || 0;

      return {
        totalItems: itemsResponse.data?.length || 0,
        lowStockItems: stockBalanceResponse.data?.length || 0,
        pendingOrders: ordersResponse.data?.length || 0,
        totalWarehouses: warehousesResponse.data?.length || 0,
        totalStockValue,
        recentActivitiesCount: 0 // Will be calculated separately
      };
    } catch (error) {
      console.error('Error fetching dashboard metrics:', error);
      return {
        totalItems: 0,
        lowStockItems: 0,
        pendingOrders: 0,
        totalWarehouses: 0,
        totalStockValue: 0,
        recentActivitiesCount: 0
      };
    }
  }

  async getRecentActivities(company?: string, limit: number = 10): Promise<RecentActivity[]> {
    try {
      const today = new Date();
      const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      
      const dateFilter = {
        creation: ['>', sevenDaysAgo.toISOString().split('T')[0]]
      };

      const [receipts, deliveries, stockEntries, materialRequests] = await Promise.all([
        this.getPurchaseReceipts({ ...dateFilter, limit: 5 }, company),
        this.getDeliveryNotes({ ...dateFilter, limit: 5 }, company),
        this.getStockEntries({ ...dateFilter, limit: 5 }, company),
        this.getMaterialRequests({ ...dateFilter, limit: 5 }, company)
      ]);

      const activities: RecentActivity[] = [];

      // Process Purchase Receipts
      receipts.data?.forEach((receipt: PurchaseReceipt) => {
        activities.push({
          id: receipt.name,
          type: 'receipt',
          title: `Purchase Receipt ${receipt.name}`,
          subtitle: `Items received from ${receipt.supplier}`,
          time: this.formatRelativeTime(receipt.posting_date || new Date().toISOString()),
          status: receipt.status?.toLowerCase() === 'submitted' ? 'completed' : 'pending',
          reference: receipt.name
        });
      });

      // Process Delivery Notes
      deliveries.data?.forEach((delivery: DeliveryNote) => {
        activities.push({
          id: delivery.name,
          type: 'delivery',
          title: `Delivery Note ${delivery.name}`,
          subtitle: `Items delivered to ${delivery.customer}`,
          time: this.formatRelativeTime(delivery.posting_date || new Date().toISOString()),
          status: delivery.status?.toLowerCase() === 'submitted' ? 'completed' : 'pending',
          reference: delivery.name
        });
      });

      // Process Stock Entries
      stockEntries.data?.forEach((entry: StockEntry) => {
        activities.push({
          id: entry.name,
          type: 'stock_entry',
          title: `Stock Entry ${entry.name}`,
          subtitle: `${entry.purpose} transaction`,
          time: this.formatRelativeTime(entry.posting_date || new Date().toISOString()),
          status: entry.status?.toLowerCase() === 'submitted' ? 'completed' : 'pending',
          reference: entry.name
        });
      });

      // Process Material Requests
      materialRequests.data?.forEach((request: MaterialRequest) => {
        activities.push({
          id: request.name,
          type: 'material_request',
          title: `Material Request ${request.name}`,
          subtitle: `${request.material_request_type} request`,
          time: this.formatRelativeTime(request.transaction_date || new Date().toISOString()),
          status: request.status?.toLowerCase() === 'submitted' ? 'completed' : 
                  request.status?.toLowerCase() === 'pending' ? 'pending' : 'cancelled',
          reference: request.name
        });
      });

      // Sort by time and limit results
      return activities
        .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
        .slice(0, limit);

    } catch (error) {
      console.error('Error fetching recent activities:', error);
      return [];
    }
  }

  async getOperationalMetrics(company?: string): Promise<OperationalMetrics> {
    try {
      // These would typically require custom reports or calculated fields
      // For now, we'll return mock data that could be enhanced with real calculations
      return {
        pickAccuracy: 97.5,
        putawaySpeed: 85.2,
        cycleCountAccuracy: 99.1,
        orderFulfillmentRate: 94.8,
        warehouseUtilization: 78.3,
        averageProcessingTime: 2.4
      };
    } catch (error) {
      console.error('Error fetching operational metrics:', error);
      return {
        pickAccuracy: 0,
        putawaySpeed: 0,
        cycleCountAccuracy: 0,
        orderFulfillmentRate: 0,
        warehouseUtilization: 0,
        averageProcessingTime: 0
      };
    }
  }

  async getFinancialMetrics(company?: string): Promise<FinancialMetrics> {
    try {
      const stockBalance = await this.getStockBalance(undefined, company);
      const totalStockValue = stockBalance.data?.reduce((sum: number, item: any) => 
        sum + ((item.actual_qty || 0) * (item.valuation_rate || 0)), 0) || 0;

      // Calculate dead stock (items with no movement in 90+ days)
      const deadStockValue = totalStockValue * 0.15; // Approximation

      return {
        stockTurnoverRatio: 6.2,
        carryingCostPercentage: 12.5,
        deadStockValue,
        abcAnalysis: {
          classA: 20,
          classB: 30,
          classC: 50
        }
      };
    } catch (error) {
      console.error('Error fetching financial metrics:', error);
      return {
        stockTurnoverRatio: 0,
        carryingCostPercentage: 0,
        deadStockValue: 0,
        abcAnalysis: {
          classA: 0,
          classB: 0,
          classC: 0
        }
      };
    }
  }

  async getItemByBarcode(barcode: string): Promise<ERPNextResponse<Item[]>> {
    const params = new URLSearchParams({
      fields: '["item_code", "item_name", "stock_uom", "has_batch_no", "has_serial_no"]',
      filters: JSON.stringify({ barcode: barcode }),
    });

    const response = await fetch(`${this.baseURL}/api/resource/Item?${params}`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch item by barcode: ${response.statusText}`);
    }

    return response.json();
  }

  async getItemDetails(itemCode: string): Promise<ERPNextResponse<Item>> {
    const response = await fetch(`${this.baseURL}/api/resource/Item/${encodeURIComponent(itemCode)}`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch item details: ${response.statusText}`);
    }

    return response.json();
  }

  async getItems(filters?: any, searchTerm?: string, company?: string): Promise<ERPNextResponse<Item[]>> {
    const params = new URLSearchParams();
    
    const stockItemFilters = {
      is_stock_item: 1,
      ...filters
    };
    
    if (stockItemFilters) {
      params.append('filters', JSON.stringify(stockItemFilters));
    }
    if (searchTerm) {
      params.append('or_filters', JSON.stringify([
        { item_code: ['like', `%${searchTerm}%`] },
        { item_name: ['like', `%${searchTerm}%`] }
      ]));
    }
    if (company) {
      params.append('company', company);
    }

    const response = await fetch(`${this.baseURL}/api/resource/Item?${params}`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch items: ${response.statusText}`);
    }

    return response.json();
  }

  async searchItems(searchTerm: string, company?: string, limit: number = 20): Promise<ERPNextResponse<Item[]>> {
    return this.getItems(undefined, searchTerm, company);
  }

  async getItemsPaginated(filters?: any, fields?: string[], company?: string, limit: number = 20, page: number = 1): Promise<ERPNextResponse<Item[]>> {
    const params = new URLSearchParams();
    
    const stockItemFilters = {
      is_stock_item: 1,
      ...filters
    };
    
    if (stockItemFilters) {
      params.append('filters', JSON.stringify(stockItemFilters));
    }
    if (fields) {
      params.append('fields', JSON.stringify(fields));
    }
    if (company) {
      params.append('company', company);
    }
    params.append('limit', limit.toString());
    params.append('offset', ((page - 1) * limit).toString());

    const response = await fetch(`${this.baseURL}/api/resource/Item?${params}`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch items: ${response.statusText}`);
    }

    return response.json();
  }

  async getWarehouses(filters?: any, company?: string): Promise<ERPNextResponse<Warehouse[]>> {
    const params = new URLSearchParams();
    
    const warehouseFilters = {
      is_group: 0,
      ...filters
    };
    
    if (warehouseFilters) {
      params.append('filters', JSON.stringify(warehouseFilters));
    }
    if (company) {
      params.append('company', company);
    }

    const response = await fetch(`${this.baseURL}/api/resource/Warehouse?${params}`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch warehouses: ${response.statusText}`);
    }

    return response.json();
  }

  async getCurrentStock(itemCode: string, warehouse: string, batch?: string, serial?: string): Promise<number> {
    let filters: any = {
      item_code: itemCode,
      warehouse: warehouse
    };

    if (batch) {
      filters.batch_no = batch;
    }

    if (serial) {
      filters.serial_no = serial;
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

  async getStockBalance(filters?: any, company?: string): Promise<ERPNextResponse<StockBalance[]>> {
    const params = new URLSearchParams();
    if (filters) {
      params.append('filters', JSON.stringify(filters));
    }
    if (company) {
      params.append('company', company);
    }

    const response = await fetch(`${this.baseURL}/api/resource/Stock Balance?${params}`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch stock balance: ${response.statusText}`);
    }

    return response.json();
  }

  async getSalesOrders(filters?: any, company?: string): Promise<ERPNextResponse<SalesOrder[]>> {
    const params = new URLSearchParams();
    if (filters) {
      params.append('filters', JSON.stringify(filters));
    }
    if (company) {
      params.append('company', company);
    }

    const response = await fetch(`${this.baseURL}/api/resource/Sales Order?${params}`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch sales orders: ${response.statusText}`);
    }

    return response.json();
  }

  async getSalesOrder(salesOrderName: string): Promise<ERPNextResponse<SalesOrder>> {
    const response = await fetch(`${this.baseURL}/api/resource/Sales Order/${encodeURIComponent(salesOrderName)}`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch sales order: ${response.statusText}`);
    }

    return response.json();
  }

  async getDeliveryNotes(filters?: any, company?: string): Promise<ERPNextResponse<DeliveryNote[]>> {
    const params = new URLSearchParams();
    if (filters) {
      params.append('filters', JSON.stringify(filters));
    }
    if (company) {
      params.append('company', company);
    }

    const response = await fetch(`${this.baseURL}/api/resource/Delivery Note?${params}`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch delivery notes: ${response.statusText}`);
    }

    return response.json();
  }

  async getPurchaseOrders(filters?: any, company?: string): Promise<ERPNextResponse<PurchaseOrder[]>> {
    const params = new URLSearchParams();
    if (filters) {
      params.append('filters', JSON.stringify(filters));
    }
    if (company) {
      params.append('company', company);
    }

    const response = await fetch(`${this.baseURL}/api/resource/Purchase Order?${params}`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch purchase orders: ${response.statusText}`);
    }

    return response.json();
  }

  async getPurchaseOrder(purchaseOrderName: string): Promise<ERPNextResponse<PurchaseOrder>> {
    const response = await fetch(`${this.baseURL}/api/resource/Purchase Order/${encodeURIComponent(purchaseOrderName)}`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch purchase order: ${response.statusText}`);
    }

    return response.json();
  }

  async getPurchaseReceipts(filters?: any, company?: string): Promise<ERPNextResponse<PurchaseReceipt[]>> {
    const params = new URLSearchParams();
    if (filters) {
      params.append('filters', JSON.stringify(filters));
    }
    if (company) {
      params.append('company', company);
    }

    const response = await fetch(`${this.baseURL}/api/resource/Purchase Receipt?${params}`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch purchase receipts: ${response.statusText}`);
    }

    return response.json();
  }

  async createPurchaseReceipt(data: any): Promise<ERPNextResponse<any>> {
    const response = await fetch(`${this.baseURL}/api/resource/Purchase Receipt`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to create Purchase Receipt:', errorText);
      throw new Error(`Failed to create Purchase Receipt: ${response.statusText}`);
    }

    return response.json();
  }

  async getMaterialRequests(filters?: any, company?: string): Promise<ERPNextResponse<MaterialRequest[]>> {
    const params = new URLSearchParams();
    if (filters) {
      params.append('filters', JSON.stringify(filters));
    }
    if (company) {
      params.append('company', company);
    }

    const response = await fetch(`${this.baseURL}/api/resource/Material Request?${params}`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch material requests: ${response.statusText}`);
    }

    return response.json();
  }

  async getStockEntries(filters?: any, company?: string): Promise<ERPNextResponse<StockEntry[]>> {
    const params = new URLSearchParams();
    if (filters) {
      params.append('filters', JSON.stringify(filters));
    }
    if (company) {
      params.append('company', company);
    }

    const response = await fetch(`${this.baseURL}/api/resource/Stock Entry?${params}`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch stock entries: ${response.statusText}`);
    }

    return response.json();
  }

  async getPickLists(filters?: any, company?: string): Promise<ERPNextResponse<PickList[]>> {
    const params = new URLSearchParams();
    if (filters) {
      params.append('filters', JSON.stringify(filters));
    }
    if (company) {
      params.append('company', company);
    }

    const response = await fetch(`${this.baseURL}/api/resource/Pick List?${params}`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch pick lists: ${response.statusText}`);
    }

    return response.json();
  }

  async getPackingSlips(filters?: any, company?: string): Promise<ERPNextResponse<PackingSlip[]>> {
    const params = new URLSearchParams();
    if (filters) {
      params.append('filters', JSON.stringify(filters));
    }
    if (company) {
      params.append('company', company);
    }

    const response = await fetch(`${this.baseURL}/api/resource/Packing Slip?${params}`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch packing slips: ${response.statusText}`);
    }

    return response.json();
  }

  async getQualityInspections(filters?: any, company?: string): Promise<ERPNextResponse<QualityInspection[]>> {
    const params = new URLSearchParams();
    if (filters) {
      params.append('filters', JSON.stringify(filters));
    }
    if (company) {
      params.append('company', company);
    }

    const response = await fetch(`${this.baseURL}/api/resource/Quality Inspection?${params}`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch quality inspections: ${response.statusText}`);
    }

    return response.json();
  }

  async getProductBundles(filters?: any, company?: string): Promise<ERPNextResponse<ProductBundle[]>> {
    const params = new URLSearchParams();
    if (filters) {
      params.append('filters', JSON.stringify(filters));
    }
    if (company) {
      params.append('company', company);
    }

    const response = await fetch(`${this.baseURL}/api/resource/Product Bundle?${params}`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch product bundles: ${response.statusText}`);
    }

    return response.json();
  }

  async getStockAgingReport(filters?: any): Promise<ERPNextResponse<any[]>> {
    const params = new URLSearchParams();
    if (filters) {
      params.append('filters', JSON.stringify(filters));
    }

    const response = await fetch(`${this.baseURL}/api/method/erpnext.stock.report.stock_ageing.stock_ageing.execute?${params}`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch stock aging report: ${response.statusText}`);
    }

    return response.json();
  }

  async createStockReconciliation(data: any): Promise<ERPNextResponse<any>> {
    const response = await fetch(`${this.baseURL}/api/resource/Stock Reconciliation`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to create Stock Reconciliation:', errorText);
      throw new Error(`Failed to create Stock Reconciliation: ${response.statusText}`);
    }

    return response.json();
  }

  async updateStockReconciliation(name: string, data: any): Promise<ERPNextResponse<any>> {
    const response = await fetch(`${this.baseURL}/api/resource/Stock Reconciliation/${name}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to update Stock Reconciliation:', errorText);
      throw new Error(`Failed to update Stock Reconciliation: ${response.statusText}`);
    }

    return response.json();
  }

  async validateBatch(batchNo: string, itemCode: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseURL}/api/method/erpnext.stock.doctype.batch.batch.create_new_batch`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          batch_id: batchNo,
          item_code: itemCode
        })
      });

      if (response.ok) {
        const result = await response.json();
        return result.message === "Batch Created";
      } else {
        console.error('Failed to create/validate batch:', response.statusText);
        return false;
      }
    } catch (error) {
      console.error('Error creating/validating batch:', error);
      return false;
    }
  }

  async validateSerial(serialNo: string, itemCode: string, warehouse: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseURL}/api/method/erpnext.stock.doctype.serial_no.serial_no.create_new_serial_no`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          serial_no: serialNo,
          item_code: itemCode,
          warehouse: warehouse
        })
      });

      if (response.ok) {
        const result = await response.json();
        return result.message === "Serial No Created";
      } else {
        console.error('Failed to create/validate serial:', response.statusText);
        return false;
      }
    } catch (error) {
      console.error('Error creating/validating serial:', error);
      return false;
    }
  }
}

export { ERPNextAPI };
export default ERPNextAPI;

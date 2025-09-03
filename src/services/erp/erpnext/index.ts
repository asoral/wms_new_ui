
import { ERPNextBaseAPI } from './baseApi';
import { ERPNextSalesAPI } from './salesApi';
import { ERPNextStockAPI } from './stockApi';
import { ERPNextMaterialAPI } from './materialApi';
import { ERPNextPurchaseAPI } from './purchaseApi';
import { ERPNextItemsAPI } from './itemsApi';

export class ERPNextAPI extends ERPNextBaseAPI {
  private salesAPI: ERPNextSalesAPI;
  public stockAPI: ERPNextStockAPI;
  private materialAPI: ERPNextMaterialAPI;
  private purchaseAPI: ERPNextPurchaseAPI;
  public itemsAPI: ERPNextItemsAPI;

  constructor(baseURL: string, apiKey: string, apiSecret: string) {
    super(baseURL, apiKey, apiSecret);
    this.salesAPI = new ERPNextSalesAPI(baseURL, apiKey, apiSecret);
    this.stockAPI = new ERPNextStockAPI(baseURL, apiKey, apiSecret);
    this.materialAPI = new ERPNextMaterialAPI(baseURL, apiKey, apiSecret);
    this.purchaseAPI = new ERPNextPurchaseAPI(baseURL, apiKey, apiSecret);
    this.itemsAPI = new ERPNextItemsAPI(baseURL, apiKey, apiSecret);
  }

  // Public getters for API properties
  get getBaseURL() { return this.baseURL; }
  get getApiKey() { return this.apiKey; }
  get getApiSecret() { return this.apiSecret; }

  // Item methods - delegate to itemsAPI with correct signatures
  async getItems(filters?: any, limitPageLength?: number) {
    return this.itemsAPI.getItems(filters, undefined, limitPageLength || 20, 0);
  }

  async getItemDetails(itemCode: string) {
    return this.itemsAPI.getItemDetails(itemCode);
  }

  async searchItems(searchTerm: string, limitPageLength?: number) {
    console.log('ERPNextAPI.searchItems called with:', searchTerm, 'limit:', limitPageLength);
    const limit = limitPageLength || 10;
    console.log('Calling itemsAPI.searchItems with limit:', limit);
    return this.itemsAPI.searchItems(searchTerm, limit);
  }

  async searchItemsByBarcode(barcode: string) {
    return this.itemsAPI.searchItemsByBarcode(barcode);
  }

  // Sales methods
  async getSalesOrders(filters?: any, company?: string, limitPageLength?: number) {
    return this.salesAPI.getSalesOrders(filters, company, limitPageLength);
  }

  async getSalesOrder(soNumber: string) {
    return this.salesAPI.getSalesOrder(soNumber);
  }

  async searchSalesOrders(searchTerm: string, company?: string, limitPageLength?: number) {
    return this.salesAPI.searchSalesOrders(searchTerm, company, limitPageLength);
  }

  async createDeliveryNote(deliveryData: any) {
    return this.salesAPI.createDeliveryNote(deliveryData);
  }

  async getDeliveryNotes(filters?: any, company?: string, limitPageLength?: number) {
    return this.salesAPI.getDeliveryNotes(filters, company, limitPageLength);
  }

  async getDeliveryNote(name: string) {
    return this.callAPI(`Delivery Note/${name}`, 'GET');
  }

  async updateDeliveryNote(name: string, deliveryData: any) {
    return this.salesAPI.updateDeliveryNote(name, deliveryData);
  }

  async submitDeliveryNote(name: string) {
    return this.salesAPI.submitDeliveryNote(name);
  }

  // Stock methods - fixed parameter delegation
  async getStockBalance(filters?: any) {
    return this.stockAPI.getStockBalance(filters);
  }

  async getCurrentStock(itemCode: string, warehouse: string) {
    return this.stockAPI.getCurrentStock(itemCode, warehouse);
  }

  async createStockEntry(stockEntryData: any) {
    return this.callAPI('Stock Entry', 'POST', stockEntryData);
  }

  async updateStockEntry(name: string, data: any) {
    return this.callAPI(`Stock Entry/${name}`, 'PUT', data);
  }

  async getStockEntries(filters?: any, company?: string, limitPageLength?: number, orderBy?: string) {
    return this.stockAPI.getStockEntries(filters, company, limitPageLength, orderBy);
  }

  async getStockEntry(name: string) {
    return this.callAPI(`Stock Entry/${name}`, 'GET');
  }

  async submitStockEntry(stockEntryName: string) {
    return this.callAPI(`Stock Entry/${stockEntryName}`, 'PUT', { docstatus: 1 });
  }

  async getStockReconciliations(filters?: any, limitPageLength?: number, orderBy?: string) {
    const fields = [
      'name',
      'purpose', 
      'docstatus',
      'posting_date',
      'posting_time',
      'company',
      'difference_amount',
      'creation',
      'owner'
    ];
    
    // Default to last 5 records ordered by creation date for performance
    const limit = limitPageLength || 5;
    const order = orderBy || 'creation desc';
    
    return this.callAPI('Stock Reconciliation', 'GET', undefined, filters, limit, fields, order);
  }

  async getStockReconciliation(name: string) {
    return this.callAPI(`Stock Reconciliation/${name}`, 'GET');
  }

  async getWarehouses(filters?: any, company?: string, limitPageLength?: number) {
    return this.callAPI('Warehouse', 'GET', undefined, filters, limitPageLength);
  }

  async getBinStock(itemCode: string, warehouse?: string) {
    if (warehouse) {
      // If specific warehouse is provided, use the existing method
      const filters = [
        ['item_code', '=', itemCode],
        ['warehouse', '=', warehouse]
      ];
      
      const fields = [
        'name',
        'item_code',
        'warehouse',
        'actual_qty',
        'reserved_qty',
        'planned_qty',
        'ordered_qty',
        'projected_qty'
      ];
      
      console.log('Fetching Bin stock with filters:', filters);
      console.log('Fetching Bin stock with fields:', fields);
      
      return this.callAPI('Bin', 'GET', undefined, filters, undefined, fields);
    } else {
      // No specific warehouse - get company-filtered bins
      console.log('Fetching company-filtered bin stock for item:', itemCode);
      
      // Get user's default company
      const { getUserDefaultCompany } = await import('@/services/erpnextApi');
      const defaultCompany = await getUserDefaultCompany();
      
      if (!defaultCompany) {
        console.warn('No default company found, fetching all bins for item');
        // Fallback to all bins for the item
        const filters = [['item_code', '=', itemCode]];
        const fields = [
          'name',
          'item_code',
          'warehouse',
          'actual_qty',
          'reserved_qty',
          'planned_qty',
          'ordered_qty',
          'projected_qty'
        ];
        
        return this.callAPI('Bin', 'GET', undefined, filters, undefined, fields);
      }
      
      console.log('Using company for bin filtering:', defaultCompany);
      return this.stockAPI.getBinStockForCompany(itemCode, defaultCompany);
    }
  }

  async getCompanies(filters?: any, limitPageLength?: number) {
    return this.callAPI('Company', 'GET', undefined, filters, limitPageLength);
  }

  // Material Request methods
  async getMaterialRequests(filters?: any, company?: string, limitPageLength?: number) {
    return this.materialAPI.getMaterialRequests(filters, company, limitPageLength);
  }

  async getMaterialRequest(name: string) {
    return this.materialAPI.getMaterialRequest(name);
  }

  async createMaterialRequest(data: any) {
    return this.materialAPI.createMaterialRequest(data);
  }

  async updateMaterialRequest(name: string, data: any) {
    return this.materialAPI.updateMaterialRequest(name, data);
  }

  async searchMaterialRequests(searchTerm: string, company?: string, limitPageLength?: number) {
    return this.materialAPI.searchMaterialRequests(searchTerm, company, limitPageLength);
  }

  async submitMaterialRequest(name: string) {
    return this.materialAPI.submitMaterialRequest(name);
  }

  async searchMaterialRequestsForStockEntry(searchTerm: string, company?: string, limitPageLength?: number) {
    return this.materialAPI.searchMaterialRequests(searchTerm, company, limitPageLength);
  }

  // Purchase methods
  async getPurchaseOrders(filters?: any, company?: string, limitPageLength?: number, orderBy?: string) {
    return this.purchaseAPI.getPurchaseOrders(filters, company, limitPageLength, 0, orderBy);
  }

  async getPurchaseOrder(poNumber: string) {
    return this.purchaseAPI.getPurchaseOrder(poNumber);
  }

  async searchPurchaseOrders(searchTerm: string, company?: string, limitPageLength?: number) {
    return this.purchaseAPI.getPurchaseOrders([['name', 'like', `%${searchTerm}%`]], company, limitPageLength);
  }

  async searchPurchaseOrdersForStockEntry(searchTerm: string, company?: string, limitPageLength?: number) {
    return this.purchaseAPI.getPurchaseOrders([['name', 'like', `%${searchTerm}%`]], company, limitPageLength);
  }

  async searchSalesOrdersForStockEntry(searchTerm: string, company?: string, limitPageLength?: number) {
    return this.salesAPI.searchSalesOrders(searchTerm, company, limitPageLength);
  }

  async searchBOMs(searchTerm: string, limitPageLength?: number) {
    return this.callAPI('BOM', 'GET', undefined, [['name', 'like', `%${searchTerm}%`]], limitPageLength);
  }

  async createPurchaseReceipt(receiptData: any) {
    return this.purchaseAPI.createPurchaseReceipt(receiptData);
  }

  async updatePurchaseReceipt(name: string, data: any) {
    return this.purchaseAPI.updatePurchaseReceipt(name, data);
  }

  async getPurchaseReceipt(name: string) {
    return this.purchaseAPI.getPurchaseReceipt(name);
  }

  async getPurchaseReceipts(filters?: any, company?: string, limitPageLength?: number, orderBy?: string) {
    return this.purchaseAPI.getPurchaseReceipts(filters, company, limitPageLength, 0, orderBy);
  }

  async submitPurchaseReceipt(name: string) {
    return this.purchaseAPI.submitPurchaseReceipt(name);
  }

  // Pick List methods
  async getPickLists(filters?: any, company?: string, limitPageLength?: number, orderBy?: string) {
    return this.stockAPI.getPickLists(filters, company, limitPageLength, orderBy);
  }

  async getPickList(name: string) {
    return this.callAPI(`Pick List/${name}`, 'GET');
  }

  async searchPickLists(searchTerm: string, company?: string, limitPageLength?: number) {
    return this.callAPI('Pick List', 'GET', undefined, [['name', 'like', `%${searchTerm}%`]], limitPageLength);
  }

  async createPickList(data: any) {
    return this.callAPI('Pick List', 'POST', data);
  }

  async updatePickList(name: string, data: any) {
    return this.callAPI(`Pick List/${name}`, 'PUT', data);
  }

  // Removed getItemLocations method as it doesn't exist in ERPNext

  async submitPickList(name: string) {
    return this.stockAPI.submitPickList(name);
  }

  async getPickListItems(pickListName: string) {
    const response = await this.getPickList(pickListName);
    return response?.data?.locations || [];
  }

  async createPickListFromDocument(data: any) {
    return this.callAPI('Pick List', 'POST', data);
  }

  // Work Order methods
  async getWorkOrders(filters?: any, company?: string, limitPageLength?: number) {
    return this.callAPI('Work Order', 'GET', undefined, filters, limitPageLength);
  }

  async getWorkOrder(name: string) {
    return this.callAPI(`Work Order/${name}`, 'GET');
  }

  async searchWorkOrders(searchTerm: string, company?: string, limitPageLength?: number) {
    const filters = [];
    if (company) {
      filters.push(['company', '=', company]);
    }
    
    const orFilters = [
      ['name', 'like', `%${searchTerm}%`],
      ['production_item', 'like', `%${searchTerm}%`],
      ['item_name', 'like', `%${searchTerm}%`]
    ];

    const params = new URLSearchParams({
      filters: JSON.stringify(filters),
      or_filters: JSON.stringify(orFilters),
      fields: JSON.stringify([
        'name',
        'production_item',
        'item_name',
        'qty',
        'status',
        'planned_start_date',
        'company'
      ]),
      limit_page_length: String(limitPageLength || 20)
    });

    const response = await fetch(`${this.baseURL}/api/resource/Work Order?${params}`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to search work orders: ${response.statusText}`);
    }

    return response.json();
  }

  // Customer methods
  async getCustomers(filters?: any, company?: string, limitPageLength?: number) {
    return this.callAPI('Customer', 'GET', undefined, filters, limitPageLength);
  }

  async getCustomer(name: string) {
    return this.callAPI(`Customer/${name}`, 'GET');
  }

  async searchCustomers(searchTerm: string, company?: string, limitPageLength?: number) {
    const filters = [];
    if (company) {
      filters.push(['company', '=', company]);
    }
    
    // If there's a search term, add it to filters (simpler approach)
    if (searchTerm && searchTerm.trim()) {
      filters.push(['customer_name', 'like', `%${searchTerm}%`]);
    }

    const params = new URLSearchParams({
      filters: JSON.stringify(filters),
      fields: JSON.stringify([
        'name',
        'customer_name',
        'customer_group',
        'territory',
        'mobile_no',
        'email_id'
      ]),
      limit_page_length: String(limitPageLength || 20)
    });

    const response = await fetch(`${this.baseURL}/api/resource/Customer?${params}`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to search customers: ${response.statusText}`);
    }

    return response.json();
  }

  // Get Sales Orders for Customer for Delivery Pick Lists
  async getSalesOrdersForCustomer(customerName: string, company?: string) {
    const filters = [
      ['customer', '=', customerName],
      ['docstatus', '=', 1], // Only submitted orders
      ['status', 'in', ['To Deliver', 'To Bill']] // Only orders ready for delivery
    ];
    
    if (company) {
      filters.push(['company', '=', company]);
    }

    const fields = [
      'name',
      'customer',
      'customer_name',
      'transaction_date',
      'delivery_date',
      'grand_total',
      'status',
      'per_delivered',
      'items'
    ];

    return this.callAPI('Sales Order', 'GET', undefined, filters, undefined, fields);
  }

  // Call ERPNext server method
  async callMethod(doctype: string, docname: string, method: string, args: any = {}) {
    return this.stockAPI.callMethod(doctype, docname, method, args);
  }

  // Delete Pick List
  async deletePickList(name: string) {
    return this.stockAPI.deletePickList(name);
  }

  // Quality Inspections
  async getQualityInspections(filters?: any, limitPageLength?: number) {
    return this.callAPI('Quality Inspection', 'GET', undefined, filters, limitPageLength);
  }

  // Product Bundles
  async getProductBundles(filters?: any, limitPageLength?: number) {
    return this.callAPI('Product Bundle', 'GET', undefined, filters, limitPageLength);
  }

  // Packing Slips
  async getPackingSlips(filters?: any, company?: string, limitPageLength?: number, orderBy?: string) {
    // Default to last 5 records ordered by creation date for performance
    const limit = limitPageLength || 5;
    const order = orderBy || 'creation desc';
    
    let finalFilters = filters || [];
    if (company) {
      finalFilters = [...(Array.isArray(finalFilters) ? finalFilters : []), ['company', '=', company]];
    }
    
    return this.callAPI('Packing Slip', 'GET', undefined, finalFilters, limit, undefined, order);
  }

  // Generic API call method - updated to support fields and order parameters
  async callAPI(endpoint: string, method: string = 'GET', data?: any, filters?: any, limitPageLength?: number, fields?: string[], orderBy?: string) {
    const params = this.buildQueryParams(filters, fields, limitPageLength, orderBy);
    const url = `${this.baseURL}/api/resource/${endpoint}${params ? '?' + params : ''}`;
    
    console.log('API URL:', url);
    
    const options: RequestInit = {
      method,
      headers: this.getHeaders(),
    };

    if (data && method !== 'GET') {
      options.headers = {
        ...options.headers,
        'Content-Type': 'application/json'
      };
      options.body = JSON.stringify(data);
    }

    const response = await fetch(url, options);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`${endpoint} API Error:`, response.status, errorText);
      throw new Error(`Failed to ${method} ${endpoint}: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }
}

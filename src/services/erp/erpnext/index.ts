
import { ERPNextBaseAPI } from './baseApi';
import { ERPNextSalesAPI } from './salesApi';
import { ERPNextPurchaseAPI } from './purchaseApi';
import { ERPNextStockAPI } from './stockApi';
import { ERPNextWarehouseAPI } from './warehouseApi';
import { ERPNextResponse, Item, Warehouse, StockBalance } from './types';

export class ERPNextAPI extends ERPNextBaseAPI {
  // Create instances of specialized APIs
  private salesAPI: ERPNextSalesAPI;
  private purchaseAPI: ERPNextPurchaseAPI;
  private stockAPI: ERPNextStockAPI;
  private warehouseAPI: ERPNextWarehouseAPI;

  constructor(baseURL: string, apiKey: string, apiSecret: string) {
    super(baseURL, apiKey, apiSecret);
    this.salesAPI = new ERPNextSalesAPI(baseURL, apiKey, apiSecret);
    this.purchaseAPI = new ERPNextPurchaseAPI(baseURL, apiKey, apiSecret);
    this.stockAPI = new ERPNextStockAPI(baseURL, apiKey, apiSecret);
    this.warehouseAPI = new ERPNextWarehouseAPI(baseURL, apiKey, apiSecret);
  }

  // Items API
  async getItems(filters?: any, limitPageLength: number = 20): Promise<ERPNextResponse<Item[]>> {
    const finalFilters = this.convertToFrappeFilters(filters);
    const params = this.buildQueryParams(finalFilters, undefined, limitPageLength);

    const response = await fetch(`${this.baseURL}/api/resource/Item?${params}`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch items: ${response.statusText}`);
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

  async searchItems(searchTerm: string, limitPageLength: number = 20): Promise<ERPNextResponse<Item[]>> {
    const orFilters = [
      ['item_code', 'like', `%${searchTerm}%`],
      ['item_name', 'like', `%${searchTerm}%`],
      ['barcode', 'like', `%${searchTerm}%`]
    ];

    const params = new URLSearchParams({
      or_filters: JSON.stringify(orFilters),
      fields: JSON.stringify(['item_code', 'item_name', 'stock_uom', 'description', 'has_batch_no', 'has_serial_no']),
      limit_page_length: limitPageLength.toString()
    });

    const response = await fetch(`${this.baseURL}/api/resource/Item?${params}`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to search items: ${response.statusText}`);
    }

    return response.json();
  }

  async searchItemsByBarcode(barcode: string): Promise<ERPNextResponse<Item[]>> {
    const filters = [
      ['barcode', '=', barcode]
    ];

    const params = new URLSearchParams({
      filters: JSON.stringify(filters),
      fields: JSON.stringify(['item_code', 'item_name', 'stock_uom', 'description', 'has_batch_no', 'has_serial_no']),
      limit_page_length: '20'
    });

    const response = await fetch(`${this.baseURL}/api/resource/Item?${params}`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to search items by barcode: ${response.statusText}`);
    }

    return response.json();
  }

  // Warehouse API
  async getWarehouses(filters?: any, limitPageLength: number = 20): Promise<ERPNextResponse<Warehouse[]>> {
    return this.warehouseAPI.getWarehouses(filters, limitPageLength);
  }

  async searchWarehouses(searchTerm: string, limitPageLength: number = 20): Promise<ERPNextResponse<Warehouse[]>> {
    const orFilters = [
      ['warehouse_name', 'like', `%${searchTerm}%`],
      ['warehouse_type', 'like', `%${searchTerm}%`]
    ];

    const params = new URLSearchParams({
      or_filters: JSON.stringify(orFilters),
      limit_page_length: limitPageLength.toString()
    });

    const response = await fetch(`${this.baseURL}/api/resource/Warehouse?${params}`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to search warehouses: ${response.statusText}`);
    }

    return response.json();
  }

  // Stock API
  async getStockBalance(filters?: any, limitPageLength: number = 20): Promise<ERPNextResponse<StockBalance[]>> {
    return this.stockAPI.getStockBalance(filters, limitPageLength);
  }

  async getCurrentStock(itemCode: string, warehouse: string): Promise<ERPNextResponse<any>> {
    return this.stockAPI.getCurrentStock(itemCode, warehouse);
  }

  // Sales API methods
  async getSalesOrders(filters?: any, company?: string, limitPageLength: number = 20): Promise<ERPNextResponse<any[]>> {
    return this.salesAPI.getSalesOrders(filters, company, limitPageLength);
  }

  async getSalesOrder(soNumber: string): Promise<ERPNextResponse<any>> {
    return this.salesAPI.getSalesOrder(soNumber);
  }

  async searchSalesOrders(searchTerm: string, company?: string, limitPageLength: number = 20): Promise<ERPNextResponse<any[]>> {
    return this.salesAPI.searchSalesOrders(searchTerm, company, limitPageLength);
  }

  async getDeliveryNotes(filters?: any, company?: string, limitPageLength: number = 20): Promise<ERPNextResponse<any[]>> {
    return this.salesAPI.getDeliveryNotes(filters, company, limitPageLength);
  }

  async getDeliveryNote(deliveryNoteName: string): Promise<ERPNextResponse<any>> {
    return this.salesAPI.getDeliveryNote(deliveryNoteName);
  }

  async createDeliveryNote(deliveryData: any): Promise<ERPNextResponse<any>> {
    return this.salesAPI.createDeliveryNote(deliveryData);
  }

  async updateDeliveryNote(name: string, deliveryData: any): Promise<ERPNextResponse<any>> {
    return this.salesAPI.updateDeliveryNote(name, deliveryData);
  }

  // Purchase API methods
  async getPurchaseOrders(filters?: any, company?: string, limitPageLength: number = 20): Promise<ERPNextResponse<any[]>> {
    return this.purchaseAPI.getPurchaseOrders(filters, company, limitPageLength);
  }

  async getPurchaseOrder(poNumber: string): Promise<ERPNextResponse<any>> {
    return this.purchaseAPI.getPurchaseOrder(poNumber);
  }

  async getPurchaseReceipt(receiptName: string): Promise<ERPNextResponse<any>> {
    const response = await fetch(`${this.baseURL}/api/resource/Purchase Receipt/${encodeURIComponent(receiptName)}`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch purchase receipt: ${response.statusText}`);
    }

    return response.json();
  }

  async updatePurchaseReceipt(name: string, receiptData: any): Promise<ERPNextResponse<any>> {
    const response = await fetch(`${this.baseURL}/api/resource/Purchase Receipt/${encodeURIComponent(name)}`, {
      method: 'PUT',
      headers: {
        ...this.getHeaders(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(receiptData)
    });

    if (!response.ok) {
      throw new Error(`Failed to update purchase receipt: ${response.statusText}`);
    }

    return response.json();
  }

  async submitPurchaseReceipt(receiptName: string): Promise<ERPNextResponse<any>> {
    const response = await fetch(`${this.baseURL}/api/resource/Purchase Receipt/${encodeURIComponent(receiptName)}`, {
      method: 'PUT',
      headers: {
        ...this.getHeaders(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ docstatus: 1 })
    });

    if (!response.ok) {
      throw new Error(`Failed to submit purchase receipt: ${response.statusText}`);
    }

    return response.json();
  }

  async getPurchaseReceipts(filters?: any, company?: string, limitPageLength: number = 20): Promise<ERPNextResponse<any[]>> {
    return this.purchaseAPI.getPurchaseReceipts(filters, company, limitPageLength);
  }

  async createPurchaseReceipt(receiptData: any): Promise<ERPNextResponse<any>> {
    return this.purchaseAPI.createPurchaseReceipt(receiptData);
  }

  // Stock Entry API methods
  async getStockEntries(filters?: any, limitPageLength: number = 20): Promise<ERPNextResponse<any[]>> {
    return this.stockAPI.getStockEntries(filters, limitPageLength);
  }

  async getStockEntry(stockEntryName: string): Promise<ERPNextResponse<any>> {
    const response = await fetch(`${this.baseURL}/api/resource/Stock Entry/${encodeURIComponent(stockEntryName)}`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch stock entry: ${response.statusText}`);
    }

    return response.json();
  }

  async createStockEntry(stockEntryData: any): Promise<ERPNextResponse<any>> {
    const response = await fetch(`${this.baseURL}/api/resource/Stock Entry`, {
      method: 'POST',
      headers: {
        ...this.getHeaders(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(stockEntryData)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to create stock entry: ${response.status} ${response.statusText} - ${errorText}`);
    }

    return response.json();
  }

  async createStockReconciliation(reconciliationData: any): Promise<ERPNextResponse<any>> {
    return this.stockAPI.createStockReconciliation(reconciliationData);
  }

  async getStockReconciliations(filters?: any, limitPageLength: number = 20): Promise<ERPNextResponse<any[]>> {
    const finalFilters = this.convertToFrappeFilters(filters);
    const params = this.buildQueryParams(finalFilters, undefined, limitPageLength);

    const response = await fetch(`${this.baseURL}/api/resource/Stock Reconciliation?${params}`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch stock reconciliations: ${response.statusText}`);
    }

    return response.json();
  }

  async submitStockEntry(stockEntryName: string): Promise<ERPNextResponse<any>> {
    const response = await fetch(`${this.baseURL}/api/resource/Stock Entry/${encodeURIComponent(stockEntryName)}`, {
      method: 'PUT',
      headers: {
        ...this.getHeaders(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        docstatus: 1
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to submit stock entry: ${response.status} ${response.statusText} - ${errorText}`);
    }

    return response.json();
  }

  // Material Request API methods
  async getMaterialRequests(filters?: any, limitPageLength: number = 20): Promise<ERPNextResponse<any[]>> {
    const finalFilters = this.convertToFrappeFilters(filters);
    const params = this.buildQueryParams(finalFilters, undefined, limitPageLength);

    const response = await fetch(`${this.baseURL}/api/resource/Material Request?${params}`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch material requests: ${response.statusText}`);
    }

    return response.json();
  }

  async getMaterialRequest(mrNumber: string): Promise<ERPNextResponse<any>> {
    const response = await fetch(`${this.baseURL}/api/resource/Material Request/${encodeURIComponent(mrNumber)}`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch material request: ${response.statusText}`);
    }

    return response.json();
  }

  async createMaterialRequest(requestData: any): Promise<ERPNextResponse<any>> {
    const response = await fetch(`${this.baseURL}/api/resource/Material Request`, {
      method: 'POST',
      headers: {
        ...this.getHeaders(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestData)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to create material request: ${response.status} ${response.statusText} - ${errorText}`);
    }

    return response.json();
  }

  async updateMaterialRequest(name: string, requestData: any): Promise<ERPNextResponse<any>> {
    const response = await fetch(`${this.baseURL}/api/resource/Material Request/${encodeURIComponent(name)}`, {
      method: 'PUT',
      headers: {
        ...this.getHeaders(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestData)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to update material request: ${response.status} ${response.statusText} - ${errorText}`);
    }

    return response.json();
  }

  // Pick List API methods
  async getPickLists(filters?: any, limitPageLength: number = 20): Promise<ERPNextResponse<any[]>> {
    const finalFilters = this.convertToFrappeFilters(filters);
    const params = this.buildQueryParams(finalFilters, undefined, limitPageLength);

    const response = await fetch(`${this.baseURL}/api/resource/Pick List?${params}`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch pick lists: ${response.statusText}`);
    }

    return response.json();
  }

  async getPickList(pickListName: string): Promise<ERPNextResponse<any>> {
    const response = await fetch(`${this.baseURL}/api/resource/Pick List/${encodeURIComponent(pickListName)}`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch pick list: ${response.statusText}`);
    }

    return response.json();
  }

  async getPickListItems(pickListName: string): Promise<ERPNextResponse<any[]>> {
    const response = await fetch(`${this.baseURL}/api/resource/Pick List Item?filters=[["parent","=","${pickListName}"]]`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch pick list items: ${response.statusText}`);
    }

    return response.json();
  }

  async createPickListFromDocument(documentType: string, documentName: string): Promise<ERPNextResponse<any>> {
    const response = await fetch(`${this.baseURL}/api/method/erpnext.stock.doctype.pick_list.pick_list.create_pick_list`, {
      method: 'POST',
      headers: {
        ...this.getHeaders(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        source_name: documentName,
        reference_doctype: documentType
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to create pick list: ${response.status} ${response.statusText} - ${errorText}`);
    }

    return response.json();
  }

  async getPickListAnalytics(company?: string): Promise<ERPNextResponse<any>> {
    const response = await fetch(`${this.baseURL}/api/method/frappe.desk.query_report.run?report_name=Pick List Summary`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch pick list analytics: ${response.statusText}`);
    }

    return response.json();
  }

  // Additional missing methods for completeness
  async getPackingSlips(filters?: any, limitPageLength: number = 20): Promise<ERPNextResponse<any[]>> {
    const finalFilters = this.convertToFrappeFilters(filters);
    const params = this.buildQueryParams(finalFilters, undefined, limitPageLength);

    const response = await fetch(`${this.baseURL}/api/resource/Packing Slip?${params}`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch packing slips: ${response.statusText}`);
    }

    return response.json();
  }

  async getQualityInspections(filters?: any, limitPageLength: number = 20): Promise<ERPNextResponse<any[]>> {
    const finalFilters = this.convertToFrappeFilters(filters);
    const params = this.buildQueryParams(finalFilters, undefined, limitPageLength);

    const response = await fetch(`${this.baseURL}/api/resource/Quality Inspection?${params}`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch quality inspections: ${response.statusText}`);
    }

    return response.json();
  }

  async getProductBundles(filters?: any, limitPageLength: number = 20): Promise<ERPNextResponse<any[]>> {
    const finalFilters = this.convertToFrappeFilters(filters);
    const params = this.buildQueryParams(finalFilters, undefined, limitPageLength);

    const response = await fetch(`${this.baseURL}/api/resource/Product Bundle?${params}`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch product bundles: ${response.statusText}`);
    }

    return response.json();
  }

  // Company API methods
  async getCompanies(): Promise<ERPNextResponse<any[]>> {
    const response = await fetch(`${this.baseURL}/api/resource/Company`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch companies: ${response.statusText}`);
    }

    return response.json();
  }

  // Bin Stock API methods
  async getBinStock(filters?: any): Promise<ERPNextResponse<any[]>> {
    const finalFilters = this.convertToFrappeFilters(filters);
    const params = this.buildQueryParams(finalFilters);

    const response = await fetch(`${this.baseURL}/api/resource/Bin?${params}`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch bin stock: ${response.statusText}`);
    }

    return response.json();
  }

  // Document search methods for stock entry
  async searchMaterialRequestsForStockEntry(searchTerm: string): Promise<ERPNextResponse<any[]>> {
    return this.getMaterialRequests([
      ['name', 'like', `%${searchTerm}%`],
      ['docstatus', '=', 1],
      ['status', '!=', 'Stopped']
    ]);
  }

  async searchPurchaseOrdersForStockEntry(searchTerm: string): Promise<ERPNextResponse<any[]>> {
    return this.getPurchaseOrders([
      ['name', 'like', `%${searchTerm}%`],
      ['docstatus', '=', 1],
      ['status', '!=', 'Closed']
    ]);
  }

  async searchSalesOrdersForStockEntry(searchTerm: string): Promise<ERPNextResponse<any[]>> {
    return this.getSalesOrders([
      ['name', 'like', `%${searchTerm}%`],
      ['docstatus', '=', 1],
      ['status', '!=', 'Closed']
    ]);
  }

  async searchBOMs(searchTerm: string): Promise<ERPNextResponse<any[]>> {
    const orFilters = [
      ['name', 'like', `%${searchTerm}%`],
      ['item', 'like', `%${searchTerm}%`]
    ];

    const params = new URLSearchParams({
      or_filters: JSON.stringify(orFilters),
      filters: JSON.stringify([['docstatus', '=', 1]]),
      limit_page_length: '20'
    });

    const response = await fetch(`${this.baseURL}/api/resource/BOM?${params}`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to search BOMs: ${response.statusText}`);
    }

    return response.json();
  }

  // Generic API call method
  async callAPI(method: string, params?: any): Promise<ERPNextResponse<any>> {
    const url = params 
      ? `${this.baseURL}/api/method/${method}?${new URLSearchParams(params)}`
      : `${this.baseURL}/api/method/${method}`;

    const response = await fetch(url, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`API call failed: ${response.statusText}`);
    }

    return response.json();
  }
}

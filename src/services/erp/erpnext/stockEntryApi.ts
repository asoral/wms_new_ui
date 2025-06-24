import { ERPNextBaseAPI } from './baseApi';
import { ERPNextResponse } from './types';

export interface StockEntryData {
  stock_entry_type: string;
  purpose?: string;
  from_warehouse?: string;
  to_warehouse?: string;
  posting_date?: string;
  posting_time?: string;
  company: string;
  items: StockEntryItemData[];
  remarks?: string;
  get_items_from?: string;
  material_request?: string;
  purchase_order?: string;
  sales_order?: string;
  bom_no?: string;
  docstatus?: number;
}

export interface StockEntryItemData {
  item_code: string;
  qty: number;
  uom?: string;
  s_warehouse?: string; // Source warehouse
  t_warehouse?: string; // Target warehouse
  basic_rate?: number;
  batch_no?: string;
  serial_no?: string;
  expense_account?: string;
  cost_center?: string;
}

export class ERPNextStockEntryAPI extends ERPNextBaseAPI {
  async getStockEntries(filters?: any, company?: string, limitPageLength?: number): Promise<ERPNextResponse<any[]>> {
    let finalFilters = this.convertToFrappeFilters(filters);
    if (company) {
      finalFilters.push(['company', '=', company]);
    }
    
    const params = this.buildQueryParams(finalFilters, [
      'name', 'stock_entry_type', 'purpose', 'posting_date', 
      'from_warehouse', 'to_warehouse', 'docstatus', 'total_amount',
      'owner', 'modified_by'
    ], limitPageLength);

    const response = await fetch(`${this.baseURL}/api/resource/Stock Entry?${params}`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch stock entries: ${response.statusText}`);
    }

    return response.json();
  }

  async getStockEntry(name: string): Promise<ERPNextResponse<any>> {
    const response = await fetch(`${this.baseURL}/api/resource/Stock Entry/${encodeURIComponent(name)}`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch stock entry: ${response.statusText}`);
    }

    return response.json();
  }

  async createStockEntry(data: StockEntryData): Promise<ERPNextResponse<any>> {
    const response = await fetch(`${this.baseURL}/api/resource/Stock Entry`, {
      method: 'POST',
      headers: {
        ...this.getHeaders(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to create stock entry: ${response.status} ${response.statusText} - ${errorText}`);
    }

    return response.json();
  }

  async updateStockEntry(name: string, data: Partial<StockEntryData>): Promise<ERPNextResponse<any>> {
    const response = await fetch(`${this.baseURL}/api/resource/Stock Entry/${encodeURIComponent(name)}`, {
      method: 'PUT',
      headers: {
        ...this.getHeaders(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to update stock entry: ${response.status} ${response.statusText} - ${errorText}`);
    }

    return response.json();
  }

  async submitStockEntry(name: string): Promise<ERPNextResponse<any>> {
    const response = await fetch(`${this.baseURL}/api/resource/Stock Entry/${encodeURIComponent(name)}`, {
      method: 'PUT',
      headers: {
        ...this.getHeaders(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ docstatus: 1 })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to submit stock entry: ${response.status} ${response.statusText} - ${errorText}`);
    }

    return response.json();
  }

  async cancelStockEntry(name: string): Promise<ERPNextResponse<any>> {
    const response = await fetch(`${this.baseURL}/api/resource/Stock Entry/${encodeURIComponent(name)}`, {
      method: 'PUT',
      headers: {
        ...this.getHeaders(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ docstatus: 2 })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to cancel stock entry: ${response.status} ${response.statusText} - ${errorText}`);
    }

    return response.json();
  }

  async getItemsFromDocument(doctype: string, docname: string): Promise<ERPNextResponse<any[]>> {
    const response = await fetch(`${this.baseURL}/api/method/erpnext.stock.doctype.stock_entry.stock_entry.get_items`, {
      method: 'POST',
      headers: {
        ...this.getHeaders(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        warehouse: '',
        posting_date: new Date().toISOString().split('T')[0],
        posting_time: new Date().toTimeString().split(' ')[0],
        company: '',
        bom_no: '',
        use_multi_level_bom: 0,
        do_not_save: 1,
        fg_completed_qty: 0
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to get items from document: ${response.statusText}`);
    }

    return response.json();
  }

  async getStockEntryTypes(): Promise<string[]> {
    return [
      "Material Issue",
      "Material Receipt", 
      "Material Transfer",
      "Material Transfer for Manufacture",
      "Material Consumption for Manufacture",
      "Manufacture",
      "Repack",
      "Send to Subcontractor",
      "Send to Warehouse",
      "Receive at Warehouse"
    ];
  }

  // Search documents for Get Items From functionality
  async searchMaterialRequestsForStockEntry(stockEntryType: string, company?: string): Promise<ERPNextResponse<any[]>> {
    console.log('Searching Material Requests for Stock Entry:', { stockEntryType, company });
    
    const filters = [['docstatus', '=', 1]]; // Only submitted Material Requests
    
    // Filter by material request type based on stock entry type
    if (stockEntryType === 'Material Transfer') {
      filters.push(['material_request_type', '=', 'Material Transfer']);
    } else if (stockEntryType === 'Material Issue') {
      filters.push(['material_request_type', '=', 'Material Issue']);
    } else if (stockEntryType === 'Material Receipt') {
      filters.push(['material_request_type', '=', 'Purchase']);
    }
    
    if (company) {
      filters.push(['company', '=', company]);
    }

    const params = this.buildQueryParams(filters, [
      'name', 'title', 'material_request_type', 'status', 
      'transaction_date', 'required_by', 'company'
    ], 20);

    console.log('Material Request search URL:', `${this.baseURL}/api/resource/Material Request?${params}`);

    const response = await fetch(`${this.baseURL}/api/resource/Material Request?${params}`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Material Request Search Error:', {
        status: response.status,
        statusText: response.statusText,
        errorText,
        url: `${this.baseURL}/api/resource/Material Request?${params}`
      });
      throw new Error(`Failed to search material requests: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const result = await response.json();
    console.log('Material Request search result:', result);
    return result;
  }

  async searchPurchaseOrdersForStockEntry(company?: string): Promise<ERPNextResponse<any[]>> {
    const filters = [['docstatus', '=', 1]]; // Only submitted Purchase Orders
    
    if (company) {
      filters.push(['company', '=', company]);
    }

    const params = this.buildQueryParams(filters, [
      'name', 'supplier', 'transaction_date', 'status', 
      'grand_total', 'currency', 'company'
    ], 20);

    const response = await fetch(`${this.baseURL}/api/resource/Purchase Order?${params}`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to search purchase orders: ${response.statusText}`);
    }

    return response.json();
  }

  async searchSalesOrdersForStockEntry(company?: string): Promise<ERPNextResponse<any[]>> {
    const filters = [['docstatus', '=', 1]]; // Only submitted Sales Orders
    
    if (company) {
      filters.push(['company', '=', company]);
    }

    const params = this.buildQueryParams(filters, [
      'name', 'customer', 'transaction_date', 'status', 
      'grand_total', 'currency', 'company'
    ], 20);

    const response = await fetch(`${this.baseURL}/api/resource/Sales Order?${params}`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to search sales orders: ${response.statusText}`);
    }

    return response.json();
  }

  async searchBOMs(company?: string): Promise<ERPNextResponse<any[]>> {
    const filters = [['docstatus', '=', 1], ['is_active', '=', 1]]; // Only active BOMs
    
    if (company) {
      filters.push(['company', '=', company]);
    }

    const params = this.buildQueryParams(filters, [
      'name', 'item', 'item_name', 'quantity', 'company'
    ], 20);

    const response = await fetch(`${this.baseURL}/api/resource/BOM?${params}`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to search BOMs: ${response.statusText}`);
    }

    return response.json();
  }
}

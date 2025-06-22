
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
  get_items_from?: string; // For getting items from Material Request, Purchase Order, etc.
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
    // Based on ERPNext Stock Entry types
    return [
      "Material Issue",
      "Material Receipt", 
      "Material Transfer",
      "Manufacture",
      "Repack",
      "Send to Subcontractor",
      "Material Transfer for Manufacture",
      "Material Consumption for Manufacture",
      "Receive at Warehouse",
      "Send to Warehouse"
    ];
  }
}

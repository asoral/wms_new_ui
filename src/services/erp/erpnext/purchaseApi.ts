
import { ERPNextBaseAPI } from './baseApi';
import { ERPNextResponse, PurchaseOrder, PurchaseReceipt } from './types';

export class ERPNextPurchaseAPI extends ERPNextBaseAPI {
  async getPurchaseOrders(filters?: any, company?: string, limitPageLength?: number): Promise<ERPNextResponse<PurchaseOrder[]>> {
    let finalFilters = this.convertToFrappeFilters(filters);
    if (company) {
      finalFilters.push(['company', '=', company]);
    }
    
    const params = this.buildQueryParams(finalFilters, undefined, limitPageLength);

    const response = await fetch(`${this.baseURL}/api/resource/Purchase Order?${params}`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch purchase orders: ${response.statusText}`);
    }

    return response.json();
  }

  async getPurchaseOrder(poNumber: string): Promise<ERPNextResponse<any>> {
    const response = await fetch(`${this.baseURL}/api/resource/Purchase Order/${poNumber}`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch purchase order: ${response.statusText}`);
    }

    return response.json();
  }

  async getPurchaseReceipts(filters?: any, company?: string, limitPageLength?: number): Promise<ERPNextResponse<PurchaseReceipt[]>> {
    let finalFilters = this.convertToFrappeFilters(filters);
    if (company) {
      finalFilters.push(['company', '=', company]);
    }
    
    const params = this.buildQueryParams(finalFilters, undefined, limitPageLength);

    const response = await fetch(`${this.baseURL}/api/resource/Purchase Receipt?${params}`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch purchase receipts: ${response.statusText}`);
    }

    return response.json();
  }

  async createPurchaseReceipt(receiptData: any): Promise<ERPNextResponse<any>> {
    const response = await fetch(`${this.baseURL}/api/resource/Purchase Receipt`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(receiptData)
    });

    if (!response.ok) {
      throw new Error(`Failed to create purchase receipt: ${response.statusText}`);
    }

    return response.json();
  }

  async getPendingPurchaseOrders(company?: string): Promise<ERPNextResponse<any[]>> {
    const filters = [
      ['status', 'in', ['To Receive and Bill', 'To Receive', 'To Bill']],
      ['docstatus', '=', '1']
    ];
    
    if (company) {
      filters.push(['company', '=', company]);
    }

    return this.getPurchaseOrders(filters, company, 20);
  }

  async getReceiptDrafts(company?: string): Promise<ERPNextResponse<any[]>> {
    const filters = [['docstatus', '=', '0']];
    
    if (company) {
      filters.push(['company', '=', company]);
    }

    return this.getPurchaseReceipts(filters, company, 20);
  }

  async getQualityInspectionsPending(company?: string): Promise<ERPNextResponse<any[]>> {
    const filters = [
      ['status', '=', 'Submitted'],
      ['inspection_type', '=', 'Incoming']
    ];
    
    if (company) {
      filters.push(['company', '=', company]);
    }

    const params = this.buildQueryParams(filters, undefined, 20);

    const response = await fetch(`${this.baseURL}/api/resource/Quality Inspection?${params}`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch quality inspections: ${response.statusText}`);
    }

    return response.json();
  }
}

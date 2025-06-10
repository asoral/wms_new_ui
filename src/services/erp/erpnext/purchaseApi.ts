
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
}

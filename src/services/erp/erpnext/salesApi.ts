
import { ERPNextBaseAPI } from './baseApi';
import { ERPNextResponse, SalesOrder, DeliveryNote } from './types';

export class ERPNextSalesAPI extends ERPNextBaseAPI {
  async getSalesOrders(filters?: any, company?: string, limitPageLength?: number): Promise<ERPNextResponse<SalesOrder[]>> {
    let finalFilters = this.convertToFrappeFilters(filters);
    if (company) {
      finalFilters.push(['company', '=', company]);
    }
    
    const params = this.buildQueryParams(finalFilters, undefined, limitPageLength);

    const response = await fetch(`${this.baseURL}/api/resource/Sales Order?${params}`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch sales orders: ${response.statusText}`);
    }

    return response.json();
  }

  async getSalesOrder(soNumber: string): Promise<ERPNextResponse<any>> {
    const response = await fetch(`${this.baseURL}/api/resource/Sales Order/${soNumber}`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch sales order: ${response.statusText}`);
    }

    return response.json();
  }

  async getDeliveryNotes(filters?: any, company?: string, limitPageLength?: number): Promise<ERPNextResponse<DeliveryNote[]>> {
    let finalFilters = this.convertToFrappeFilters(filters);
    if (company) {
      finalFilters.push(['company', '=', company]);
    }
    
    const params = this.buildQueryParams(finalFilters, undefined, limitPageLength);

    const response = await fetch(`${this.baseURL}/api/resource/Delivery Note?${params}`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch delivery notes: ${response.statusText}`);
    }

    return response.json();
  }

  async createDeliveryNote(deliveryData: any): Promise<ERPNextResponse<any>> {
    const response = await fetch(`${this.baseURL}/api/resource/Delivery Note`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(deliveryData)
    });

    if (!response.ok) {
      throw new Error(`Failed to create delivery note: ${response.statusText}`);
    }

    return response.json();
  }

  async getPendingSalesOrders(company?: string): Promise<ERPNextResponse<any[]>> {
    const filters = [
      ['status', 'in', ['To Deliver and Bill', 'To Deliver', 'To Bill']],
      ['docstatus', '=', '1']
    ];
    
    if (company) {
      filters.push(['company', '=', company]);
    }

    return this.getSalesOrders(filters, company, 20);
  }

  async getDeliveryDrafts(company?: string): Promise<ERPNextResponse<any[]>> {
    const filters = [['docstatus', '=', '0']];
    
    if (company) {
      filters.push(['company', '=', company]);
    }

    return this.getDeliveryNotes(filters, company, 20);
  }
}

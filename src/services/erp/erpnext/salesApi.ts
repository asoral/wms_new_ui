
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
    const response = await fetch(`${this.baseURL}/api/resource/Sales Order/${encodeURIComponent(soNumber)}`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch sales order: ${response.statusText}`);
    }

    return response.json();
  }

  async searchSalesOrders(searchTerm: string, company?: string, limitPageLength: number = 20): Promise<ERPNextResponse<SalesOrder[]>> {
    const filters = [
      ['docstatus', '=', 1],
      ['status', 'in', ['To Deliver', 'To Deliver and Bill', 'Partially Delivered']]
    ];

    if (company) {
      filters.push(['company', '=', company]);
    }

    // Add search filters using OR logic
    const orFilters = [
      ['name', 'like', `%${searchTerm}%`],
      ['customer', 'like', `%${searchTerm}%`],
      ['customer_name', 'like', `%${searchTerm}%`]
    ];

    const params = new URLSearchParams({
      filters: JSON.stringify(filters),
      or_filters: JSON.stringify(orFilters),
      fields: JSON.stringify(['name', 'customer', 'customer_name', 'delivery_date', 'transaction_date', 'grand_total', 'status', 'items']),
      limit_page_length: limitPageLength.toString()
    });

    const response = await fetch(`${this.baseURL}/api/resource/Sales Order?${params}`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to search sales orders: ${response.statusText}`);
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
      headers: {
        ...this.getHeaders(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(deliveryData)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to create delivery note: ${response.status} ${response.statusText} - ${errorText}`);
    }

    return response.json();
  }

  async updateDeliveryNote(name: string, deliveryData: any): Promise<ERPNextResponse<any>> {
    const response = await fetch(`${this.baseURL}/api/resource/Delivery Note/${encodeURIComponent(name)}`, {
      method: 'PUT',
      headers: {
        ...this.getHeaders(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(deliveryData)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to update delivery note: ${response.status} ${response.statusText} - ${errorText}`);
    }

    return response.json();
  }
}



import { ERPNextBaseAPI } from './baseApi';
import { ERPNextResponse, SalesOrder, DeliveryNote } from './types';

export class ERPNextSalesAPI extends ERPNextBaseAPI {
  async getSalesOrders(filters?: any, company?: string, limitPageLength?: number): Promise<ERPNextResponse<SalesOrder[]>> {
    let finalFilters = this.convertToFrappeFilters(filters);
    if (company) {
      finalFilters.push(['company', '=', company]);
    }
    
    const params = new URLSearchParams();
    params.append('filters', JSON.stringify(finalFilters));
    // Request specific fields needed for dashboard
    params.append('fields', JSON.stringify([
      'name', 'customer', 'customer_name', 'delivery_date', 'transaction_date', 
      'grand_total', 'status', 'items', 'total_qty', 'per_delivered'
    ]));
    params.append('limit_page_length', String(limitPageLength || 20));

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
    // Enhanced filters for sales orders ready for delivery - based on the JSON structure
    const filters = [
      ['docstatus', '=', 1], // Only submitted orders
      ['status', '!=', 'Closed'], // Exclude closed orders  
      ['per_delivered', '<', 100] // Orders with pending delivery
    ];

    if (company) {
      filters.push(['company', '=', company]);
    }

    console.log('Searching for sales orders with term:', searchTerm);
    console.log('Using filters:', filters);

    // Enhanced search filters with more fields
    const orFilters = [
      ['name', 'like', `%${searchTerm}%`],
      ['customer', 'like', `%${searchTerm}%`],
      ['customer_name', 'like', `%${searchTerm}%`],
      ['po_no', 'like', `%${searchTerm}%`] // Also search by PO number
    ];

    const params = new URLSearchParams({
      filters: JSON.stringify(filters),
      or_filters: JSON.stringify(orFilters),
      fields: JSON.stringify([
        'name',
        'customer',
        'customer_name', 
        'status',
        'grand_total',
        'delivery_date',
        'transaction_date',
        'per_delivered',
        'docstatus',
        'po_no',
        'company'
      ]),
      limit_page_length: limitPageLength.toString(),
      order_by: 'delivery_date asc' // Order by delivery date
    });

    console.log('API URL:', `${this.baseURL}/api/resource/Sales Order?${params.toString()}`);
    
    const response = await fetch(`${this.baseURL}/api/resource/Sales Order?${params}`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      console.error('Search failed:', response.status, response.statusText);
      throw new Error(`Failed to search sales orders: ${response.statusText}`);
    }

    const result = await response.json();
    console.log('Search results:', result);
    
    return result;
  }

  async getDeliveryNotes(filters?: any, company?: string, limitPageLength?: number): Promise<ERPNextResponse<DeliveryNote[]>> {
    let finalFilters = this.convertToFrappeFilters(filters);
    if (company) {
      finalFilters.push(['company', '=', company]);
    }
    
    const params = new URLSearchParams();
    params.append('filters', JSON.stringify(finalFilters));
    // Request specific fields needed for dashboard
    params.append('fields', JSON.stringify([
      'name', 'customer', 'customer_name', 'posting_date', 'creation', 
      'grand_total', 'status', 'items', 'total_qty'
    ]));
    params.append('limit_page_length', String(limitPageLength || 20));

    const response = await fetch(`${this.baseURL}/api/resource/Delivery Note?${params}`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch delivery notes: ${response.statusText}`);
    }

    return response.json();
  }

  async getDeliveryNote(deliveryNoteName: string): Promise<ERPNextResponse<any>> {
    const response = await fetch(`${this.baseURL}/api/resource/Delivery Note/${encodeURIComponent(deliveryNoteName)}`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch delivery note: ${response.statusText}`);
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

  async submitDeliveryNote(name: string): Promise<ERPNextResponse<any>> {
    const response = await fetch(`${this.baseURL}/api/resource/Delivery Note/${encodeURIComponent(name)}`, {
      method: 'PUT',
      headers: {
        ...this.getHeaders(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ docstatus: 1 })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to submit delivery note: ${response.status} ${response.statusText} - ${errorText}`);
    }

    return response.json();
  }

  /**
   * Get delivery notes for dashboard metrics
   */
  async getDeliveryMetrics(company?: string): Promise<ERPNextResponse<any>> {
    const today = new Date().toISOString().split('T')[0];
    
    try {
      // Get today's deliveries
      const todayFilters = [
        ['posting_date', '=', today],
        ['docstatus', '=', 1]
      ];
      if (company) {
        todayFilters.push(['company', '=', company]);
      }

      // Get all deliveries
      const allFilters = [
        ['docstatus', '=', 1]
      ];
      if (company) {
        allFilters.push(['company', '=', company]);
      }

      const [todayResult, allResult] = await Promise.all([
        this.getDeliveryNotes(todayFilters, company, 1000),
        this.getDeliveryNotes(allFilters, company, 1000)
      ]);

      return {
        data: {
          todaysDelivery: todayResult.data ? todayResult.data.length : 0,
          totalDeliveries: allResult.data ? allResult.data.length : 0
        }
      };
    } catch (error) {
      console.error('Error fetching delivery metrics:', error);
      return { data: { todaysDelivery: 0, totalDeliveries: 0 } };
    }
  }
}


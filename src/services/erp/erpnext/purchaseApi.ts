
import { ERPNextBaseAPI } from './baseApi';
import { ERPNextResponse, PurchaseOrder, PurchaseReceipt } from './types';

export class ERPNextPurchaseAPI extends ERPNextBaseAPI {
  /**
   * Fetch Purchase Orders with optional filters, company, pagination
   */
  async getPurchaseOrders(
    filters: Record<string, any> = {},
    company?: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<ERPNextResponse<PurchaseOrder[]>> {
    // Build Frappe filters array
    const conditions: any[] = this.convertToFrappeFilters(filters);
    if (company) {
      conditions.push(['company', '=', company]);
    }

    // Build URL parameters
    const params = new URLSearchParams();
    params.append('filters', JSON.stringify(conditions));
    // No custom fields → let Frappe return default fields
    params.append('limit_page_length', String(limit));
    params.append('limit_start', String(offset));

    const response = await fetch(
      `${this.baseURL}/api/resource/Purchase Order?${params.toString()}`,
      { headers: this.getHeaders() }
    );
    if (!response.ok) {
      throw new Error(`Failed to fetch purchase orders: ${response.statusText}`);
    }
    return response.json();
  }

  /**
   * Fetch a single Purchase Order by name/ID
   */
  async getPurchaseOrder(
    poNumber: string
  ): Promise<ERPNextResponse<PurchaseOrder>> {
    const response = await fetch(
      `${this.baseURL}/api/resource/Purchase Order/${encodeURIComponent(poNumber)}`,
      { headers: this.getHeaders() }
    );
    if (!response.ok) {
      throw new Error(`Failed to fetch purchase order: ${response.statusText}`);
    }
    return response.json();
  }

  /**
   * Fetch Purchase Receipts with optional filters, company, pagination
   */
  async getPurchaseReceipts(
    filters: Record<string, any> = {},
    company?: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<ERPNextResponse<PurchaseReceipt[]>> {
    const conditions: any[] = this.convertToFrappeFilters(filters);
    if (company) {
      conditions.push(['company', '=', company]);
    }

    const params = new URLSearchParams();
    params.append('filters', JSON.stringify(conditions));
    params.append('limit_page_length', String(limit));
    params.append('limit_start', String(offset));

    const response = await fetch(
      `${this.baseURL}/api/resource/Purchase Receipt?${params.toString()}`,
      { headers: this.getHeaders() }
    );
    if (!response.ok) {
      throw new Error(`Failed to fetch purchase receipts: ${response.statusText}`);
    }
    return response.json();
  }

  /**
   * Create a new Purchase Receipt
   */
  async createPurchaseReceipt(
    receiptData: Partial<PurchaseReceipt>
  ): Promise<ERPNextResponse<PurchaseReceipt>> {
    const response = await fetch(
      `${this.baseURL}/api/resource/Purchase Receipt`,
      {
        method: 'POST',
        headers: {
          ...this.getHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(receiptData)
      }
    );
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to create purchase receipt: ${response.status} ${response.statusText} - ${errorText}`);
    }
    return response.json();
  }

  /**
   * Update an existing Purchase Receipt
   */
  async updatePurchaseReceipt(
    receiptName: string,
    updateData: Partial<PurchaseReceipt>
  ): Promise<ERPNextResponse<PurchaseReceipt>> {
    const response = await fetch(
      `${this.baseURL}/api/resource/Purchase Receipt/${encodeURIComponent(receiptName)}`,
      {
        method: 'PUT',
        headers: {
          ...this.getHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      }
    );
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to update purchase receipt: ${response.status} ${response.statusText} - ${errorText}`);
    }
    return response.json();
  }

  /**
   * Submit a Purchase Receipt (change status from Draft to Submitted)
   */
  async submitPurchaseReceipt(receiptName: string): Promise<ERPNextResponse<any>> {
    const response = await fetch(
      `${this.baseURL}/api/resource/Purchase Receipt/${encodeURIComponent(receiptName)}`,
      {
        method: 'PUT',
        headers: {
          ...this.getHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          docstatus: 1 // Set to 1 to submit the document
        })
      }
    );
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to submit purchase receipt: ${response.status} ${response.statusText} - ${errorText}`);
    }
    return response.json();
  }
}

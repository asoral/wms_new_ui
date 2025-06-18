
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
   * Create or get existing batch
   */
  async ensureBatchExists(batchNo: string, itemCode: string): Promise<boolean> {
    try {
      // First, try to get existing batch
      const params = new URLSearchParams();
      params.append('filters', JSON.stringify([['name', '=', batchNo]]));
      
      const response = await fetch(
        `${this.baseURL}/api/resource/Batch?${params.toString()}`,
        { headers: this.getHeaders() }
      );
      
      if (response.ok) {
        const result = await response.json();
        if (result.data && result.data.length > 0) {
          return true; // Batch exists
        }
      }

      // Create new batch if it doesn't exist
      const createResponse = await fetch(
        `${this.baseURL}/api/resource/Batch`,
        {
          method: 'POST',
          headers: {
            ...this.getHeaders(),
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            batch_id: batchNo,
            item: itemCode
          })
        }
      );

      return createResponse.ok;
    } catch (error) {
      console.error('Error ensuring batch exists:', error);
      return false;
    }
  }

  /**
   * Create a new Purchase Receipt
   */
  async createPurchaseReceipt(
    receiptData: Partial<PurchaseReceipt>
  ): Promise<ERPNextResponse<PurchaseReceipt>> {
    // Clean the data to avoid inter-company validation issues
    const cleanedData = {
      ...receiptData,
      // Explicitly set fields that might cause inter-company issues
      is_internal_supplier: 0,
      represents_company: null,
      inter_company_delivery_reference: null,
      inter_company_invoice_reference: null,
      inter_company_reference: null,
      // Ensure these fields are not passed if empty
      ...(receiptData.purchase_order && { purchase_order: receiptData.purchase_order }),
    };

    // Remove any undefined or null fields that might cause issues
    Object.keys(cleanedData).forEach(key => {
      if (cleanedData[key] === undefined || cleanedData[key] === null) {
        delete cleanedData[key];
      }
    });

    console.log('Creating Purchase Receipt with cleaned data:', cleanedData);

    const response = await fetch(
      `${this.baseURL}/api/resource/Purchase Receipt`,
      {
        method: 'POST',
        headers: {
          ...this.getHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(cleanedData)
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

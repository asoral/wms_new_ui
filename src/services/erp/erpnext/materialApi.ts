
import { ERPNextBaseAPI } from './baseApi';
import { ERPNextResponse, MaterialRequest } from './types';

export class ERPNextMaterialAPI extends ERPNextBaseAPI {
  async getMaterialRequests(filters?: any, company?: string, limitPageLength?: number): Promise<ERPNextResponse<MaterialRequest[]>> {
    let finalFilters = this.convertToFrappeFilters(filters);
    if (company) {
      finalFilters.push(['company', '=', company]);
    }
    
    const params = this.buildQueryParams(finalFilters, undefined, limitPageLength);

    const response = await fetch(`${this.baseURL}/api/resource/Material Request?${params}`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Material Request API Error:', response.status, errorText);
      throw new Error(`Failed to fetch material requests: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async getMaterialRequest(name: string): Promise<ERPNextResponse<any>> {
    const response = await fetch(`${this.baseURL}/api/resource/Material Request/${encodeURIComponent(name)}`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Material Request Detail API Error:', response.status, errorText);
      throw new Error(`Failed to fetch material request: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async createMaterialRequest(data: any): Promise<ERPNextResponse<any>> {
    const response = await fetch(`${this.baseURL}/api/resource/Material Request`, {
      method: 'POST',
      headers: {
        ...this.getHeaders(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Create Material Request API Error:', response.status, errorText);
      throw new Error(`Failed to create material request: ${response.status} ${response.statusText} - ${errorText}`);
    }

    return response.json();
  }

  async updateMaterialRequest(name: string, data: any): Promise<ERPNextResponse<any>> {
    const response = await fetch(`${this.baseURL}/api/resource/Material Request/${encodeURIComponent(name)}`, {
      method: 'PUT',
      headers: {
        ...this.getHeaders(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Update Material Request API Error:', response.status, errorText);
      throw new Error(`Failed to update material request: ${response.status} ${response.statusText} - ${errorText}`);
    }

    return response.json();
  }

  async searchMaterialRequests(searchTerm: string, company?: string, limitPageLength: number = 20): Promise<ERPNextResponse<MaterialRequest[]>> {
    const filters = [];
    
    if (company) {
      filters.push(['company', '=', company]);
    }

    const orFilters = [
      ['name', 'like', `%${searchTerm}%`],
      ['title', 'like', `%${searchTerm}%`]
    ];

    const params = new URLSearchParams({
      filters: JSON.stringify(filters),
      or_filters: JSON.stringify(orFilters),
      fields: JSON.stringify([
        'name', 
        'title',
        'material_request_type', 
        'status', 
        'transaction_date',
        'required_by',
        'requested_by',
        'company'
      ]),
      limit_page_length: limitPageLength.toString(),
      order_by: 'transaction_date desc'
    });

    const response = await fetch(`${this.baseURL}/api/resource/Material Request?${params}`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Search Material Request API Error:', response.status, errorText);
      throw new Error(`Failed to search material requests: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async submitMaterialRequest(name: string): Promise<ERPNextResponse<any>> {
    const response = await fetch(`${this.baseURL}/api/resource/Material Request/${encodeURIComponent(name)}`, {
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
      console.error('Submit Material Request API Error:', response.status, errorText);
      throw new Error(`Failed to submit material request: ${response.status} ${response.statusText} - ${errorText}`);
    }

    return response.json();
  }
}

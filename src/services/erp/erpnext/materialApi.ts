
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
      throw new Error(`Failed to fetch material requests: ${response.statusText}`);
    }

    return response.json();
  }

  async getMaterialRequest(mrNumber: string): Promise<ERPNextResponse<any>> {
    const response = await fetch(`${this.baseURL}/api/resource/Material Request/${mrNumber}`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch material request: ${response.statusText}`);
    }

    return response.json();
  }

  async createMaterialRequest(requestData: any): Promise<ERPNextResponse<any>> {
    const response = await fetch(`${this.baseURL}/api/resource/Material Request`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(requestData)
    });

    if (!response.ok) {
      throw new Error(`Failed to create material request: ${response.statusText}`);
    }

    return response.json();
  }
}

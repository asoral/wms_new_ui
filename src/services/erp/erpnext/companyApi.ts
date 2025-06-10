
import { ERPNextBaseAPI } from './baseApi';
import { ERPNextResponse, Company } from './types';

export class ERPNextCompanyAPI extends ERPNextBaseAPI {
  async getCompanies(): Promise<ERPNextResponse<Company[]>> {
    const params = this.buildQueryParams(undefined, ["name","company_name"]);
    const response = await fetch(`${this.baseURL}/api/resource/Company?${params}`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to fetch companies:', response.status, errorText);
      throw new Error(`Failed to fetch companies: ${response.statusText}`);
    }

    return response.json();
  }
}

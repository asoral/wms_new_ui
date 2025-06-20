
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

  async getCompanyDetails(companyName: string): Promise<ERPNextResponse<any>> {
    const response = await fetch(
      `${this.baseURL}/api/resource/Company/${encodeURIComponent(companyName)}`,
      {
        headers: this.getHeaders(),
      }
    );
    
    if (!response.ok) {
      throw new Error(`Failed to fetch company details: ${response.statusText}`);
    }

    const result = await response.json();
    return { data: result.data };
  }
}

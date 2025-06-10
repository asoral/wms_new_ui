
import { ERPNextConfig, ERPNextResponse } from './types';

export class ERPNextBaseAPI {
  constructor(public baseURL: string, public apiKey: string, public apiSecret: string) {
    this.baseURL = baseURL.replace(/\/+$/, '');
    this.apiKey = apiKey;
    this.apiSecret = apiSecret;
  }

  protected getHeaders() {
    return {
      'Authorization': `token ${this.apiKey}:${this.apiSecret}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
  }

  // Helper method to convert filter objects to Frappe format
  protected convertToFrappeFilters(filters: any): string[][] {
    if (!filters) return [];
    
    if (Array.isArray(filters)) {
      return filters;
    }
    
    // Convert object format to Frappe array format
    const frappeFilters: string[][] = [];
    Object.entries(filters).forEach(([field, value]) => {
      if (Array.isArray(value) && value.length === 2) {
        // Handle operator format like ['<', 10]
        frappeFilters.push([field, value[0], value[1].toString()]);
      } else {
        // Simple equality filter
        frappeFilters.push([field, '=', value?.toString() || '']);
      }
    });
    
    return frappeFilters;
  }

  // Helper method to build query parameters
  protected buildQueryParams(filters?: any, fields?: string[], limitPageLength?: number): URLSearchParams {
    const params = new URLSearchParams();
    
    const frappeFilters = this.convertToFrappeFilters(filters);
    if (frappeFilters.length > 0) {
      params.append('filters', JSON.stringify(frappeFilters));
    }
    
    if (fields) {
      params.append('fields', JSON.stringify(fields));
    }
    
    if (limitPageLength) {
      params.append('limit_page_length', limitPageLength.toString());
    }
    
    return params;
  }

  protected formatRelativeTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
      return `${diffInMinutes} minutes ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours} hours ago`;
    } else if (diffInDays < 7) {
      return `${diffInDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      console.log('Testing connection to:', this.baseURL);
      const response = await fetch(`${this.baseURL}/api/method/frappe.auth.get_logged_user`, {
        headers: this.getHeaders(),
      });
      
      console.log('Connection test response status:', response.status);
      
      if (response.ok) {
        const result = await response.json();
        console.log('Connection test result:', result);
        return true;
      } else {
        const errorText = await response.text();
        console.error('Connection test failed:', response.status, errorText);
        return false;
      }
    } catch (error) {
      console.error('Connection test failed with error:', error);
      return false;
    }
  }

  async getLoggedInUserDetails(): Promise<ERPNextResponse<any>> {
    const response = await fetch(`${this.baseURL}/api/method/frappe.auth.get_logged_user`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to fetch user details:', response.status, errorText);
      throw new Error(`Failed to fetch user details: ${response.statusText}`);
    }

    return response.json();
  }

  // Generic document fetch method
  async getDocument(doctype: string, name: string): Promise<ERPNextResponse<any>> {
    const response = await fetch(`${this.baseURL}/api/resource/${doctype}/${name}`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch ${doctype}: ${response.statusText}`);
    }

    return response.json();
  }

  // Generic document creation method
  async createDocument(doctype: string, data: any): Promise<ERPNextResponse<any>> {
    const response = await fetch(`${this.baseURL}/api/resource/${doctype}`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error(`Failed to create ${doctype}: ${response.statusText}`);
    }

    return response.json();
  }

  // Generic document update method
  async updateDocument(doctype: string, name: string, data: any): Promise<ERPNextResponse<any>> {
    const response = await fetch(`${this.baseURL}/api/resource/${doctype}/${name}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error(`Failed to update ${doctype}: ${response.statusText}`);
    }

    return response.json();
  }

  // Generic document list method
  async getDocumentList(doctype: string, filters?: any, fields?: string[], limitPageLength?: number): Promise<ERPNextResponse<any[]>> {
    const params = this.buildQueryParams(filters, fields, limitPageLength);

    const response = await fetch(`${this.baseURL}/api/resource/${doctype}?${params}`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch ${doctype} list: ${response.statusText}`);
    }

    return response.json();
  }
}

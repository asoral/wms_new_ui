
import { ERPNextSalesAPI } from './salesApi';
import { ERPNextStockAPI } from './stockApi';
import { ERPNextCompanyAPI } from './companyApi';
import { ERPNextMaterialAPI } from './materialApi';
import { ERPNextWarehouseAPI } from './warehouseApi';
import { ERPNextBaseAPI } from './baseApi';

export class ERPNextAPI {
  private baseURL: string;
  private apiKey: string;
  private apiSecret: string;

  public sales: ERPNextSalesAPI;
  public stock: ERPNextStockAPI;
  public company: ERPNextCompanyAPI;
  public material: ERPNextMaterialAPI;
  public warehouse: ERPNextWarehouseAPI;
  private baseApi: ERPNextBaseAPI;

  constructor(baseURL: string, apiKey: string, apiSecret: string) {
    this.baseURL = baseURL;
    this.apiKey = apiKey;
    this.apiSecret = apiSecret;

    this.sales = new ERPNextSalesAPI(baseURL, apiKey, apiSecret);
    this.stock = new ERPNextStockAPI(baseURL, apiKey, apiSecret);
    this.company = new ERPNextCompanyAPI(baseURL, apiKey, apiSecret);
    this.material = new ERPNextMaterialAPI(baseURL, apiKey, apiSecret);
    this.warehouse = new ERPNextWarehouseAPI(baseURL, apiKey, apiSecret);
    this.baseApi = new ERPNextBaseAPI(baseURL, apiKey, apiSecret);
  }

  // Proxy methods for backward compatibility
  async testConnection(): Promise<boolean> {
    return this.baseApi.testConnection();
  }

  async getCompanies() {
    return this.company.getCompanies();
  }

  async getItems(filters?: any, company?: string, limitPageLength?: number) {
    return this.stock.getItems(filters, company, limitPageLength);
  }
}

// ERPNext configuration and instance management
let erpnextAPIInstance: ERPNextAPI | null = null;

export interface ERPNextConfig {
  baseURL: string;
  apiKey: string;
  apiSecret: string;
}

export function configureERPNextAPI(config: ERPNextConfig): void {
  erpnextAPIInstance = new ERPNextAPI(config.baseURL, config.apiKey, config.apiSecret);
  
  // Store configuration in localStorage for persistence
  localStorage.setItem('erpnext_config', JSON.stringify(config));
}

export async function createERPNextAPI(): Promise<ERPNextAPI | null> {
  if (erpnextAPIInstance) {
    return erpnextAPIInstance;
  }

  // Try to restore from localStorage
  const savedConfig = localStorage.getItem('erpnext_config');
  if (savedConfig) {
    try {
      const config = JSON.parse(savedConfig);
      erpnextAPIInstance = new ERPNextAPI(config.baseURL, config.apiKey, config.apiSecret);
      return erpnextAPIInstance;
    } catch (error) {
      console.error('Failed to restore ERPNext config:', error);
    }
  }

  return null;
}

export async function getUserDefaultCompany(): Promise<string | null> {
  const api = await createERPNextAPI();
  if (!api) return null;

  try {
    const companiesResult = await api.getCompanies();
    if (companiesResult.data && companiesResult.data.length > 0) {
      return companiesResult.data[0].name;
    }
  } catch (error) {
    console.error('Failed to get default company:', error);
  }

  return null;
}

// Re-export types
export type * from './types';

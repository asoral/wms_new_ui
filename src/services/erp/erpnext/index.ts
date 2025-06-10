import { ERPNextConfig } from './types';
import { ERPNextAuthAPI } from './authApi';
import { ERPNextItemsAPI } from './itemsApi';
import { ERPNextStockAPI } from './stockApi';
import { ERPNextWarehouseAPI } from './warehouseApi';
import { ERPNextSalesAPI } from './salesApi';
import { ERPNextPurchaseAPI } from './purchaseApi';
import { ERPNextManufacturingAPI } from './manufacturingApi';
import { ERPNextCRMAPI } from './crmApi';
import { ERPNextAccountsAPI } from './accountsApi';
import { ERPNextQualityAPI } from './qualityApi';
import { ERPNextAssetsAPI } from './assetsApi';
import { ERPNextSupportAPI } from './supportApi';
import { ERPNextBinAPI } from './binApi';

export class ERPNextAPI extends ERPNextBinAPI {
  public auth: ERPNextAuthAPI;
  public items: ERPNextItemsAPI;
  public stock: ERPNextStockAPI;
  public warehouse: ERPNextWarehouseAPI;
  public sales: ERPNextSalesAPI;
  public purchase: ERPNextPurchaseAPI;
  public manufacturing: ERPNextManufacturingAPI;
  public crm: ERPNextCRMAPI;
  public accounts: ERPNextAccountsAPI;
  public quality: ERPNextQualityAPI;
  public assets: ERPNextAssetsAPI;
  public support: ERPNextSupportAPI;

  constructor(config: ERPNextConfig) {
    super(config.baseURL, config.apiKey, config.apiSecret);
    this.auth = new ERPNextAuthAPI(config.baseURL, config.apiKey, config.apiSecret);
    this.items = new ERPNextItemsAPI(config.baseURL, config.apiKey, config.apiSecret);
    this.stock = new ERPNextStockAPI(config.baseURL, config.apiKey, config.apiSecret);
    this.warehouse = new ERPNextWarehouseAPI(config.baseURL, config.apiKey, config.apiSecret);
    this.sales = new ERPNextSalesAPI(config.baseURL, config.apiKey, config.apiSecret);
    this.purchase = new ERPNextPurchaseAPI(config.baseURL, config.apiKey, config.apiSecret);
    this.manufacturing = new ERPNextManufacturingAPI(config.baseURL, config.apiKey, config.apiSecret);
    this.crm = new ERPNextCRMAPI(config.baseURL, config.apiKey, config.apiSecret);
    this.accounts = new ERPNextAccountsAPI(config.baseURL, config.apiKey, config.apiSecret);
    this.quality = new ERPNextQualityAPI(config.baseURL, config.apiKey, config.apiSecret);
    this.assets = new ERPNextAssetsAPI(config.baseURL, config.apiKey, config.apiSecret);
    this.support = new ERPNextSupportAPI(config.baseURL, config.apiKey, config.apiSecret);
  }
}

export const configureERPNextAPI = async (
  baseURL: string,
  apiKey: string,
  apiSecret: string
): Promise<ERPNextAPI | null> => {
  if (!baseURL || !apiKey || !apiSecret) {
    console.error('ERPNext API configuration is incomplete.');
    return null;
  }

  const api = new ERPNextAPI({ baseURL, apiKey, apiSecret });
  const isConnected = await api.auth.testConnection();

  if (!isConnected) {
    console.error('Failed to connect to ERPNext with provided credentials.');
    return null;
  }

  return api;
};

export const createERPNextAPI = async (): Promise<ERPNextAPI | null> => {
  const baseURL = localStorage.getItem('erpnextBaseURL') || '';
  const apiKey = localStorage.getItem('erpnextAPIKey') || '';
  const apiSecret = localStorage.getItem('erpnextAPISecret') || '';

  if (!baseURL || !apiKey || !apiSecret) {
    console.warn('ERPNext API configuration not found in localStorage.');
    return null;
  }

  return configureERPNextAPI(baseURL, apiKey, apiSecret);
};

export const getUserDefaultCompany = async (): Promise<string | null> => {
  try {
    const baseURL = localStorage.getItem('erpnextBaseURL') || '';
    const apiKey = localStorage.getItem('erpnextAPIKey') || '';
    const apiSecret = localStorage.getItem('erpnextAPISecret') || '';

    if (!baseURL || !apiKey || !apiSecret) {
      console.warn('ERPNext API configuration not found in localStorage.');
      return null;
    }

    const api = new ERPNextAuthAPI(baseURL, apiKey, apiSecret);
    const userDetails = await api.getLoggedInUserDetails();

    if (userDetails && userDetails.data && userDetails.data.company) {
      return userDetails.data.company;
    }

    return null;
  } catch (error) {
    console.error('Failed to fetch user details:', error);
    return null;
  }
};

import { ERPNextAuthAPI } from './authApi';
import { ERPNextSalesAPI } from './salesApi';
import { ERPNextStockAPI } from './stockApi';
import { ERPNextProductionAPI } from './productionApi';
import { ERPNextCRMAPI } from './crmApi';

export class ERPNextAPI {
  private baseURL: string;
  private apiKey: string;
  private apiSecret: string;

  public auth: ERPNextAuthAPI;
  public sales: ERPNextSalesAPI;
  public stock: ERPNextStockAPI;
  public production: ERPNextProductionAPI;
  public crm: ERPNextCRMAPI;

  constructor(baseURL: string, apiKey: string, apiSecret: string) {
    this.baseURL = baseURL;
    this.apiKey = apiKey;
    this.apiSecret = apiSecret;

    this.auth = new ERPNextAuthAPI(baseURL, apiKey, apiSecret);
    this.sales = new ERPNextSalesAPI(baseURL, apiKey, apiSecret);
    this.stock = new ERPNextStockAPI(baseURL, apiKey, apiSecret);
    this.production = new ERPNextProductionAPI(baseURL, apiKey, apiSecret);
    this.crm = new ERPNextCRMAPI(baseURL, apiKey, apiSecret);
  }
}

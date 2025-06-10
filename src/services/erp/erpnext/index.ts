import { ERPNextConfig } from './types';
import { ERPNextBaseAPI } from './baseApi';
import { ERPNextItemsAPI } from './itemsApi';
import { ERPNextStockAPI } from './stockApi';
import { ERPNextWarehouseAPI } from './warehouseApi';
import { ERPNextSalesAPI } from './salesApi';
import { ERPNextPurchaseAPI } from './purchaseApi';
import { ERPNextMaterialAPI } from './materialApi';
import { ERPNextCompanyAPI } from './companyApi';
import { ERPNextOtherAPIs } from './otherApis';
import { ERPNextDashboardAPI } from './dashboardApi';

let erpnextConfig: ERPNextConfig | null = null;

export const configureERPNextAPI = (config: ERPNextConfig) => {
  erpnextConfig = config;
  localStorage.setItem('erpnextBaseURL', config.baseURL);
  localStorage.setItem('erpnextApiKey', config.apiKey);
  localStorage.setItem('erpnextApiSecret', config.apiSecret);
};

export const createERPNextAPI = async (): Promise<ERPNextAPI | null> => {
  if (!erpnextConfig) {
    const baseURL = localStorage.getItem('erpnextBaseURL');
    const apiKey = localStorage.getItem('erpnextApiKey');
    const apiSecret = localStorage.getItem('erpnextApiSecret');
    
    if (baseURL && apiKey && apiSecret) {
      erpnextConfig = { baseURL, apiKey, apiSecret };
    } else {
      console.warn('ERPNext API not configured. Configure credentials first.');
      return null;
    }
  }

  return new ERPNextAPI(erpnextConfig.baseURL, erpnextConfig.apiKey, erpnextConfig.apiSecret);
};

export const getUserDefaultCompany = async (): Promise<string | null> => {
  try {
    const storedCompany = localStorage.getItem('erpnextDefaultCompany');
    if (storedCompany) {
      return storedCompany;
    }

    const erpnextAPI = await createERPNextAPI();
    if (!erpnextAPI) {
      console.error('ERPNext API not configured');
      return null;
    }

    const userDetails = await erpnextAPI.getLoggedInUserDetails();
    if (userDetails && userDetails.data && userDetails.data.defaults && userDetails.data.defaults.company) {
      const company = userDetails.data.defaults.company;
      localStorage.setItem('erpnextDefaultCompany', company);
      return company;
    } else {
      console.warn('Unable to retrieve default company from user details.');
      return null;
    }
  } catch (error) {
    console.error('Error fetching user details:', error);
    return null;
  }
};

class ERPNextAPI extends ERPNextBaseAPI {
  private itemsApi: ERPNextItemsAPI;
  private stockApi: ERPNextStockAPI;
  private warehouseApi: ERPNextWarehouseAPI;
  private salesApi: ERPNextSalesAPI;
  private purchaseApi: ERPNextPurchaseAPI;
  private materialApi: ERPNextMaterialAPI;
  private companyApi: ERPNextCompanyAPI;
  private otherApis: ERPNextOtherAPIs;
  private dashboardApi: ERPNextDashboardAPI;

  constructor(baseURL: string, apiKey: string, apiSecret: string) {
    super(baseURL, apiKey, apiSecret);
    this.itemsApi = new ERPNextItemsAPI(baseURL, apiKey, apiSecret);
    this.stockApi = new ERPNextStockAPI(baseURL, apiKey, apiSecret);
    this.warehouseApi = new ERPNextWarehouseAPI(baseURL, apiKey, apiSecret);
    this.salesApi = new ERPNextSalesAPI(baseURL, apiKey, apiSecret);
    this.purchaseApi = new ERPNextPurchaseAPI(baseURL, apiKey, apiSecret);
    this.materialApi = new ERPNextMaterialAPI(baseURL, apiKey, apiSecret);
    this.companyApi = new ERPNextCompanyAPI(baseURL, apiKey, apiSecret);
    this.otherApis = new ERPNextOtherAPIs(baseURL, apiKey, apiSecret);
    this.dashboardApi = new ERPNextDashboardAPI(baseURL, apiKey, apiSecret);
  }

  // Items API
  getItems = this.itemsApi.getItems.bind(this.itemsApi);
  searchItems = this.itemsApi.searchItems.bind(this.itemsApi);
  getItemsPaginated = this.itemsApi.getItemsPaginated.bind(this.itemsApi);
  getItemByBarcode = this.itemsApi.getItemByBarcode.bind(this.itemsApi);
  getItemDetails = this.itemsApi.getItemDetails.bind(this.itemsApi);

  // Stock API
  getStockBalance = this.stockApi.getStockBalance.bind(this.stockApi);
  getCurrentStock = this.stockApi.getCurrentStock.bind(this.stockApi);
  getStockLedgerEntries = this.stockApi.getStockLedgerEntries.bind(this.stockApi);
  getStockAgingReport = this.stockApi.getStockAgingReport.bind(this.stockApi);
  getStockEntries = this.stockApi.getStockEntries.bind(this.stockApi);
  createStockReconciliation = this.stockApi.createStockReconciliation.bind(this.stockApi);
  updateStockReconciliation = this.stockApi.updateStockReconciliation.bind(this.stockApi);

  // Warehouse API
  getWarehouses = this.warehouseApi.getWarehouses.bind(this.warehouseApi);

  // Sales API
  getSalesOrders = this.salesApi.getSalesOrders.bind(this.salesApi);
  getSalesOrder = this.salesApi.getSalesOrder.bind(this.salesApi);
  getDeliveryNotes = this.salesApi.getDeliveryNotes.bind(this.salesApi);

  // Purchase API
  getPurchaseOrders = this.purchaseApi.getPurchaseOrders.bind(this.purchaseApi);
  getPurchaseOrder = this.purchaseApi.getPurchaseOrder.bind(this.purchaseApi);
  getPurchaseReceipts = this.purchaseApi.getPurchaseReceipts.bind(this.purchaseApi);
  createPurchaseReceipt = this.purchaseApi.createPurchaseReceipt.bind(this.purchaseApi);

  // Material API
  getMaterialRequests = this.materialApi.getMaterialRequests.bind(this.materialApi);

  // Company API
  getCompanies = this.companyApi.getCompanies.bind(this.companyApi);

  // Other APIs
  getPickLists = this.otherApis.getPickLists.bind(this.otherApis);
  getPackingSlips = this.otherApis.getPackingSlips.bind(this.otherApis);
  getQualityInspections = this.otherApis.getQualityInspections.bind(this.otherApis);
  getProductBundles = this.otherApis.getProductBundles.bind(this.otherApis);
  validateBatch = this.otherApis.validateBatch.bind(this.otherApis);
  validateSerial = this.otherApis.validateSerial.bind(this.otherApis);

  // Dashboard API
  getDashboardMetrics = this.dashboardApi.getDashboardMetrics.bind(this.dashboardApi);
  getRecentActivities = this.dashboardApi.getRecentActivities.bind(this.dashboardApi);
  getOperationalMetrics = this.dashboardApi.getOperationalMetrics.bind(this.dashboardApi);
  getFinancialMetrics = this.dashboardApi.getFinancialMetrics.bind(this.dashboardApi);
}

export { ERPNextAPI };
export default ERPNextAPI;

// Re-export types for convenience
export * from './types';

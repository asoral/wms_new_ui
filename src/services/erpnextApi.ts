
// Legacy compatibility layer - re-exports from the new ERPNext API structure
export {
  configureERPNextAPI,
  createERPNextAPI,
  getUserDefaultCompany,
  ERPNextAPI
} from './erp/erpnext';

export type {
  ERPNextConfig,
  ERPNextResponse,
  Item,
  Warehouse,
  StockBalance,
  SalesOrder,
  DeliveryNote,
  PurchaseOrder,
  PurchaseReceipt,
  MaterialRequest,
  StockEntry,
  PickList,
  PackingSlip,
  QualityInspection,
  ProductBundle,
  Company,
  DashboardMetrics,
  RecentActivity,
  OperationalMetrics,
  FinancialMetrics
} from './erp/erpnext/types';

// Import and re-export as default
import { ERPNextAPI } from './erp/erpnext';
export default ERPNextAPI;

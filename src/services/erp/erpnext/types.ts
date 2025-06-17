export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface ERPNextResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
}

export interface ERPNextConfig {
  baseURL: string;
  apiKey: string;
  apiSecret: string;
}

export interface Item {
  name: string;
  item_code: string;
  item_name: string;
  description: string;
  stock_uom: string;
  default_warehouse: string;
  is_stock_item: number;
  has_batch_no: number;
  disabled: number;
  variant_of: string;
  attributes: any[];
  image?: string;
  qty?: number;
}

export interface Warehouse {
  name: string;
  warehouse_name: string;
  company: string;
  is_group: number;
  lft: number;
  rgt: number;
  parent_warehouse: string;
}

export interface StockBalance {
  item_code: string;
  warehouse: string;
  projected_qty: number;
  actual_qty: number;
}

export interface SalesOrder {
  name: string;
  customer: string;
  company: string;
  transaction_date: string;
  delivery_date: string;
  status: string;
  base_grand_total: number;
  grand_total: number;
}

export interface DeliveryNote {
  name: string;
  customer: string;
  company: string;
  posting_date: string;
  status: string;
  grand_total: number;
}

export interface PurchaseOrder {
  name: string;
  supplier: string;
  company: string;
  transaction_date: string;
  status: string;
  base_grand_total: number;
  grand_total: number;
}

export interface PurchaseReceipt {
  name: string;
  supplier: string;
  company: string;
  posting_date: string;
  status: string;
  grand_total: number;
}

export interface MaterialRequest {
  name: string;
  item: string;
  company: string;
  transaction_date: string;
  material_request_type: string;
  status: string;
  qty: number;
  warehouse: string;
}

export interface StockEntry {
  name: string;
  posting_date: string;
  purpose: string;
  status: string;
  total_amount: number;
}

export interface PickList {
  name: string;
  company: string;
  status: string;
}

export interface PackingSlip {
  name: string;
  company: string;
  status: string;
}

export interface QualityInspection {
  name: string;
  company: string;
  status: string;
}

export interface ProductBundle {
  name: string;
  product_bundle_id: string;
  description: string;
}

export interface Company {
  name: string;
  company_name: string;
  abbr: string;
  default_currency: string;
  creation: string;
  modified: string;
}

export interface DashboardMetrics {
  totalItems: number;
  lowStockItems: number;
  pendingOrders: number;
  totalWarehouses: number;
  totalStockValue: number;
  recentActivitiesCount: number;
}

export interface RecentActivity {
  id: string;
  type: string;
  title: string;
  subtitle: string;
  time: string;
  status: string;
  reference: string;
}

export interface OperationalMetrics {
  pickAccuracy: number;
  putawaySpeed: number;
  cycleCountAccuracy: number;
  orderFulfillmentRate: number;
  warehouseUtilization: number;
  averageProcessingTime: number;
}

export interface FinancialMetrics {
  stockTurnoverRatio: number;
  carryingCostPercentage: number;
  deadStockValue: number;
  abcAnalysis: {
    classA: number;
    classB: number;
    classC: number;
  };
}

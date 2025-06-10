
export interface ERPNextConfig {
  baseURL: string;
  apiKey: string;
  apiSecret: string;
}

export interface ERPNextResponse<T> {
  data: T;
  message?: string;
}

export interface Item {
  item_code: string;
  item_name: string;
  stock_uom: string;
  has_batch_no?: boolean;
  has_serial_no?: boolean;
}

export interface Warehouse {
  name: string;
  warehouse_name: string;
  is_group?: number;
  company?: string;
}

export interface StockBalance {
  item_code: string;
  warehouse: string;
  actual_qty: number;
  valuation_rate: number;
  stock_value: number;
  stock_uom?: string;
}

export interface SalesOrder {
  name: string;
  customer: string;
  status: string;
  company: string;
}

export interface DeliveryNote {
  name: string;
  customer: string;
  status: string;
  company: string;
}

export interface PurchaseOrder {
  name: string;
  supplier: string;
  status: string;
  company: string;
}

export interface PurchaseReceipt {
  name: string;
  supplier: string;
  status: string;
  company: string;
}

export interface MaterialRequest {
  name: string;
  status: string;
  company: string;
}

export interface StockEntry {
  name: string;
  status: string;
  company: string;
}

export interface PickList {
  name: string;
  status: string;
  company: string;
}

export interface PackingSlip {
  name: string;
  status: string;
  company: string;
}

export interface QualityInspection {
  name: string;
  item_code: string;
  status: string;
  company: string;
}

export interface ProductBundle {
  name: string;
  new_item_code: string;
  company: string;
}

export interface Company {
  name: string;
  company_name: string;
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

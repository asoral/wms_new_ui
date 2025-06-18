
// ERPNext API Types
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
  name: string;
  item_group: string;
  description?: string;
  has_batch_no?: number;
  has_serial_no?: number;
  barcodes?: Array<{
    barcode: string;
    barcode_type: string;
  }>;
}

export interface Warehouse {
  name: string;
  is_group: number;
  warehouse_name?: string;
  company?: string;
}

export interface StockBalance {
  item_code: string;
  warehouse: string;
  actual_qty: number;
  valuation_rate?: number;
  stock_value?: number;
  stock_uom?: string;
}

export interface SalesOrder {
  name: string;
  customer: string;
  customer_name?: string;
  company: string;
  base_grand_total: number;
  grand_total?: number;
  currency: string;
  status: string;
  delivery_date?: string;
  transaction_date?: string;
  items?: any[];
}

export interface DeliveryNote {
  name: string;
  customer: string;
  company: string;
  grand_total: number;
  currency: string;
  status: string;
  posting_date?: string;
  posting_time?: string;
}

export interface PurchaseOrder {
  name: string;
  supplier: string;
  supplier_name?: string;
  schedule_date?: string;
  transaction_date?: string;
  grand_total?: number;
  status?: string;
  items?: any[];
  company: string;
  base_grand_total: number;
  currency: string;
}

export interface PurchaseReceiptItem {
  item_code: string;
  qty: number;
  warehouse: string;
  rate: number;
  uom: string;
  batch_no?: string;
  serial_no?: string;
}

export interface PurchaseReceipt {
  name: string;
  supplier: string;
  company: string;
  grand_total: number;
  currency: string;
  status: string;
  posting_date?: string;
  posting_time?: string;
  purchase_order?: string;
  set_posting_time?: number;
  items?: PurchaseReceiptItem[];
}

export interface MaterialRequest {
  name: string;
  company: string;
  material_request_type: string;
  status: string;
  transaction_date?: string;
  required_date?: string;
}

export interface StockEntry {
  name: string;
  company: string;
  purpose: string;
  status: string;
  posting_date?: string;
  posting_time?: string;
}

export interface PickList {
  name: string;
  company: string;
  status: string;
}

export interface PackingSlip {
  name: string;
  customer: string;
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
  type: 'receipt' | 'delivery' | 'stock_entry' | 'material_request';
  title: string;
  subtitle: string;
  time: string;
  status: 'completed' | 'pending' | 'cancelled';
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

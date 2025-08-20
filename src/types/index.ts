
// Core Item Types
export interface Item {
  name: string;
  item_code: string;
  item_name: string;
  item_group?: string;
  stock_uom: string;
  description?: string;
  has_batch_no?: number;
  has_serial_no?: number;
  has_variants?: number;
  variant_of?: string;
  barcodes?: Array<{
    barcode: string;
    barcode_type: string;
  }>;
}

// Sales Order Types
export interface SalesOrder {
  name: string;
  id: string;
  number: string;
  customer: string;
  customer_name?: string;
  status: string;
  delivery_date?: string;
  deliveryDate?: string;
  expectedDelivery?: string;
  grand_total: number;
  totalValue: number;
  totalItems: number;
  percentDelivered: number;
  per_delivered?: number;
  items: SalesOrderItem[];
}

export interface SalesOrderItem {
  name: string;
  item_code: string;
  itemCode: string;
  item_name: string;
  itemName: string;
  qty: number;
  orderedQty: number;
  delivered_qty: number;
  deliveredQty: number;
  pending_qty: number;
  pendingQty: number;
  rate: number;
  stock_uom: string;
  uom: string;
  warehouse?: string;
}

export interface SOItem {
  itemCode: string;
  itemName: string;
  orderedQty: number;
  deliveredQty: number;
  pendingQty: number;
  uom: string;
  rate: number;
  warehouse?: string;
}

// Delivery Types
export interface DeliveryEntry {
  itemCode: string;
  itemName: string;
  deliveredQty: number;
  actualQty: number;
  warehouse: string;
  batch?: string;
  serial?: string;
  uom: string;
  rate: number;
  salesOrderItem?: string;
  serial_batch_bundle?: string;
  batches?: Array<{
    batch_no: string;
    qty: number;
  }>;
}

// Stock Count Types
export interface StockCountSession {
  id: string;
  name: string;
  warehouse: string;
  purpose: string;
  status: 'Draft' | 'In Progress' | 'Completed' | 'Submitted' | 'Cancelled';
  startedAt: Date;
  postingTime?: string;
  completedAt?: Date;
  totalItems: number;
  matchedItems: number;
  varianceItems: number;
  differenceAmount?: number;
  createdBy?: string;
  owner?: string;
  entries: StockCountEntry[];
}

export interface StockCountEntry {
  itemCode: string;
  itemName: string;
  warehouse: string;
  currentQty: number;
  actualQty: number;
  difference: number;
  status: 'matched' | 'variance' | 'pending';
  batch?: string;
  serial?: string;
  serialBatchBundle?: string;
  uom: string;
}

export interface StockCountItem {
  itemCode: string;
  itemName: string;
  warehouse: string;
  currentQty: number;
  actualQty: number;
  uom: string;
  batch?: string;
  serial?: string;
}

// Dashboard Types
export interface SalesOrderOption {
  id: string;
  number: string;
  customer: string;
  status: string;
  delivery_date?: string;
  totalValue: number;
  totalItems: number;
  expectedDelivery?: string;
  percentDelivered: number;
}

export interface DashboardData {
  pendingOrders: number;
  readyToShip: number;
  overdue: number;
  deliveredToday: number;
}

// Purchase Order Types
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
  per_received?: number;
}

export interface POItem {
  itemCode: string;
  itemName: string;
  orderedQty: number;
  receivedQty: number;
  pendingQty: number;
  uom: string;
  rate: number;
  warehouse?: string;
}

// Draft Receipt Types
export interface DraftReceipt {
  name: string;
  supplier: string;
  posting_date: string;
  grand_total: number;
  status: string;
}

// Common Callback Types
export type ItemSelectCallback = (item: Item) => void;
export type ItemCodeSelectCallback = (itemCode: string) => void;
export type BarcodeScannedCallback = (barcode: string) => void;

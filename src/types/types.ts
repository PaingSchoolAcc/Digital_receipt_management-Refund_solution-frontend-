// ---------- Generic ----------
export interface ApiResponse<T> {
  message?: string;
  data: T;
}

// ---------- Receipts ----------
export type ReceiptStatus = "issued" | "viewed" | "refunded";

// TODO: adjust to the real shape you store in the `items` JSONB column
export interface ReceiptItem {
  name: string;
  quantity: number;
  price: number;
}

export interface Receipt {
  receipt_id: number;
  merchant_id: number;
  customer_id: number;
  cashier_id: number | null;
  payment_type: string;
  issued_at: string; // ISO timestamp
  items: ReceiptItem[];
  total_amount: string | number; // node-postgres returns NUMERIC as a string
  receipt_status: ReceiptStatus;
}

export interface CreateReceiptInput {
  merchant_id: number;
  customer_id: number;
  cashier_id?: number | null;
  payment_type: string;
  items: ReceiptItem[];
  total_amount: number;
  receipt_status?: ReceiptStatus; // backend defaults to "issued"
}

export type RefundStatus = "pending" | "approved" | "rejected";

export interface Refund {
  refund_id: number;
  receipt_id: number;
  customer_id: number;
  merchant_id: number;
  requested_at: string; // ISO timestamp
  refund_status: RefundStatus;
  refund_amount: string | number; // node-postgres returns NUMERIC as a string
  refund_reason: string | null;
  processed_at: string | null; // ISO timestamp or null before processing
}
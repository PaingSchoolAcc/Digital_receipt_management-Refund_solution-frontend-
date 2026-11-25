import { http } from "@/lib/api/http";
import type { ApiResponse, Receipt } from "@/types/types";

export type RefundStatus = "pending" | "approved" | "rejected" | string;

export interface Refund {
  refund_id: number;
  receipt_id: number;
  customer_id: number;
  merchant_id: number;
  requested_at: string;
  refund_status: RefundStatus;
  refund_amount: string | number; // node-postgres NUMERIC often comes back as string
  refund_reason: string | null;
  processed_at: string | null;
}

export interface UpdateRefundStatusVariables {
  receiptId: number;
  approved: boolean;
}

export interface UpdateRefundStatusResult {
  message?: string;
  data: {
    refunds: Refund[];
    receipt: Receipt;
  };
}

export const refundsService = {
  // GET /api/refunds/:id (where :id = merchant_id)
  getByMerchant: (merchantId: number) =>
    http.get<ApiResponse<Refund[]>>(`/refund/${merchantId}`),

  // POST /api/refunds/:id/:decision (where :id = receipt_id, :decision = 'true' | 'false')
  updateStatus: ({ receiptId, approved }: UpdateRefundStatusVariables) =>
    http.post<UpdateRefundStatusResult>(
      `/refund/${receiptId}/${approved ? "true" : "false"}`
    ),
};
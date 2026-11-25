import { http } from "@/lib/api/http";
import type { ApiResponse, CreateReceiptInput, Receipt } from "@/types/types";

export const receiptsService = {
  create: (input: CreateReceiptInput) =>
    http.post<ApiResponse<Receipt>>("/receipts", input),

  getAllByUser: (userId: number) =>
    http.get<ApiResponse<Receipt[]>>(`/receipts/all/${userId}`),

  getById: (receiptId: number) =>
    http.get<ApiResponse<Receipt>>(`/receipts/${receiptId}`),
};
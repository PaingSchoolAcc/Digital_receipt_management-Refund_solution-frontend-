import { http } from "@/lib/api/http";
import type { ApiResponse } from "@/types/types";

export type CashierStatus = "active" | "pending";
export type ApprovalCodeStatus = "active" | "used" | string;

export interface CashierUser {
  user_id: number;
  role: string;
  name: string;
  email: string;
  phone_number: string | null;
  merchant_to_work_under: number | string | null;
  business_name: string | null;
  business_registration_code: string | null;
  account_status: string;
  created_at: string;
}

export interface ApprovalCode {
  id: number;
  approval_code: string;
  status: ApprovalCodeStatus;
  used_at: string | null;
}

export interface UpdateCashierStatusVariables {
  userId: number;
  approved: boolean;
}

export interface UpdateCashierStatusResponse {
  message?: string;
  data: CashierUser;
}

export const merchantsService = {
  // GET /api/merchants/approval-codes/active
  getActiveApprovalCodes: () =>
    http.get<ApiResponse<ApprovalCode[]>>("/merchant/approval-codes/active"),

  // POST /api/merchants/approval-codes
  createApprovalCode: () =>
    http.post<ApiResponse<ApprovalCode>>("/merchant/approval-codes"),

  // GET /api/merchants/:status (:status = 'active' | 'pending')
  getCashiersByStatus: (status: CashierStatus) =>
    http.get<ApiResponse<CashierUser[]>>(`/merchant/${status}`),

  // POST /api/merchants/:id/:decision (:id = user_id, :decision = 'true' | 'false')
  updateCashierStatus: ({ userId, approved }: UpdateCashierStatusVariables) =>
    http.post<UpdateCashierStatusResponse>(
      `/merchant/${userId}/${approved ? "true" : "false"}`
    ),
};
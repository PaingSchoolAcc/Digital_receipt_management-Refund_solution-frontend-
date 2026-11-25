"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { receiptKeys } from "@/hook/useReceipt";
import {
  refundsService,
  type UpdateRefundStatusVariables,
} from "@/services/refund.service";

export const refundKeys = {
  all: ["refunds"] as const,
  byMerchant: (merchantId: number) =>
    [...refundKeys.all, "merchant", merchantId] as const,
};

export function useMerchantRefunds(merchantId: number | undefined) {
  return useQuery({
    queryKey: refundKeys.byMerchant(merchantId ?? 0),
    queryFn: () => refundsService.getByMerchant(merchantId!),
    select: (res) => (Array.isArray(res?.data) ? res.data : []),
    enabled:
      typeof merchantId === "number" &&
      Number.isInteger(merchantId) &&
      merchantId > 0,
  });
}

export function useUpdateRefundStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (vars: UpdateRefundStatusVariables) =>
      refundsService.updateStatus(vars),
    onSuccess: () => {
      // Refresh both refund lists and receipt lists since the backend syncs both tables
      queryClient.invalidateQueries({ queryKey: refundKeys.all });
      queryClient.invalidateQueries({ queryKey: receiptKeys.all });
    },
  });
}
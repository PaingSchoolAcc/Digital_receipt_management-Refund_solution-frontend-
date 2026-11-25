"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  merchantsService,
  type CashierStatus,
  type UpdateCashierStatusVariables,
} from "@/services/merchant.service";

export const merchantKeys = {
  all: ["merchants"] as const,
  cashiers: (status: CashierStatus) =>
    [...merchantKeys.all, "cashiers", status] as const,
  activeApprovalCodes: () =>
    [...merchantKeys.all, "approval-codes", "active"] as const,
};

export function useCashiersByStatus(status: CashierStatus) {
  return useQuery({
    queryKey: merchantKeys.cashiers(status),
    queryFn: () => merchantsService.getCashiersByStatus(status),
    select: (res) => (Array.isArray(res?.data) ? res.data : []),
  });
}

export function useUpdateCashierStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (vars: UpdateCashierStatusVariables) =>
      merchantsService.updateCashierStatus(vars),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: merchantKeys.cashiers("pending"),
      });
      queryClient.invalidateQueries({
        queryKey: merchantKeys.cashiers("active"),
      });
    },
  });
}

export function useActiveApprovalCodes() {
  return useQuery({
    queryKey: merchantKeys.activeApprovalCodes(),
    queryFn: () => merchantsService.getActiveApprovalCodes(),
    select: (res) => (Array.isArray(res?.data) ? res.data : []),
  });
}

export function useCreateApprovalCode() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => merchantsService.createApprovalCode(),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: merchantKeys.activeApprovalCodes(),
      });
    },
  });
}
"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { receiptsService } from "@/services/receipt.service";
import type { CreateReceiptInput } from "@/types/types";

export const receiptKeys = {
  all: ["receipts"] as const,
  byUser: (userId: number) => [...receiptKeys.all, "user", userId] as const,
  detail: (id: number) => [...receiptKeys.all, "detail", id] as const,
};

export function useUserReceipts(userId: number | undefined) {
  return useQuery({
    queryKey: receiptKeys.byUser(userId ?? 0),
    queryFn: () => receiptsService.getAllByUser(userId!),
    // Adjust `.data` if your backend/ApiResponse uses a different property name
    select: (res) => (Array.isArray(res?.data) ? res.data : []),
    enabled: !!userId,
  });
}
export function useReceipt(receiptId: number | undefined) {
  return useQuery({
    queryKey: receiptKeys.detail(receiptId ?? 0),
    queryFn: () => receiptsService.getById(receiptId!),
    select: (res) => res.data,
    enabled: !!receiptId,
  });
}

export function useCreateReceipt() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateReceiptInput) => receiptsService.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: receiptKeys.all }); // refetch lists
    },
  });
}
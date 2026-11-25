import { http } from "../lib/api/http";

export const healthService = {
  check: () => http.get<{ status: string }>("/health"),
};
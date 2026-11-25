import axios from "axios";

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number | null,
    public code?: string,
    public details?: unknown
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function toApiError(err: unknown): ApiError {
  if (axios.isAxiosError(err)) {
    if (!err.response) {
      return new ApiError("Network error. Is the server reachable?", null, "NETWORK_ERROR");
    }
    const data = err.response.data as any;
    return new ApiError(
  data?.error ?? data?.message ?? err.message,
  err.response.status,
  data?.code,
  data?.errors ?? data?.details
);
  }
  return new ApiError(err instanceof Error ? err.message : "Unknown error", null);
}
import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { env } from "../../config/env";
import { tokenStorage } from "../auth/token-storage";
import { toApiError } from "./errors";

export const client = axios.create({
  baseURL: env.apiBaseUrl,
  timeout: env.apiTimeoutMs,
  headers: { "Content-Type": "application/json" },
  // withCredentials: true, // if using cookies
});

// Attach token
client.interceptors.request.use((config) => {
  const token = tokenStorage.get();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Refresh-on-401 with a single in-flight refresh
let refreshPromise: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
  // Use bare axios so this call skips our interceptors (no infinite loop)
  const res = await axios.post(
    `${env.apiBaseUrl}/auth/refresh`,
    {},
    { withCredentials: true }
  );
  const token = res.data.accessToken;
  tokenStorage.set(token);
  return token;
}

client.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;

    const isAuthRoute = original?.url?.includes("/auth/");
    if (error.response?.status === 401 && original && !original._retry && !isAuthRoute) {
      original._retry = true;
      try {
        refreshPromise ??= refreshAccessToken().finally(() => (refreshPromise = null));
        const newToken = await refreshPromise;
        original.headers.Authorization = `Bearer ${newToken}`;
        return client(original);
      } catch {
        tokenStorage.clear();
        window.dispatchEvent(new Event("auth:logout")); // app listens and redirects to /login
      }
    }
    return Promise.reject(toApiError(error));
  }
);
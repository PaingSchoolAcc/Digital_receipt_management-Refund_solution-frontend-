const KEY = "access_token";
const isBrowser = typeof window !== "undefined";

export const tokenStorage = {
  get: () => (isBrowser ? localStorage.getItem(KEY) : null),
  set: (token: string) => { if (isBrowser) localStorage.setItem(KEY, token); },
  clear: () => { if (isBrowser) localStorage.removeItem(KEY); },
};
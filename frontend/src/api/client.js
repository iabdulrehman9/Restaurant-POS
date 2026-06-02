const getInjectedApiBase = () => {
  if (typeof globalThis.__POS_API_BASE__ === "string" && globalThis.__POS_API_BASE__) {
    return globalThis.__POS_API_BASE__;
  }
  if (typeof window !== "undefined" && window.posDesktop?.getApiBaseUrl) {
    return window.posDesktop.getApiBaseUrl();
  }
  return import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:5000/api";
};

export const getApiBaseUrl = () => getInjectedApiBase();

export const getWsBaseUrl = () => {
  if (typeof globalThis.__POS_WS__ === "string" && globalThis.__POS_WS__) {
    return globalThis.__POS_WS__;
  }
  return getInjectedApiBase().replace(/^http/, "ws").replace(/\/api$/, "/ws");
};

const getToken = () => localStorage.getItem("pos_token");

const buildHeaders = (options = {}) => {
  const headers = new Headers(options.headers || {});
  const token = getToken();
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const isFormData = options.body instanceof FormData;
  if (!isFormData && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  return headers;
};

export const apiRequest = async (path, options = {}) => {
  const response = await fetch(`${getInjectedApiBase()}${path}`, {
    ...options,
    headers: buildHeaders(options),
  });

  const contentType = response.headers.get("content-type") || "";
  const data = contentType.includes("application/json") ? await response.json() : null;

  if (!response.ok) {
    const message = data?.error || data?.message || `Request failed (${response.status})`;
    throw new Error(message);
  }

  return data;
};

import { apiRequest } from "./client.js";

export const login = (email, password) =>
  apiRequest("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

export const getMe = () => apiRequest("/auth/me");

export const getProducts = (params = {}) => {
  const query = new URLSearchParams(params).toString();
  return apiRequest(`/products${query ? `?${query}` : ""}`);
};

export const createProduct = (formData) =>
  apiRequest("/products", {
    method: "POST",
    body: formData,
  });

export const updateProduct = (id, formData) =>
  apiRequest(`/products/${id}`, {
    method: "PUT",
    body: formData,
  });

export const deleteProduct = (id) =>
  apiRequest(`/products/${id}`, { method: "DELETE" });

export const getExpenses = (params = {}) => {
  const query = new URLSearchParams(params).toString();
  return apiRequest(`/expenses${query ? `?${query}` : ""}`);
};

export const createExpense = (payload) =>
  apiRequest("/expenses", {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const updateExpense = (id, payload) =>
  apiRequest(`/expenses/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });

export const deleteExpense = (id) =>
  apiRequest(`/expenses/${id}`, { method: "DELETE" });

export const getOrders = (params = {}) => {
  const query = new URLSearchParams(params).toString();
  return apiRequest(`/orders${query ? `?${query}` : ""}`);
};

export const createOrder = (payload) =>
  apiRequest("/orders", {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const updateOrder = (id, payload) =>
  apiRequest(`/orders/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });

export const updateOrderStatus = (id, status) =>
  apiRequest(`/orders/${id}/status`, {
    method: "PUT",
    body: JSON.stringify({ status }),
  });

export const markOrderKOT = (id) =>
  apiRequest(`/orders/${id}/print/kot`, { method: "POST" });

export const markOrderReceipt = (id) =>
  apiRequest(`/orders/${id}/print/receipt`, { method: "POST" });

export const getReportSummary = (params = {}) => {
  const query = new URLSearchParams(params).toString();
  return apiRequest(`/reports/summary${query ? `?${query}` : ""}`);
};

export const getReportSales = (params = {}) => {
  const query = new URLSearchParams(params).toString();
  return apiRequest(`/reports/sales${query ? `?${query}` : ""}`);
};

export const getReportExpenses = (params = {}) => {
  const query = new URLSearchParams(params).toString();
  return apiRequest(`/reports/expenses${query ? `?${query}` : ""}`);
};

export const getReportProducts = (params = {}) => {
  const query = new URLSearchParams(params).toString();
  return apiRequest(`/reports/products${query ? `?${query}` : ""}`);
};

export const getSettings = () => apiRequest("/settings");

export const updateSettings = (payload) =>
  apiRequest("/settings", {
    method: "PUT",
    body: JSON.stringify(payload),
  });

export const backupDatabase = () =>
  apiRequest("/settings/backup", { method: "POST" });

export const restoreDatabase = (backupPath) =>
  apiRequest("/settings/restore", {
    method: "POST",
    body: JSON.stringify({ backupPath }),
  });

export const getModules = () => apiRequest("/permissions/modules");

export const getUserPermissions = (userId) =>
  apiRequest(`/permissions/users/${userId}`);

export const updateUserPermissions = (userId, permissions) =>
  apiRequest(`/permissions/users/${userId}`, {
    method: "PUT",
    body: JSON.stringify({ permissions }),
  });

export const getUsers = () => apiRequest("/users");

export const createUser = (payload) =>
  apiRequest("/users", {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const updateUser = (id, payload) =>
  apiRequest(`/users/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });

export const deleteUser = (id) =>
  apiRequest(`/users/${id}`, { method: "DELETE" });

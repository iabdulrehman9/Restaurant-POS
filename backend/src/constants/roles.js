export const ALLOWED_ROLES = ["admin", "cashier", "kitchen"];

export const isAllowedRole = (role) => ALLOWED_ROLES.includes(String(role || "").toLowerCase());

export const normalizeRole = (role) => String(role || "").toLowerCase();

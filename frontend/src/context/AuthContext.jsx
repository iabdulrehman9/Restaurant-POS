import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { getMe, login as loginRequest } from "../api/index.js";

const AuthContext = createContext(null);

const TOKEN_KEY = "pos_token";

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadSession = async () => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const data = await getMe();
      setUser(data.user);
      setPermissions(data.permissions || []);
    } catch (err) {
      localStorage.removeItem(TOKEN_KEY);
      setUser(null);
      setPermissions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSession();
  }, []);

  const login = async (email, password) => {
    const data = await loginRequest(email, password);
    localStorage.setItem(TOKEN_KEY, data.token);
    setUser(data.user);
    setPermissions(data.permissions || []);
    return data;
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
    setPermissions([]);
  };

  const can = (moduleKey, actionKey = "view") => {
    if (!user) return false;
    if (user.role === "admin") return true;
    const entry = permissions.find((item) => item.moduleKey === moduleKey);
    return entry ? entry.actions.includes(actionKey) : false;
  };

  const value = useMemo(
    () => ({ user, permissions, loading, login, logout, can }),
    [user, permissions, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
};

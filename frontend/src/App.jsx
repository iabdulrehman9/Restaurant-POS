import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AdminLayout from "./layout/AdminLayout";
import { useAuth } from "./context/AuthContext.jsx";

import Dashboard from "./pages/Dashboard";
import POS from "./pages/POS";
import Kitchen from "./pages/Kitchen";
import Products from "./pages/Products";
import Expenses from "./pages/Expenses";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import SignUp from "./pages/SignUp";

const RequireAuth = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 text-sm font-semibold text-neutral-500">
        Loading session...
      </div>
    );
  }
  if (!user) {
    return <Navigate to="/signup" replace />;
  }
  return children;
};

const RequirePermission = ({ moduleKey, children }) => {
  const { can, loading } = useAuth();
  if (loading) return null;
  if (!can(moduleKey, "view")) {
    return <Navigate to="/" replace />;
  }
  return children;
};

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/signup" element={<SignUp />} />
        <Route
          element={
            <RequireAuth>
              <AdminLayout />
            </RequireAuth>
          }
        >
          <Route
            path="/"
            element={
              <RequirePermission moduleKey="dashboard">
                <Dashboard />
              </RequirePermission>
            }
          />
          <Route
            path="/pos"
            element={
              <RequirePermission moduleKey="pos">
                <POS />
              </RequirePermission>
            }
          />
          <Route
            path="/kitchen"
            element={
              <RequirePermission moduleKey="kitchen">
                <Kitchen />
              </RequirePermission>
            }
          />
          <Route
            path="/products"
            element={
              <RequirePermission moduleKey="products">
                <Products />
              </RequirePermission>
            }
          />
          <Route
            path="/expenses"
            element={
              <RequirePermission moduleKey="expenses">
                <Expenses />
              </RequirePermission>
            }
          />
          <Route
            path="/reports"
            element={
              <RequirePermission moduleKey="reports">
                <Reports />
              </RequirePermission>
            }
          />
          <Route
            path="/settings"
            element={
              <RequirePermission moduleKey="settings">
                <Settings />
              </RequirePermission>
            }
          />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

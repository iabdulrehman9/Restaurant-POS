import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Store,
  Package,
  Banknote,
  BarChart3,
  Settings,
  X,
  UtensilsCrossed
} from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";

const menuItems = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/", moduleKey: "dashboard" },
  { label: "POS / Billing", icon: Store, path: "/pos", moduleKey: "pos" },
  { label: "Kitchen / Order", icon: Store, path: "/kitchen", moduleKey: "kitchen" },
  { label: "Products", icon: Package, path: "/products", moduleKey: "products" },
  { label: "Expenses", icon: Banknote, path: "/expenses", moduleKey: "expenses" },
  { label: "Reports", icon: BarChart3, path: "/reports", moduleKey: "reports" },
  { label: "Settings", icon: Settings, path: "/settings", moduleKey: "settings" },
];

export default function Sidebar({ isOpen, onClose }) {
  const { user, can, logout } = useAuth();
  const visibleItems = menuItems.filter((item) => can(item.moduleKey, "view"));

  return (
    <>
      {/* BACKGROUND BLUR OVERLAY (Crucial for Mobile/Tablet UX) */}
      <div
        onClick={onClose}
        className={`fixed inset-0 bg-neutral-950/40 backdrop-blur-sm z-40 transition-opacity duration-300 md:hidden ${
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      />

      {/* SIDEBAR PANEL */}
      <aside
        className={`h-screen w-72 bg-neutral-900 text-white flex flex-col fixed left-0 top-0 z-50 shadow-2xl transition-transform duration-300 ease-in-out border-r border-neutral-800/60 font-sans ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* PANEL HEADER */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-neutral-800/50">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-2.5 rounded-xl shadow-lg shadow-orange-500/10">
              <UtensilsCrossed size={20} className="text-white" />
            </div>
            <div>
              <h1 className="font-bold text-base tracking-tight text-white flex items-center gap-0.5">
                Bite<span className="text-orange-500">Flow</span>
              </h1>
              <span className="text-[10px] text-neutral-500 font-medium block -mt-0.5 tracking-wider uppercase">
                Management POS
              </span>
            </div>
          </div>

          {/* CLOSE BUTTON */}
          <button
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-xl transition-all duration-200 outline-none"
            aria-label="Close sidebar"
          >
            <X size={16} />
          </button>
        </div>

        {/* NAVIGATION LINKS CONTAINER */}
        <div className="flex-1 overflow-y-auto py-6 px-4 space-y-1 custom-scrollbar">
          <nav className="space-y-1.5">
            {visibleItems.map(({ label, icon: Icon, path }) => (
              <NavLink
                key={path}
                to={path}
                className={({ isActive }) =>
                  `group relative flex items-center gap-3.5 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-200 outline-none select-none ${
                    isActive
                      ? "bg-gradient-to-r from-orange-500/10 to-orange-500/[0.02] text-white shadow-inner"
                      : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/40"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {/* Glowing Left Indicator Pin on Active */}
                    <span
                      className={`absolute left-0 top-3 bottom-3 w-1 rounded-r-full transition-all duration-300 ${
                        isActive ? "bg-orange-500 shadow-[0_0_12px_#f97316]" : "bg-transparent opacity-0"
                      }`}
                    />

                    <Icon
                      size={18}
                      className={`transition-colors duration-200 ${
                        isActive ? "text-orange-500" : "text-neutral-400 group-hover:text-neutral-300"
                      }`}
                    />
                    <span className={isActive ? "font-semibold text-white" : "font-medium"}>
                      {label}
                    </span>
                  </>
                )}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* PREMIUM FOOTER INTERFACE WITH USER PROFILE / SYSTEM METADATA */}
        <div className="p-4 border-t border-neutral-800/50 bg-neutral-950/20 flex flex-col gap-3">
          <div className="flex items-center gap-3 bg-neutral-800/30 p-2.5 rounded-xl border border-neutral-800/40">
            <div className="w-8 h-8 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-400 flex items-center justify-center text-xs font-bold">
              {user?.name?.slice(0, 1)?.toUpperCase() || "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-neutral-200 truncate">{user?.name || "User"}</p>
              <p className="text-[10px] text-neutral-500 font-medium truncate">Role: {user?.role || ""}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full bg-neutral-800/60 hover:bg-neutral-800 text-neutral-200 text-[11px] font-semibold py-2 rounded-lg transition-colors"
          >
            Sign Out
          </button>
          <div className="text-center text-[10px] font-medium text-neutral-600 tracking-wider">
            SYSTEM VERSION 1.4.0
          </div>
        </div>
      </aside>
    </>
  );
}
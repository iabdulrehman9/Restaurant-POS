import { useEffect, useMemo, useState } from "react";
import { 
  Clock, 
  ChefHat, 
  CheckCircle, 
  ShoppingBag, 
  Utensils, 
  Truck, 
  User, 
  Check,
  Trash2
} from "lucide-react";
import { getOrders, updateOrderStatus } from "../api/index.js";

export default function Kitchen() {
  const [orders, setOrders] = useState([]);
  const wsUrl = (import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api")
    .replace(/^http/, "ws")
    .replace(/\/api$/, "/ws");

  const loadOrders = async () => {
    try {
      const data = await getOrders({ status: "pending,preparing,ready" });
      setOrders(data.orders || []);
    } catch (err) {
      setOrders([]);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  useEffect(() => {
    const socket = new WebSocket(wsUrl);

    socket.onmessage = () => {
      loadOrders();
    };

    socket.onerror = () => {
      socket.close();
    };

    return () => {
      socket.close();
    };
  }, [wsUrl]);

  const formatElapsed = (createdAt) => {
    if (!createdAt) return "-";
    const diff = Date.now() - new Date(createdAt).getTime();
    const minutes = Math.max(0, Math.floor(diff / 60000));
    return minutes < 60 ? `${minutes}m` : `${Math.floor(minutes / 60)}h`;
  };

  const updateStatus = async (id, status) => {
    try {
      await updateOrderStatus(id, status);
      await loadOrders();
    } catch (err) {
      alert(err.message || "Unable to update order status.");
    }
  };

  const completeOrder = (id) => {
    updateStatus(id, "completed");
  };

  const wasteOrder = (id) => {
    updateStatus(id, "waste");
  };

  const statusConfigs = {
    pending: { bg: "bg-orange-500 text-white", dot: "bg-white", label: "Pending" },
    preparing: { bg: "bg-neutral-900 text-white", dot: "bg-orange-500", label: "Cooking" },
    ready: { bg: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-500", label: "Ready" },
  };

  const typeIcons = {
    "dine-in": <Utensils size={12} className="text-orange-600" />,
    "delivery": <Truck size={12} className="text-orange-600" />,
    "takeaway": <ShoppingBag size={12} className="text-orange-600" />,
  };

  const visibleOrders = useMemo(
    () => orders.filter((order) => statusConfigs[order.status]),
    [orders]
  );

  return (
    <div className="h-screen w-screen bg-neutral-50 pt-2 px-4 pb-4 md:pt-3 md:px-6 md:pb-6 text-neutral-800 antialiased font-sans flex flex-col overflow-hidden">
      
      {/* FIXED TOP HEADER SECTION */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4 pb-2 border-b border-neutral-200 shrink-0">
        <div className="flex items-center gap-2">
          <span className="p-1.5 bg-orange-500 rounded-lg text-white shadow-sm">
            <ChefHat size={18} />
          </span>
          <div>
            <h1 className="text-xl font-black tracking-tight text-neutral-900">KDS Monitor</h1>
            <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Active Lines</p>
          </div>
        </div>

        {/* COMPACT METRIC COUNTERS */}
        <div className="flex items-center gap-1.5">
          {Object.entries(statusConfigs).map(([key, config]) => (
            <div key={key} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-white border border-neutral-200 text-neutral-600 shadow-sm">
              <span className={`w-1.5 h-1.5 rounded-full ${key === 'pending' ? 'bg-orange-500' : key === 'preparing' ? 'bg-neutral-900' : 'bg-emerald-500'}`} />
              <span>{config.label}: {visibleOrders.filter(o => o.status === key).length}</span>
            </div>
          ))}
        </div>
      </div>

      {/* INDEPENDENT SCROLLABLE ORDER SECTION */}
      <div className="flex-1 overflow-y-auto pr-1 pb-2 min-h-0">
        {visibleOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 border border-dashed border-neutral-200 rounded-2xl bg-white">
            <CheckCircle size={32} className="text-emerald-500 mb-2" />
            <p className="text-xs font-bold text-neutral-400">All tickets clear.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
            {visibleOrders.map((order) => (
              <div
                key={order.id}
                className={`bg-white rounded-xl border flex flex-col justify-between transition-all overflow-hidden shadow-sm ${
                  order.status === "pending" ? "border-orange-500 ring-1 ring-orange-500/10" : "border-neutral-200"
                }`}
              >
                {/* COMPACT CARD HEADER */}
                <div className="p-3 border-b border-neutral-100 bg-neutral-50/40 space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-1.5">
                      <h2 className="text-base font-black text-neutral-900 font-mono tracking-tight">{order.order_number || `#${order.id}`}</h2>
                      <div className="flex items-center gap-0.5 text-[10px] font-bold text-neutral-400 font-mono bg-white px-1.5 py-0.5 rounded border border-neutral-200/60">
                        <Clock size={10} className="text-orange-500" />
                        <span>{formatElapsed(order.created_at)}</span>
                      </div>
                    </div>
                    
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider border ${statusConfigs[order.status].bg}`}>
                      {order.status}
                    </span>
                  </div>

                  {/* DESTINATION DATA TAGS */}
                  <div className="flex flex-wrap items-center gap-1">
                    <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-orange-50 text-orange-700 text-[10px] font-bold uppercase tracking-wide border border-orange-100">
                      {typeIcons[order.order_type]}
                      <span>{order.order_type}</span>
                    </div>
                    {order.table_no && (
                      <span className="px-1.5 py-0.5 rounded bg-neutral-900 text-white text-[10px] font-bold">
                        T: {order.table_no}
                      </span>
                    )}
                    {order.customer_name && (
                      <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-600 text-[10px] font-medium max-w-[120px] truncate">
                        <User size={9} className="text-neutral-400 shrink-0" />
                        <span className="truncate">{order.customer_name} ({order.customer_address})</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* COMPACT ITEMS SECTION */}
                <div className="p-3 flex-1 space-y-1">
                  {(order.items || []).map((item, index) => (
                    <div key={index} className="bg-neutral-50/40 border border-neutral-100 px-2.5 py-1.5 rounded-lg flex justify-between items-center">
                      <span className="text-xs font-bold text-neutral-700">{item.name}</span>
                      <span className="text-[11px] font-black font-mono text-orange-600 bg-orange-50 border border-orange-100 w-5 h-5 flex items-center justify-center rounded">
                        {item.qty}
                      </span>
                    </div>
                  ))}
                  {order.notes && (
                    <div className="text-[10px] font-semibold text-neutral-500 bg-neutral-50/60 border border-neutral-100 px-2 py-1 rounded-md">
                      Note: {order.notes}
                    </div>
                  )}
                </div>

                {/* CONTROL INTERFACES BUTTON WRAPPER */}
                <div className="p-3 pt-0 gap-1.5 flex flex-col">
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => updateStatus(order.id, "preparing")}
                      disabled={order.status === "preparing" || order.status === "ready"}
                      className={`flex-1 py-1.5 rounded-lg font-bold text-[10px] uppercase tracking-wider flex items-center justify-center gap-1 transition-all ${
                        order.status === "preparing" || order.status === "ready"
                          ? "bg-neutral-50 text-neutral-300 border border-neutral-200 cursor-not-allowed"
                          : "bg-neutral-900 hover:bg-neutral-950 text-white shadow-sm"
                      }`}
                    >
                      <ChefHat size={11} />
                      <span>Cook</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => updateStatus(order.id, "ready")}
                      disabled={order.status === "ready"}
                      className={`flex-1 py-1.5 rounded-lg font-bold text-[10px] uppercase tracking-wider flex items-center justify-center gap-1 transition-all ${
                        order.status === "ready"
                          ? "bg-neutral-50 text-neutral-300 border border-neutral-200 cursor-not-allowed"
                          : "bg-orange-500 hover:bg-orange-600 text-white shadow-sm"
                      }`}
                    >
                      <CheckCircle size={11} />
                      <span>Ready</span>
                    </button>
                  </div>

                  {/* BOTTOM MANAGEMENT ROW */}
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => wasteOrder(order.id)}
                      className="px-2.5 bg-white hover:bg-rose-50 text-rose-600 rounded-lg border border-neutral-200 hover:border-rose-200 flex items-center justify-center transition-colors"
                      title="Log Spoilage / Waste"
                    >
                      <Trash2 size={12} />
                    </button>

                    <button
                      type="button"
                      onClick={() => completeOrder(order.id)}
                      className="flex-1 bg-white hover:bg-neutral-50 text-neutral-600 py-1.5 rounded-lg font-bold text-[10px] uppercase tracking-wider border border-neutral-200 flex items-center justify-center gap-1 transition-colors"
                    >
                      <Check size={11} className="text-emerald-500" />
                      <span>Bump Ticket</span>
                    </button>
                  </div>
                </div>

              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
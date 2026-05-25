import { useEffect, useMemo, useState } from "react";
import { 
  Plus, 
  Minus, 
  Trash2, 
  ShoppingBag, 
  Utensils, 
  Bike, 
  Printer, 
  User, 
  Search, 
  Store, 
  MapPin, 
  Phone,
  Layers,
  ChevronRight,
  FileText
} from "lucide-react";
import {
  createOrder,
  getProducts,
  getSettings,
  markOrderKOT,
  markOrderReceipt,
  updateOrder
} from "../api/index.js";

const POS_STATE_KEY = "pos_state";

const readStoredState = () => {
  try {
    const raw = localStorage.getItem(POS_STATE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (err) {
    return null;
  }
};

export default function POS() {
  // 1. Essential State Hooks
  const storedState = readStoredState() || {};
  const [products, setProducts] = useState([]);
  const [settings, setSettings] = useState({ tax: 5, serviceCharge: 0, tables: 5 });
  const [mode, setMode] = useState(storedState.mode || "dine-in"); 
  const [activeTable, setActiveTable] = useState(storedState.activeTable || "T1");
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState("All"); 

  // Carts for different fulfillment types
  const [dineInOrders, setDineInOrders] = useState(storedState.dineInOrders || {});
  const [takeawayCart, setTakeawayCart] = useState(storedState.takeawayCart || []);
  const [deliveryCart, setDeliveryCart] = useState(storedState.deliveryCart || []);

  const [customer, setCustomer] = useState(
    storedState.customer || { name: "", phone: "", address: "" }
  );
  const [takeawayCustomer, setTakeawayCustomer] = useState(
    storedState.takeawayCustomer || { name: "", phone: "" }
  );
  const [validationError, setValidationError] = useState({
    delivery: false,
    takeaway: false,
  });
  const [orderRefs, setOrderRefs] = useState({
    dineIn: storedState.orderRefs?.dineIn || {},
    takeaway: storedState.orderRefs?.takeaway || null,
    delivery: storedState.orderRefs?.delivery || null,
  });
  const apiBase = (import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api").replace(/\/api$/, "");

  useEffect(() => {
    const loadData = async () => {
      try {
        const productData = await getProducts({ active: 1 });
        setProducts(productData.products || []);
      } catch (err) {
        setProducts([]);
      }

      try {
        const settingsData = await getSettings();
        setSettings(settingsData.settings || { tax: 5, serviceCharge: 0, tables: 5 });
      } catch (err) {
        setSettings((prev) => ({ ...prev }));
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    const snapshot = {
      mode,
      activeTable,
      dineInOrders,
      takeawayCart,
      deliveryCart,
      customer,
      takeawayCustomer,
      orderRefs,
    };
    localStorage.setItem(POS_STATE_KEY, JSON.stringify(snapshot));
  }, [mode, activeTable, dineInOrders, takeawayCart, deliveryCart, customer, takeawayCustomer, orderRefs]);

  const tables = useMemo(() => {
    const count = Number(settings.tables || 5);
    return Array.from({ length: count }, (_, idx) => `T${idx + 1}`);
  }, [settings.tables]);

  useEffect(() => {
    if (tables.length && !tables.includes(activeTable)) {
      setActiveTable(tables[0]);
    }
  }, [tables, activeTable]);

  useEffect(() => {
    setDineInOrders((prev) => {
      const next = { ...prev };
      tables.forEach((table) => {
        if (!next[table]) next[table] = [];
      });
      return next;
    });
  }, [tables]);

  // Derive matching categories from item list
  const categories = useMemo(() => {
    return ["All", ...new Set(products.map((p) => p.category))];
  }, [products]);

  // 2. Search & Category Filter Logic
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = activeCategory === "All" || p.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchTerm, activeCategory]);

  // Determine active item bucket depending on fulfillment type
  const cart = useMemo(() => {
    if (mode === "dine-in") return dineInOrders[activeTable] || [];
    if (mode === "takeaway") return takeawayCart;
    if (mode === "delivery") return deliveryCart;
    return [];
  }, [mode, activeTable, dineInOrders, takeawayCart, deliveryCart]);

  const updateActiveCart = (updatedCart) => {
    if (mode === "dine-in") {
      setDineInOrders((prev) => ({ ...prev, [activeTable]: updatedCart }));
    } else if (mode === "takeaway") {
      setTakeawayCart(updatedCart);
    } else if (mode === "delivery") {
      setDeliveryCart(updatedCart);
    }
  };

  const getActiveOrderRef = () => {
    if (mode === "dine-in") return orderRefs.dineIn[activeTable] || null;
    if (mode === "takeaway") return orderRefs.takeaway;
    if (mode === "delivery") return orderRefs.delivery;
    return null;
  };

  const setActiveOrderRef = (ref) => {
    if (mode === "dine-in") {
      setOrderRefs((prev) => ({
        ...prev,
        dineIn: { ...prev.dineIn, [activeTable]: ref },
      }));
    } else if (mode === "takeaway") {
      setOrderRefs((prev) => ({ ...prev, takeaway: ref }));
    } else if (mode === "delivery") {
      setOrderRefs((prev) => ({ ...prev, delivery: ref }));
    }
  };

  // 3. Basket Mutator Actions
  const addItem = (item) => {
    const exists = cart.find((i) => i.id === item.id);
    let updated;
    if (exists) {
      updated = cart.map((i) => (i.id === item.id ? { ...i, qty: i.qty + 1 } : i));
    } else {
      updated = [...cart, { ...item, qty: 1 }];
    }
    updateActiveCart(updated);
  };

  const removeItem = (id) => {
    const updated = cart.filter((i) => i.id !== id);
    updateActiveCart(updated);
  };

  const incrementQty = (id) => {
    const updated = cart.map((i) => (i.id === id ? { ...i, qty: i.qty + 1 } : i));
    updateActiveCart(updated);
  };

  const decrementQty = (id, currentQty) => {
    if (currentQty <= 1) {
      removeItem(id);
      return;
    }
    const updated = cart.map((i) => (i.id === id ? { ...i, qty: i.qty - 1 } : i));
    updateActiveCart(updated);
  };

  // 4. Financial Calculations
  const subtotal = useMemo(() => cart.reduce((s, i) => s + i.price * i.qty, 0), [cart]);
  const taxRate = Number(settings.tax ?? 5);
  const serviceChargeRate = Number(settings.serviceCharge ?? 0);
  const storeName = settings.name || "Restaurant POS";
  const storeAddress = settings.address || "";
  const storePhone = settings.phone || "";
  const footerText = settings.footer || "Thank you for visiting!";
  const showTax = settings.showTax !== false;
  const tax = subtotal * (taxRate / 100);
  const serviceCharge = subtotal * (serviceChargeRate / 100);
  const total = subtotal + tax + serviceCharge;

  const occupiedTableCount = Object.values(dineInOrders).filter((items) => items.length > 0).length;
  const takeawayOrderCount = takeawayCart.length > 0 ? 1 : 0;
  const deliveryOrderCount = deliveryCart.length > 0 ? 1 : 0;
  const takeawayPendingCount = takeawayOrderCount && orderRefs.takeaway?.status !== "completed" ? 1 : 0;
  const deliveryPendingCount = deliveryOrderCount && orderRefs.delivery?.status !== "completed" ? 1 : 0;

  // Kitchen Order Ticket (KOT) implementation logic
  const resolveCustomer = () => {
    if (mode === "delivery") return customer;
    if (mode === "takeaway") return takeawayCustomer;
    return null;
  };

  const validateCustomer = () => {
    if (mode === "delivery") {
      const missingName = !customer.name;
      const missingAddress = !customer.address;
      const hasError = missingName || missingAddress;
      setValidationError({ delivery: hasError, takeaway: false });
      return !hasError;
    }

    if (mode === "takeaway") {
      const missingName = !takeawayCustomer.name;
      const hasError = missingName;
      setValidationError({ takeaway: hasError, delivery: false });
      return !hasError;
    }

    setValidationError({ delivery: false, takeaway: false });
    return true;
  };

  const buildOrderPayload = (status, paymentMethod, paidAmount) => ({
    orderType: mode,
    status,
    tableNo: mode === "dine-in" ? activeTable : null,
    customer: resolveCustomer(),
    items: cart.map((item) => ({
      productId: item.id,
      name: item.name,
      price: item.price,
      qty: item.qty,
    })),
    paymentMethod,
    taxRate,
    serviceChargeRate,
    discountType: "percentage",
    discountValue: 0,
    paidAmount,
    notes: "",
  });

  const printKOT = async () => {
    if (cart.length === 0) return;
    if (!validateCustomer()) return;

    let orderRef = getActiveOrderRef();

    try {
      if (!orderRef) {
        const created = await createOrder(buildOrderPayload("pending", "unpaid", 0));
        orderRef = { orderId: created.id, orderNumber: created.orderNumber, status: "pending" };
        setActiveOrderRef(orderRef);
      } else if (!orderRef.status) {
        setActiveOrderRef({ ...orderRef, status: "pending" });
      }

      await markOrderKOT(orderRef.orderId);
    } catch (err) {
      alert(err.message || "Unable to save kitchen ticket.");
      return;
    }

    const currentDate = new Date().toLocaleString();
    const activeCustomer = resolveCustomer();

    const win = window.open("", "_blank", "width=400,height=600");
    if (!win) return alert("Popup blocked! Please allow popups to print tickets.");

    win.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Print KOT - ${orderRef.orderNumber}</title>
        <style>
          @page { size: 80mm auto; margin: 0; }
          body { font-family: 'Courier New', Courier, monospace; width: 74mm; margin: 0 auto; padding: 4mm 0; font-size: 14px; color: #000; line-height: 1.4; }
          .text-center { text-align: center; }
          .bold { font-weight: bold; }
          .header { font-size: 18px; margin-bottom: 4px; font-weight: bold; text-transform: uppercase; }
          .divider { border-top: 1px dashed #000; margin: 6px 0; }
          .kot-row { display: flex; justify-content: space-between; font-size: 15px; padding: 3px 0; }
        </style>
      </head>
      <body>
        <div class="text-center header">${storeName}</div>
        <div class="text-center bold" style="font-size: 12px; text-transform: uppercase;">Kitchen Ticket</div>
        <div class="text-center bold" style="font-size: 12px; background: #000; color: #fff; padding: 2px 0; margin-top: 4px;">KITCHEN COPY</div>
        <div class="divider"></div>
        <div><strong>Time:</strong> ${currentDate}</div>
        <div><strong>KOT ID:</strong> ${orderRef.orderNumber}</div>
        <div><strong>Type:</strong> ${mode.toUpperCase()}</div>
        ${mode === "dine-in" ? `<div><strong>Table:</strong> ${activeTable}</div>` : ""}
        <div class="divider"></div>
        
        <div class="bold" style="display: flex; justify-content: space-between;">
          <span>Qty x Item Desc</span>
        </div>
        <div class="divider"></div>

        ${cart.map((i) => `
          <div class="kot-row">
            <span class="bold">[ ${i.qty} ] &times; ${i.name}</span>
          </div>
        `).join("")}

        <div class="divider"></div>
        ${activeCustomer?.name ? `<div><strong>Cust:</strong> ${activeCustomer.name}</div>` : ""}
        ${activeCustomer?.phone ? `<div><strong>Phone:</strong> ${activeCustomer.phone}</div>` : ""}
        <script>
          window.onload = function() {
            setTimeout(function() { window.print(); window.close(); }, 300);
          };
        </script>
      </body>
      </html>
    `);

    win.document.close();
  };

  // Receipt printing implementation logic
  const printReceipt = async () => {
    if (cart.length === 0) return;
    if (!validateCustomer()) return;

    let orderRef = getActiveOrderRef();

    try {
      if (!orderRef) {
        const created = await createOrder(buildOrderPayload("pending", "cash", total));
        orderRef = { orderId: created.id, orderNumber: created.orderNumber, status: "pending" };
        setActiveOrderRef(orderRef);
      } else {
        await updateOrder(orderRef.orderId, {
          status: "completed",
          paymentMethod: "cash",
          paidAmount: total,
          changeDue: 0,
        });
        setActiveOrderRef({ ...orderRef, status: "completed" });
      }

      await markOrderReceipt(orderRef.orderId);
    } catch (err) {
      alert(err.message || "Unable to save receipt.");
      return;
    }

    const currentDate = new Date().toLocaleString();
    const activeCustomer = resolveCustomer();

    const win = window.open("", "_blank", "width=400,height=600");
    if (!win) return alert("Popup blocked! Please allow popups to print invoices.");

    win.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Print Receipt - ${orderRef.orderNumber}</title>
        <style>
          @page { size: 80mm auto; margin: 0; }
          body { font-family: 'Courier New', Courier, monospace; width: 74mm; margin: 0 auto; padding: 4mm 0; font-size: 13px; color: #000; line-height: 1.4; }
          .text-center { text-align: center; }
          .text-right { text-align: right; }
          .bold { font-weight: bold; }
          .header { font-size: 16px; margin-bottom: 4px; font-weight: bold; text-transform: uppercase; }
          .divider { border-top: 1px dashed #000; margin: 6px 0; }
          .item-row { margin-bottom: 4px; }
          .item-details { display: flex; justify-content: space-between; font-size: 12px; }
          .totals-table { width: 100%; margin-top: 8px; }
          .totals-table td { padding: 2px 0; }
          .footer { margin-top: 14px; font-size: 11px; }
        </style>
      </head>
      <body>
        <div class="text-center header">${storeName}</div>
        ${storeAddress ? `<div class="text-center" style="font-size: 12px;">${storeAddress}</div>` : ""}
        ${storePhone ? `<div class="text-center" style="font-size: 12px;">${storePhone}</div>` : ""}
        <div class="divider"></div>
        <div><strong>Date:</strong> ${currentDate}</div>
        <div><strong>Order ID:</strong> ${orderRef.orderNumber}</div>
        <div><strong>Type:</strong> ${mode.toUpperCase()}</div>
        ${mode === "dine-in" ? `<div><strong>Table:</strong> ${activeTable}</div>` : ""}
        <div class="divider"></div>
        
        <div class="bold" style="display: flex; justify-content: space-between;">
          <span>Item Desc</span>
          <span>Total</span>
        </div>
        <div class="divider"></div>

        ${cart.map((i) => `
          <div class="item-row">
            <div class="bold">${i.name}</div>
            <div class="item-details">
              <span>${i.qty} x Rs ${i.price}</span>
              <span>Rs ${i.qty * i.price}</span>
            </div>
          </div>
        `).join("")}

        <div class="divider"></div>
        <table class="totals-table">
          <tr><td>Subtotal:</td><td class="text-right">Rs ${subtotal}</td></tr>
          ${showTax ? `<tr><td>Tax (${taxRate}%):</td><td class="text-right">Rs ${tax.toFixed(0)}</td></tr>` : ""}
          ${serviceChargeRate > 0 ? `<tr><td>Service (${serviceChargeRate}%):</td><td class="text-right">Rs ${serviceCharge.toFixed(0)}</td></tr>` : ""}
          <tr class="bold" style="font-size: 14px;">
            <td>TOTAL DUE:</td>
            <td class="text-right">Rs ${total.toFixed(0)}</td>
          </tr>
        </table>

        ${activeCustomer?.name ? `
          <div class="divider"></div>
          <div class="bold">CUSTOMER:</div>
          <div>${activeCustomer.name}</div>
          ${activeCustomer.phone ? `<div>Phone: ${activeCustomer.phone}</div>` : ""}
          ${activeCustomer.address ? `<div>Addr: ${activeCustomer.address}</div>` : ""}
        ` : ""}

        <div class="divider"></div>
        <div class="text-center footer">${footerText}</div>
        <script>
          window.onload = function() {
            setTimeout(function() { window.print(); window.close(); }, 300);
          };
        </script>
      </body>
      </html>
    `);

    win.document.close();

    // Reset Carts after printing
    if (mode === "dine-in") {
      setDineInOrders((prev) => ({ ...prev, [activeTable]: [] }));
      setOrderRefs((prev) => ({
        ...prev,
        dineIn: { ...prev.dineIn, [activeTable]: null },
      }));
    } else if (mode === "takeaway") {
      setTakeawayCart([]);
      setTakeawayCustomer({ name: "", phone: "" });
      setOrderRefs((prev) => ({ ...prev, takeaway: null }));
    } else if (mode === "delivery") {
      setDeliveryCart([]);
      setCustomer({ name: "", phone: "", address: "" });
      setOrderRefs((prev) => ({ ...prev, delivery: null }));
    }
  };

  return (
    <div className="grid grid-cols-12 h-full min-h-0 bg-stone-50 text-stone-800 antialiased font-sans selection:bg-orange-100 overflow-hidden">
      
      {/* LEFT PANEL: CATALOG MENU (Fixed structure, content scrolls) */}
      <div className="col-span-8 pt-4 px-4 pb-0 flex flex-col border-r border-stone-200 bg-stone-50/50 overflow-hidden h-full">
        
        {/* BRAND HEADER & SEARCH COMPONENT (Fixed) */}
        <div className="flex items-center justify-between mb-3 flex-shrink-0 gap-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center text-white shadow-lg shadow-orange-500/20">
              <Store size={20} />
            </div>
            <div>
              <h1 className="font-black text-xl tracking-tight text-stone-900 leading-none">Bite<span className="text-orange-500">Flow</span></h1>
              <span className="text-[10px] text-stone-400 font-bold tracking-wider uppercase">Cashier Terminal v2.0</span>
            </div>
          </div>
          
          {/* Expanded Search Bar Component */}
          <div className="relative flex-1 max-w-[36rem]">
            <Search className="absolute left-3.5 top-3 text-stone-400" size={16} />
            <input 
              type="text"
              placeholder="Search dishes, drinks, extras..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-stone-200 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 rounded-xl pl-10 pr-4 py-2.5 text-xs font-medium transition-all outline-none text-stone-800 placeholder:text-stone-400 shadow-sm"
            />
          </div>
        </div>

        {/* CONTROLS CONTAINER (Fixed Category Row) */}
        <div className="flex-shrink-0 mb-4">
          <div 
            className="flex items-center gap-2 pb-1 overflow-x-auto"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {categories.map((cat) => {
              const uniqueKey = cat && cat.trim() !== "" ? cat : "unassigned-category";
              
              return (
                <button
                  key={uniqueKey}
                  type="button"
                  onClick={() => setActiveCategory(cat)}
                  className={`px-5 py-2.5 rounded-xl text-xs font-black transition-all whitespace-nowrap shadow-sm border flex-shrink-0 ${
                    activeCategory === cat
                      ? "bg-stone-900 border-stone-900 text-white shadow-stone-900/10"
                      : "bg-white border-stone-200 text-stone-500 hover:bg-stone-50 hover:text-stone-800"
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        {/* PRODUCT SHELF (Strictly Scrollable Area) */}
        <div className="flex-1 overflow-y-auto pb-6 pr-1">
          {filteredProducts.length === 0 ? (
            <div className="text-center py-16 bg-white border border-stone-200 rounded-2xl p-6 shadow-sm">
              <p className="text-xs font-bold text-stone-400">No matching food items found.</p>
              <p className="text-[11px] text-stone-400/80 font-medium mt-1">Try adjusting your search criteria or filter categories.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {filteredProducts.map((p) => (
                <div
                  key={p.id}
                  onClick={() => addItem(p)}
                  className="group bg-white rounded-2xl overflow-hidden border border-stone-200 hover:border-orange-300 shadow-sm hover:shadow-md active:scale-[0.98] cursor-pointer transition-all duration-200 flex flex-col"
                >
                  <div className="h-32 w-full relative overflow-hidden bg-stone-100">
                    <img
                      src={p.image_path ? `${apiBase}${p.image_path}` : "https://images.unsplash.com/photo-1606755962773-d324e9a13086"}
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                      alt={p.name}
                    />
                    <span className="absolute top-2 left-2 px-2 py-0.5 text-[9px] font-black tracking-wide uppercase bg-stone-900/80 text-white rounded-md backdrop-blur-sm">
                      {p.category}
                    </span>
                  </div>
                  <div className="p-3.5 flex flex-col flex-1 justify-between gap-3">
                    <div>
                      <h3 className="font-bold text-stone-800 text-xs tracking-tight line-clamp-1 group-hover:text-orange-600 transition-colors">{p.name}</h3>
                      <p className="text-stone-900 font-black text-sm mt-0.5">Rs {p.price}</p>
                    </div>
                    <div className="w-full bg-stone-50 text-stone-600 text-[11px] py-2 rounded-xl font-bold group-hover:bg-orange-50 group-hover:text-orange-600 flex items-center justify-center gap-1.5 transition-colors border border-stone-100 group-hover:border-orange-100">
                      <Plus size={12} strokeWidth={3} /> Add to Basket
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* OPTIMIZED RIGHT PANEL (Fixed structural envelope) */}
      <div className="col-span-4 bg-white flex flex-col shadow-2xl z-10 overflow-hidden h-full min-h-0">
        
        {/* TOP META BAR (Fixed) */}
        <div className="px-4 py-3 border-b border-stone-100 flex items-center justify-between bg-stone-50/40 flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">Active Terminal</span>
          </div>
          <div className="text-[11px] text-stone-400 font-bold flex items-center gap-1">
            <span>Basket Total</span>
            <ChevronRight size={12} />
            <span className="text-stone-900 font-black text-xs">Rs {total.toFixed(0)}</span>
          </div>
        </div>

        {/* WORKFLOW CLUSTER (Fixed Configurations Area) */}
        <div className="p-3 border-b border-stone-100 bg-white flex-shrink-0 space-y-2.5">
          {/* Channel Selector */}
          <div className="grid grid-cols-3 gap-1 bg-stone-100 p-1 rounded-xl border border-stone-200/40">
            <button
              type="button"
              onClick={() => { setMode("dine-in"); setValidationError({ delivery: false, takeaway: false }); }}
              className={`relative flex flex-col items-center justify-center py-2 px-1 rounded-lg transition-all ${
                mode === "dine-in" 
                  ? "bg-white text-orange-600 shadow-sm font-black" 
                  : "text-stone-500 font-bold hover:text-stone-800"
              }`}
            >
              <Utensils size={14} className={mode === "dine-in" ? "text-orange-500" : "text-stone-400"} />
              <span className="text-[10px] mt-0.5">Dine-In</span>
              {occupiedTableCount > 0 && (
                <span className="absolute top-1 right-1 px-1 min-w-[14px] h-[14px] flex items-center justify-center text-[8px] bg-orange-500 text-white rounded-full font-black scale-90">
                  {occupiedTableCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => { setMode("takeaway"); setValidationError({ delivery: false, takeaway: false }); }}
              className={`relative flex flex-col items-center justify-center py-2 px-1 rounded-lg transition-all ${
                mode === "takeaway" 
                  ? "bg-white text-orange-600 shadow-sm font-black" 
                  : "text-stone-500 font-bold hover:text-stone-800"
              }`}
            >
              <ShoppingBag size={14} className={mode === "takeaway" ? "text-orange-500" : "text-stone-400"} />
              <span className="text-[10px] mt-0.5">Takeaway</span>
              {takeawayOrderCount > 0 && (
                <span className="absolute top-1 right-1 px-1 min-w-[14px] h-[14px] flex items-center justify-center text-[8px] bg-orange-500 text-white rounded-full font-black scale-90">
                  {takeawayOrderCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => { setMode("delivery"); setValidationError({ delivery: false, takeaway: false }); }}
              className={`relative flex flex-col items-center justify-center py-2 px-1 rounded-lg transition-all ${
                mode === "delivery" 
                  ? "bg-white text-orange-600 shadow-sm font-black" 
                  : "text-stone-500 font-bold hover:text-stone-800"
              }`}
            >
              <Bike size={14} className={mode === "delivery" ? "text-orange-500" : "text-stone-400"} />
              <span className="text-[10px] mt-0.5">Delivery</span>
              {deliveryOrderCount > 0 && (
                <span className="absolute top-1 right-1 px-1 min-w-[14px] h-[14px] flex items-center justify-center text-[8px] bg-orange-500 text-white rounded-full font-black scale-90">
                  {deliveryOrderCount}
                </span>
              )}
            </button>
          </div>

          {/* Context-Specific Controls Container */}
          <div className="bg-stone-50/70 rounded-xl p-2.5 border border-stone-200/50">
            {/* Dine-In Mode Options */}
            {mode === "dine-in" && (
              <div>
                <div className="flex items-center gap-1 mb-1.5 text-stone-400">
                  <Layers size={11} />
                  <span className="text-[9px] font-black uppercase tracking-wider">Serving Table Assignment</span>
                </div>
                <div className="grid grid-cols-5 gap-1">
                  {tables.map((t) => {
                    const currentTableCart = dineInOrders[t] || [];
                    const hasItems = currentTableCart.length > 0;
                    
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setActiveTable(t)}
                        className={`h-9 rounded-lg text-xs font-black transition-all flex flex-col items-center justify-center border relative ${
                          activeTable === t
                            ? "bg-stone-900 border-stone-900 text-white shadow-sm"
                            : hasItems
                            ? "bg-orange-50 border-orange-200 text-orange-700 font-black"
                            : "bg-white border-stone-200 text-stone-600 hover:bg-stone-100"
                        }`}
                      >
                        <span>{t}</span>
                        {hasItems && activeTable !== t && (
                          <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 bg-orange-500 rounded-full" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Delivery Mode Inputs */}
            {mode === "delivery" && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-stone-400 mb-1">
                  <div className="flex items-center gap-1">
                    <User size={11} />
                    <span className="text-[9px] font-black uppercase tracking-wider">Courier Destination</span>
                  </div>
                  <span className="text-[9px] font-black uppercase tracking-wider text-stone-500">
                    Orders: {deliveryOrderCount} | Pending: {deliveryPendingCount}
                  </span>
                </div>
                <div className="text-[9px] font-black uppercase tracking-wider text-stone-500">
                  Status: {orderRefs.delivery?.status || (deliveryCart.length > 0 ? "draft" : "idle")}
                </div>
                
                <div className="grid grid-cols-2 gap-1.5">
                  <div className="relative">
                    <User size={11} className="absolute left-2.5 top-2 text-stone-400" />
                    <input
                      type="text"
                      className={`w-full bg-white border ${validationError.delivery && !customer.name ? 'border-red-400 bg-red-50/30' : 'border-stone-200'} focus:border-orange-500 rounded-lg pl-7 pr-2 py-1.5 text-[11px] font-medium transition-all outline-none placeholder:text-stone-400`}
                      placeholder="Name"
                      value={customer.name}
                      onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
                    />
                  </div>
                  <div className="relative">
                    <Phone size={11} className="absolute left-2.5 top-2 text-stone-400" />
                    <input
                      type="text"
                      className="w-full bg-white border border-stone-200 focus:border-orange-500 rounded-lg pl-7 pr-2 py-1.5 text-[11px] font-medium transition-all outline-none placeholder:text-stone-400"
                      placeholder="Phone (optional)"
                      value={customer.phone}
                      onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
                    />
                  </div>
                </div>

                <div className="relative">
                  <MapPin size={11} className="absolute left-2.5 top-2 text-stone-400" />
                  <input
                    type="text"
                    className={`w-full bg-white border ${validationError.delivery && !customer.address ? 'border-red-400 bg-red-50/30' : 'border-stone-200'} focus:border-orange-500 rounded-lg pl-7 pr-2 py-1.5 text-[11px] font-medium transition-all outline-none placeholder:text-stone-400`}
                    placeholder="Drop Address Details"
                    value={customer.address}
                    onChange={(e) => setCustomer({ ...customer, address: e.target.value })}
                  />
                </div>

                {validationError.delivery && (
                  <p className="text-[9px] text-red-600 font-bold bg-red-50 border border-red-100 p-1 rounded">
                    ⚠️ Name and address are required.
                  </p>
                )}
              </div>
            )}

            {/* Takeaway Mode Inputs */}
            {mode === "takeaway" && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-stone-400 mb-1">
                  <div className="flex items-center gap-1">
                    <User size={11} />
                    <span className="text-[9px] font-black uppercase tracking-wider">Pickup Details</span>
                  </div>
                  <span className="text-[9px] font-black uppercase tracking-wider text-stone-500">
                    Orders: {takeawayOrderCount} | Pending: {takeawayPendingCount}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-1.5">
                  <div className="relative">
                    <User size={11} className="absolute left-2.5 top-2 text-stone-400" />
                    <input
                      type="text"
                      className={`w-full bg-white border ${validationError.takeaway && !takeawayCustomer.name ? 'border-red-400 bg-red-50/30' : 'border-stone-200'} focus:border-orange-500 rounded-lg pl-7 pr-2 py-1.5 text-[11px] font-medium transition-all outline-none placeholder:text-stone-400`}
                      placeholder="Customer Name"
                      value={takeawayCustomer.name}
                      onChange={(e) => setTakeawayCustomer({ ...takeawayCustomer, name: e.target.value })}
                    />
                  </div>
                  <div className="relative">
                    <Phone size={11} className="absolute left-2.5 top-2 text-stone-400" />
                    <input
                      type="text"
                      className="w-full bg-white border border-stone-200 focus:border-orange-500 rounded-lg pl-7 pr-2 py-1.5 text-[11px] font-medium transition-all outline-none placeholder:text-stone-400"
                      placeholder="Phone (optional)"
                      value={takeawayCustomer.phone}
                      onChange={(e) => setTakeawayCustomer({ ...takeawayCustomer, phone: e.target.value })}
                    />
                  </div>
                </div>

                {validationError.takeaway && (
                  <p className="text-[9px] text-red-600 font-bold bg-red-50 border border-red-100 p-1 rounded">
                    ⚠️ Customer name is required.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* TICKET BUCKET LIST (Strictly Scrollable Cart List) */}
        <div className="flex-1 px-3 py-2 space-y-1.5 bg-stone-50/40 overflow-hidden min-h-0">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-stone-300">
              <div className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center mb-1.5">
                <ShoppingBag size={16} className="text-stone-400" />
              </div>
              <p className="font-bold text-xs text-stone-500">Cart is empty</p>
              <p className="text-[10px] text-stone-400 max-w-[160px] mt-0.5">Select menu items on the left to queue active ticket items.</p>
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-2 border border-stone-200/80 rounded-xl p-2 bg-white shadow-sm hover:border-stone-300 transition-all group">
                <div className="flex-1 min-w-0 pl-0.5">
                  <h4 className="font-bold text-stone-800 text-[11px] truncate leading-tight group-hover:text-orange-600 transition-colors">{item.name}</h4>
                  <p className="text-stone-400 font-black text-[10px] mt-0.5">Rs {item.price}</p>
                </div>
                
                {/* ADVANCED CLUSTERING CONTROL */}
                <div className="flex items-center bg-stone-50 rounded-lg p-0.5 border border-stone-200/60 shadow-inner flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => decrementQty(item.id, item.qty)}
                    className="w-5 h-5 flex items-center justify-center bg-white hover:bg-stone-100 rounded-md text-stone-500 hover:text-red-600 transition-colors shadow-xs border border-stone-200/30 active:scale-95"
                  >
                    <Minus size={9} strokeWidth={3} />
                  </button>
                  <span className="w-6 text-center font-black text-[11px] text-stone-800 select-none">{item.qty}</span>
                  <button
                    type="button"
                    onClick={() => incrementQty(item.id)}
                    className="w-5 h-5 flex items-center justify-center bg-white hover:bg-stone-100 rounded-md text-stone-500 hover:text-orange-600 transition-colors shadow-xs border border-stone-200/30 active:scale-95"
                  >
                    <Plus size={9} strokeWidth={3} />
                  </button>
                  <button 
                    type="button"
                    onClick={() => removeItem(item.id)} 
                    className="p-1 text-stone-300 hover:text-red-500 ml-1 transition-colors"
                  >
                    <Trash2 size={11}/>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* SECURE TERMINAL CHECKOUT BAR (Fixed Bottom Section) */}
        <div className="p-3 border-t border-stone-200 bg-white space-y-2.5 flex-shrink-0">
          <div className="bg-stone-50 rounded-xl p-2.5 border border-stone-200/40 space-y-1 text-[11px] font-bold text-stone-500">
            <div className="flex justify-between">
              <span>Subtotal Items</span>
              <span className="text-stone-700">Rs {subtotal}</span>
            </div>
            {showTax && (
              <div className="flex justify-between">
                <span>Govt Tax ({taxRate}%)</span>
                <span className="text-stone-700">Rs {tax.toFixed(0)}</span>
              </div>
            )}
            {serviceChargeRate > 0 && (
              <div className="flex justify-between">
                <span>Service Charge ({serviceChargeRate}%)</span>
                <span className="text-stone-700">Rs {serviceCharge.toFixed(0)}</span>
              </div>
            )}
            <div className="h-px bg-stone-200/60 my-1" />
            <div className="flex justify-between items-center text-xs text-stone-900 font-black pt-0.5">
              <span className="uppercase tracking-wider text-[10px] text-stone-400 font-bold">Total Due</span>
              <span className="text-sm text-orange-600">Rs {total.toFixed(0)}</span>
            </div>
          </div>
          
          {/* Action Row Cluster */}
          <div className="grid grid-cols-2 gap-2">
            <button 
              type="button"
              onClick={printKOT}
              disabled={cart.length === 0}
              className="w-full bg-stone-100 hover:bg-stone-200 active:scale-[0.99] disabled:bg-stone-50 disabled:text-stone-300 disabled:scale-100 font-black py-2.5 rounded-xl text-stone-700 text-xs uppercase flex items-center justify-center gap-1.5 transition-all border border-stone-200"
            >
              <FileText size={13} /> 
              <span>Print KOT</span>
            </button>

            <button 
              type="button"
              onClick={printReceipt}
              disabled={cart.length === 0}
              className="w-full bg-orange-500 hover:bg-orange-600 active:scale-[0.99] disabled:bg-stone-100 disabled:text-stone-300 disabled:scale-100 font-black py-2.5 rounded-xl text-white text-xs uppercase flex items-center justify-center gap-1.5 transition-all shadow-md shadow-orange-500/10"
            >
              <Printer size={13} /> 
              <span>Print Bill</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
import { useMemo, useState } from "react";
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

// Mock Product Database
const products = [
  { id: 1, name: "Zinger Burger", price: 550, category: "Burgers", image: "https://images.unsplash.com/photo-1606755962773-d324e9a13086" },
  { id: 2, name: "Chicken Burger", price: 450, category: "Burgers", image: "https://images.unsplash.com/photo-1606757389929-204a5a0c6d8a" },
  { id: 3, name: "Fries", price: 200, category: "Sides", image: "https://images.unsplash.com/photo-1541592106381-b31e9677c0e5" },
  { id: 4, name: "Cold Drink", price: 150, category: "Beverages", image: "https://images.unsplash.com/photo-1551024601-bec78aea704b" },
];

const tables = ["T1", "T2", "T3", "T4", "T5"];

export default function POS() {
  // 1. Essential State Hooks
  const [mode, setMode] = useState("dine-in"); 
  const [activeTable, setActiveTable] = useState("T1");
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState("All"); 

  // Carts for different fulfillment types
  const [dineInOrders, setDineInOrders] = useState({ T1: [], T2: [], T3: [], T4: [], T5: [] });
  const [takeawayCart, setTakeawayCart] = useState([]);
  const [deliveryCart, setDeliveryCart] = useState([]);

  const [customer, setCustomer] = useState({ name: "", phone: "", address: "" });
  const [validationError, setValidationError] = useState(false);

  // Derive matching categories from item list
  const categories = useMemo(() => {
    return ["All", ...new Set(products.map(p => p.category))];
  }, []);

  // 2. Search & Category Filter Logic
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = activeCategory === "All" || p.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchTerm, activeCategory]);

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
  const tax = subtotal * 0.05;
  const total = subtotal + tax;

  const totalDineInItems = Object.values(dineInOrders).flat().reduce((sum, item) => sum + item.qty, 0);
  const totalTakeawayItems = takeawayCart.reduce((sum, item) => sum + item.qty, 0);
  const totalDeliveryItems = deliveryCart.reduce((sum, item) => sum + item.qty, 0);

  // Kitchen Order Ticket (KOT) implementation logic
  const printKOT = () => {
    if (cart.length === 0) return;
    if (mode === "delivery" && (!customer.name || !customer.phone || !customer.address)) {
      setValidationError(true);
      return;
    }
    setValidationError(false);

    const kotId = "KOT-" + Math.floor(100000 + Math.random() * 900000);
    const currentDate = new Date().toLocaleString();

    const win = window.open("", "_blank", "width=400,height=600");
    if (!win) return alert("Popup blocked! Please allow popups to print tickets.");

    win.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Print KOT - ${kotId}</title>
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
        <div class="text-center header">KITCHEN TICKET</div>
        <div class="text-center bold" style="font-size: 12px; background: #000; color: #fff; padding: 2px 0; margin-top: 4px;">KITCHEN COPY</div>
        <div class="divider"></div>
        <div><strong>Time:</strong> ${currentDate}</div>
        <div><strong>KOT ID:</strong> ${kotId}</div>
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
        ${mode === "delivery" ? `<div><strong>Cust:</strong> ${customer.name}</div>` : ""}
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
  const printReceipt = () => {
    if (cart.length === 0) return;
    if (mode === "delivery" && (!customer.name || !customer.phone || !customer.address)) {
      setValidationError(true);
      return;
    }
    setValidationError(false);

    const orderId = "ORD-" + Math.floor(100000 + Math.random() * 900000);
    const currentDate = new Date().toLocaleString();

    const win = window.open("", "_blank", "width=400,height=600");
    if (!win) return alert("Popup blocked! Please allow popups to print invoices.");

    win.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Print Receipt - ${orderId}</title>
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
        <div class="text-center header">RESTAURANT POS</div>
        <div class="divider"></div>
        <div><strong>Date:</strong> ${currentDate}</div>
        <div><strong>Order ID:</strong> ${orderId}</div>
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
          <tr><td>Tax (5%):</td><td class="text-right">Rs ${tax.toFixed(0)}</td></tr>
          <tr class="bold" style="font-size: 14px;">
            <td>TOTAL DUE:</td>
            <td class="text-right">Rs ${total.toFixed(0)}</td>
          </tr>
        </table>

        ${mode === "delivery" ? `
          <div class="divider"></div>
          <div class="bold">DELIVERY TO:</div>
          <div>${customer.name}</div>
          <div>Phone: ${customer.phone}</div>
          <div>Addr: ${customer.address}</div>
        ` : ""}

        <div class="divider"></div>
        <div class="text-center footer">THANK YOU FOR VISITING!</div>
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
    } else if (mode === "takeaway") {
      setTakeawayCart([]);
    } else if (mode === "delivery") {
      setDeliveryCart([]);
      setCustomer({ name: "", phone: "", address: "" });
    }
  };

  return (
    <div className="grid grid-cols-12 h-screen max-h-screen bg-stone-50 text-stone-800 antialiased font-sans selection:bg-orange-100 overflow-hidden">
      
      {/* LEFT PANEL: CATALOG MENU */}
      <div className="col-span-8 pt-2 px-4 pb-0 flex flex-col border-r border-stone-200 bg-stone-50/50 overflow-hidden h-full">
        
        {/* BRAND HEADER & SEARCH COMPONENT */}
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

        {/* CONTROLS CONTAINER */}
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

        {/* PRODUCT SHELF */}
        <div className="flex-1 overflow-y-auto pb-6 pr-1 -mr-1">
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
                    <img src={p.image} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" alt={p.name} />
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

      {/* OPTIMIZED RIGHT PANEL */}
      <div className="col-span-4 bg-white flex flex-col shadow-2xl z-10 overflow-hidden h-full">
        
        {/* TOP META BAR */}
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

        {/* WORKFLOW CLUSTER (Unified Layout Context Box) */}
        <div className="p-3 border-b border-stone-100 bg-white flex-shrink-0 space-y-2.5">
          {/* Channel Selector */}
          <div className="grid grid-cols-3 gap-1 bg-stone-100 p-1 rounded-xl border border-stone-200/40">
            <button
              type="button"
              onClick={() => { setMode("dine-in"); setValidationError(false); }}
              className={`relative flex flex-col items-center justify-center py-2 px-1 rounded-lg transition-all ${
                mode === "dine-in" 
                  ? "bg-white text-orange-600 shadow-sm font-black" 
                  : "text-stone-500 font-bold hover:text-stone-800"
              }`}
            >
              <Utensils size={14} className={mode === "dine-in" ? "text-orange-500" : "text-stone-400"} />
              <span className="text-[10px] mt-0.5">Dine-In</span>
              {totalDineInItems > 0 && (
                <span className="absolute top-1 right-1 px-1 min-w-[14px] h-[14px] flex items-center justify-center text-[8px] bg-orange-500 text-white rounded-full font-black scale-90">
                  {totalDineInItems}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => { setMode("takeaway"); setValidationError(false); }}
              className={`relative flex flex-col items-center justify-center py-2 px-1 rounded-lg transition-all ${
                mode === "takeaway" 
                  ? "bg-white text-orange-600 shadow-sm font-black" 
                  : "text-stone-500 font-bold hover:text-stone-800"
              }`}
            >
              <ShoppingBag size={14} className={mode === "takeaway" ? "text-orange-500" : "text-stone-400"} />
              <span className="text-[10px] mt-0.5">Takeaway</span>
              {totalTakeawayItems > 0 && (
                <span className="absolute top-1 right-1 px-1 min-w-[14px] h-[14px] flex items-center justify-center text-[8px] bg-orange-500 text-white rounded-full font-black scale-90">
                  {totalTakeawayItems}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => { setMode("delivery"); setValidationError(false); }}
              className={`relative flex flex-col items-center justify-center py-2 px-1 rounded-lg transition-all ${
                mode === "delivery" 
                  ? "bg-white text-orange-600 shadow-sm font-black" 
                  : "text-stone-500 font-bold hover:text-stone-800"
              }`}
            >
              <Bike size={14} className={mode === "delivery" ? "text-orange-500" : "text-stone-400"} />
              <span className="text-[10px] mt-0.5">Delivery</span>
              {totalDeliveryItems > 0 && (
                <span className="absolute top-1 right-1 px-1 min-w-[14px] h-[14px] flex items-center justify-center text-[8px] bg-orange-500 text-white rounded-full font-black scale-90">
                  {totalDeliveryItems}
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
                <div className="flex items-center gap-1 text-stone-400 mb-1">
                  <User size={11} />
                  <span className="text-[9px] font-black uppercase tracking-wider">Courier Destination</span>
                </div>
                
                <div className="grid grid-cols-2 gap-1.5">
                  <div className="relative">
                    <User size={11} className="absolute left-2.5 top-2 text-stone-400" />
                    <input
                      type="text"
                      className={`w-full bg-white border ${validationError && !customer.name ? 'border-red-400 bg-red-50/30' : 'border-stone-200'} focus:border-orange-500 rounded-lg pl-7 pr-2 py-1.5 text-[11px] font-medium transition-all outline-none placeholder:text-stone-400`}
                      placeholder="Name"
                      value={customer.name}
                      onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
                    />
                  </div>
                  <div className="relative">
                    <Phone size={11} className="absolute left-2.5 top-2 text-stone-400" />
                    <input
                      type="text"
                      className={`w-full bg-white border ${validationError && !customer.phone ? 'border-red-400 bg-red-50/30' : 'border-stone-200'} focus:border-orange-500 rounded-lg pl-7 pr-2 py-1.5 text-[11px] font-medium transition-all outline-none placeholder:text-stone-400`}
                      placeholder="Phone"
                      value={customer.phone}
                      onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
                    />
                  </div>
                </div>

                <div className="relative">
                  <MapPin size={11} className="absolute left-2.5 top-2 text-stone-400" />
                  <input
                    type="text"
                    className={`w-full bg-white border ${validationError && !customer.address ? 'border-red-400 bg-red-50/30' : 'border-stone-200'} focus:border-orange-500 rounded-lg pl-7 pr-2 py-1.5 text-[11px] font-medium transition-all outline-none placeholder:text-stone-400`}
                    placeholder="Drop Address Details"
                    value={customer.address}
                    onChange={(e) => setCustomer({ ...customer, address: e.target.value })}
                  />
                </div>

                {validationError && (
                  <p className="text-[9px] text-red-600 font-bold bg-red-50 border border-red-100 p-1 rounded">
                    ⚠️ All fields required.
                  </p>
                )}
              </div>
            )}

            {/* Takeaway Mode Placeholder */}
            {mode === "takeaway" && (
              <div className="py-2 text-center text-[11px] text-stone-400 font-medium">
                No extra customer configuration required for standard counter pickups.
              </div>
            )}
          </div>
        </div>

        {/* TICKET BUCKET LIST (Max height optimizations) */}
        <div className="flex-1 px-3 py-2 space-y-1.5 bg-stone-50/40 overflow-y-auto">
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

        {/* SECURE TERMINAL CHECKOUT BAR */}
        <div className="p-3 border-t border-stone-200 bg-white space-y-2.5 flex-shrink-0">
          <div className="bg-stone-50 rounded-xl p-2.5 border border-stone-200/40 space-y-1 text-[11px] font-bold text-stone-500">
            <div className="flex justify-between">
              <span>Subtotal Items</span>
              <span className="text-stone-700">Rs {subtotal}</span>
            </div>
            <div className="flex justify-between">
              <span>Govt Tax (5%)</span>
              <span className="text-stone-700">Rs {tax.toFixed(0)}</span>
            </div>
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
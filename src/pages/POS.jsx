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
  Layers
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
      setDineInOrders({ ...dineInOrders, [activeTable]: updatedCart });
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
      setDineInOrders({ ...dineInOrders, [activeTable]: [] });
    } else if (mode === "takeaway") {
      setTakeawayCart([]);
    } else if (mode === "delivery") {
      setDeliveryCart([]);
      setCustomer({ name: "", phone: "", address: "" });
    }
  };

  return (
    <div className="grid grid-cols-12 h-screen bg-stone-50 text-stone-800 antialiased font-sans selection:bg-orange-100 overflow-hidden">
      
      {/* LEFT PANEL: CATALOG MENU */}
      <div className="col-span-7 p-6 overflow-y-auto flex flex-col border-r border-stone-200 bg-stone-50/50">
        
        {/* BRAND Header & SEARCH */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center text-white shadow-lg shadow-orange-500/20">
              <Store size={20} />
            </div>
            <div>
              <h1 className="font-black text-xl tracking-tight text-stone-900 leading-none">Bite<span className="text-orange-500">Flow</span></h1>
              <span className="text-[10px] text-stone-400 font-bold tracking-wider uppercase">Cashier Terminal v2.0</span>
            </div>
          </div>
          
          <div className="relative w-72">
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

        {/* ORDER MODE SYSTEM TABS */}
        <div className="mb-6 space-y-3">
          <div className="grid grid-cols-3 gap-1.5 bg-stone-200/60 p-1.5 rounded-xl border border-stone-200/30">
            <button
              onClick={() => { setMode("dine-in"); setValidationError(false); }}
              className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-bold text-xs transition-all ${
                mode === "dine-in" 
                  ? "bg-white text-orange-600 shadow-md" 
                  : "text-stone-600 hover:text-stone-900 hover:bg-stone-200/40"
              }`}
            >
              <Utensils size={14} className={mode === "dine-in" ? "text-orange-500" : ""} /> 
              <span>Dine-In</span>
              {totalDineInItems > 0 && (
                <span className="ml-1 px-1.5 py-0.5 text-[10px] bg-orange-100 text-orange-600 rounded-full font-black">{totalDineInItems}</span>
              )}
            </button>
            <button
              onClick={() => { setMode("takeaway"); setValidationError(false); }}
              className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-bold text-xs transition-all ${
                mode === "takeaway" 
                  ? "bg-white text-orange-600 shadow-md" 
                  : "text-stone-600 hover:text-stone-900 hover:bg-stone-200/40"
              }`}
            >
              <ShoppingBag size={14} className={mode === "takeaway" ? "text-orange-500" : ""} /> 
              <span>Takeaway</span>
              {totalTakeawayItems > 0 && (
                <span className="ml-1 px-1.5 py-0.5 text-[10px] bg-orange-100 text-orange-600 rounded-full font-black">{totalTakeawayItems}</span>
              )}
            </button>
            <button
              onClick={() => { setMode("delivery"); setValidationError(false); }}
              className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-bold text-xs transition-all ${
                mode === "delivery" 
                  ? "bg-white text-orange-600 shadow-md" 
                  : "text-stone-600 hover:text-stone-900 hover:bg-stone-200/40"
              }`}
            >
              <Bike size={14} className={mode === "delivery" ? "text-orange-500" : ""} /> 
              <span>Delivery</span>
              {totalDeliveryItems > 0 && (
                <span className="ml-1 px-1.5 py-0.5 text-[10px] bg-orange-100 text-orange-600 rounded-full font-black">{totalDeliveryItems}</span>
              )}
            </button>
          </div>

          {/* DINE-IN LOCAL TABLES CONTROL */}
          {mode === "dine-in" && (
            <div className="bg-white border border-stone-200 rounded-xl p-3 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <Layers size={12} className="text-stone-400" />
                <span className="text-[10px] font-black uppercase text-stone-400 tracking-wider">Select Serving Table</span>
              </div>
              <div className="flex gap-2 flex-wrap">
                {tables.map((t) => {
                  const currentTableCart = dineInOrders[t] || [];
                  const hasItems = currentTableCart.length > 0;
                  const itemQuantity = currentTableCart.reduce((s, i) => s + i.qty, 0);
                  
                  return (
                    <button
                      key={t}
                      onClick={() => setActiveTable(t)}
                      className={`relative min-w-[64px] h-12 rounded-xl text-xs font-black transition-all flex flex-col items-center justify-center border ${
                        activeTable === t
                          ? "bg-orange-50 border-orange-500 text-orange-600 shadow-md shadow-orange-500/5"
                          : hasItems
                          ? "bg-amber-50 border-amber-300 text-amber-800 hover:bg-amber-100/70"
                          : "bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100 hover:border-stone-300"
                      }`}
                    >
                      <span>{t}</span>
                      {hasItems && (
                        <span className={`text-[9px] mt-0.5 px-1 py-0.1 rounded font-medium ${
                          activeTable === t ? "bg-orange-600 text-orange-100" : "bg-amber-200 text-amber-900"
                        }`}>
                          {itemQuantity} items
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* INTERACTIVE CATEGORY TABS CONTAINER */}
<div className="flex items-center gap-2 mb-6  pb-2 scrollbar-none">
  {categories.map((cat) => {
    // Standardize the key fallback in case a category name is blank or missing
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
        {/* FOOD CARD SHELF */}
        <div className="flex-1">
          {filteredProducts.length === 0 ? (
            <div className="text-center py-16 bg-white border border-stone-200 rounded-2xl p-6 shadow-sm">
              <p className="text-xs font-bold text-stone-400">No matching food items found.</p>
              <p className="text-[11px] text-stone-400/80 font-medium mt-1">Try adjusting your search criteria or filter categories.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
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

      {/* RIGHT PANEL: LIVE TICKET SUMMARY */}
      <div className="col-span-5 bg-white flex flex-col shadow-2xl z-10 overflow-hidden">
        
        {/* TICKET MAIN HEADER */}
        <div className="p-4 border-b border-stone-100 flex items-center justify-between bg-stone-50/50">
          <div className="flex items-center gap-2.5">
            <span className="p-2 bg-orange-100 text-orange-600 rounded-xl shadow-sm">
              {mode === "dine-in" ? <Utensils size={16} /> : mode === "delivery" ? <Bike size={16} /> : <ShoppingBag size={16} />}
            </span>
            <div>
              <h2 className="font-black text-stone-900 tracking-tight text-xs uppercase leading-none">
                {mode === "dine-in" ? `${activeTable} Order Ticket` : `${mode} Ticket`}
              </h2>
              <span className="text-[10px] text-stone-400 font-semibold tracking-wide">Active Order Basket</span>
            </div>
          </div>
          <span className="text-xs bg-stone-900 text-white font-black px-2.5 py-1 rounded-lg shadow-sm shadow-stone-900/10">
            {cart.reduce((sum, item) => sum + item.qty, 0)} Items
          </span>
        </div>

        {/* CONDITIONAL DELIVERY DETAILS INPUTS */}
        {mode === "delivery" && (
          <div className="p-4 bg-orange-50/40 border-b border-orange-100 space-y-2.5">
            <div className="flex items-center gap-1.5 text-[10px] font-black text-orange-800 uppercase tracking-wider">
              <User size={12} /> Customer Drop Details
            </div>
            
            <div className="space-y-2">
              <div className="relative">
                <User size={12} className="absolute left-3 top-2.5 text-stone-400" />
                <input
                  className={`w-full bg-white border ${validationError && !customer.name ? 'border-red-400 bg-red-50/20' : 'border-stone-200'} focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 rounded-xl pl-8 pr-3 py-2 text-xs font-medium transition-all outline-none placeholder:text-stone-400`}
                  placeholder="Customer Full Name"
                  value={customer.name}
                  onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
                />
              </div>

              <div className="relative">
                <Phone size={12} className="absolute left-3 top-2.5 text-stone-400" />
                <input
                  className={`w-full bg-white border ${validationError && !customer.phone ? 'border-red-400 bg-red-50/20' : 'border-stone-200'} focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 rounded-xl pl-8 pr-3 py-2 text-xs font-medium transition-all outline-none placeholder:text-stone-400`}
                  placeholder="Contact Mobile Number"
                  value={customer.phone}
                  onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
                />
              </div>

              <div className="relative">
                <MapPin size={12} className="absolute left-3 top-2.5 text-stone-400" />
                <input
                  className={`w-full bg-white border ${validationError && !customer.address ? 'border-red-400 bg-red-50/20' : 'border-stone-200'} focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 rounded-xl pl-8 pr-3 py-2 text-xs font-medium transition-all outline-none placeholder:text-stone-400`}
                  placeholder="Complete Delivery Address"
                  value={customer.address}
                  onChange={(e) => setCustomer({ ...customer, address: e.target.value })}
                />
              </div>
            </div>

            {validationError && (
              <p className="text-[10px] text-red-600 font-bold mt-1 bg-red-50 p-1.5 rounded-lg border border-red-100">
                ⚠️ All customer drop details are required to clear this ticket.
              </p>
            )}
          </div>
        )}

        {/* BASKET COMPONENT LIST */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-stone-50/30">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-stone-300">
              <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center mb-2">
                <ShoppingBag size={20} className="text-stone-400" />
              </div>
              <p className="font-bold text-xs text-stone-500">This basket is empty</p>
              <p className="text-[11px] text-stone-400 max-w-[180px] mt-0.5">Select menu items on the left to spin up an active ticket.</p>
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-3 border border-stone-200 rounded-xl p-2.5 bg-white shadow-sm hover:border-stone-300 transition-all group">
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-stone-800 text-xs truncate group-hover:text-orange-600 transition-colors">{item.name}</h4>
                  <p className="text-stone-400 text-[10px] font-bold">Rs {item.price}</p>
                </div>
                
                {/* ADVANCED COUNTER CLUSTERING */}
                <div className="flex items-center bg-stone-100 rounded-xl p-1 border border-stone-200/50 shadow-inner">
                  <button
                    onClick={() => decrementQty(item.id, item.qty)}
                    className="w-6 h-6 flex items-center justify-center bg-white hover:bg-stone-50 rounded-lg text-stone-600 hover:text-red-600 transition-colors shadow-sm border border-stone-200/30 active:scale-95"
                  >
                    <Minus size={10} strokeWidth={3} />
                  </button>
                  <span className="w-7 text-center font-black text-xs text-stone-800 select-none">{item.qty}</span>
                  <button
                    onClick={() => incrementQty(item.id)}
                    className="w-6 h-6 flex items-center justify-center bg-white hover:bg-stone-50 rounded-lg text-stone-600 hover:text-orange-600 transition-colors shadow-sm border border-stone-200/30 active:scale-95"
                  >
                    <Plus size={10} strokeWidth={3} />
                  </button>
                  <button 
                    onClick={() => removeItem(item.id)} 
                    className="p-1 text-stone-400 hover:text-red-500 ml-2"
                  >
                    <Trash2 size={12}/>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* CHECKOUT ACTION BAR */}
        <div className="p-4 border-t border-stone-100 bg-stone-50/50 space-y-3">
          <div className="flex justify-between text-xs font-bold text-stone-600">
            <span>Total Amount Due:</span>
            <span className="text-stone-950 font-black text-sm">Rs {total.toFixed(0)}</span>
          </div>
          <button 
            onClick={printReceipt}
            disabled={cart.length === 0}
            className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-stone-200 disabled:text-stone-400 font-black py-3 rounded-xl text-white text-xs uppercase flex items-center justify-center gap-2"
          >
            <Printer size={14} /> Print Invoice
          </button>
        </div>
      </div>
    </div>
  );
}
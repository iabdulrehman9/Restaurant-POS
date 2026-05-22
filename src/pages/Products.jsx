import { useState, useRef } from "react";
import { 
  Plus, 
  Pencil, 
  Trash2, 
  Image as ImageIcon, 
  UploadCloud, 
  CheckCircle2, 
  XCircle,
  Folder,
  Utensils,
  DollarSign
} from "lucide-react";

const initialCategories = ["Burger", "Drinks", "Pizza", "Fries"];

// Fallback high-quality vector images for pre-loaded/empty state aesthetics
const placeholderImage = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop&q=60";

export default function Products() {
  const [products, setProducts] = useState([
    {
      id: 1,
      name: "Crispy Zinger Crunch",
      category: "Burger",
      price: "550",
      image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&auto=format&fit=crop&q=60",
      active: true
    },
    {
      id: 2,
      name: "Classic Pepperoni Feast",
      category: "Pizza",
      price: "1200",
      image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500&auto=format&fit=crop&q=60",
      active: true
    }
  ]);

  const [form, setForm] = useState({
    id: null,
    name: "",
    category: "Burger",
    price: "",
    image: "",
    active: true,
  });

  const [editMode, setEditMode] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const fileInputRef = useRef(null);

  /* ---------------- IMAGE UPLOAD HANDLING ---------------- */
  const handleImage = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setForm({ ...form, image: reader.result });
    };
    reader.readAsDataURL(file);
  };

  /* ---------------- RESET FORM STATE ---------------- */
  const resetForm = () => {
    setForm({
      id: null,
      name: "",
      category: "Burger",
      price: "",
      image: "",
      active: true,
    });
    setEditMode(false);
    setErrorMsg("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  /* ---------------- CREATE / UPDATE SUBMIT ---------------- */
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name || !form.price) {
      setErrorMsg("Please fill in both the product name and price fields.");
      return;
    }
    setErrorMsg("");

    // Fallback to placeholder if no image was chosen
    const finalForm = { ...form, image: form.image || placeholderImage };

    if (editMode) {
      setProducts(products.map((p) => p.id === form.id ? finalForm : p));
    } else {
      setProducts([...products, { ...finalForm, id: Date.now() }]);
    }

    resetForm();
  };

  /* ---------------- CORE ACTION METHODS ---------------- */
  const handleEdit = (product) => {
    setForm(product);
    setEditMode(true);
    setErrorMsg("");
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = (id) => {
    setProducts(products.filter((p) => p.id !== id));
  };

  const toggleActive = (id) => {
    setProducts(
      products.map((p) => p.id === id ? { ...p, active: !p.active } : p)
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-[1500px] mx-auto p-2">
      
 {/* LEFT AREA PANEL: THE INPUT CREATION ENGINE */}
<div className="lg:col-span-4 bg-white rounded-3xl p-6 border-2 border-orange-500/30 shadow-xl shadow-neutral-100/70 h-fit sticky top-24">      
  <div className="flex items-center gap-2.5 mb-6 pb-4 border-b border-neutral-200/60">
    <div className="w-9 h-9 rounded-xl bg-orange-500/10 text-orange-600 flex items-center justify-center">
      <Utensils size={18} />
    </div>
    <div>
      <h2 className="font-black text-neutral-900 tracking-tight text-base">
        {editMode ? "Modify Item details" : "Register Catalog Item"}
      </h2>
      <p className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider">Product Creation Suite</p>
    </div>
  </div>

  <form onSubmit={handleSubmit} className="space-y-5">
    {/* ERROR ALERT REGION */}
    {errorMsg && (
      <div className="p-3 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl text-xs font-semibold animate-fadeIn">
        {errorMsg}
      </div>
    )}

    {/* PRODUCT NAME INPUT */}
    <div className="space-y-1.5">
      <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Product Nomenclature</label>
      <input
        className="w-full bg-neutral-50/60 border border-neutral-200 hover:border-neutral-300 focus:border-orange-500 focus:bg-white px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 outline-none placeholder:text-neutral-400"
        placeholder="e.g., Gourmet Smoked BBQ Burger"
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
      />
    </div>

    {/* CATEGORY SELECT DROPDOWN */}
    <div className="space-y-1.5">
      <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Department Category</label>
      <div className="relative">
        <select
          className="w-full bg-neutral-50/60 border border-neutral-200 hover:border-neutral-300 focus:border-orange-500 focus:bg-white px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 outline-none appearance-none cursor-pointer text-neutral-800"
          value={form.category}
          onChange={(e) => setForm({ ...form, category: e.target.value })}
        >
          {initialCategories.map((c) => (
            <option key={c} value={c}>{c} Lineups</option>
          ))}
        </select>
        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none text-xs">▼</span>
      </div>
    </div>

    {/* PRICE ENTRY INPUT */}
    <div className="space-y-1.5">
      <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Wholesale Base Price</label>
      <div className="relative">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 font-bold text-xs font-mono">RS</div>
        <input
          className="w-full bg-neutral-50/60 border border-neutral-200 hover:border-neutral-300 focus:border-orange-500 focus:bg-white pl-10 pr-4 py-3 rounded-xl text-sm font-bold font-mono transition-all duration-200 outline-none"
          placeholder="0.00"
          type="number"
          value={form.price}
          onChange={(e) => setForm({ ...form, price: e.target.value })}
        />
      </div>
    </div>

    {/* PREMIUM FILE UPLOAD DRAG/CLICK REGION */}
    <div className="space-y-1.5">
      <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Display Media Thumbnail</label>
      <div 
        onClick={() => fileInputRef.current?.click()}
        className="border-2 border-dashed border-neutral-200 hover:border-orange-400 rounded-2xl p-4 transition-colors duration-200 cursor-pointer bg-neutral-50/40 text-center flex flex-col items-center justify-center group"
      >
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="image/*"
          onChange={handleImage}
        />
        
        {form.image ? (
          <div className="relative w-full h-28 rounded-xl overflow-hidden shadow-inner">
            <img src={form.image} alt="Preview" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center text-white text-xs font-bold gap-1">
              <UploadCloud size={14} /> Replace Media
            </div>
          </div>
        ) : (
          <div className="py-2 text-neutral-400 group-hover:text-neutral-600 transition-colors">
            <UploadCloud size={24} className="mx-auto text-neutral-300 group-hover:text-orange-500 mb-1.5 transition-colors" />
            <span className="text-xs font-bold block text-neutral-600">Upload Image File</span>
            <span className="text-[10px] text-neutral-400 font-medium block mt-0.5">PNG, JPG formats accepted</span>
          </div>
        )}
      </div>
    </div>

    {/* ACTIVE STATUS TOGGLE */}
    <div className="flex items-center justify-between bg-neutral-50 p-3 rounded-2xl border border-neutral-200/40">
      <div className="flex flex-col">
        <span className="text-xs font-bold text-neutral-700">Display Availability</span>
        <span className="text-[10px] font-medium text-neutral-400">Controls terminal listing visibility</span>
      </div>
      <label className="relative inline-flex items-center cursor-pointer select-none">
        <input
          type="checkbox"
          className="sr-only peer"
          checked={form.active}
          onChange={(e) => setForm({ ...form, active: e.target.checked })}
        />
        <div className="w-10 h-6 bg-neutral-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500" />
      </label>
    </div>

    {/* TRIGGER CONTROL BUTTON BLOCK */}
    <div className="space-y-2.5 pt-2">
      <button
        type="submit"
        className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-4 rounded-xl text-sm transition-all shadow-md shadow-orange-500/20 flex items-center justify-center gap-1.5 active:scale-[0.99]"
      >
        <Plus size={16} strokeWidth={2.5} />
        <span>{editMode ? "Save Changes" : "Publish to Catalog"}</span>
      </button>

      {editMode && (
        <button
          type="button"
          onClick={resetForm}
          className="w-full bg-neutral-100 hover:bg-neutral-200 text-neutral-600 font-bold py-2.5 px-4 rounded-xl text-xs transition-colors"
        >
          Discard Edits
        </button>
      )}
    </div>
  </form>
</div>


      {/* RIGHT AREA PANEL: CATALOG MANAGEMENT TABLE/GRID */}
      <div className="lg:col-span-8 space-y-4">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <div className="h-4 w-1 bg-gradient-to-b from-neutral-800 to-neutral-950 rounded-full" />
            <h2 className="text-xs font-bold text-neutral-400 tracking-widest uppercase">
              Active Inventory Stream
            </h2>
          </div>
          <span className="text-xs font-bold text-neutral-400 bg-neutral-100 px-2.5 py-1 rounded-full">
            Count: {products.length} Items
          </span>
        </div>

        {/* CONDITION: EMPTY LIST ARTIFACT HOOK */}
        {products.length === 0 ? (
          <div className="bg-white border border-neutral-200/60 rounded-3xl p-12 text-center text-neutral-400 shadow-sm flex flex-col items-center justify-center">
            <ImageIcon size={40} className="text-neutral-200 mb-3" />
            <h3 className="text-sm font-bold text-neutral-800">Your Menu is Bare</h3>
            <p className="text-xs text-neutral-400 max-w-xs mt-1 leading-relaxed">
              No retail items are compiled inside the index yet. Use the left dashboard form engine to map items.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {products.map((p) => (
              <div
                key={p.id}
                className={`bg-white rounded-3xl border transition-all duration-300 flex flex-col overflow-hidden relative group shadow-sm hover:shadow-xl hover:shadow-neutral-100/50 ${
                  !p.active ? "border-neutral-200/40 bg-neutral-50/40 opacity-70" : "border-neutral-200/60"
                }`}
              >
                {/* FLOATING ACTION OVERLAY TAG REGION */}
                <span className="absolute left-3 top-3 z-10 text-[10px] font-bold text-neutral-700 bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-full shadow-sm border border-neutral-200/20 flex items-center gap-1">
                  <Folder size={10} className="text-orange-500" />
                  {p.category}
                </span>

                {/* ITEM RUNTIME BANNER MEDIA ROW */}
                <div className="h-44 w-full bg-neutral-100 overflow-hidden relative">
                  <img
                    src={p.image}
                    alt={p.name}
                    className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                    loading="lazy"
                  />
                  {!p.active && (
                    <div className="absolute inset-0 bg-neutral-900/40 backdrop-blur-[1px] flex items-center justify-center text-white text-[11px] font-black uppercase tracking-widest gap-1">
                      <XCircle size={14} /> Shelf Hidden
                    </div>
                  )}
                </div>

                {/* BOTTOM METADATA CARD REGION */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-1">
                    <h3 className="font-bold text-sm tracking-tight text-neutral-900 line-clamp-1 group-hover:text-orange-600 transition-colors">
                      {p.name}
                    </h3>
                    <div className="text-base font-black text-neutral-900 tracking-tight font-mono flex items-baseline">
                      <span className="text-[10px] font-bold text-neutral-400 mr-0.5">RS</span>
                      {parseFloat(p.price).toLocaleString()}
                    </div>
                  </div>

                  {/* BOTTOM ACTION BAR COMPONENT ROW */}
                  <div className="flex items-center justify-between gap-2 pt-3 border-t border-neutral-100">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleEdit(p)}
                        className="p-2 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 rounded-xl transition-colors border border-transparent hover:border-neutral-200"
                        title="Edit Item Parameters"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(p.id)}
                        className="p-2 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors border border-transparent hover:border-rose-100"
                        title="Purge Item entry"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                    <button
                      onClick={() => toggleActive(p.id)}
                      className={`text-[10px] font-bold px-3 py-1.5 rounded-xl border transition-all duration-200 flex items-center gap-1 shadow-sm uppercase tracking-wider ${
                        p.active
                          ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                          : "bg-neutral-100 border-neutral-200 text-neutral-500"
                      }`}
                    >
                      {p.active ? (
                        <>
                          <CheckCircle2 size={12} strokeWidth={2.5} />
                          <span>Listed</span>
                        </>
                      ) : (
                        <>
                          <XCircle size={12} strokeWidth={2.5} />
                          <span>Hidden</span>
                        </>
                      )}
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
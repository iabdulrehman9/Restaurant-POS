import { useEffect, useMemo, useRef, useState } from "react";
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
  PlusCircle
} from "lucide-react";
import { createProduct, deleteProduct, getProducts, updateProduct } from "../api/index.js";
import { getApiBaseUrl } from "../api/client.js";

const initialCategories = ["Burger", "Drinks", "Pizza", "Fries"];
const placeholderImage = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 200 200'%3E%3Crect width='200' height='200' fill='%23f5f5f5'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23a3a3a3' font-family='Arial' font-size='16'%3ENo Image%3C/text%3E%3C/svg%3E";

export default function Products() {
  const [products, setProducts] = useState([]);

  const [form, setForm] = useState({
    id: null,
    name: "",
    category: "Burger",
    price: "",
    imageFile: null,
    imagePreview: "",
    active: true,
  });

  const [editMode, setEditMode] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const fileInputRef = useRef(null);
  const formHeadingRef = useRef(null);
  const apiBase = getApiBaseUrl().replace(/\/api$/, "");

  const loadProducts = async () => {
    try {
      const data = await getProducts();
      setProducts(data.products || []);
    } catch (err) {
      setProducts([]);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const categoryOptions = useMemo(() => {
    const dynamic = products.map((p) => p.category);
    return Array.from(new Set([...initialCategories, ...dynamic]));
  }, [products]);

  const handleImage = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const previewUrl = URL.createObjectURL(file);
    setForm({ ...form, imageFile: file, imagePreview: previewUrl });
  };

  const resetForm = () => {
    setForm({
      id: null,
      name: "",
      category: "Burger",
      price: "",
      imageFile: null,
      imagePreview: "",
      active: true,
    });
    setEditMode(false);
    setErrorMsg("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const focusFormConsole = () => {
    resetForm();
    formHeadingRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.price) {
      setErrorMsg("Please fill in both name and price fields.");
      return;
    }
    setErrorMsg("");

    const formData = new FormData();
    formData.append("name", form.name);
    formData.append("category", form.category);
    formData.append("price", form.price);
    formData.append("active", form.active ? "1" : "0");
    if (form.imageFile) {
      formData.append("image", form.imageFile);
    }

    try {
      if (editMode) {
        await updateProduct(form.id, formData);
      } else {
        await createProduct(formData);
      }
      await loadProducts();
    } catch (err) {
      setErrorMsg(err.message || "Unable to save product.");
      return;
    }

    resetForm();
  };

  const handleEdit = (product) => {
    setForm({
      id: product.id,
      name: product.name,
      category: product.category,
      price: product.price,
      imageFile: null,
      imagePreview: product.image_path ? `${apiBase}${product.image_path}` : "",
      active: product.active === 1 || product.active === true,
    });
    setEditMode(true);
    setErrorMsg("");
    formHeadingRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleDelete = async (id) => {
    try {
      await deleteProduct(id);
      await loadProducts();
    } catch (err) {
      setErrorMsg(err.message || "Unable to delete product.");
    }
  };

  const toggleActive = async (id) => {
    const target = products.find((p) => p.id === id);
    if (!target) return;
    const formData = new FormData();
    formData.append("active", target.active ? "0" : "1");
    try {
      await updateProduct(id, formData);
      await loadProducts();
    } catch (err) {
      setErrorMsg(err.message || "Unable to update product status.");
    }
  };

  return (
    /* OUTER CONTAINER */
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-[1500px] mx-auto p-2 lg:h-[calc(100vh-80px)] lg:overflow-hidden bg-neutral-50/50">
      
      {/* COMPACT LEFT PANEL FORM */}
      <div className="lg:col-span-4 bg-white rounded-2xl border border-neutral-300 shadow-xl shadow-neutral-200/50 overflow-hidden flex flex-col h-fit lg:max-h-[calc(100vh-100px)]">      
        
        {/* COMPACT DARK TITLE BAR */}
        <div ref={formHeadingRef} className="flex items-center gap-3 p-4 bg-gradient-to-r from-neutral-900 to-neutral-950 z-10 flex-shrink-0">
          <div className="w-8 h-8 rounded-lg bg-orange-500/20 text-orange-400 flex items-center justify-center border border-orange-500/20">
            <Utensils size={15} />
          </div>
          <div>
            <h2 className="font-bold text-white tracking-wide text-xs">
              {editMode ? "Modify Item Details" : "Register Catalog Item"}
            </h2>
            <p className="text-[9px] font-bold text-orange-400/80 uppercase tracking-wider">Product Creation Suite</p>
          </div>
        </div>

        {/* DENSE FORM CONTAINER */}
        <div className="p-4 overflow-y-auto [scrollbar-width:none]">
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {errorMsg && (
              <div className="p-2.5 bg-rose-50 border border-rose-100 text-rose-600 rounded-lg text-[11px] font-semibold">
                {errorMsg}
              </div>
            )}

            {/* PRODUCT NAME */}
            <div className="flex flex-col">
              <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1">Product Nomenclature</label>
              <input
                className="w-full bg-neutral-50/80 border border-neutral-200 hover:border-neutral-300 focus:border-orange-500 focus:bg-white px-3.5 py-2 rounded-xl text-xs font-medium transition-all duration-150 outline-none placeholder:text-neutral-400"
                placeholder="e.g., Gourmet Smoked BBQ Burger"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>

            {/* ROW GRID FOR COMPACT PAIRING */}
            <div className="grid grid-cols-2 gap-3">
              {/* CATEGORY SELECT */}
              <div className="flex flex-col">
                <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1">Category</label>
                <div className="relative">
                  <select
                    className="w-full bg-neutral-50/80 border border-neutral-200 hover:border-neutral-300 focus:border-orange-500 focus:bg-white pl-3.5 pr-8 py-2 rounded-xl text-xs font-medium transition-all duration-150 outline-none appearance-none cursor-pointer text-neutral-800"
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                  >
                    {categoryOptions.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none text-[9px]">▼</span>
                </div>
              </div>

              {/* PRICE FIELD */}
              <div className="flex flex-col">
                <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1">Price</label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 font-bold text-[10px] font-mono">RS</div>
                  <input
                    className="w-full bg-neutral-50/80 border border-neutral-200 hover:border-neutral-300 focus:border-orange-500 focus:bg-white pl-8 pr-3.5 py-2 rounded-xl text-xs font-bold font-mono transition-all duration-150 outline-none"
                    placeholder="0"
                    type="number"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* DENSE MEDIA CONSOLE */}
            <div className="flex flex-col">
              <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1">Display Media Thumbnail</label>
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border border-dashed border-neutral-200 hover:border-orange-400 rounded-xl p-3 transition-colors duration-150 cursor-pointer bg-neutral-50/40 text-center flex flex-col items-center justify-center group"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={handleImage}
                />
                
                {form.imagePreview ? (
                  <div className="relative w-full h-20 rounded-lg overflow-hidden shadow-inner">
                    <img src={form.imagePreview} alt="Preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex items-center justify-center text-white text-[10px] font-bold gap-1">
                      <UploadCloud size={12} /> Replace Media
                    </div>
                  </div>
                ) : (
                  <div className="py-1 text-neutral-400 group-hover:text-neutral-600 transition-colors">
                    <UploadCloud size={18} className="mx-auto text-neutral-300 group-hover:text-orange-500 mb-1 transition-colors" />
                    <span className="text-[11px] font-bold block text-neutral-600">Upload Image File</span>
                  </div>
                )}
              </div>
            </div>

            {/* COMPACT AVAILABILITY PANEL */}
            <div className="flex items-center justify-between bg-neutral-50/50 p-2.5 rounded-xl border border-neutral-200/40">
              <div className="flex flex-col">
                <span className="text-xs font-bold text-neutral-700">Display Availability</span>
                <span className="text-[9px] font-medium text-neutral-400">Controls terminal listing visibility</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer select-none">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={form.active}
                  onChange={(e) => setForm({ ...form, active: e.target.checked })}
                />
                <div className="w-9 h-5 bg-neutral-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-orange-500" />
              </label>
            </div>

            {/* FORM SUBMIT RUNTIME BUTTONS */}
            <div className="space-y-2 pt-1">
              <button
                type="submit"
                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-all shadow-md shadow-orange-500/10 flex items-center justify-center gap-1.5 active:scale-[0.99]"
              >
                <Plus size={14} strokeWidth={2.5} />
                <span>{editMode ? "Save Changes" : "Publish to Catalog"}</span>
              </button>

              {editMode && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="w-full bg-neutral-100 hover:bg-neutral-200 text-neutral-600 font-bold py-2 px-4 rounded-xl text-[10px] transition-colors"
                >
                  Discard Edits
                </button>
              )}
            </div>
          </form>
        </div>
      </div>

      {/* SOFTENED RIGHT PANEL */}
      <div className="lg:col-span-8 flex flex-col lg:h-[calc(100vh-100px)] bg-neutral-100/40 rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
        
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 bg-white border-b border-neutral-200 z-10 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-2.5 h-2.5 rounded-full bg-neutral-400" />
            <div>
              <h2 className="text-xs font-bold text-neutral-800 tracking-tight">
                Active Inventory Stream
              </h2>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[10px] font-medium text-neutral-400">Management Index Dashboard</span>
                <span className="inline-flex items-center bg-neutral-100 text-neutral-600 px-1.5 py-0.5 rounded-md text-[9px] font-bold tracking-wider uppercase">
                  {products.length} Items
                </span>
              </div>
            </div>
          </div>
          
          <button
            onClick={focusFormConsole}
            className="flex items-center gap-1.5 bg-neutral-900 hover:bg-neutral-800 text-white text-[11px] font-bold py-2 px-3.5 rounded-xl transition-all shadow-sm active:scale-95 group w-full sm:w-auto justify-center"
          >
            <PlusCircle size={13} className="text-orange-400 group-hover:rotate-90 transition-transform duration-200" />
            <span>Add New Product</span>
          </button>
        </div>

        {/* INDEX STREAM STACK */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5 [scrollbar-width:thin]">
          {products.length === 0 ? (
            <div className="bg-white border border-neutral-200 border-dashed rounded-xl p-12 text-center text-neutral-400 flex flex-col items-center justify-center h-64 my-auto">
              <ImageIcon size={36} className="text-neutral-300 mb-2" />
              <h3 className="text-xs font-bold text-neutral-800">Your Menu is Bare</h3>
              <p className="text-[11px] text-neutral-400 max-w-xs mt-1 leading-relaxed">
                No retail items are compiled inside the index yet. Use the dashboard form engine to map items.
              </p>
            </div>
          ) : (
            products.map((p) => (
              <div
                key={p.id}
                className={`bg-white rounded-xl border transition-all duration-150 flex flex-col sm:flex-row items-start sm:items-center p-2.5 gap-3.5 relative group shadow-sm hover:shadow-md hover:border-neutral-300 ${
                  !p.active ? "border-neutral-200/40 bg-neutral-50/40 opacity-70" : "border-neutral-200/80"
                }`}
              >
                {/* THUMBNAIL */}
                <div className="h-14 w-14 bg-neutral-100 rounded-lg overflow-hidden relative flex-shrink-0 border border-neutral-200/40">
                  <img
                    src={p.image_path ? `${apiBase}${p.image_path}` : placeholderImage}
                    alt={p.name}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                  {!p.active && (
                    <div className="absolute inset-0 bg-neutral-900/40 backdrop-blur-[1px] flex items-center justify-center text-white">
                      <XCircle size={12} />
                    </div>
                  )}
                </div>

                {/* INFO BLOCK */}
                <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-12 gap-1 sm:gap-4 items-center w-full">
                  <div className="sm:col-span-6 space-y-0.5 min-w-0">
                    <h3 className="font-bold text-xs tracking-tight text-neutral-900 truncate group-hover:text-orange-500 transition-colors">
                      {p.name}
                    </h3>
                    <div className="inline-flex items-center gap-1 text-[9px] font-bold text-neutral-500 bg-neutral-50 border border-neutral-200/40 px-1.5 py-0.5 rounded-md">
                      <Folder size={9} className="text-neutral-400" />
                      {p.category}
                    </div>
                  </div>

                  <div className="sm:col-span-3 min-w-0">
                    <div className="text-xs font-black text-neutral-900 tracking-tight font-mono truncate">
                      <span className="text-[9px] font-bold text-neutral-400 mr-0.5">RS</span>
                      {parseFloat(p.price).toLocaleString()}
                    </div>
                  </div>

                  <div className="sm:col-span-3 flex sm:justify-end flex-shrink-0">
                    <button
                      onClick={() => toggleActive(p.id)}
                      className={`text-[9px] font-bold px-2 py-0.5 rounded-md border transition-all duration-150 flex items-center gap-1 uppercase tracking-wider ${
                        p.active
                          ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                          : "bg-neutral-100 border-neutral-200 text-neutral-500"
                      }`}
                    >
                      {p.active ? (
                        <>
                          <CheckCircle2 size={10} strokeWidth={2.5} />
                          <span>Listed</span>
                        </>
                      ) : (
                        <>
                          <XCircle size={10} strokeWidth={2.5} />
                          <span>Hidden</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* ROW ACTION HOVER BAR */}
                <div className="flex items-center gap-1 border-t sm:border-t-0 sm:border-l border-neutral-100 pt-1.5 sm:pt-0 sm:pl-1.5 w-full sm:w-auto justify-end flex-shrink-0 ml-auto">
                  <button
                    onClick={() => handleEdit(p)}
                    className="p-1.5 text-neutral-400 hover:text-neutral-900 hover:bg-neutral-50 rounded-md transition-colors"
                    title="Edit Item Parameters"
                  >
                    <Pencil size={12} />
                  </button>
                  <button
                    onClick={() => handleDelete(p.id)}
                    className="p-1.5 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                    title="Purge Item Entry"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>

              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
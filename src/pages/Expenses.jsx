import { useMemo, useState } from "react";
import { 
  Plus, 
  Pencil, 
  Trash2, 
  TrendingDown, 
  Calendar, 
  FileText, 
  Layers,
  AlertCircle,
  Inbox
} from "lucide-react";

const categories = [
  "Rent",
  "Salary",
  "Electricity",
  "Gas",
  "Raw Material",
  "Maintenance",
  "Misc",
];

export default function Expenses() {
  const [expenses, setExpenses] = useState([
    {
      id: 1,
      category: "Electricity",
      amount: "45000",
      date: "2026-05-18",
      note: "Main production facility unit billing",
    },
    {
      id: 2,
      category: "Raw Material",
      amount: "185000",
      date: "2026-05-20",
      note: "Bulk meat and packaging restock shipment",
    }
  ]);

  const [form, setForm] = useState({
    id: null,
    category: "Rent",
    amount: "",
    date: "",
    note: "",
  });

  const [editMode, setEditMode] = useState(false);
  const [validationError, setValidationError] = useState("");

  /* ---------------- RESET FORM STATE ---------------- */
  const resetForm = () => {
    setForm({
      id: null,
      category: "Rent",
      amount: "",
      date: "",
      note: "",
    });
    setEditMode(false);
    setValidationError("");
  };

  /* ---------------- CREATE / UPDATE HANDLER ---------------- */
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.amount || !form.date) {
      setValidationError("Amount and Date values are mandatory fields.");
      return;
    }
    setValidationError("");

    if (editMode) {
      setExpenses(expenses.map((exp) => exp.id === form.id ? form : exp));
    } else {
      setExpenses([...expenses, { ...form, id: Date.now() }]);
    }

    resetForm();
  };

  /* ---------------- CORE ACTION TRIGGERS ---------------- */
  const handleEdit = (item) => {
    setForm(item);
    setEditMode(true);
    setValidationError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = (id) => {
    setExpenses(expenses.filter((exp) => exp.id !== id));
  };

  /* ---------------- COMPLEX TOTAL CALCULATION ---------------- */
  const totalExpense = useMemo(() => {
    return expenses.reduce((sum, exp) => sum + Number(exp.amount), 0);
  }, [expenses]);

  return (
    <div className="max-w-[1400px] mx-auto p-4 md:p-8 space-y-6 bg-neutral-50/50 min-h-screen">
      
      {/* TOP HEADER & RUNTIME TOTAL BANNER */}
      <div className="bg-white rounded-3xl p-6 border border-neutral-200/60 shadow-xl shadow-neutral-100/30 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center">
            <TrendingDown size={22} />
          </div>
          <div>
            <h1 className="font-black text-neutral-900 tracking-tight text-lg">Expense Register</h1>
            <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Operational Ledger</p>
          </div>
        </div>

        <div className="bg-orange-50/60 border border-orange-100 rounded-2xl px-6 py-3 min-w-[200px] text-left sm:text-right">
          <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest block">Aggregate Outflow</span>
          <div className="text-2xl font-black text-orange-600 tracking-tight font-mono mt-0.5">
            <span className="text-xs font-bold mr-0.5">RS</span>
            {totalExpense.toLocaleString()}
          </div>
        </div>
      </div>

      {/* DUAL WORKSPACE LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

        {/* LEFT COMPONENT COLUMN: SUBMISSION FORM CARD */}
        <div className="lg:col-span-4 bg-white p-6 rounded-3xl border border-neutral-200/60 shadow-xl shadow-neutral-100/30 lg:sticky lg:top-6">
          <h2 className="font-extrabold text-neutral-900 tracking-tight text-sm mb-5 pb-3 border-b border-neutral-200/60">
            {editMode ? "Modify Ledger Entry" : "File Expense Record"}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {validationError && (
              <div className="p-3 bg-amber-50 border border-amber-200 text-amber-700 rounded-xl text-xs font-semibold flex items-center gap-2 animate-fadeIn">
                <AlertCircle size={14} className="shrink-0" />
                <span>{validationError}</span>
              </div>
            )}

            {/* CATEGORY INPUT FIELD */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
                <Layers size={12} /> Allocations Group
              </label>
              <div className="relative">
                <select
                  className="w-full bg-neutral-50/60 border border-neutral-200 hover:border-neutral-300 focus:border-orange-500 focus:bg-white px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 outline-none appearance-none cursor-pointer text-neutral-800"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none text-[10px]">▼</span>
              </div>
            </div>

            {/* AMOUNT CASH INPUT */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
                Value Amount
              </label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 font-bold text-xs font-mono">RS</div>
                <input
                  type="number"
                  className="w-full bg-neutral-50/60 border border-neutral-200 hover:border-neutral-300 focus:border-orange-500 focus:bg-white pl-10 pr-3.5 py-2.5 rounded-xl text-sm font-bold font-mono transition-all duration-200 outline-none"
                  placeholder="0.00"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                />
              </div>
            </div>

            {/* CALENDAR TIMESTAMP INPUT */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar size={12} /> Execution Date
              </label>
              <input
                type="date"
                className="w-full bg-neutral-50/60 border border-neutral-200 hover:border-neutral-300 focus:border-orange-500 focus:bg-white px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 outline-none text-neutral-800"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
              />
            </div>

            {/* EXPENSE META NOTE */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
                <FileText size={12} /> Annotation / Context
              </label>
              <textarea
                className="w-full bg-neutral-50/60 border border-neutral-200 hover:border-neutral-300 focus:border-orange-500 focus:bg-white px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 outline-none min-h-[80px] max-h-[140px] placeholder:text-neutral-400"
                placeholder="Add receipt notes, references, etc."
                value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
              />
            </div>

            {/* COMMIT TRIGGER ACTION SECTION */}
            <div className="space-y-2 pt-2">
              <button
                type="submit"
                className={`w-full text-white font-bold py-2.5 px-4 rounded-xl text-sm transition-all shadow-md flex items-center justify-center gap-1.5 active:scale-[0.99] ${
                  editMode 
                    ? "bg-blue-600 hover:bg-blue-700 shadow-blue-500/10" 
                    : "bg-orange-500 hover:bg-orange-600 shadow-orange-500/20"
                }`}
              >
                <Plus size={16} strokeWidth={2.5} />
                <span>{editMode ? "Apply Update" : "Log Expense"}</span>
              </button>

              {editMode && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="w-full bg-neutral-100 hover:bg-neutral-200 text-neutral-500 font-bold py-2 rounded-xl text-xs transition-colors"
                >
                  Cancel Edit
                </button>
              )}
            </div>
          </form>
        </div>

        {/* RIGHT COMPONENT COLUMN: HISTORICAL LEDGER FEED WITH EXPERT GRADIENT LINE */}
        <div className="lg:col-span-8 bg-white p-6 rounded-3xl border border-neutral-200/60 shadow-xl shadow-neutral-100/30 space-y-4 relative lg:border-l lg:border-neutral-200/40 pl-6 lg:pl-10">
          
          {/* MODERN GRAPHIC TIMELINE AXIS (Visible on LG screens) */}
          <div className="hidden lg:block absolute left-0 top-12 bottom-12 w-[3px] bg-gradient-to-b from-orange-500 via-orange-300 to-transparent rounded-full opacity-75" />

          <h2 className="font-extrabold text-neutral-400 tracking-wider text-xs uppercase flex items-center gap-2">
            <span>Audit Trail Ledger Feed</span>
            <span className="text-[10px] bg-orange-50 font-bold text-orange-600 px-2 py-0.5 rounded-full">
              {expenses.length} Records
            </span>
          </h2>

          {expenses.length === 0 ? (
            <div className="border border-dashed border-neutral-200 rounded-2xl p-12 text-center text-neutral-400 flex flex-col items-center justify-center">
              <Inbox size={32} className="text-neutral-300 mb-2" />
              <h3 className="text-xs font-bold text-neutral-700">Ledger Index is Empty</h3>
              <p className="text-[11px] text-neutral-400 max-w-xs mt-0.5">
                No outbound capital pipelines are recorded for this current operational phase cycle.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-neutral-100 border border-neutral-200/60 rounded-2xl overflow-hidden shadow-sm">
              {expenses.map((e) => (
                <div
                  key={e.id}
                  className="p-4 hover:bg-orange-50/20 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
                >
                  {/* METADATA MANIFEST DETAILS */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-neutral-900">{e.category}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-orange-50 text-orange-600 font-mono">
                        {e.date}
                      </span>
                    </div>
                    {e.note && (
                      <p className="text-xs text-neutral-500 max-w-md leading-relaxed">
                        {e.note}
                      </p>
                    )}
                  </div>

                  {/* FINANCIAL COST & RUNTIME ACTION BLOCKS */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2 border-t sm:border-0 pt-2 sm:pt-0 border-neutral-100">
                    <div className="text-sm font-black text-orange-600 tracking-tight font-mono">
                      <span className="text-[10px] font-bold mr-0.5">RS</span>
                      {Number(e.amount).toLocaleString()}
                    </div>

                    <div className="flex items-center gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                      <button
                        onClick={() => handleEdit(e)}
                        className="p-1.5 text-neutral-400 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-colors"
                        title="Edit Entry"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        onClick={() => handleDelete(e.id)}
                        className="p-1.5 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Delete Entry"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
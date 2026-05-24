import { useEffect, useMemo, useState } from "react";
import { 
  Plus, 
  Pencil, 
  Trash2, 
  TrendingDown, 
  Calendar, 
  FileText, 
  Layers,
  AlertCircle,
  Inbox,
  Clock
} from "lucide-react";
import { createExpense, deleteExpense, getExpenses, updateExpense } from "../api/index.js";

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
  const [expenses, setExpenses] = useState([]);

  const [form, setForm] = useState({
    id: null,
    category: "Rent",
    amount: "",
    date: "",
    note: "",
  });

  const [editMode, setEditMode] = useState(false);
  const [validationError, setValidationError] = useState("");

  const loadExpenses = async () => {
    try {
      const data = await getExpenses();
      setExpenses(data.expenses || []);
    } catch (err) {
      setExpenses([]);
    }
  };

  useEffect(() => {
    loadExpenses();
  }, []);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.amount || !form.date) {
      setValidationError("Amount and Date values are mandatory fields.");
      return;
    }
    setValidationError("");

    try {
      if (editMode) {
        await updateExpense(form.id, form);
      } else {
        await createExpense(form);
      }
      await loadExpenses();
    } catch (err) {
      setValidationError(err.message || "Unable to save expense.");
      return;
    }

    resetForm();
  };

  const handleEdit = (item) => {
    setForm(item);
    setEditMode(true);
    setValidationError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id) => {
    try {
      await deleteExpense(id);
      await loadExpenses();
    } catch (err) {
      setValidationError(err.message || "Unable to delete expense.");
    }
  };

  const totalExpense = useMemo(() => {
    return expenses.reduce((sum, exp) => sum + Number(exp.amount), 0);
  }, [expenses]);

  return (
    <div className="max-w-[1400px] mx-auto p-3 md:p-4 pt-0 md:pt-0 bg-neutral-50/50 min-h-screen">
      
      {/* TOP HEADER BANNER */}
      <div className="bg-white rounded-2xl p-4 md:p-5 border border-neutral-200/60 shadow-xl shadow-neutral-100/30 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mt-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
            <TrendingDown size={20} />
          </div>
          <div>
            <h1 className="font-black text-neutral-900 tracking-tight text-base">Expense Register</h1>
            <p className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">Operational Ledger</p>
          </div>
        </div>

        <div className="bg-orange-50/60 border border-orange-100 rounded-xl px-5 py-2 min-w-[180px] text-left sm:text-right">
          <span className="text-[9px] font-black text-orange-500 uppercase tracking-widest block">Aggregate Outflow</span>
          <div className="text-xl font-black text-orange-600 tracking-tight font-mono mt-0.5">
            <span className="text-xs font-bold mr-0.5">RS</span>
            {totalExpense.toLocaleString()}
          </div>
        </div>
      </div>

      {/* WORKSPACE CONTENT GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start mt-4">

        {/* LEFT WORKSPACE CARD: INPUT SUBMISSION ENTRY */}
        <div className="lg:col-span-4 bg-white p-5 rounded-2xl border border-neutral-200/60 shadow-md shadow-neutral-100/20 lg:sticky lg:top-4">
          <h2 className="font-bold text-neutral-900 tracking-tight text-xs mb-3 pb-2 border-b border-neutral-100">
            {editMode ? "Modify Ledger Entry" : "File Expense Record"}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-3">
            {validationError && (
              <div className="p-2.5 bg-amber-50 border border-amber-200 text-amber-700 rounded-xl text-xs font-semibold flex items-center gap-2 animate-fadeIn">
                <AlertCircle size={14} className="shrink-0" />
                <span>{validationError}</span>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider flex items-center gap-1.5">
                <Layers size={11} className="text-neutral-400" /> Allocations Group
              </label>
              <div className="relative">
                <select
                  className="w-full bg-neutral-50/60 border border-neutral-200 hover:border-neutral-300 focus:border-orange-500 focus:bg-white px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 outline-none appearance-none cursor-pointer text-neutral-800"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none text-[9px]">▼</span>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider">
                Value Amount
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 font-bold text-[11px] font-mono">RS</div>
                <input
                  type="number"
                  className="w-full bg-neutral-50/60 border border-neutral-200 hover:border-neutral-300 focus:border-orange-500 focus:bg-white pl-8 pr-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-all duration-200 outline-none"
                  placeholder="0.00"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar size={11} className="text-neutral-400" /> Execution Date
              </label>
              <input
                type="date"
                className="w-full bg-neutral-50/60 border border-neutral-200 hover:border-neutral-300 focus:border-orange-500 focus:bg-white px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 outline-none text-neutral-800"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider flex items-center gap-1.5">
                <FileText size={11} className="text-neutral-400" /> Annotation / Context
              </label>
              <textarea
                className="w-full bg-neutral-50/60 border border-neutral-200 hover:border-neutral-300 focus:border-orange-500 focus:bg-white px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 outline-none min-h-[60px] max-h-[120px] placeholder:text-neutral-400"
                placeholder="Add receipt notes, references, etc."
                value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
              />
            </div>

            <div className="space-y-1.5 pt-1">
              <button
                type="submit"
                className={`w-full text-white font-semibold py-2 px-3 rounded-lg text-xs transition-all shadow-sm flex items-center justify-center gap-1.5 active:scale-[0.99] ${
                  editMode 
                    ? "bg-blue-600 hover:bg-blue-700 shadow-blue-500/10" 
                    : "bg-orange-500 hover:bg-orange-600 shadow-orange-500/10"
                }`}
              >
                <Plus size={14} strokeWidth={2.5} />
                <span>{editMode ? "Apply Update" : "Log Expense"}</span>
              </button>

              {editMode && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="w-full bg-neutral-100 hover:bg-neutral-200 text-neutral-500 font-semibold py-1.5 rounded-lg text-[11px] transition-colors"
                >
                  Cancel Edit
                </button>
              )}
            </div>
          </form>
        </div>

        {/* RIGHT WORKSPACE CARD: CLEAN FLAT LISTING VIEW */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-neutral-200/60 shadow-xl shadow-neutral-100/30 overflow-hidden">
          
          {/* LISTING HEADER CONTROLS */}
          <div className="p-4 border-b border-neutral-100 bg-neutral-50/30 flex items-center justify-between">
            <h2 className="font-extrabold text-neutral-500 tracking-wider text-[10px] uppercase flex items-center gap-2">
              <span>Operational Outflow Manifest</span>
              <span className="bg-neutral-100 font-bold text-neutral-600 px-2 py-0.5 rounded-full text-[9px]">
                {expenses.length} Total Rows
              </span>
            </h2>
          </div>

          {expenses.length === 0 ? (
            <div className="p-12 text-center text-neutral-400 flex flex-col items-center justify-center">
              <Inbox size={32} className="text-neutral-300 mb-2" />
              <h3 className="text-xs font-bold text-neutral-700">No Entry Lines Exist</h3>
              <p className="text-[11px] text-neutral-400 max-w-xs mt-0.5">
                The database index contains zero logged transactional updates for this phase.
              </p>
            </div>
          ) : (
            <div className="flex flex-col">
              
              {/* TABLE LISTING COLUMN TITLES */}
              <div className="hidden sm:grid grid-cols-12 gap-2 px-4 py-2 bg-neutral-50/70 border-b border-neutral-100 text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                <div className="col-span-3">Category Allocation</div>
                <div className="col-span-5">Annotation Context</div>
                <div className="col-span-2">Logged Date</div>
                <div className="col-span-2 text-right">Outflow Value</div>
              </div>

              {/* LISTING ROWS ITERATION */}
              <div className="divide-y divide-neutral-100">
                {expenses.map((e) => (
                  <div
                    key={e.id}
                    className="grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-2 items-center px-4 py-2.5 hover:bg-neutral-50/40 transition-all duration-150 group"
                  >
                    
                    {/* COLUMN 1: CATEGORY SPECIFIER */}
                    <div className="col-span-1 sm:col-span-3 flex items-center justify-between sm:justify-start gap-2">
                      <span className="font-bold text-neutral-800 text-xs tracking-tight">{e.category}</span>
                      <span className="sm:hidden text-[10px] font-bold text-orange-600 font-mono">
                        RS {Number(e.amount).toLocaleString()}
                      </span>
                    </div>

                    {/* COLUMN 2: NOTATION ANNOTATION LINE */}
                    <div className="col-span-1 sm:col-span-5 text-xs text-neutral-500 truncate pr-4">
                      {e.note ? (
                        <span className="text-neutral-600">{e.note}</span>
                      ) : (
                        <span className="text-neutral-300 italic text-[11px]">No annotation given</span>
                      )}
                    </div>

                    {/* COLUMN 3: DATETIME SPECIFIER */}
                    <div className="col-span-1 sm:col-span-2 flex items-center gap-1 text-neutral-400 text-[11px] font-mono">
                      <Clock size={11} className="sm:hidden text-neutral-400" />
                      <span>{e.date}</span>
                    </div>

                    {/* COLUMN 4: ACTION ACTIONS & VALUATION METRIC */}
                    <div className="col-span-1 sm:col-span-2 flex items-center justify-between sm:justify-end gap-3 mt-1 sm:mt-0 pt-1.5 sm:pt-0 border-t sm:border-0 border-dashed border-neutral-100">
                      
                      {/* UTILITY OPERATIONAL ACTIONS */}
                      <div className="flex items-center gap-0.5 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity duration-150 order-2 sm:order-1">
                        <button
                          onClick={() => handleEdit(e)}
                          className="p-1 text-neutral-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                          title="Modify Record"
                        >
                          <Pencil size={12} />
                        </button>
                        <button
                          onClick={() => handleDelete(e.id)}
                          className="p-1 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                          title="Purge Record"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>

                      {/* NATIVE VALUE METRIC ACCENT */}
                      <div className="hidden sm:block text-xs font-black text-neutral-900 font-mono tracking-tight text-right order-1 sm:order-2">
                        {Number(e.amount).toLocaleString()}
                      </div>

                    </div>

                  </div>
                ))}
              </div>

            </div>
          )}
        </div>

      </div>
    </div>
  );
}
import { useMemo, useState } from "react";
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Calendar,
  Flame,
  ArrowDownRight,
  FileText,
  Printer
} from "lucide-react";

export default function Reports() {
  const [tab, setTab] = useState("sales");

  /* ---------------- MOCK DATA SCHEMAS ---------------- */
  const sales = [
    { date: "2026-05-01", total: 5000 },
    { date: "2026-05-02", total: 7000 },
    { date: "2026-05-03", total: 6500 },
  ];

  const expenses = [
    { date: "2026-05-01", total: 2000 },
    { date: "2026-05-02", total: 1500 },
    { date: "2026-05-03", total: 1800 },
  ];

  const products = [
    { name: "Zinger Burger", sold: 120, revenue: 66000 },
    { name: "Fries", sold: 200, revenue: 40000 },
    { name: "Cold Drink", sold: 150, revenue: 22500 },
    { name: "Pizza", sold: 40, revenue: 48000 },
  ];

  /* ---------------- CORE DATA INSIGHTS ---------------- */
  // FIXED: Added appropriate state dependencies to ensure calculations re-run if arrays change
  const totalSales = useMemo(() => sales.reduce((s, i) => s + i.total, 0), [sales]);
  const totalExpenses = useMemo(() => expenses.reduce((s, i) => s + i.total, 0), [expenses]);
  const netProfit = totalSales - totalExpenses;

  const topProducts = useMemo(() => [...products].sort((a, b) => b.sold - a.sold), [products]);
  const lowProducts = useMemo(() => [...products].sort((a, b) => a.sold - b.sold), [products]);

  /* ---------------- RELIABLE PRINT/PDF ENGINE ---------------- */
  const handlePrintOrPDF = () => {
    window.print();
  };

  return (
    <div className="max-w-[1500px] mx-auto p-4 md:p-8 space-y-8 bg-neutral-50/40 min-h-screen antialiased">
      
      {/* FORCE BROWSER TO UNDERSTAND COLOR PRINTING & LAYOUT FORCING */}
      {/* FIXED: Corrected 'grid-template-cols' to standard native 'grid-template-columns' */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body { 
            background: white !important; 
            color: black !important; 
            -webkit-print-color-adjust: exact !important; 
            print-color-adjust: exact !important;
          }
          .no-print { display: none !important; }
          .print-container { padding: 0 !important; margin: 0 !important; width: 100% !important; }
          .print-force-visible { display: block !important; visibility: visible !important; }
          .print-grid { display: grid !important; grid-template-columns: repeat(2, minmax(0, 1fr)) !important; gap: 16px !important; }
        }
      `}} />

      {/* MODULE MAIN BRANDING CONTROL HEADER BAR */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-2 print-container">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-neutral-900 text-white flex items-center justify-center shadow-md shadow-neutral-900/10 no-print">
            <BarChart3 size={22} />
          </div>
          <div>
            <h1 className="text-xl font-black text-neutral-900 tracking-tight">Reports & Performance Hub</h1>
            <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Enterprise Analytics Engine</p>
          </div>
        </div>

        {/* LIFTED UTILITY EXPORT GROUP */}
        <div className="flex flex-wrap items-center gap-2 no-print">
          <button
            onClick={handlePrintOrPDF}
            className="bg-white hover:bg-neutral-50 text-neutral-700 font-bold px-3.5 py-2 rounded-xl text-xs border border-neutral-200 shadow-sm flex items-center gap-1.5 transition-all active:scale-[0.98]"
          >
            <FileText size={14} className="text-rose-500" />
            <span>Export PDF</span>
          </button>
          <button
            onClick={handlePrintOrPDF}
            className="bg-neutral-900 hover:bg-neutral-950 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-sm flex items-center gap-1.5 transition-all active:scale-[0.98]"
          >
            <Printer size={14} />
            <span>Print Manifest</span>
          </button>
        </div>
      </div>

      {/* CORE PERFORMANCE SUMMARY METRIC CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 print-container">
        
        {/* TOTAL SALES VOLUME */}
        <div className="bg-white border border-neutral-200 rounded-3xl p-5 shadow-sm">
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-black text-neutral-400 uppercase tracking-wider block">Gross Receivables</span>
            <span className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xs font-bold no-print">
              <TrendingUp size={14} />
            </span>
          </div>
          <div className="mt-4 space-y-1">
            <p className="text-xs font-bold text-neutral-500">To Date Sales</p>
            <h2 className="text-2xl font-black text-neutral-900 font-mono tracking-tight flex items-baseline">
              <span className="text-xs font-bold text-neutral-400 mr-0.5">RS</span>
              {totalSales.toLocaleString()}
            </h2>
          </div>
        </div>

        {/* COMPREHENSIVE OUTFLOW METRIC */}
        <div className="bg-white border border-neutral-200 rounded-3xl p-5 shadow-sm">
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-black text-neutral-400 uppercase tracking-wider block">Operating Expenses</span>
            <span className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center text-xs font-bold no-print">
              <TrendingDown size={14} />
            </span>
          </div>
          <div className="mt-4 space-y-1">
            <p className="text-xs font-bold text-neutral-500">Total Expenses</p>
            <h2 className="text-2xl font-black text-neutral-900 font-mono tracking-tight flex items-baseline">
              <span className="text-xs font-bold text-neutral-400 mr-0.5">RS</span>
              {totalExpenses.toLocaleString()}
            </h2>
          </div>
        </div>

        {/* NET PROFIT CARD */}
        <div className="bg-neutral-900 text-white rounded-3xl p-5 shadow-md border border-neutral-800">
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-black text-neutral-400 uppercase tracking-wider block">Net Capital Gain</span>
            <span className="bg-white/10 text-emerald-400 text-[10px] font-extrabold px-2 py-0.5 rounded-md no-print">
              +{totalSales > 0 ? ((netProfit / totalSales) * 100).toFixed(1) : "0.0"}% Yield
            </span>
          </div>
          <div className="mt-4 space-y-1">
            <p className="text-xs font-bold text-neutral-300">Net Retained Profit</p>
            <h2 className="text-2xl font-black text-emerald-400 font-mono tracking-tight flex items-baseline">
              <span className="text-xs font-bold text-emerald-500/80 mr-0.5">RS</span>
              {netProfit.toLocaleString()}
            </h2>
          </div>
        </div>

      </div>

      {/* INTERACTIVE NAVIGATION CONTROL BUTTONS */}
      <div className="space-y-6 print-container">
        <div className="flex border-b border-neutral-200 pb-px no-print">
          <div className="flex gap-1 bg-neutral-200/60 p-1 rounded-xl">
            {["sales", "expenses", "products"].map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold tracking-wide uppercase transition-all duration-150 ${
                  tab === t
                    ? "bg-white text-neutral-900 shadow-sm"
                    : "text-neutral-500 hover:text-neutral-900"
                }`}
              >
                {t} Segment
              </button>
            ))}
          </div>
        </div>

        {/* DATA LEDGER GROUPS */}
        
        {/* REVENUE SALES TABLES */}
        <div className={`bg-white border border-neutral-200 rounded-3xl p-6 shadow-sm space-y-4 ${tab === "sales" ? "block" : "hidden print:block"}`}>
          <h2 className="text-xs font-black text-neutral-400 uppercase tracking-widest flex items-center gap-2">
            <Calendar size={12} className="text-neutral-400 no-print" />
            <span>Sales Report Ledger</span>
          </h2> 

          <div className="overflow-hidden border border-neutral-200 rounded-2xl">
            <table className="w-full text-left text-xs font-medium text-neutral-600">
              <thead className="bg-neutral-50 border-b border-neutral-200 text-[10px] font-black text-neutral-400 uppercase tracking-wider">
                <tr>
                  <th className="p-4">Transaction Cycle Date</th>
                  <th className="p-4 text-right">Settled Aggregates</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {sales.map((s, i) => (
                  <tr key={i} className="hover:bg-neutral-50/40 transition-colors">
                    <td className="p-4 font-bold text-neutral-800">{s.date}</td>
                    <td className="p-4 text-right font-bold font-mono text-emerald-600 text-sm">
                      RS {s.total.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* OPERATIONAL MATRIX EXPENSES */}
        <div className={`bg-white border border-neutral-200 rounded-3xl p-6 shadow-sm space-y-4 ${tab === "expenses" ? "block" : "hidden print:block"}`}>
          <h2 className="text-xs font-black text-neutral-400 uppercase tracking-widest flex items-center gap-2">
            <ArrowDownRight size={14} className="text-neutral-400 no-print" />
            <span>Expense Report Ledger</span>
          </h2> 

          <div className="overflow-hidden border border-neutral-200 rounded-2xl">
            <table className="w-full text-left text-xs font-medium text-neutral-600">
              <thead className="bg-neutral-50 border-b border-neutral-200 text-[10px] font-black text-neutral-400 uppercase tracking-wider">
                <tr>
                  <th className="p-4">Execution Timestamp Date</th>
                  <th className="p-4 text-right">Debited Statement Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {expenses.map((e, i) => (
                  <tr key={i} className="hover:bg-neutral-50/40 transition-colors">
                    <td className="p-4 font-bold text-neutral-800">{e.date}</td>
                    <td className="p-4 text-right font-bold font-mono text-rose-600 text-sm">
                      RS {e.total.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* PRODUCT INVENTORY MATRICES */}
        <div className={`grid grid-cols-1 gap-6 ${tab === "products" ? "block print-grid" : "hidden print:print-grid"}`}>
          
          {/* VOLUMETRIC METRIC VELOCITY LEADERS */}
          <div className="bg-white border border-neutral-200 rounded-3xl p-6 shadow-sm space-y-4">
            <h2 className="text-xs font-black text-neutral-400 uppercase tracking-widest flex items-center gap-1.5">
              <Flame size={14} className="text-orange-500 no-print" />
              <span>Top Performing Products</span>
            </h2> 

            <div className="divide-y divide-neutral-200 border border-neutral-200 rounded-2xl overflow-hidden">
              {topProducts.map((p, i) => (
                <div key={i} className="p-4 flex items-center justify-between gap-4 bg-white">
                  <div className="space-y-1">
                    <span className="text-xs font-extrabold text-neutral-900 block">{p.name}</span>
                    <span className="text-[10px] font-bold text-neutral-400 block font-mono">REV: RS {p.revenue.toLocaleString()}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-black text-neutral-900 font-mono bg-neutral-100 px-2.5 py-1 rounded-lg border border-neutral-200/50">
                      {p.sold} sold
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* PERFORMANCE DEFICIT WARNING MATRIX */}
          <div className="bg-white border border-neutral-200 rounded-3xl p-6 shadow-sm space-y-4">
            <h2 className="text-xs font-black text-neutral-400 uppercase tracking-widest flex items-center gap-1.5">
              <ArrowDownRight size={14} className="text-neutral-400 no-print" />
              <span>Low Performing Products</span>
            </h2> 

            <div className="divide-y divide-neutral-200 border border-neutral-200 rounded-2xl overflow-hidden">
              {lowProducts.map((p, i) => (
                <div key={i} className="p-4 flex items-center justify-between gap-4 bg-white">
                  <div className="space-y-1">
                    <span className="text-xs font-extrabold text-neutral-900 block">{p.name}</span>
                    <span className="text-[10px] font-bold text-neutral-400 block font-mono">REV: RS {p.revenue.toLocaleString()}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-black text-neutral-600 font-mono bg-neutral-50 border border-neutral-200 px-2.5 py-1 rounded-lg">
                      {p.sold} sold
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
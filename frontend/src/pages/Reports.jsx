import { useEffect, useMemo, useState } from "react";
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Calendar,
  Flame,
  FileText,
  Printer,
  Receipt,
  ChevronLeft,
  ChevronRight,
  Briefcase
} from "lucide-react";
import {
  getReportExpenses,
  getReportProducts,
  getReportSales,
  getReportSummary
} from "../api/index.js";

export default function Reports() {
  const [tab, setTab] = useState("sales");

  // Simple Pagination Controls (5 items per page)
  const [salesPage, setSalesPage] = useState(1);
  const [expensesPage, setExpensesPage] = useState(1);
  const [productsPage, setProductsPage] = useState(1);
  
  const itemsPerPage = 5;

  const [sales, setSales] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [products, setProducts] = useState([]);
  const [summary, setSummary] = useState({
    totalSales: 0,
    subtotal: 0,
    tax: 0,
    ordersCount: 0,
    totalExpenses: 0,
    profit: 0,
    avgBill: 0,
  });

  useEffect(() => {
    const loadReports = async () => {
      try {
        const summaryData = await getReportSummary();
        setSummary(summaryData);
      } catch (err) {
        setSummary((prev) => ({ ...prev }));
      }

      try {
        const salesData = await getReportSales();
        setSales(salesData.sales || []);
      } catch (err) {
        setSales([]);
      }

      try {
        const expenseData = await getReportExpenses();
        setExpenses(expenseData.expenses || []);
      } catch (err) {
        setExpenses([]);
      }

      try {
        const productData = await getReportProducts();
        setProducts(productData.products || []);
      } catch (err) {
        setProducts([]);
      }
    };

    loadReports();
  }, []);

  /* ---------------- CALCULATIONS ---------------- */
  const financialSummary = useMemo(() => {
    return {
      totalSalesBeforeTax: summary.subtotal || 0,
      totalTaxCollected: summary.tax || 0,
      totalFinalSales: summary.totalSales || 0,
      totalOrdersCount: summary.ordersCount || 0,
      totalExpensesCost: summary.totalExpenses || 0,
      takeHomeProfit: summary.profit || 0,
      averageBillValue: summary.avgBill || 0,
    };
  }, [summary]);

  const sortedProducts = useMemo(() => [...products].sort((a, b) => b.sold - a.sold), [products]);

  /* ---------------- PAGINATION SPLITTING ---------------- */
  const paginatedSales = useMemo(() => {
    const start = (salesPage - 1) * itemsPerPage;
    return sales.slice(start, start + itemsPerPage);
  }, [sales, salesPage]);

  const paginatedExpenses = useMemo(() => {
    const start = (expensesPage - 1) * itemsPerPage;
    return expenses.slice(start, start + itemsPerPage);
  }, [expenses, expensesPage]);

  const paginatedProducts = useMemo(() => {
    const start = (productsPage - 1) * itemsPerPage;
    return sortedProducts.slice(start, start + itemsPerPage);
  }, [sortedProducts, productsPage]);

  const salesMaxPages = Math.ceil(sales.length / itemsPerPage) || 1;
  const expensesMaxPages = Math.ceil(expenses.length / itemsPerPage) || 1;
  const productsMaxPages = Math.ceil(sortedProducts.length / itemsPerPage) || 1;

  const formatMoney = (value) => Number(value || 0).toLocaleString();

  const buildReportHtml = () => {
    const salesRows = sales.length
      ? sales
          .map(
            (row) => `
              <tr>
                <td>${row.date}</td>
                <td style="text-align:center;">${row.ordersCount}</td>
                <td style="text-align:right;">RS ${formatMoney(row.subtotal)}</td>
                <td style="text-align:right;">RS ${formatMoney(row.tax)}</td>
                <td style="text-align:right;">RS ${formatMoney(row.total)}</td>
              </tr>
            `
          )
          .join("")
      : `<tr><td colspan="5" style="text-align:center;">No sales data</td></tr>`;

    const expenseRows = expenses.length
      ? expenses
          .map(
            (row) => `
              <tr>
                <td>${row.id || ""}<div style="font-size:11px; color:#666;">${row.date || ""}</div></td>
                <td>${row.category || ""}</td>
                <td>${row.description || ""}</td>
                <td style="text-align:right;">RS ${formatMoney(row.total)}</td>
              </tr>
            `
          )
          .join("")
      : `<tr><td colspan="4" style="text-align:center;">No expense data</td></tr>`;

    const productRows = sortedProducts.length
      ? sortedProducts
          .map(
            (row) => `
              <tr>
                <td>${row.name || ""}</td>
                <td style="text-align:right;">${row.sold || 0}</td>
                <td style="text-align:right;">RS ${formatMoney(row.revenue)}</td>
              </tr>
            `
          )
          .join("")
      : `<tr><td colspan="3" style="text-align:center;">No product data</td></tr>`;

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <title>POS Report</title>
        <style>
          @page { size: A4; margin: 12mm; }
          body { font-family: Arial, sans-serif; color: #111; }
          h1 { font-size: 20px; margin: 0 0 6px; }
          h2 { font-size: 14px; margin: 18px 0 8px; }
          .summary { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
          .card { border: 1px solid #ddd; padding: 10px; border-radius: 6px; }
          .label { font-size: 11px; color: #666; text-transform: uppercase; }
          .value { font-size: 18px; font-weight: bold; }
          table { width: 100%; border-collapse: collapse; margin-top: 6px; }
          th, td { border: 1px solid #ddd; padding: 6px; font-size: 12px; }
          th { background: #f4f4f4; text-align: left; }
          .muted { color: #666; font-size: 11px; }
        </style>
      </head>
      <body>
        <h1>Business Report</h1>
        <div class="muted">Generated on ${new Date().toLocaleString()}</div>

        <h2>Summary</h2>
        <div class="summary">
          <div class="card"><div class="label">Total Sales</div><div class="value">RS ${formatMoney(financialSummary.totalFinalSales)}</div></div>
          <div class="card"><div class="label">Total Expenses</div><div class="value">RS ${formatMoney(financialSummary.totalExpensesCost)}</div></div>
          <div class="card"><div class="label">Net Profit</div><div class="value">RS ${formatMoney(financialSummary.takeHomeProfit)}</div></div>
          <div class="card"><div class="label">Orders</div><div class="value">${financialSummary.totalOrdersCount}</div></div>
          <div class="card"><div class="label">Avg. Ticket</div><div class="value">RS ${formatMoney(financialSummary.averageBillValue)}</div></div>
          <div class="card"><div class="label">Tax Collected</div><div class="value">RS ${formatMoney(financialSummary.totalTaxCollected)}</div></div>
        </div>

        <h2>Sales Logs</h2>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th style="text-align:center;">Orders</th>
              <th style="text-align:right;">Net Sales</th>
              <th style="text-align:right;">Tax</th>
              <th style="text-align:right;">Gross Total</th>
            </tr>
          </thead>
          <tbody>
            ${salesRows}
          </tbody>
        </table>

        <h2>Expense Logs</h2>
        <table>
          <thead>
            <tr>
              <th>ID / Date</th>
              <th>Category</th>
              <th>Details</th>
              <th style="text-align:right;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${expenseRows}
          </tbody>
        </table>

        <h2>Product Performance</h2>
        <table>
          <thead>
            <tr>
              <th>Product</th>
              <th style="text-align:right;">Units Sold</th>
              <th style="text-align:right;">Revenue</th>
            </tr>
          </thead>
          <tbody>
            ${productRows}
          </tbody>
        </table>
      </body>
      </html>
    `;
  };

  const handlePrint = () => {
    const html = buildReportHtml();
    const win = window.open("", "_blank", "width=900,height=700");
    if (!win) {
      alert("Popup blocked. Please allow popups to print/save PDF.");
      return;
    }
    win.document.write(html);
    win.document.close();
    win.onload = () => {
      win.focus();
      win.print();
    };
  };

  return (
    <div className="max-w-[1600px] mx-auto p-5 space-y-5 bg-orange-50/30 h-screen flex flex-col overflow-hidden antialiased text-neutral-800">
      
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
        }
      `}} />

      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-orange-100 print-container shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-orange-500 text-white flex items-center justify-center shadow-sm shadow-orange-500/20 no-print">
            <BarChart3 size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-neutral-900">Business Dashboard</h1>
            <p className="text-xs font-medium text-neutral-500">Real-time overview of sales performance & expenses</p>
          </div>
        </div>

        <div className="flex items-center gap-2 no-print">
          <button
            onClick={handlePrint}
            className="bg-white hover:bg-neutral-50 text-neutral-700 font-semibold px-4 py-2 rounded-xl text-xs border border-neutral-200 shadow-sm flex items-center gap-2 transition-all active:scale-95"
          >
            <FileText size={14} className="text-orange-500" />
            <span>Save PDF</span>
          </button>
          <button
            onClick={handlePrint}
            className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-4 py-2 rounded-xl text-xs shadow-sm shadow-orange-500/10 flex items-center gap-2 transition-all active:scale-95"
          >
            <Printer size={14} />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* FINANCIAL OVERVIEW CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 print-container shrink-0">
        
        {/* TOTAL SALES */}
        <div className="bg-white border border-orange-100 rounded-2xl p-5 shadow-sm shadow-orange-500/[0.02] flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-neutral-400 tracking-wider block uppercase">Total Gross Sales</span>
            <h2 className="text-2xl font-bold text-neutral-900 font-mono tracking-tight">
              <span className="text-sm font-semibold text-neutral-400 mr-1">RS</span>
              {financialSummary.totalFinalSales.toLocaleString()}
            </h2>
            <span className="text-[11px] text-neutral-500 block">Excl. Tax: RS {financialSummary.totalSalesBeforeTax.toLocaleString()}</span>
          </div>
          <span className="w-9 h-9 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center no-print">
            <TrendingUp size={16} />
          </span>
        </div>

        {/* TOTAL EXPENSES */}
        <div className="bg-white border border-orange-100 rounded-2xl p-5 shadow-sm shadow-orange-500/[0.02] flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-neutral-400 tracking-wider block uppercase">Total Expenses</span>
            <h2 className="text-2xl font-bold text-neutral-900 font-mono tracking-tight">
              <span className="text-sm font-semibold text-neutral-400 mr-1">RS</span>
              {financialSummary.totalExpensesCost.toLocaleString()}
            </h2>
            <span className="text-[11px] text-neutral-500 block">All outgoing payments</span>
          </div>
          <span className="w-9 h-9 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center no-print">
            <TrendingDown size={16} />
          </span>
        </div>

        {/* NET PROFIT */}
        <div className="bg-orange-500 text-white rounded-2xl p-5 shadow-md shadow-orange-500/10 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-orange-100 tracking-wider block uppercase">Net Earnings</span>
            <h2 className="text-2xl font-bold font-mono tracking-tight">
              <span className="text-sm font-semibold text-orange-200 mr-1">RS</span>
              {financialSummary.takeHomeProfit.toLocaleString()}
            </h2>
            <span className="text-[11px] text-orange-100 block">Avg. Ticket: RS {financialSummary.averageBillValue.toFixed(0)}</span>
          </div>
          <span className="w-9 h-9 rounded-xl bg-white/10 text-white flex items-center justify-center no-print">
            <Receipt size={16} />
          </span>
        </div>

      </div>

      {/* QUICK METRICS BAR */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 print-container shrink-0">
        <div className="bg-white border border-neutral-200/60 rounded-xl p-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-orange-50 text-orange-500 flex items-center justify-center shrink-0"><Receipt size={16} /></div>
          <div>
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">Volume</span>
            <p className="text-sm font-bold text-neutral-800">{financialSummary.totalOrdersCount} Completed Orders</p>
          </div>
        </div>
        
      </div>

      {/* TAB NAVIGATION SECTION */}
      <div className="flex border-b border-neutral-200/80 no-print shrink-0">
        <div className="flex gap-1 bg-neutral-200/50 p-1 rounded-xl">
          {[
            { id: "sales", name: "Sales Logs" },
            { id: "expenses", name: "Expense Logs" },
            { id: "products", name: "Item Performance" }
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`px-4 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                tab === t.id
                  ? "bg-white text-orange-600 shadow-sm"
                  : "text-neutral-500 hover:text-neutral-900"
              }`}
            >
              {t.name}
            </button>
          ))}
        </div>
      </div>

      {/* INDEPENDENT INTERNAL SCROLL REGION */}
      <div className="flex-1 overflow-y-auto min-h-0 pr-1 pb-4 print-container">
        
        {/* TAB 1: SALES TABLE */}
        <div className={`bg-white border border-neutral-200 rounded-2xl p-5 shadow-sm space-y-4 ${tab === "sales" ? "block" : "hidden print:block"}`}>
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-neutral-400 uppercase tracking-widest flex items-center gap-2">
              <Calendar size={14} className="text-orange-500 no-print" />
              <span>Daily Performance Sheet</span>
            </h2> 
          </div>

          <div className="overflow-x-auto border border-neutral-100 rounded-xl">
            <table className="w-full text-left text-xs text-neutral-600 min-w-[600px]">
              <thead className="bg-neutral-50 text-[10px] font-bold text-neutral-400 uppercase tracking-wider border-b border-neutral-100">
                <tr>
                  <th className="p-3.5">Date Date</th>
                  <th className="p-3.5 text-center">Orders Count</th>
                  <th className="p-3.5 text-right">Net Sales</th>
                  <th className="p-3.5 text-right">Tax Value</th>
                  <th className="p-3.5 text-right">Gross Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 font-mono text-xs">
                {paginatedSales.map((s, i) => (
                  <tr key={i} className="hover:bg-neutral-50/50 transition-colors">
                    <td className="p-3.5 font-semibold font-sans text-neutral-800">{s.date}</td>
                    <td className="p-3.5 text-center font-bold text-neutral-700">{s.ordersCount}</td>
                    <td className="p-3.5 text-right text-neutral-700">RS {s.subtotal.toLocaleString()}</td>
                    <td className="p-3.5 text-right text-orange-600">RS {s.tax}</td>
                    <td className="p-3.5 text-right font-bold text-neutral-900">
                      RS {s.total.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between pt-1 no-print">
            <span className="text-[11px] text-neutral-400 font-medium">Showing page {salesPage} of {salesMaxPages}</span>
            <div className="flex gap-1.5">
              <button 
                type="button"
                disabled={salesPage === 1}
                onClick={() => setSalesPage(p => p - 1)}
                className="p-1.5 border border-neutral-200 rounded-lg bg-white hover:bg-neutral-50 disabled:opacity-40 transition-colors"
              >
                <ChevronLeft size={14} />
              </button>
              <button 
                type="button"
                disabled={salesPage === salesMaxPages}
                onClick={() => setSalesPage(p => p + 1)}
                className="p-1.5 border border-neutral-200 rounded-lg bg-white hover:bg-neutral-50 disabled:opacity-40 transition-colors"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* TAB 2: EXPENSES TABLE */}
        <div className={`bg-white border border-neutral-200 rounded-2xl p-5 shadow-sm space-y-4 ${tab === "expenses" ? "block" : "hidden print:block"}`}>
          <div className="space-y-4">
            <h2 className="text-xs font-bold text-neutral-400 uppercase tracking-widest flex items-center gap-2">
              <Briefcase size={14} className="text-orange-500 no-print" />
              <span>Statement of Outgoings</span>
            </h2> 
            <div className="overflow-x-auto border border-neutral-100 rounded-xl">
              <table className="w-full text-left text-xs text-neutral-600 min-w-[600px]">
                <thead className="bg-neutral-50 text-[10px] font-bold text-neutral-400 uppercase tracking-wider border-b border-neutral-100">
                  <tr>
                    <th className="p-3.5">ID / Posting Date</th>
                    <th className="p-3.5">Category Type</th>
                    <th className="p-3.5">Payment Details</th>
                    <th className="p-3.5 text-right">Debit Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 text-xs">
                  {paginatedExpenses.map((e, i) => (
                    <tr key={i} className="hover:bg-neutral-50/50 transition-colors">
                      <td className="p-3.5">
                        <span className="font-mono block text-neutral-400 font-semibold text-[10px]">{e.id}</span>
                        <span className="text-neutral-800 font-semibold">{e.date}</span>
                      </td>
                      <td className="p-3.5 font-bold text-neutral-700">{e.category}</td>
                      <td className="p-3.5 text-neutral-500 font-medium">{e.description}</td>
                      <td className="p-3.5 text-right font-bold font-mono text-neutral-900">
                        RS {e.total.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1 no-print">
            <span className="text-[11px] text-neutral-400 font-medium">Showing page {expensesPage} of {expensesMaxPages}</span>
            <div className="flex gap-1.5">
              <button 
                type="button"
                disabled={expensesPage === 1}
                onClick={() => setExpensesPage(p => p - 1)}
                className="p-1.5 border border-neutral-200 rounded-lg bg-white hover:bg-neutral-50 disabled:opacity-40 transition-colors"
              >
                <ChevronLeft size={14} />
              </button>
              <button 
                type="button"
                disabled={expensesPage === expensesMaxPages}
                onClick={() => setExpensesPage(p => p + 1)}
                className="p-1.5 border border-neutral-200 rounded-lg bg-white hover:bg-neutral-50 disabled:opacity-40 transition-colors"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* TAB 3: PRODUCT METRICS */}
        <div className={`bg-white border border-neutral-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between space-y-4 ${tab === "products" ? "block" : "hidden print:block"}`}>
          <div className="space-y-4">
            <h2 className="text-xs font-bold text-neutral-400 uppercase tracking-widest flex items-center gap-2">
              <Flame size={14} className="text-orange-500 no-print" />
              <span>Volume Breakdown by Product</span>
            </h2> 

            <div className="divide-y divide-neutral-100 border border-neutral-100 rounded-xl overflow-hidden">
              {paginatedProducts.map((p, i) => (
                <div key={i} className="p-4 flex items-center justify-between gap-4 bg-white text-xs hover:bg-neutral-50/30 transition-colors">
                  <div className="space-y-1">
                    <span className="font-bold text-neutral-900 block text-sm">{p.name}</span>
                    <span className="text-[11px] font-medium text-neutral-400 block">
                      Generated Turnover: <strong className="text-neutral-700 font-mono">RS {p.revenue.toLocaleString()}</strong>
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-orange-600 font-mono bg-orange-50 px-3 py-1 text-xs rounded-xl border border-orange-100">
                      {p.sold} units
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between pt-1 no-print">
            <span className="text-[11px] text-neutral-400 font-medium">Showing page {productsPage} of {productsMaxPages}</span>
            <div className="flex gap-1.5">
              <button 
                type="button"
                disabled={productsPage === 1}
                onClick={() => setProductsPage(p => p - 1)}
                className="p-1.5 border border-neutral-200 rounded-lg bg-white hover:bg-neutral-50 disabled:opacity-40 transition-colors"
              >
                <ChevronLeft size={14} />
              </button>
              <button 
                type="button"
                disabled={productsPage === productsMaxPages}
                onClick={() => setProductsPage(p => p + 1)}
                className="p-1.5 border border-neutral-200 rounded-lg bg-white hover:bg-neutral-50 disabled:opacity-40 transition-colors"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
import { useEffect, useState } from "react";
import {
  DollarSign,
  Wallet,
  TrendingUp,
  BarChart3,
  CalendarDays,
  Percent,
  Zap
} from "lucide-react";
import { getReportSummary } from "../api/index.js";

export default function Dashboard() {
  const [dashboardData, setDashboardData] = useState({
    todaySales: 0,
    todayExpenses: 0,
    monthlyRevenue: 0,
    monthlyExpenses: 0,
  });

  useEffect(() => {
    const loadSummary = async () => {
      const now = new Date();
      const startOfDay = new Date(now);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(now);
      endOfDay.setHours(23, 59, 59, 999);

      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

      try {
        const today = await getReportSummary({
          from: startOfDay.toISOString(),
          to: endOfDay.toISOString(),
        });
        const month = await getReportSummary({
          from: startOfMonth.toISOString(),
          to: endOfMonth.toISOString(),
        });

        setDashboardData({
          todaySales: Number(today.totalSales || 0),
          todayExpenses: Number(today.totalExpenses || 0),
          monthlyRevenue: Number(month.totalSales || 0),
          monthlyExpenses: Number(month.totalExpenses || 0),
        });
      } catch (err) {
        setDashboardData((prev) => ({ ...prev }));
      }
    };

    loadSummary();
  }, []);

  const netProfit = dashboardData.todaySales - dashboardData.todayExpenses;
  const monthlyProfit = dashboardData.monthlyRevenue - dashboardData.monthlyExpenses;

  const dailyMargin = dashboardData.todaySales
    ? ((netProfit / dashboardData.todaySales) * 100).toFixed(0)
    : "0";
  const monthlyMargin = dashboardData.monthlyRevenue
    ? ((monthlyProfit / dashboardData.monthlyRevenue) * 100).toFixed(0)
    : "0";

  return (
    <div className="h-screen w-full bg-neutral-50 p-4 md:p-6 flex flex-col overflow-hidden text-neutral-800 antialiased font-sans">
      
      {/* FIXED TOP HEADER SECTION */}
      <div className="bg-neutral-950 rounded-2xl p-5 mb-5 shrink-0 border border-neutral-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-sm">
        <div>
          <div className="inline-flex items-center gap-1 bg-neutral-800 px-2 py-0.5 rounded-full text-[10px] font-bold text-orange-400 uppercase tracking-wider mb-1.5">
            <Zap size={10} className="fill-orange-400/20" /> Performance Console
          </div>
          <h1 className="text-xl font-black tracking-tight text-white">
            Financial Overview
          </h1>
        </div>
        
        <div className="self-start sm:self-auto flex items-center gap-2 bg-neutral-900 border border-neutral-800 px-3 py-1.5 rounded-xl text-xs font-bold text-neutral-300">
          <CalendarDays size={13} className="text-orange-500" />
          <span>Live Session Active</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        </div>
      </div>

      {/* INDEPENDENT SCROLLABLE CONTENT SECTION */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-6 min-h-0 pb-2">
        
        {/* DAILY DECK */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 px-1">
            <div className="h-3 w-1 bg-orange-500 rounded-full" />
            <h2 className="text-[11px] font-bold text-neutral-400 tracking-wider uppercase">
              Today's Floor Operations
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Today Sales */}
            <div className="bg-white rounded-2xl p-5 border border-neutral-200 shadow-sm flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Gross Income</p>
                  <h3 className="text-2xl font-black text-neutral-900 tracking-tight mt-1 flex items-baseline">
                    <span className="text-xs font-bold text-neutral-400 mr-1 font-mono">RS</span>
                    {dashboardData.todaySales.toLocaleString()}
                  </h3>
                </div>
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 shrink-0">
                  <DollarSign size={18} />
                </div>
              </div>
              <div className="mt-4 text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 w-fit px-2 py-0.5 rounded-md">
                +12.4% vs yesterday
              </div>
            </div>

            {/* Today Expenses */}
            <div className="bg-white rounded-2xl p-5 border border-neutral-200 shadow-sm flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Payout Outflows</p>
                  <h3 className="text-2xl font-black text-neutral-900 tracking-tight mt-1 flex items-baseline">
                    <span className="text-xs font-bold text-neutral-400 mr-1 font-mono">RS</span>
                    {dashboardData.todayExpenses.toLocaleString()}
                  </h3>
                </div>
                <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100 shrink-0">
                  <Wallet size={18} />
                </div>
              </div>
              <div className="mt-4 text-[10px] font-bold text-rose-600 bg-rose-50 border border-rose-100 w-fit px-2 py-0.5 rounded-md">
                Supplier payouts out
              </div>
            </div>

            {/* Today Net Profit */}
            <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[10px] font-bold text-orange-100 uppercase tracking-wider opacity-90">Net Daily Yield</p>
                  <h3 className="text-2xl font-black text-white tracking-tight mt-1 flex items-baseline">
                    <span className="text-xs font-bold text-orange-200/70 mr-1 font-mono">RS</span>
                    {netProfit.toLocaleString()}
                  </h3>
                </div>
                <div className="w-10 h-10 rounded-xl bg-white/10 text-white flex items-center justify-center border border-white/20 shrink-0">
                  <TrendingUp size={18} />
                </div>
              </div>
              <div className="mt-4 flex items-center gap-0.5 text-[10px] font-bold text-white bg-black/15 w-fit px-2 py-0.5 rounded-md border border-white/5">
                <Percent size={9} strokeWidth={3} />
                <span>{dailyMargin}% Conversion Margin</span>
              </div>
            </div>
          </div>
        </div>

        {/* MONTHLY DECK */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 px-1">
            <div className="h-3 w-1 bg-purple-500 rounded-full" />
            <h2 className="text-[11px] font-bold text-neutral-400 tracking-wider uppercase">
              Monthly Performance
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Monthly Revenue */}
            <div className="bg-white rounded-2xl p-5 border border-neutral-200 shadow-sm flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Accumulated Revenue</p>
                  <h3 className="text-2xl font-black text-neutral-900 tracking-tight mt-1 flex items-baseline">
                    <span className="text-xs font-bold text-neutral-400 mr-1 font-mono">RS</span>
                    {dashboardData.monthlyRevenue.toLocaleString()}
                  </h3>
                </div>
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100 shrink-0">
                  <BarChart3 size={18} />
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2 text-[10px] font-medium text-neutral-400">
                <div className="w-full bg-neutral-100 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-purple-500 h-full w-[84%] rounded-full" />
                </div>
                <span className="font-bold text-neutral-700 min-w-fit">84% Target</span>
              </div>
            </div>

            {/* Monthly Expenses */}
            <div className="bg-white rounded-2xl p-5 border border-neutral-200 shadow-sm flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Operational Costs</p>
                  <h3 className="text-2xl font-black text-neutral-900 tracking-tight mt-1 flex items-baseline">
                    <span className="text-xs font-bold text-neutral-400 mr-1 font-mono">RS</span>
                    {dashboardData.monthlyExpenses.toLocaleString()}
                  </h3>
                </div>
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100 shrink-0">
                  <Wallet size={18} />
                </div>
              </div>
              <p className="mt-4 text-[10px] font-semibold text-neutral-400 tracking-wide">
                Includes inventory, rent & wages
              </p>
            </div>

            {/* Monthly Net Profit */}
            <div className="bg-white rounded-2xl p-5 border border-neutral-200 shadow-sm flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Retained Profit</p>
                  <h3 className="text-2xl font-black text-neutral-900 tracking-tight mt-1 flex items-baseline">
                    <span className="text-xs font-bold text-neutral-400 mr-1 font-mono">RS</span>
                    {monthlyProfit.toLocaleString()}
                  </h3>
                </div>
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100 shrink-0">
                  <DollarSign size={18} />
                </div>
              </div>
              <div className="mt-4 flex items-center gap-0.5 text-[10px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 w-fit px-2 py-0.5 rounded-md">
                <Percent size={9} strokeWidth={3} />
                <span>{monthlyMargin}% Retention Rate</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
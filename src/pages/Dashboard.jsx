import {
  DollarSign,
  Wallet,
  TrendingUp,
  TrendingDown,
  BarChart3,
  CalendarDays,
  Percent,
  ArrowUpRight,
  ArrowDownRight,
  Zap
} from "lucide-react";

export default function Dashboard() {
  // Master Data Store Object
  const dashboardData = {
    todaySales: 24500,
    todayExpenses: 6200,
    monthlyRevenue: 420000,
    monthlyExpenses: 120000,
  };

  // Derived Financial Computations 
  const netProfit = dashboardData.todaySales - dashboardData.todayExpenses;
  const monthlyProfit = dashboardData.monthlyRevenue - dashboardData.monthlyExpenses;

  // Efficiency margins (Profit / Revenue ratio)
  const dailyMargin = ((netProfit / dashboardData.todaySales) * 100).toFixed(0);
  const monthlyMargin = ((monthlyProfit / dashboardData.monthlyRevenue) * 100).toFixed(0);

  return (
    <div className="space-y-10 max-w-[1400px] mx-auto p-2">
      
      {/* GRAPHIC TOP HEADER SECTION */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-neutral-900 via-neutral-950 to-stone-900 p-6 md:p-8 shadow-xl shadow-neutral-950/20 border border-neutral-800/40">
        {/* Subtle Ambient Backlight Glows */}
        <div className="absolute top-0 right-1/4 w-72 h-72 bg-orange-500/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 right-10 w-48 h-48 bg-amber-500/10 rounded-full blur-[80px] pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-1.5 bg-neutral-800/50 border border-neutral-700/30 px-2.5 py-1 rounded-full text-[10px] font-bold text-orange-400 uppercase tracking-widest mb-3">
              <Zap size={10} className="fill-orange-400/20" /> Performance Console
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white font-sans">
              Financial Overview
            </h1>
            <p className="text-xs md:text-sm text-neutral-400 font-medium mt-1 max-w-xl leading-relaxed">
              Real-time monitoring panel for BiteFlow POS terminal workspace. Review live floor velocity and macro margins.
            </p>
          </div>
          
          {/* DIGITAL DATE CHIP */}
          <div className="self-start md:self-auto flex items-center gap-2.5 bg-neutral-900/80 border border-neutral-800 backdrop-blur-md shadow-inner px-4 py-2.5 rounded-2xl text-xs font-bold text-neutral-300">
            <CalendarDays size={14} className="text-orange-500" />
            <span>Live Session Active</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]" />
          </div>
        </div>
      </div>

      {/* STRATEGIC CONTEXT ROW: THE DAILY OPERATIONAL DECK */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 px-1">
          <div className="h-4 w-1 bg-gradient-to-b from-orange-500 to-amber-500 rounded-full" />
          <h2 className="text-xs font-bold text-neutral-400 tracking-widest uppercase">
            Today's Floor Operations
          </h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Today Sales */}
          <div className="bg-white rounded-3xl p-6 border border-neutral-200/50 shadow-sm hover:shadow-xl hover:shadow-neutral-100/70 hover:border-neutral-300 transition-all duration-300 flex flex-col justify-between group">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">Gross Income</p>
                <h3 className="text-3xl font-black text-neutral-900 tracking-tight mt-2 flex items-baseline">
                  <span className="text-xs font-bold text-neutral-400 mr-1 font-mono">RS</span>
                  {dashboardData.todaySales.toLocaleString()}
                </h3>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 group-hover:scale-110 transition-transform duration-300 shadow-sm shadow-emerald-500/5">
                <DollarSign size={20} />
              </div>
            </div>
            <div className="mt-5 flex items-center gap-1.5 text-[11px] font-bold text-emerald-600 bg-emerald-50/60 border border-emerald-100/50 w-fit px-2 py-0.5 rounded-lg">
              <ArrowUpRight size={12} strokeWidth={3} />
              <span>+12.4% vs yesterday</span>
            </div>
          </div>

          {/* Card 2: Today Expenses */}
          <div className="bg-white rounded-3xl p-6 border border-neutral-200/50 shadow-sm hover:shadow-xl hover:shadow-neutral-100/70 hover:border-neutral-300 transition-all duration-300 flex flex-col justify-between group">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">Payout Outflows</p>
                <h3 className="text-3xl font-black text-neutral-900 tracking-tight mt-2 flex items-baseline">
                  <span className="text-xs font-bold text-neutral-400 mr-1 font-mono">RS</span>
                  {dashboardData.todayExpenses.toLocaleString()}
                </h3>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100 group-hover:scale-110 transition-transform duration-300 shadow-sm shadow-rose-500/5">
                <Wallet size={20} />
              </div>
            </div>
            <div className="mt-5 flex items-center gap-1.5 text-[11px] font-bold text-rose-600 bg-rose-50/60 border border-rose-100/50 w-fit px-2 py-0.5 rounded-lg">
              <ArrowDownRight size={12} strokeWidth={3} />
              <span>Supplier payouts out</span>
            </div>
          </div>

          {/* Card 3: Today Net Profit (PREMIUM HIGHLIGHT BOX) */}
          <div className="bg-gradient-to-br from-orange-500 via-orange-600 to-red-600 rounded-3xl p-6 shadow-xl shadow-orange-500/20 flex flex-col justify-between relative overflow-hidden group">
            {/* Background geometric design texture */}
            <div className="absolute right-0 bottom-0 translate-x-4 translate-y-4 text-white/[0.08] pointer-events-none group-hover:scale-105 transition-transform duration-500">
              <TrendingUp size={160} strokeWidth={1} />
            </div>
            
            <div className="flex items-start justify-between relative z-10">
              <div>
                <p className="text-[11px] font-bold text-orange-100 uppercase tracking-wider opacity-90">Net Daily Yield</p>
                <h3 className="text-3xl font-black text-white tracking-tight mt-2 flex items-baseline">
                  <span className="text-xs font-bold text-orange-200/70 mr-1 font-mono">RS</span>
                  {netProfit.toLocaleString()}
                </h3>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md text-white flex items-center justify-center border border-white/20 shadow-inner">
                <TrendingUp size={20} />
              </div>
            </div>
            
            <div className="mt-5 flex items-center gap-1 text-[11px] font-bold text-white bg-black/15 backdrop-blur-sm w-fit px-2.5 py-0.5 rounded-lg relative z-10 border border-white/5">
              <Percent size={10} strokeWidth={3} />
              <span>{dailyMargin}% Conversion Margin</span>
            </div>
          </div>
        </div>
      </div>

      {/* STRATEGIC CONTEXT ROW: MONTHLY PERFORMANCE DECK */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 px-1">
          <div className="h-4 w-1 bg-gradient-to-b from-purple-500 to-indigo-500 rounded-full" />
          <h2 className="text-xs font-bold text-neutral-400 tracking-widest uppercase">
            Monthly Performance Calendar
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 4: Monthly Revenue */}
          <div className="bg-white rounded-3xl p-6 border border-neutral-200/50 shadow-sm hover:shadow-xl hover:shadow-neutral-100/70 hover:border-neutral-300 transition-all duration-300 flex flex-col justify-between group">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">Accumulated Revenue</p>
                <h3 className="text-3xl font-black text-neutral-900 tracking-tight mt-2 flex items-baseline">
                  <span className="text-xs font-bold text-neutral-400 mr-1 font-mono">RS</span>
                  {dashboardData.monthlyRevenue.toLocaleString()}
                </h3>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100 group-hover:scale-110 transition-transform duration-300">
                <BarChart3 size={20} />
              </div>
            </div>
            <div className="mt-5 text-[11px] font-medium text-neutral-400 flex items-center gap-2">
              <div className="w-full bg-neutral-100 h-1.5 rounded-full overflow-hidden">
                <div className="bg-purple-500 h-full w-[84%] rounded-full" />
              </div>
              <span className="font-bold text-neutral-700 min-w-fit">84% Target</span>
            </div>
          </div>

          {/* Card 5: Monthly Expenses */}
          <div className="bg-white rounded-3xl p-6 border border-neutral-200/50 shadow-sm hover:shadow-xl hover:shadow-neutral-100/70 hover:border-neutral-300 transition-all duration-300 flex flex-col justify-between group">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">Operational Costs</p>
                <h3 className="text-3xl font-black text-neutral-900 tracking-tight mt-2 flex items-baseline">
                  <span className="text-xs font-bold text-neutral-400 mr-1 font-mono">RS</span>
                  {dashboardData.monthlyExpenses.toLocaleString()}
                </h3>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100 group-hover:scale-110 transition-transform duration-300">
                <TrendingDown size={20} />
              </div>
            </div>
            <p className="mt-5 text-[11px] font-semibold text-neutral-400 tracking-wide">
              Includes inventory, rent & employee wages
            </p>
          </div>

          {/* Card 6: Monthly Net Profit */}
          <div className="bg-white rounded-3xl p-6 border border-neutral-200/50 shadow-sm hover:shadow-xl hover:shadow-neutral-100/70 hover:border-neutral-300 transition-all duration-300 flex flex-col justify-between group">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">Retained Profit</p>
                <h3 className="text-3xl font-black text-neutral-900 tracking-tight mt-2 flex items-baseline">
                  <span className="text-xs font-bold text-neutral-400 mr-1 font-mono">RS</span>
                  {monthlyProfit.toLocaleString()}
                </h3>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100 group-hover:scale-110 transition-transform duration-300">
                <DollarSign size={20} />
              </div>
            </div>
            <div className="mt-5 flex items-center gap-1.5 text-[11px] font-bold text-indigo-600 bg-indigo-50/60 border border-indigo-100/50 w-fit px-2 py-0.5 rounded-lg">
              <Percent size={10} strokeWidth={3} />
              <span>{monthlyMargin}% Conversion Retention Rate</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
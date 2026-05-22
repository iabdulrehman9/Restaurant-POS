import { useState } from "react";
import Sidebar from "../components/Sidebar";
import { Outlet } from "react-router-dom";
import { Menu, Bell, Clock } from "lucide-react";

export default function AdminLayout() {
  // Default to open on desktop screens, easily collapsible
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="min-h-screen bg-[#fcfbfa] text-stone-800 font-sans antialiased flex">
      
      {/* PERSISTENT BRAND SIDEBAR PANEL */}
      <Sidebar
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />

      {/* DYNAMIC MASTER MAIN CANVAS PANEL */}
      <div 
        className={`flex-1 flex flex-col min-w-0 min-h-screen transition-all duration-300 ease-in-out ${
          isOpen ? "md:pl-72" : "pl-0"
        }`}
      >
        
        {/* PREMIUM FIXED TOP HEADER BAR CONTAINER */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-stone-200/60 px-6 h-16 flex items-center justify-between">
          
          {/* HEADER LEFT ACTION PACK */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsOpen(!isOpen)} // Smart layout Toggle Switch
              className="p-2 text-stone-600 hover:text-orange-600 hover:bg-orange-50 rounded-xl border border-stone-200/60 hover:border-orange-200/60 bg-white transition-all duration-200 shadow-sm active:scale-95 outline-none"
              title={isOpen ? "Collapse Menu" : "Expand Menu"}
            >
              <Menu size={16} className={`transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
            </button>

            <div>
              <h1 className="font-bold text-sm tracking-tight text-stone-900 md:text-base">
                Terminal Workspace
              </h1>
              <p className="hidden md:flex items-center gap-1 text-[10px] text-stone-400 font-semibold tracking-wider uppercase -mt-0.5">
                <Clock size={10} /> Live Session Active
              </p>
            </div>
          </div>

          {/* HEADER RIGHT STATUS ACTIONS UTILITY REGION */}
          <div className="flex items-center gap-3">
            
            {/* AMBIENT SYSTEM ALERTS BUTTON */}
            <button className="relative p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-50 rounded-xl transition-colors outline-none">
              <Bell size={16} />
              <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-orange-500 rounded-full ring-2 ring-white" />
            </button>

            <div className="h-6 w-[1px] bg-stone-200" />

            {/* DYNAMIC METRIC STATUS CHIP CONTAINER */}
            <div className="flex items-center gap-2 bg-stone-100/80 border border-stone-200/20 px-3 py-1 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[11px] font-bold text-stone-600 uppercase tracking-wider">
                Server Online
              </span>
            </div>
          </div>
        </header>

        {/* COMPONENT INTERFACE PAGE CANVAS OUTPUT VIEWPORT */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 animate-fadeIn max-w-[1600px] w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
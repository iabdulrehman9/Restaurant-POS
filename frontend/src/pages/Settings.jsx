import { useEffect, useState } from "react";
import { 
  Building2, Receipt, Percent, Printer, 
  Armchair, Utensils, ShieldCheck, Settings2, 
  Database, UserCheck, Save, RefreshCw, Upload
} from "lucide-react";
import { getSettings, updateSettings, backupDatabase, restoreDatabase } from "../api/index.js";

export default function Settings() {
  const [tab, setTab] = useState("business");
  const [backupMessage, setBackupMessage] = useState("");

  const handleBackup = async () => {
    try {
      const result = await backupDatabase();
      setBackupMessage(`Backup saved: ${result.filename}`);
    } catch (err) {
      setBackupMessage(err.message || "Backup failed");
    }
  };

  const handleRestore = async () => {
    const backupPath = window.prompt("Enter full path to backup file in the backups folder:");
    if (!backupPath) return;
    try {
      const result = await restoreDatabase(backupPath);
      setBackupMessage(result.message || "Restore complete. Restart the application.");
    } catch (err) {
      setBackupMessage(err.message || "Restore failed");
    }
  };

  const [settings, setSettings] = useState({
    name: "Crispy House Café",
    logo: "",
    address: "Main Commercial Market, Block C, Lahore",
    phone: "+92 300 1234567",
    email: "info@crispyhouse.com",
    currency: "PKR",
    timezone: "Asia/Karachi",

    invoicePrefix: "CH-",
    invoiceStart: 1001,
    billFormat: "detailed",
    showLogo: true,
    showTax: true,
    footer: "Thank you for dining with us! Visit again.",

    tax: 5,
    serviceCharge: 2,
    discountType: "percentage",
    manualDiscount: true,

    printerType: "Thermal Network",
    paperSize: "80mm",
    autoPrint: true,
    kotPrint: true,
    copies: 1,

    tables: 12,
    layout: "grid",
    autoOpenBill: true,

    categoryDefault: "Burger",
    imageRequired: false,
    barcode: false,
    stockTracking: true,

    roles: ["Admin", "Manager", "Cashier", "Waitstaff"],

    theme: "light",
    language: "en",
    autoLogout: 30,
    sound: true,

    pinLogin: true,
    activityLog: true,
  });

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const data = await getSettings();
        if (data.settings) {
          setSettings((prev) => ({ ...prev, ...data.settings }));
        }
      } catch (err) {
        setSettings((prev) => ({ ...prev }));
      }
    };

    loadSettings();
  }, []);

  const update = (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateSettings(settings);
      alert("Configuration keys flushed and saved successfully!");
    } catch (err) {
      alert(err.message || "Unable to save settings.");
    } finally {
      setIsSaving(false);
    }
  };

  // Tab schema mapping to keep things highly readable and clean
  const tabConfig = [
    { id: "business", label: "Business Profile", icon: Building2 },
    { id: "billing", label: "Receipt & Billing", icon: Receipt },
    { id: "tax", label: "Taxes & Fees", icon: Percent },
    { id: "printer", label: "Hardware Printer", icon: Printer },
    { id: "tables", label: "Table Layouts", icon: Armchair },
    { id: "products", label: "Product Controls", icon: Utensils },
    { id: "system", label: "System Config", icon: Settings2 },
    { id: "security", label: "Access & Security", icon: ShieldCheck },
    { id: "backup", label: "Database Backup", icon: Database },
  ];

  return (
    <div className="max-w-[1400px] mx-auto space-y-6 antialiased">
      
      {/* MODULE MAIN HERO BAR */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-neutral-200 pb-5">
        <div>
          <h1 className="text-2xl font-extrabold text-neutral-950 tracking-tight flex items-center gap-2">
            System Configuration
          </h1>
          <p className="text-xs font-medium text-neutral-500 mt-0.5">
            Manage your store environment variables, hardware peripherals, and fiscal rules.
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="w-full sm:w-auto bg-neutral-900 hover:bg-neutral-950 text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50"
        >
          {isSaving ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
          <span>{isSaving ? "Saving Variables..." : "Save Changes"}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        
        {/* NAV SEGMENT MATRIX */}
        <div className="bg-white border border-neutral-200 rounded-2xl p-2 shadow-sm flex flex-row lg:flex-col overflow-x-auto lg:overflow-x-visible gap-1 scrollbar-none">
          {tabConfig.map((t) => {
            const IconComponent = t.icon;
            const isSelected = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-2.5 px-4 py-3 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-150 text-left w-auto lg:w-full ${
                  isSelected
                    ? "bg-neutral-900 text-white shadow-sm"
                    : "text-neutral-500 hover:text-neutral-900 hover:bg-neutral-50"
                }`}
              >
                <IconComponent size={16} className={isSelected ? "text-white" : "text-neutral-400"} />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* WORKSPACE REGION */}
        <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-sm lg:col-span-3 min-h-[480px]">
          
          {/* BUSINESS SECTION */}
          {tab === "business" && (
            <div className="space-y-5">
              <h3 className="text-sm font-bold text-neutral-900 border-b pb-2">Store Identity</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="block space-y-1.5">
                  <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">Restaurant Name</span>
                  <input className="w-full border border-neutral-200 focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 rounded-xl px-3 py-2 text-xs font-medium text-neutral-800 bg-neutral-50/30 outline-none transition-all" value={settings.name} onChange={(e) => update("name", e.target.value)} />
                </label>
                <label className="block space-y-1.5">
                  <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">Contact Phone</span>
                  <input className="w-full border border-neutral-200 focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 rounded-xl px-3 py-2 text-xs font-medium text-neutral-800 bg-neutral-50/30 outline-none transition-all" value={settings.phone} onChange={(e) => update("phone", e.target.value)} />
                </label>
                <label className="block space-y-1.5 md:col-span-2">
                  <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">Physical Address</span>
                  <input className="w-full border border-neutral-200 focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 rounded-xl px-3 py-2 text-xs font-medium text-neutral-800 bg-neutral-50/30 outline-none transition-all" value={settings.address} onChange={(e) => update("address", e.target.value)} />
                </label>
                <label className="block space-y-1.5">
                  <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">E-mail</span>
                  <input className="w-full border border-neutral-200 focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 rounded-xl px-3 py-2 text-xs font-medium text-neutral-800 bg-neutral-50/30 outline-none transition-all" value={settings.email} onChange={(e) => update("email", e.target.value)} />
                </label>
                <label className="block space-y-1.5">
                  <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">Base Currency Target</span>
                  <select className="w-full border border-neutral-200 focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 rounded-xl px-3 py-2 text-xs font-semibold text-neutral-800 bg-neutral-50/30 outline-none transition-all" value={settings.currency} onChange={(e) => update("currency", e.target.value)}>
                    <option value="PKR">PKR (Rs)</option>
                    <option value="USD">USD ($)</option>
                  </select>
                </label>
              </div>
              <div className="pt-4">
                <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider block mb-2">Brand Identity Logo</span>
                <div className="border-2 border-dashed border-neutral-200 rounded-2xl p-6 flex flex-col items-center justify-center bg-neutral-50/30 hover:bg-neutral-50/80 transition-all cursor-pointer">
                  <Upload size={24} className="text-neutral-400 mb-2" />
                  <span className="text-xs font-bold text-neutral-700">Upload Logo Image File</span>
                  <span className="text-[10px] text-neutral-400 mt-0.5">PNG or JPG formats up to 2MB capacity</span>
                </div>
              </div>
            </div>
          )}

          {/* BILLING SECTION */}
          {tab === "billing" && (
            <div className="space-y-5">
              <h3 className="text-sm font-bold text-neutral-900 border-b pb-2">Receipt Token Properties</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="block space-y-1.5">
                  <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">Invoice Prefix String</span>
                  <input className="w-full border border-neutral-200 rounded-xl px-3 py-2 text-xs font-medium text-neutral-800 bg-neutral-50/30 outline-none" value={settings.invoicePrefix} onChange={(e) => update("invoicePrefix", e.target.value)} />
                </label>
                <label className="block space-y-1.5">
                  <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">Auto-Increment Baseline</span>
                  <input type="number" className="w-full border border-neutral-200 rounded-xl px-3 py-2 text-xs font-medium text-neutral-800 bg-neutral-50/30 outline-none" value={settings.invoiceStart} onChange={(e) => update("invoiceStart", parseInt(e.target.value))} />
                </label>
                <label className="block space-y-1.5">
                  <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">Layout Template Schema</span>
                  <select className="w-full border border-neutral-200 rounded-xl px-3 py-2 text-xs font-semibold text-neutral-800 bg-neutral-50/30 outline-none" value={settings.billFormat} onChange={(e) => update("billFormat", e.target.value)}>
                    <option value="simple">Simple Token (Fast Render)</option>
                    <option value="detailed">Detailed Matrix Layout</option>
                  </select>
                </label>
                <label className="block space-y-1.5 md:col-span-2">
                  <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">Footer Greeting String</span>
                  <input className="w-full border border-neutral-200 rounded-xl px-3 py-2 text-xs font-medium text-neutral-800 bg-neutral-50/30 outline-none" value={settings.footer} onChange={(e) => update("footer", e.target.value)} />
                </label>
              </div>

              <div className="pt-4 space-y-3">
                <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider block">Visual Layout Toggles</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="flex items-center gap-3 border border-neutral-200 rounded-xl p-3 hover:bg-neutral-50/50 transition-all cursor-pointer">
                    <input type="checkbox" className="w-4 h-4 rounded text-neutral-900 border-neutral-300 focus:ring-neutral-900" checked={settings.showLogo} onChange={(e) => update("showLogo", e.target.checked)} />
                    <span className="text-xs font-semibold text-neutral-700">Render Brand Logo on Bill Head</span>
                  </label>
                  <label className="flex items-center gap-3 border border-neutral-200 rounded-xl p-3 hover:bg-neutral-50/50 transition-all cursor-pointer">
                    <input type="checkbox" className="w-4 h-4 rounded text-neutral-900 border-neutral-300 focus:ring-neutral-900" checked={settings.showTax} onChange={(e) => update("showTax", e.target.checked)} />
                    <span className="text-xs font-semibold text-neutral-700">Display Tax Calculation Ledger Row</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* TAX SECTION */}
          {tab === "tax" && (
            <div className="space-y-5">
              <h3 className="text-sm font-bold text-neutral-900 border-b pb-2">Fiscal & Discount Architecture</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="block space-y-1.5">
                  <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">Standard Tax Rate (%)</span>
                  <input type="number" className="w-full border border-neutral-200 rounded-xl px-3 py-2 text-xs font-medium text-neutral-800 bg-neutral-50/30 outline-none" value={settings.tax} onChange={(e) => update("tax", parseFloat(e.target.value))} />
                </label>
                <label className="block space-y-1.5">
                  <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">Service Charge Rate (%)</span>
                  <input type="number" className="w-full border border-neutral-200 rounded-xl px-3 py-2 text-xs font-medium text-neutral-800 bg-neutral-50/30 outline-none" value={settings.serviceCharge} onChange={(e) => update("serviceCharge", parseFloat(e.target.value))} />
                </label>
                <label className="block space-y-1.5">
                  <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">Discount Strategy Group</span>
                  <select className="w-full border border-neutral-200 rounded-xl px-3 py-2 text-xs font-semibold text-neutral-800 bg-neutral-50/30 outline-none" value={settings.discountType} onChange={(e) => update("discountType", e.target.value)}>
                    <option value="percentage">Percentage Allocation</option>
                    <option value="fixed">Fixed Currency Deduction</option>
                  </select>
                </label>
              </div>
            </div>
          )}

          {/* PRINTER SECTION */}
          {tab === "printer" && (
            <div className="space-y-5">
              <h3 className="text-sm font-bold text-neutral-900 border-b pb-2">Hardware & Peripheral Mappings</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="block space-y-1.5">
                  <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">Connection Protocol Port</span>
                  <select className="w-full border border-neutral-200 rounded-xl px-3 py-2 text-xs font-semibold text-neutral-800 bg-neutral-50/30 outline-none" value={settings.printerType} onChange={(e) => update("printerType", e.target.value)}>
                    <option value="USB">USB Core Protocol</option>
                    <option value="Bluetooth">Bluetooth Wireless Radio</option>
                    <option value="Network">Thermal Network (LAN IP Explicit)</option>
                  </select>
                </label>
                <label className="block space-y-1.5">
                  <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">Paper Canvas Size</span>
                  <select className="w-full border border-neutral-200 rounded-xl px-3 py-2 text-xs font-semibold text-neutral-800 bg-neutral-50/30 outline-none" value={settings.paperSize} onChange={(e) => update("paperSize", e.target.value)}>
                    <option value="80mm">80mm Standard Desktop Thermal</option>
                    <option value="58mm">58mm Mobile Terminal Spool</option>
                  </select>
                </label>
              </div>
              <div className="pt-4 space-y-3">
                <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider block">Automation Event Handlers</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="flex items-center gap-3 border border-neutral-200 rounded-xl p-3 hover:bg-neutral-50/50 transition-all cursor-pointer">
                    <input type="checkbox" className="w-4 h-4 rounded text-neutral-900 border-neutral-300 focus:ring-neutral-900" checked={settings.autoPrint} onChange={(e) => update("autoPrint", e.target.checked)} />
                    <span className="text-xs font-semibold text-neutral-700">Auto-Print Bill upon Settlement Check</span>
                  </label>
                  <label className="flex items-center gap-3 border border-neutral-200 rounded-xl p-3 hover:bg-neutral-50/50 transition-all cursor-pointer">
                    <input type="checkbox" className="w-4 h-4 rounded text-neutral-900 border-neutral-300 focus:ring-neutral-900" checked={settings.kotPrint} onChange={(e) => update("kotPrint", e.target.checked)} />
                    <span className="text-xs font-semibold text-neutral-700">Auto-Spool KOT Order to Kitchen Hub</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* TABLES SECTION */}
          {tab === "tables" && (
            <div className="space-y-5">
              <h3 className="text-sm font-bold text-neutral-900 border-b pb-2">Floor Arrangement Controls</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="block space-y-1.5">
                  <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">Total Table Capacities</span>
                  <input type="number" className="w-full border border-neutral-200 rounded-xl px-3 py-2 text-xs font-medium text-neutral-800 bg-neutral-50/30 outline-none" value={settings.tables} onChange={(e) => update("tables", parseInt(e.target.value))} />
                </label>
                <label className="block space-y-1.5">
                  <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">POS Layout Projection View</span>
                  <select className="w-full border border-neutral-200 rounded-xl px-3 py-2 text-xs font-semibold text-neutral-800 bg-neutral-50/30 outline-none" value={settings.layout} onChange={(e) => update("layout", e.target.value)}>
                    <option value="grid">Dense Uniform Matrix Grid</option>
                    <option value="zone">Categorized Sectional Zones</option>
                  </select>
                </label>
              </div>
            </div>
          )}

          {/* PRODUCTS SECTION */}
          {tab === "products" && (
            <div className="space-y-5">
              <h3 className="text-sm font-bold text-neutral-900 border-b pb-2">Catalog Inventory Enforcements</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="flex items-center gap-3 border border-neutral-200 rounded-xl p-3 hover:bg-neutral-50/50 transition-all cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 rounded text-neutral-900 border-neutral-300 focus:ring-neutral-900" checked={settings.imageRequired} onChange={(e) => update("imageRequired", e.target.checked)} />
                  <span className="text-xs font-semibold text-neutral-700">Enforce Asset Image Block on Creation</span>
                </label>
                <label className="flex items-center gap-3 border border-neutral-200 rounded-xl p-3 hover:bg-neutral-50/50 transition-all cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 rounded text-neutral-900 border-neutral-300 focus:ring-neutral-900" checked={settings.stockTracking} onChange={(e) => update("stockTracking", e.target.checked)} />
                  <span className="text-xs font-semibold text-neutral-700">Enable Active Real-time Stock Tracking</span>
                </label>
              </div>
            </div>
          )}

          {/* ROLES SECTION */}
          {tab === "roles" && (
            <div className="space-y-5">
              <h3 className="text-sm font-bold text-neutral-900 border-b pb-2">User Authorization Scopes</h3>
              <div className="flex flex-wrap gap-2">
                {settings.roles.map((role, idx) => (
                  <div key={idx} className="flex items-center gap-1.5 bg-neutral-100 border border-neutral-200 rounded-xl px-3 py-1.5 text-xs font-bold text-neutral-700 shadow-sm">
                    <UserCheck size={13} className="text-neutral-500" />
                    <span>{role}</span>
                  </div>
                ))}
              </div>
              <p className="text-[11px] font-medium text-neutral-400 mt-2">
                Role modifications require master system owner clearance levels.
              </p>
            </div>
          )}

          {/* SYSTEM SECTION */}
          {tab === "system" && (
            <div className="space-y-5">
              <h3 className="text-sm font-bold text-neutral-900 border-b pb-2">Application Properties</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="block space-y-1.5">
                  <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">UI Theme Layer</span>
                  <select className="w-full border border-neutral-200 rounded-xl px-3 py-2 text-xs font-semibold text-neutral-800 bg-neutral-50/30 outline-none" value={settings.theme} onChange={(e) => update("theme", e.target.value)}>
                    <option value="light">Classic Clean Light Environment</option>
                    <option value="dark">High-Contrast Low Light Variant</option>
                  </select>
                </label>
                <label className="block space-y-1.5">
                  <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">Language Dictionary Pack</span>
                  <select className="w-full border border-neutral-200 rounded-xl px-3 py-2 text-xs font-semibold text-neutral-800 bg-neutral-50/30 outline-none" value={settings.language} onChange={(e) => update("language", e.target.value)}>
                    <option value="en">English (US Standard)</option>
                    <option value="ur">Urdu Locale (اردو)</option>
                  </select>
                </label>
              </div>
            </div>
          )}

          {/* SECURITY SECTION */}
          {tab === "security" && (
            <div className="space-y-5">
              <h3 className="text-sm font-bold text-neutral-900 border-b pb-2">Security Enforcement Thresholds</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="flex items-center gap-3 border border-neutral-200 rounded-xl p-3 hover:bg-neutral-50/50 transition-all cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 rounded text-neutral-900 border-neutral-300 focus:ring-neutral-900" checked={settings.pinLogin} onChange={(e) => update("pinLogin", e.target.checked)} />
                  <span className="text-xs font-semibold text-neutral-700">Enforce Quick 4-Digit Security PIN Login</span>
                </label>
                <label className="flex items-center gap-3 border border-neutral-200 rounded-xl p-3 hover:bg-neutral-50/50 transition-all cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 rounded text-neutral-900 border-neutral-300 focus:ring-neutral-900" checked={settings.activityLog} onChange={(e) => update("activityLog", e.target.checked)} />
                  <span className="text-xs font-semibold text-neutral-700">Spool System Modifications to Activity Log</span>
                </label>
              </div>
            </div>
          )}

          {/* BACKUP SECTION */}
          {tab === "backup" && (
            <div className="space-y-5">
              <h3 className="text-sm font-bold text-neutral-900 border-b pb-2">Disaster Recovery & Redundancy</h3>
              <p className="text-xs text-neutral-500 leading-relaxed">
                Exporting your snapshot captures entire transactional journals, physical logs, and stock indices into a clean, unencrypted binary manifest file.
              </p>
              {backupMessage && (
                <p className="text-xs font-semibold text-neutral-600">{backupMessage}</p>
              )}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleBackup}
                  className="bg-neutral-900 hover:bg-neutral-950 text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow-sm transition-all active:scale-[0.98]"
                >
                  Export Local SQL Dump File
                </button>
                <button
                  type="button"
                  onClick={handleRestore}
                  className="bg-white hover:bg-neutral-50 text-neutral-700 font-semibold text-xs px-4 py-2.5 rounded-xl border border-neutral-200 shadow-sm transition-all active:scale-[0.98]"
                >
                  Restore Target Backup Manifest
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
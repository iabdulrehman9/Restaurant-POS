import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { Eye, EyeOff, Lock, Mail, UtensilsCrossed } from "lucide-react";

export default function SignUp() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (error) setError(""); // Instantly clear error alerts when they type
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!form.email || !form.password) {
      return setError("Email and security password fields are required.");
    }

    setIsLoading(true);
    setError("");

    login(form.email, form.password)
      .then((data) => {
        if (data.requirePasswordChange) {
          alert("Default password detected. Please change your password in Settings > Users before continuing.");
          navigate("/settings");
          return;
        }
        navigate("/");
      })
      .catch((err) => {
        setError(err.message || "Login failed");
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 px-4 antialiased">
      <div className="w-full max-w-md bg-white border border-neutral-200 p-6 md:p-8 rounded-2xl shadow-sm space-y-6">
        
        {/* APP BRAND HEADER */}
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-neutral-950 text-white flex items-center justify-center shadow-sm">
            <UtensilsCrossed size={22} />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-neutral-950 tracking-tight">
              Restaurant POS Terminal
            </h1>
            <p className="text-xs font-semibold text-neutral-400 mt-0.5">
              Provide authorized credentials to open shift sessions
            </p>
          </div>
        </div>

        {/* INLINE ERROR MESSAGES */}
        {error && (
          <div className="bg-rose-50 border border-rose-100 text-rose-600 text-xs font-semibold px-4 py-3 rounded-xl transition-all duration-150">
            {error}
          </div>
        )}

        {/* INTERACTIVE FORM PLATFORM */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* EMAIL INPUT CONTAINER */}
          <label className="block space-y-1.5">
            <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
              Email Address
            </span>
            <div className="relative flex items-center">
              <Mail size={16} className="absolute left-3.5 text-neutral-400 pointer-events-none" />
              <input
                type="email"
                name="email"
                placeholder="manager@restaurant.com"
                value={form.email}
                onChange={handleChange}
                className="w-full border border-neutral-200 focus:border-neutral-950 focus:ring-1 focus:ring-neutral-950 rounded-xl pl-10 pr-4 py-2.5 text-xs font-medium text-neutral-800 bg-neutral-50/20 outline-none transition-all"
              />
            </div>
          </label>

          {/* PASSWORD INPUT CONTAINER */}
          <label className="block space-y-1.5">
            <div className="flex justify-between items-center">
              <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
                Security Password
              </span>
              <span className="text-[11px] font-bold text-zinc-500 hover:text-neutral-950 cursor-pointer transition-colors">
                Forgot password?
              </span>
            </div>
            <div className="relative flex items-center">
              <Lock size={16} className="absolute left-3.5 text-neutral-400 pointer-events-none" />
              <input
                type={showPass ? "text" : "password"}
                name="password"
                placeholder="••••••••"
                value={form.password}
                onChange={handleChange}
                className="w-full border border-neutral-200 focus:border-neutral-950 focus:ring-1 focus:ring-neutral-950 rounded-xl pl-10 pr-10 py-2.5 text-xs font-medium text-neutral-800 bg-neutral-50/20 outline-none transition-all font-mono"
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-3 text-neutral-400 hover:text-neutral-700 transition-colors focus:outline-none"
              >
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </label>

          {/* COMPILATION ACTION SUBMIT BUTTON */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-neutral-900 hover:bg-neutral-950 text-white font-bold text-xs p-3 rounded-xl shadow-sm transition-all active:scale-[0.99] disabled:opacity-50 pt-3.5 pb-3.5 mt-2"
          >
            {isLoading ? "Authenticating Session Keys..." : "Verify & Sign In"}
          </button>
        </form>

        {/* SYSTEM ENROLLMENT REGISTRATION FOOTER */}
        <p className="text-center text-xs font-semibold text-neutral-400 pt-2">
          New terminal setup?{" "}
          <span className="text-zinc-600 hover:text-neutral-950 underline underline-offset-2 cursor-pointer transition-colors">
            Register store node
          </span>
        </p>

      </div>
    </div>
  );
}
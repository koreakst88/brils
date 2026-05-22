import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useTranslation } from "../i18n";
import { supabase } from "../lib/supabase";
import { Shield, MessageSquare, AlertCircle } from "lucide-react";

export function Login() {
  const { user, loading } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  useEffect(() => {
    if (user && !loading) {
      navigate("/admin/dashboard");
    }
  }, [user, loading, navigate]);

  const handleTelegramLogin = async () => {
    setAuthLoading(true);
    setErrorMsg(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "telegram" as any,
        options: {
          redirectTo: `${window.location.origin}/admin/dashboard`,
        },
      });
      if (error) throw error;
    } catch (err: any) {
      console.error("Login error:", err);
      setErrorMsg(err.message || "Failed to initiate Telegram login");
      setAuthLoading(false);
    }
  };

  const handleDemoLogin = (role: "admin" | "owner") => {
    localStorage.setItem(
      "demo_user",
      JSON.stringify({
        id: "demo-admin-id",
        email: "admin@demo.local",
        role,
      })
    );
    window.location.href = "/admin/dashboard";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center font-sans">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-white mx-auto" />
          <p className="text-slate-400 text-sm font-semibold">{t("login.initializing")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 font-sans antialiased">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(113,113,122,0.1),transparent_40%),radial-gradient(circle_at_bottom_left,rgba(30,41,59,0.2),transparent_50%)] pointer-events-none" />

      <div className="w-full max-w-md bg-slate-900 border border-slate-800 p-8 rounded-3xl shadow-2xl space-y-8 relative z-10">
        <div className="text-center space-y-2">
          <span className="inline-flex h-12 w-12 rounded-2xl bg-white text-slate-950 items-center justify-center font-black text-2xl shadow-lg">
            B
          </span>
          <h2 className="text-2xl font-bold tracking-tight text-white mt-4 font-sans">{t("login.title")}</h2>
          <p className="text-slate-400 text-sm">{t("login.subtitle")}</p>
        </div>

        {errorMsg && (
          <div className="bg-red-950/50 border border-red-800 text-red-200 p-4 rounded-xl flex items-start gap-2.5 text-xs font-semibold leading-relaxed">
            <AlertCircle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="space-y-4">
          <button
            onClick={handleTelegramLogin}
            disabled={authLoading}
            className="w-full bg-[#54a9eb] hover:bg-[#4399db] disabled:bg-slate-800 text-white font-bold py-3.5 px-4 rounded-xl transition-all shadow-md flex items-center justify-center gap-3 text-sm"
          >
            <MessageSquare size={18} />
            <span>{authLoading ? t("login.connecting") : t("login.telegram_button")}</span>
          </button>

          <div className="relative my-6 pt-2">
            <div className="absolute inset-0 flex items-center" aria-hidden="true">
              <div className="w-full border-t border-slate-800"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-slate-900 px-2 text-slate-500 font-bold tracking-wider">
                DEVELOPMENT HELPERS
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => handleDemoLogin("admin")}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold py-3 px-4 rounded-xl transition-all border border-slate-700 hover:border-slate-600 text-xs shadow-sm"
            >
              Sign In as Admin
            </button>
            <button
              onClick={() => handleDemoLogin("owner")}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold py-3 px-4 rounded-xl transition-all border border-slate-700 hover:border-slate-600 text-xs shadow-sm"
            >
              Sign In as Owner
            </button>
          </div>
        </div>

        <div className="flex items-center justify-center gap-1.5 text-slate-500 text-xs">
          <Shield size={12} />
          <span>{t("login.ssl_encrypted")}</span>
        </div>
      </div>
    </div>
  );
}

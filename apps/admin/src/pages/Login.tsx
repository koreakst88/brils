import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";
import { Shield, MessageSquare, AlertCircle } from "lucide-react";

export function Login() {
  const { user, loading } = useAuth();
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

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center font-sans">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-white mx-auto" />
          <p className="text-slate-400 text-sm font-semibold">Initializing Security Systems...</p>
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
          <h2 className="text-2xl font-bold tracking-tight text-white mt-4 font-sans">Brils Admin Panel</h2>
          <p className="text-slate-400 text-sm">Secure sign-in for administrators and owners</p>
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
            <span>{authLoading ? "Connecting..." : "Войти через Telegram"}</span>
          </button>
        </div>

        <div className="flex items-center justify-center gap-1.5 text-slate-500 text-xs">
          <Shield size={12} />
          <span>SSL Encrypted Connection</span>
        </div>
      </div>
    </div>
  );
}

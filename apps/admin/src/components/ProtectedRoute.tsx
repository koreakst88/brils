import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useTranslation } from "../i18n";
import { ShieldAlert, LogOut } from "lucide-react";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, role, loading, signOut } = useAuth();
  const { t } = useTranslation();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex items-center justify-center font-sans">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-slate-950 mx-auto" />
          <p className="text-slate-500 text-sm font-semibold">{t("protected.loading")}</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (role !== "admin" && role !== "owner") {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 font-sans antialiased">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(220,38,38,0.05),transparent_40%),radial-gradient(circle_at_bottom_left,rgba(30,41,59,0.2),transparent_50%)] pointer-events-none" />

        <div className="w-full max-w-md bg-slate-900 border border-red-950/80 p-8 rounded-3xl shadow-2xl space-y-6 text-center relative z-10">
          <div className="inline-flex h-16 w-16 rounded-2xl bg-red-950/50 border border-red-800 text-red-500 items-center justify-center mb-2">
            <ShieldAlert size={32} />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold tracking-tight text-white font-sans">{t("protected.access_denied")}</h2>
            <p className="text-slate-400 text-sm leading-relaxed">
              {t("protected.access_denied_desc")}
            </p>
          </div>

          {user.email && (
            <div className="bg-slate-800/40 p-3.5 rounded-xl border border-slate-800 text-xs font-mono text-slate-400 truncate">
              {t("protected.identity")}: {user.email} ({t("protected.role")}: {role || "none"})
            </div>
          )}

          <button
            onClick={() => signOut()}
            className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-3.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 text-sm"
          >
            <LogOut size={16} />
            <span>{t("protected.sign_out_switch")}</span>
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

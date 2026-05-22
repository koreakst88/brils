import React, { useMemo } from "react";
import { useTranslation } from "../i18n";
import { useAdminStore } from "../store/useAdminStore";
import { supabase } from "../lib/supabase";
import { useQuery } from "@tanstack/react-query";
import { Search, Info, CheckCircle2, AlertTriangle, XCircle, Clock } from "lucide-react";

type ActivityRow = {
  id: string;
  user_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string;
  details: any;
  created_at: string;
};

type ActivityView = ActivityRow & { actor_name: string };

async function fetchActivity(): Promise<ActivityView[]> {
  const { data, error } = await supabase
    .from("activity_log")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) throw error;
  const rows = (data ?? []) as ActivityRow[];

  const userIds = Array.from(new Set(rows.map((r) => r.user_id).filter(Boolean))) as string[];
  const names: Record<string, string> = {};
  if (userIds.length > 0) {
    const { data: usersData, error: usersError } = await supabase
      .from("users")
      .select("id, name")
      .in("id", userIds);
    if (usersError) throw usersError;
    for (const u of usersData ?? []) {
      names[u.id] = u.name || "";
    }
  }

  return rows.map((r) => ({
    ...r,
    actor_name: r.user_id ? (names[r.user_id] || "Unknown") : "System",
  }));
}

function inferSeverity(action: string): "success" | "warning" | "error" | "info" {
  const a = action.toLowerCase();
  if (a.includes("error") || a.includes("failed") || a.includes("ошиб")) return "error";
  if (a.includes("warning") || a.includes("warn") || a.includes("вниман")) return "warning";
  if (a.includes("created") || a.includes("updated") || a.includes("success") || a.includes("успеш")) return "success";
  return "info";
}

export function Activity() {
  const { t } = useTranslation();
  const { filters, setFilters } = useAdminStore();

  const { data: logs = [], isLoading, isError, refetch } = useQuery({
    queryKey: ["activity_log"],
    queryFn: fetchActivity,
  });

  const filteredLogs = useMemo(() => {
    const q = filters.search.toLowerCase();
    return logs.filter((log) => {
      const matchesSearch =
        log.actor_name.toLowerCase().includes(q) ||
        log.action.toLowerCase().includes(q) ||
        log.id.toLowerCase().includes(q);
      const matchesType = filters.status === "all" || log.entity_type === filters.status;
      return matchesSearch && matchesType;
    });
  }, [logs, filters.search, filters.status]);

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "success":
        return <CheckCircle2 size={16} className="text-emerald-500" />;
      case "warning":
        return <AlertTriangle size={16} className="text-amber-500" />;
      case "error":
        return <XCircle size={16} className="text-red-500" />;
      default:
        return <Info size={16} className="text-blue-500" />;
    }
  };

  const getSeverityStyle = (severity: string) => {
    switch (severity) {
      case "success":
        return "bg-emerald-50 border-emerald-100/50";
      case "warning":
        return "bg-amber-50 border-amber-100/50";
      case "error":
        return "bg-red-50 border-red-100/50";
      default:
        return "bg-blue-50 border-blue-100/50";
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-slate-900">{t("activity.title")}</h2>
        <p className="text-slate-500 mt-1">{t("activity.subtitle")}</p>
      </div>

      {isError ? (
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between gap-4">
          <span className="text-sm font-semibold text-slate-600">{t("activity.failed_to_load")}</span>
          <button
            type="button"
            onClick={() => refetch()}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold border bg-slate-900 text-white border-slate-900 shadow-sm"
          >
            {t("common.retry")}
          </button>
        </div>
      ) : null}

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center gap-4 justify-between">
        <div className="relative w-full md:w-80">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder={t("common.search")}
            value={filters.search}
            onChange={(e) => setFilters({ search: e.target.value })}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all"
          />
        </div>

        <div className="flex flex-wrap gap-1.5 w-full md:w-auto">
          {["all", "lead", "order", "inventory", "pricing", "system"].map((type) => (
            <button
              key={type}
              onClick={() => setFilters({ status: type })}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                filters.status === type
                  ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
              }`}
            >
              {type === "all" ? t("common.filter_all") : t("nav." + type, { defaultValue: type.toUpperCase() }).toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden divide-y divide-slate-100">
        {isLoading ? (
          <div className="py-12 text-center text-slate-400 font-medium">{t("common.loading")}</div>
        ) : filteredLogs.length > 0 ? (
          filteredLogs.map((log) => {
            const severity = inferSeverity(log.action);
            return (
              <div
                key={log.id}
                className={`p-5 flex items-start gap-4 border-l-4 border-l-slate-400 transition-colors hover:bg-slate-50/50 ${getSeverityStyle(
                  severity
                )}`}
              >
                <div className="mt-0.5">{getSeverityIcon(severity)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">{log.actor_name}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                      {t("nav." + log.entity_type.toLowerCase(), { defaultValue: log.entity_type }).toUpperCase()}
                    </span>
                    <span className="text-slate-400 font-mono text-[10px] ml-auto">{log.id.slice(0, 8)}</span>
                  </div>
                  <p className="text-sm font-semibold text-slate-700 mt-2 leading-relaxed">{log.action}</p>
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 font-semibold mt-3">
                    <Clock size={12} />
                    <span>{log.created_at}</span>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="py-12 text-center text-slate-400 font-medium">{t("common.no_data")}</div>
        )}
      </div>
    </div>
  );
}


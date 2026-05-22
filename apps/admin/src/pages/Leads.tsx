import React from "react";
import { useTranslation } from "../i18n";
import { useAdminStore } from "../store/useAdminStore";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";
import { useQuery } from "@tanstack/react-query";
import { Search, MessageSquare, Check, X, Eye } from "lucide-react";

type LeadRow = {
  id: string;
  telegram_id: number;
  country: string;
  intent: string | null;
  products: string[] | null;
  created_at: string;
};

async function fetchLeads(): Promise<LeadRow[]> {
  const { data, error } = await supabase
    .from("leads")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as LeadRow[];
}

export function Leads() {
  const { t } = useTranslation();
  const { filters, setFilters } = useAdminStore();
  const { role } = useAuth();
  const isReadOnly = role === "owner";

  const { data: leads = [], isLoading, isError, refetch } = useQuery({
    queryKey: ["leads"],
    queryFn: fetchLeads,
  });

  const filteredLeads = leads.filter((lead) => {
    const haystack = [
      lead.id,
      String(lead.telegram_id ?? ""),
      lead.country,
      lead.intent ?? "",
      ...(lead.products ?? []),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    const matchesSearch = haystack.includes(filters.search.toLowerCase());

    // Leads table doesn't have a status column; keep UI filters stable by treating all as "new".
    const matchesStatus = filters.status === "all" || filters.status === "new";

    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      new: "bg-blue-50 text-blue-700 border-blue-100",
      contacted: "bg-amber-50 text-amber-700 border-amber-100",
      qualified: "bg-violet-50 text-violet-700 border-violet-100",
      converted: "bg-emerald-50 text-emerald-700 border-emerald-100",
      closed: "bg-slate-100 text-slate-600 border-slate-200",
    };

    return (
      <span
        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${styles[status] || ""}`}
      >
        {status.toUpperCase()}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-slate-900">
          {t("leads.title")}
        </h2>
        <p className="text-slate-500 mt-1">{t("leads.subtitle")}</p>
      </div>

      {isError ? (
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between gap-4">
          <span className="text-sm font-semibold text-slate-600">
            Failed to load leads.
          </span>
          <button
            type="button"
            onClick={() => refetch()}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold border bg-slate-900 text-white border-slate-900 shadow-sm"
          >
            Retry
          </button>
        </div>
      ) : null}

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center gap-4 justify-between">
        <div className="relative w-full md:w-80">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            placeholder={t("common.search")}
            value={filters.search}
            onChange={(e) => setFilters({ search: e.target.value })}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all"
          />
        </div>

        <div className="flex flex-wrap gap-1.5 w-full md:w-auto">
          {["all", "new", "contacted", "qualified", "converted", "closed"].map(
            (status) => (
              <button
                key={status}
                onClick={() => setFilters({ status })}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                  filters.status === status
                    ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                }`}
              >
                {status.toUpperCase()}
              </button>
            ),
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs font-bold uppercase tracking-wider">
                <th className="px-6 py-4">ID</th>
                <th className="px-6 py-4">{t("leads.name")}</th>
                <th className="px-6 py-4">{t("leads.company")}</th>
                <th className="px-6 py-4">{t("leads.created")}</th>
                <th className="px-6 py-4">Products</th>
                <th className="px-6 py-4">{t("leads.status")}</th>
                <th className="px-6 py-4 text-right">{t("leads.action")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {isLoading ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-12 text-center text-slate-400 font-medium"
                  >
                    Loading...
                  </td>
                </tr>
              ) : filteredLeads.length > 0 ? (
                filteredLeads.map((lead) => (
                  <tr
                    key={lead.id}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-6 py-4 font-mono font-semibold text-slate-600">
                      {lead.id}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900">
                        Telegram ID: {lead.telegram_id}
                      </div>
                      <div className="text-xs text-slate-400 font-medium flex items-center gap-1.5 mt-0.5">
                        <MessageSquare size={12} />
                        {lead.country}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600 font-medium">
                      {lead.intent ?? "-"}
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      {new Date(lead.created_at).toISOString().split("T")[0]}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {(lead.products ?? []).map((p, i) => (
                          <span
                            key={`${lead.id}-${i}`}
                            className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200/50"
                          >
                            {p}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4">{getStatusBadge("new")}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          disabled={isReadOnly}
                          title={isReadOnly ? "Read-Only Mode" : "Qualify Lead"}
                          className={`p-1.5 rounded-lg transition-colors ${
                            isReadOnly
                              ? "text-slate-200 cursor-not-allowed opacity-50"
                              : "text-slate-400 hover:text-emerald-600 hover:bg-emerald-50"
                          }`}
                        >
                          <Check size={16} />
                        </button>
                        <button
                          disabled={isReadOnly}
                          title={isReadOnly ? "Read-Only Mode" : "Reject Lead"}
                          className={`p-1.5 rounded-lg transition-colors ${
                            isReadOnly
                              ? "text-slate-200 cursor-not-allowed opacity-50"
                              : "text-slate-400 hover:text-red-600 hover:bg-red-50"
                          }`}
                        >
                          <X size={16} />
                        </button>
                        <button
                          title="View Details"
                          className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                          <Eye size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-12 text-center text-slate-400 font-medium"
                  >
                    {t("common.no_data")}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}


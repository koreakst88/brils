import React, { useMemo } from "react";
import { useTranslation } from "../i18n";
import { useAdminStore } from "../store/useAdminStore";
import { supabase } from "../lib/supabase";
import { useQuery } from "@tanstack/react-query";
import { Search, Building2, Hash, Calendar } from "lucide-react";

type UserRow = {
  id: string;
  telegram_id: number;
  name: string | null;
  role: string;
  created_at: string;
};

async function fetchDistributors(): Promise<UserRow[]> {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("role", "user")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as UserRow[];
}

export function Distributors() {
  const { t } = useTranslation();
  const { filters, setFilters } = useAdminStore();

  const { data: distributors = [], isLoading, isError, refetch } = useQuery({
    queryKey: ["distributors"],
    queryFn: fetchDistributors,
  });

  const filtered = useMemo(() => {
    const q = filters.search.toLowerCase();
    return distributors.filter((u) => {
      const hay = [u.name ?? "", String(u.telegram_id ?? ""), u.id].join(" ").toLowerCase();
      return hay.includes(q);
    });
  }, [distributors, filters.search]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-slate-900">{t("distributors.title")}</h2>
        <p className="text-slate-500 mt-1">{t("distributors.subtitle")}</p>
      </div>

      {isError ? (
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between gap-4">
          <span className="text-sm font-semibold text-slate-600">Failed to load distributors.</span>
          <button
            type="button"
            onClick={() => refetch()}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold border bg-slate-900 text-white border-slate-900 shadow-sm"
          >
            Retry
          </button>
        </div>
      ) : null}

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
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
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {isLoading ? (
          <div className="col-span-2 py-12 text-center text-slate-400 font-medium bg-white rounded-2xl border border-slate-200">
            Loading...
          </div>
        ) : filtered.length > 0 ? (
          filtered.map((u) => (
            <div
              key={u.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between hover:shadow-md transition-all"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
                      <Building2 size={20} />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-950 text-base">{u.name ?? "Unnamed distributor"}</h3>
                      <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mt-0.5">
                        {u.id.slice(0, 8)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 space-y-3 text-sm border-t border-slate-100 pt-4">
                  <div className="flex items-center gap-2 text-slate-600 font-medium">
                    <Hash size={16} className="text-slate-400" />
                    <span>Telegram: {u.telegram_id}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600 font-medium">
                    <Calendar size={16} className="text-slate-400" />
                    <span>Created: {u.created_at}</span>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-2 py-12 text-center text-slate-400 font-medium bg-white rounded-2xl border border-slate-200">
            {t("common.no_data")}
          </div>
        )}
      </div>
    </div>
  );
}


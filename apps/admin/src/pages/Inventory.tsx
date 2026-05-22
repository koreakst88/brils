import React from "react";
import { useTranslation } from "../i18n";
import { useAdminStore } from "../store/useAdminStore";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";
import { useQuery } from "@tanstack/react-query";
import { Search, Plus, Minus, RotateCcw } from "lucide-react";

type InventoryTxnRow = {
  product: string;
  quantity: number;
  type: "incoming" | "outgoing";
  created_at: string;
};

type InventorySummary = {
  product: string;
  stock: number;
};

const LOW_STOCK_THRESHOLD = 50;

async function fetchInventory(): Promise<InventorySummary[]> {
  const { data, error } = await supabase
    .from("inventory_transactions")
    .select("product, quantity, type, created_at")
    .eq("is_deleted", false)
    .order("created_at", { ascending: true });

  if (error) throw error;

  const txns = (data ?? []) as InventoryTxnRow[];
  const map: Record<string, number> = {};
  for (const t of txns) {
    const delta = t.type === "outgoing" ? -Number(t.quantity) : Number(t.quantity);
    map[t.product] = (map[t.product] ?? 0) + delta;
  }

  return Object.entries(map)
    .map(([product, stock]) => ({ product, stock }))
    .sort((a, b) => a.product.localeCompare(b.product));
}

export function Inventory() {
  const { t } = useTranslation();
  const { filters, setFilters } = useAdminStore();
  const { role } = useAuth();
  const isReadOnly = role === "owner";

  const { data: inventory = [], isLoading, isError, refetch } = useQuery({
    queryKey: ["inventory"],
    queryFn: fetchInventory,
  });

  const getStockStatus = (stock: number) => {
    if (stock <= 0) return "out_of_stock";
    if (stock <= LOW_STOCK_THRESHOLD) return "low_stock";
    return "in_stock";
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      in_stock: "bg-emerald-50 text-emerald-700 border-emerald-100",
      low_stock: "bg-amber-50 text-amber-700 border-amber-100",
      out_of_stock: "bg-red-50 text-red-700 border-red-100",
    };

    const labelKey = `inventory.status_${status}`;

    return (
      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${styles[status] || ""}`}>
        {t(labelKey).toUpperCase()}
      </span>
    );
  };

  // Filter based on search and status
  const filteredInventory = inventory.filter((item) => {
    const matchesSearch = item.product.toLowerCase().includes(filters.search.toLowerCase());
    const status = getStockStatus(item.stock);
    const matchesStatus = filters.status === "all" || status === filters.status;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">{t("inventory.title")}</h2>
          <p className="text-slate-500 mt-1">{t("inventory.subtitle")}</p>
        </div>
        <button
          disabled={isReadOnly}
          className={`flex items-center justify-center gap-2 font-bold text-sm px-4 py-2.5 rounded-xl transition-all shadow-sm ${
            isReadOnly
              ? "bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300"
              : "bg-slate-900 hover:bg-slate-800 text-white"
          }`}
        >
          <Plus size={16} />
          Create Product Stock
        </button>
      </div>

      {isError ? (
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between gap-4">
          <span className="text-sm font-semibold text-slate-600">Failed to load inventory.</span>
          <button
            type="button"
            onClick={() => refetch()}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold border bg-slate-900 text-white border-slate-900 shadow-sm"
          >
            Retry
          </button>
        </div>
      ) : null}

      {/* Filters Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center gap-4 justify-between">
        {/* Search */}
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

        {/* Status Pills */}
        <div className="flex flex-wrap gap-1.5 w-full md:w-auto">
          {["all", "in_stock", "low_stock", "out_of_stock"].map((status) => (
            <button
              key={status}
              onClick={() => setFilters({ status })}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                filters.status === status
                  ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
              }`}
            >
              {status === "all" ? "ALL" : t(`inventory.status_${status}`).toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs font-bold uppercase tracking-wider">
                <th className="px-6 py-4">{t("inventory.product_name")}</th>
                <th className="px-6 py-4">{t("inventory.stock")}</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Adjust Stock</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-400 font-medium">
                    Loading...
                  </td>
                </tr>
              ) : filteredInventory.length > 0 ? (
                filteredInventory.map((item) => {
                  const status = getStockStatus(item.stock);
                  return (
                    <tr key={item.product} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 font-semibold text-slate-900">{item.product}</td>
                      <td className="px-6 py-4 font-bold text-slate-900">{item.stock} units</td>
                      <td className="px-6 py-4">{getStatusBadge(status)}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            disabled={isReadOnly}
                            title={isReadOnly ? "Read-Only Mode" : "Add stock"}
                            className={`p-1.5 border rounded-lg transition-all ${
                              isReadOnly
                                ? "text-slate-200 border-slate-100 cursor-not-allowed"
                              : "text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 border-slate-200 hover:border-emerald-200"
                            }`}
                          >
                            <Plus size={14} />
                          </button>
                          <button
                            disabled={isReadOnly}
                            title={isReadOnly ? "Read-Only Mode" : "Remove stock"}
                            className={`p-1.5 border rounded-lg transition-all ${
                              isReadOnly
                                ? "text-slate-200 border-slate-100 cursor-not-allowed"
                                : "text-slate-400 hover:text-red-600 hover:bg-red-50 border-slate-200 hover:border-red-200"
                            }`}
                          >
                            <Minus size={14} />
                          </button>
                          <button
                            disabled={isReadOnly}
                            title={isReadOnly ? "Read-Only Mode" : "Reset adjustments"}
                            className={`p-1.5 border rounded-lg transition-all ${
                              isReadOnly
                                ? "text-slate-200 border-slate-100 cursor-not-allowed"
                                : "text-slate-400 hover:text-slate-900 hover:bg-slate-100 border-slate-200 hover:border-slate-300"
                            }`}
                          >
                            <RotateCcw size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-400 font-medium">
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

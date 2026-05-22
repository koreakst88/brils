import React, { useMemo, useState } from "react";
import { useTranslation } from "../i18n";
import { useAdminStore } from "../store/useAdminStore";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Search, DollarSign, Edit3, Check, X, ShieldAlert } from "lucide-react";

type PricingRow = {
  id: string;
  product: string;
  price: number;
  created_at: string;
  updated_at: string;
};

async function fetchPricing(): Promise<PricingRow[]> {
  const { data, error } = await supabase
    .from("pricing")
    .select("*")
    .order("product", { ascending: true });

  if (error) throw error;
  return (data ?? []) as PricingRow[];
}

export function Pricing() {
  const { t } = useTranslation();
  const { filters, setFilters } = useAdminStore();
  const { role } = useAuth();
  const isReadOnly = role === "owner";

  const queryClient = useQueryClient();
  const { data: pricing = [], isLoading, isError, refetch } = useQuery({
    queryKey: ["pricing"],
    queryFn: fetchPricing,
  });

  const [editingProduct, setEditingProduct] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState<string>("");

  const updateMutation = useMutation({
    mutationFn: async ({ product, price }: { product: string; price: number }) => {
      const { error } = await supabase
        .from("pricing")
        .update({ price })
        .eq("product", product);
      if (error) throw error;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["pricing"] });
    },
  });

  const filteredPricing = useMemo(() => {
    const q = filters.search.toLowerCase();
    return pricing.filter((row) => row.product.toLowerCase().includes(q));
  }, [pricing, filters.search]);

  const startEdit = (row: PricingRow) => {
    if (isReadOnly) return;
    setEditingProduct(row.product);
    setEditPrice(String(row.price ?? 0));
  };

  const cancelEdit = () => {
    setEditingProduct(null);
    setEditPrice("");
  };

  const saveEdit = async (product: string) => {
    if (isReadOnly) return;
    const next = Number(editPrice);
    if (!Number.isFinite(next)) return;
    await updateMutation.mutateAsync({ product, price: next });
    cancelEdit();
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-slate-900">{t("pricing.title")}</h2>
        <p className="text-slate-500 mt-1">{t("pricing.subtitle")}</p>
      </div>

      {isError ? (
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between gap-4">
          <span className="text-sm font-semibold text-slate-600">{t("pricing.failed_to_load")}</span>
          <button
            type="button"
            onClick={() => refetch()}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold border bg-slate-900 text-white border-slate-900 shadow-sm"
          >
            {t("common.retry")}
          </button>
        </div>
      ) : null}

      <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-xl flex items-start gap-3">
        <ShieldAlert className="text-amber-600 flex-shrink-0 mt-0.5" size={20} />
        <div>
          <h4 className="font-bold text-sm">{t("pricing.warning_title")}</h4>
          <p className="text-xs text-amber-700 mt-1 leading-relaxed">
            {t("pricing.warning_text")}
          </p>
        </div>
      </div>

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

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs font-bold uppercase tracking-wider">
                <th className="px-6 py-4">{t("pricing.product_col")}</th>
                <th className="px-6 py-4">{t("pricing.base_price")}</th>
                <th className="px-6 py-4 text-right">{t("pricing.actions_col")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {isLoading ? (
                <tr>
                  <td colSpan={3} className="px-6 py-12 text-center text-slate-400 font-medium">
                    {t("common.loading")}
                  </td>
                </tr>
              ) : filteredPricing.length > 0 ? (
                filteredPricing.map((row) => {
                  const isEditing = editingProduct === row.product;
                  return (
                    <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 font-semibold text-slate-900">{t("products." + row.product, { defaultValue: row.product })}</td>
                      <td className="px-6 py-4">
                        {isEditing ? (
                          <div className="relative w-32">
                            <DollarSign size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                              type="number"
                              value={editPrice}
                              onChange={(e) => setEditPrice(e.target.value)}
                              className="w-full pl-6 pr-2 py-1 bg-slate-50 border border-slate-300 rounded focus:outline-none focus:bg-white font-semibold"
                            />
                          </div>
                        ) : (
                          <span className="font-semibold text-slate-900">${Number(row.price || 0).toFixed(2)}</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {isEditing ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              disabled={updateMutation.isPending}
                              onClick={() => saveEdit(row.product)}
                              className="p-1.5 text-emerald-600 bg-emerald-50 border border-emerald-200 hover:border-emerald-300 rounded-lg transition-colors disabled:opacity-50"
                            >
                              <Check size={14} />
                            </button>
                            <button
                              disabled={updateMutation.isPending}
                              onClick={cancelEdit}
                              className="p-1.5 text-slate-500 bg-slate-100 border border-slate-200 hover:bg-slate-200 rounded-lg transition-colors disabled:opacity-50"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ) : (
                          <button
                            disabled={isReadOnly}
                            onClick={() => startEdit(row)}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 border rounded-lg text-xs font-bold transition-all ${
                              isReadOnly
                                ? "text-slate-200 border-slate-100 cursor-not-allowed"
                                : "bg-slate-50 text-slate-700 hover:bg-slate-900 hover:text-white border-slate-200"
                            }`}
                          >
                            <Edit3 size={12} />
                            {t("pricing.edit")}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={3} className="px-6 py-12 text-center text-slate-400 font-medium">
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


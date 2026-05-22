import React, { useState } from "react";
import { useTranslation } from "../i18n";
import { useAdminStore } from "../store/useAdminStore";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, Plus, Minus, RotateCcw, X, AlertTriangle, Loader2, Package } from "lucide-react";

type InventorySummary = {
  product: string;
  stock: number;
};

const LOW_STOCK_THRESHOLD = 500;

async function fetchInventory(): Promise<InventorySummary[]> {
  const [pricingRes, txnsRes] = await Promise.all([
    supabase.from("pricing").select("product").eq("is_deleted", false),
    supabase.from("inventory_transactions").select("product, quantity")
  ]);

  if (pricingRes.error) throw pricingRes.error;
  if (txnsRes.error) throw txnsRes.error;

  const products = pricingRes.data?.map((p) => p.product) || [];
  const map: Record<string, number> = {};
  
  for (const p of products) {
    map[p] = 0;
  }

  for (const t of (txnsRes.data || [])) {
    map[t.product] = (map[t.product] ?? 0) + Number(t.quantity);
  }

  return Object.entries(map)
    .map(([product, stock]) => ({ product, stock }))
    .sort((a, b) => a.product.localeCompare(b.product));
}

interface CreateTransactionModalProps {
  onClose: () => void;
  isReadOnly: boolean;
  products: string[];
}

function CreateTransactionModal({ onClose, isReadOnly, products }: CreateTransactionModalProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [product, setProduct] = useState(products[0] || "");
  const [type, setType] = useState<"incoming" | "outgoing">("incoming");
  const [quantity, setQuantity] = useState("");
  const [notes, setNotes] = useState("");

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!product) throw new Error(t("common.required_field", { defaultValue: "Product is required" }));
      let qty = Number(quantity);
      if (isNaN(qty) || qty === 0) throw new Error(t("common.invalid_number", { defaultValue: "Invalid quantity" }));
      
      // Ensure quantity sign matches type
      if (type === "outgoing" && qty > 0) qty = -qty;
      if (type === "incoming" && qty < 0) qty = Math.abs(qty);

      const { error } = await supabase.from("inventory_transactions").insert({
        product,
        quantity: qty,
        type,
        notes: notes.trim() || null
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      onClose();
    }
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border border-slate-100 font-sans">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <Package size={20} className="text-slate-600" />
            <h3 className="font-bold text-lg text-slate-800">
              {t("inventory.create_stock", { defaultValue: "Create Transaction" })}
            </h3>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(); }} className="flex-1 overflow-y-auto p-6 space-y-4">
          {createMutation.isError && (
            <div className="p-3 bg-red-50 border border-red-100 text-red-600 rounded-xl text-xs font-semibold flex items-center gap-2">
              <AlertTriangle size={16} />
              <span>{createMutation.error instanceof Error ? createMutation.error.message : "Error"}</span>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              {t("inventory.product_name", { defaultValue: "Product" })} *
            </label>
            <select
              value={product}
              onChange={(e) => setProduct(e.target.value)}
              disabled={isReadOnly || createMutation.isPending}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-950 focus:bg-white transition-all font-semibold"
            >
              <option value="" disabled>Select product</option>
              {products.map((p) => (
                <option key={p} value={p}>{t("products." + p, { defaultValue: p })}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              {t("inventory.type", { defaultValue: "Type" })} *
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as any)}
              disabled={isReadOnly || createMutation.isPending}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-950 focus:bg-white transition-all font-semibold"
            >
              <option value="incoming">{t("inventory.incoming", { defaultValue: "Incoming" })}</option>
              <option value="outgoing">{t("inventory.outgoing", { defaultValue: "Outgoing" })}</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              {t("inventory.quantity", { defaultValue: "Quantity" })} *
            </label>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              disabled={isReadOnly || createMutation.isPending}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-950 focus:bg-white transition-all font-semibold font-mono"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              {t("inventory.notes", { defaultValue: "Notes" })}
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={isReadOnly || createMutation.isPending}
              rows={3}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-950 focus:bg-white transition-all font-semibold"
            />
          </div>
          <button type="submit" className="hidden" />
        </form>

        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-slate-100 bg-slate-50/50">
          <button onClick={onClose} type="button" className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-sm font-bold transition-colors">
            {t("common.cancel")}
          </button>
          <button
            onClick={() => createMutation.mutate()}
            disabled={isReadOnly || createMutation.isPending || !product || !quantity}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-xl text-sm font-bold transition-all flex items-center gap-2"
          >
            {createMutation.isPending && <Loader2 size={14} className="animate-spin" />}
            {t("common.create", { defaultValue: "Create" })}
          </button>
        </div>
      </div>
    </div>
  );
}

export function Inventory() {
  const { t } = useTranslation();
  const { filters, setFilters } = useAdminStore();
  const { role } = useAuth();
  const isReadOnly = role === "owner";
  const queryClient = useQueryClient();

  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const { data: inventory = [], isLoading, isError, refetch } = useQuery({
    queryKey: ["inventory"],
    queryFn: fetchInventory,
  });

  const adjustMutation = useMutation({
    mutationFn: async ({ product, amount }: { product: string; amount: number }) => {
      const { error } = await supabase.from("inventory_transactions").insert({
        product,
        quantity: amount,
        type: "adjustment" as any,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
    }
  });

  const getStockStatus = (stock: number) => {
    if (stock <= 0) return "out_of_stock";
    if (stock < LOW_STOCK_THRESHOLD) return "low_stock";
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

  const filteredInventory = inventory.filter((item) => {
    const matchesSearch = item.product.toLowerCase().includes(filters.search.toLowerCase());
    const status = getStockStatus(item.stock);
    const matchesStatus = filters.status === "all" || status === filters.status;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">{t("inventory.title")}</h2>
          <p className="text-slate-500 mt-1">{t("inventory.subtitle")}</p>
        </div>
        <button
          onClick={() => setIsCreateOpen(true)}
          disabled={isReadOnly}
          className={`flex items-center justify-center gap-2 font-bold text-sm px-4 py-2.5 rounded-xl transition-all shadow-sm ${
            isReadOnly
              ? "bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300"
              : "bg-slate-900 hover:bg-slate-800 text-white"
          }`}
        >
          <Plus size={16} />
          {t("inventory.create_stock", { defaultValue: "Create Transaction" })}
        </button>
      </div>

      {isError && (
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between gap-4">
          <span className="text-sm font-semibold text-slate-600">{t("inventory.failed_to_load")}</span>
          <button
            type="button"
            onClick={() => refetch()}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold border bg-slate-900 text-white border-slate-900 shadow-sm"
          >
            {t("common.retry")}
          </button>
        </div>
      )}

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
              {status === "all" ? t("common.filter_all") : t(`inventory.status_${status}`).toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs font-bold uppercase tracking-wider">
                <th className="px-6 py-4">{t("inventory.product_name")}</th>
                <th className="px-6 py-4">{t("inventory.stock")}</th>
                <th className="px-6 py-4">{t("inventory.status_col")}</th>
                <th className="px-6 py-4 text-right">{t("inventory.adjust_stock")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-400 font-medium">
                    {t("common.loading")}
                  </td>
                </tr>
              ) : filteredInventory.length > 0 ? (
                filteredInventory.map((item) => {
                  const status = getStockStatus(item.stock);
                  return (
                    <tr key={item.product} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 font-semibold text-slate-900">{t("products." + item.product, { defaultValue: item.product })}</td>
                      <td className="px-6 py-4 font-bold text-slate-900">{item.stock} {t("common.units")}</td>
                      <td className="px-6 py-4">{getStatusBadge(status)}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            disabled={isReadOnly || adjustMutation.isPending}
                            onClick={() => adjustMutation.mutate({ product: item.product, amount: 100 })}
                            title="+100"
                            className={`p-1.5 border rounded-lg transition-all ${
                              isReadOnly
                                ? "text-slate-200 border-slate-100 cursor-not-allowed"
                              : "text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 border-slate-200 hover:border-emerald-200"
                            }`}
                          >
                            <Plus size={14} />
                          </button>
                          <button
                            disabled={isReadOnly || adjustMutation.isPending}
                            onClick={() => adjustMutation.mutate({ product: item.product, amount: -100 })}
                            title="-100"
                            className={`p-1.5 border rounded-lg transition-all ${
                              isReadOnly
                                ? "text-slate-200 border-slate-100 cursor-not-allowed"
                                : "text-slate-400 hover:text-red-600 hover:bg-red-50 border-slate-200 hover:border-red-200"
                            }`}
                          >
                            <Minus size={14} />
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

      {isCreateOpen && (
        <CreateTransactionModal
          onClose={() => setIsCreateOpen(false)}
          isReadOnly={isReadOnly}
          products={inventory.map(i => i.product)}
        />
      )}
    </div>
  );
}

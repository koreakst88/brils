import React from "react";
import { useTranslation } from "../i18n";
import { useAdminStore } from "../store/useAdminStore";
import { supabase } from "../lib/supabase";
import { useQuery } from "@tanstack/react-query";
import { Search, ShoppingBag, Eye, Calendar, Package, ArrowRight } from "lucide-react";

type OrderItem = {
  product: string;
  quantity: number;
  price?: number;
};

type OrderRow = {
  id: string;
  distributor_id: string | null;
  items: OrderItem[] | null;
  total_amount: number;
  status: string;
  shipped_at: string | null;
  created_at: string;
  users?: Array<{ name: string | null }> | null;
};

async function fetchOrders(): Promise<OrderRow[]> {
  const { data, error } = await supabase
    .from("orders")
    .select("id, distributor_id, items, total_amount, status, shipped_at, created_at, users(name)")
    .eq("is_deleted", false)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as OrderRow[];
}

export function Orders() {
  const { t } = useTranslation();
  const { filters, setFilters } = useAdminStore();

  const { data: orders = [], isLoading, isError, refetch } = useQuery({
    queryKey: ["orders"],
    queryFn: fetchOrders,
  });

  // Filtering based on search and status
  const filteredOrders = orders.filter((order) => {
    const distributorName = order.users?.[0]?.name ?? "";
    const matchesSearch =
      String(order.id).toLowerCase().includes(filters.search.toLowerCase()) ||
      distributorName.toLowerCase().includes(filters.search.toLowerCase());

    const matchesStatus =
      filters.status === "all" || order.status === filters.status;

    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      new: "bg-blue-50 text-blue-700 border-blue-100",
      confirmed: "bg-violet-50 text-violet-700 border-violet-100",
      processing: "bg-amber-50 text-amber-700 border-amber-100",
      shipped: "bg-indigo-50 text-indigo-700 border-indigo-100",
      delivered: "bg-emerald-50 text-emerald-700 border-emerald-100",
      cancelled: "bg-slate-100 text-slate-600 border-slate-200",
    };

    return (
      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${styles[status] || ""}`}>
        {status.toUpperCase()}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-slate-900">{t("orders.title")}</h2>
        <p className="text-slate-500 mt-1">{t("orders.subtitle")}</p>
      </div>

      {isError ? (
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between gap-4">
          <span className="text-sm font-semibold text-slate-600">Failed to load orders.</span>
          <button
            type="button"
            onClick={() => refetch()}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold border bg-slate-900 text-white border-slate-900 shadow-sm"
          >
            Retry
          </button>
        </div>
      ) : null}

      {/* Toolbar */}
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

        {/* Status filters */}
        <div className="flex flex-wrap gap-1.5 w-full md:w-auto">
          {["all", "new", "confirmed", "processing", "shipped", "delivered", "cancelled"].map((status) => (
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
          ))}
        </div>
      </div>

      {/* Orders list */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="py-12 text-center text-slate-400 font-medium bg-white rounded-2xl border border-slate-200">
            Loading...
          </div>
        ) : filteredOrders.length > 0 ? (
          filteredOrders.map((order) => (
            <div key={order.id} className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition-shadow">
              {/* Card top */}
              <div className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-700">
                    <ShoppingBag size={20} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-950 text-base">{String(order.id).slice(0, 8)}</span>
                      {getStatusBadge(order.status)}
                    </div>
                    <p className="text-sm font-semibold text-slate-900 mt-1">{order.users?.[0]?.name ?? "-"}</p>
                  </div>
                </div>
                <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-1">
                  <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider flex items-center gap-1">
                    <Calendar size={12} />
                    {order.created_at?.split("T")[0]}
                  </span>
                  <span className="text-lg font-black text-slate-900">
                    ${Number(order.total_amount || 0).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Card body */}
              <div className="px-6 py-4 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                {/* Items list */}
                <div className="space-y-1.5">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Items list</span>
                  <div className="flex flex-wrap gap-4 text-xs font-semibold text-slate-700">
                    {(order.items ?? []).map((item, idx) => (
                      <span key={idx} className="flex items-center gap-1.5 bg-white border border-slate-200 px-2.5 py-1 rounded-lg">
                        <Package size={12} className="text-slate-400" />
                        {item.product}: <strong className="text-slate-950">{item.quantity} units</strong>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Delivery details */}
                <div className="text-left md:text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Logistics / Delivery</span>
                  <span className="text-xs text-slate-600 font-bold block mt-1">
                    {order.shipped_at ? `Shipped: ${order.shipped_at.split("T")[0]}` : "-"}
                  </span>
                </div>
              </div>

              {/* Card actions */}
              <div className="px-6 py-3 flex items-center justify-between border-t border-slate-100 text-xs">
                <span className="text-slate-400 font-semibold">Payment terms: Bank Transfer Net-30</span>
                <button className="flex items-center gap-1.5 text-slate-700 hover:text-slate-950 font-bold hover:underline transition-all">
                  Process Logistics
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="py-12 text-center text-slate-400 font-medium bg-white rounded-2xl border border-slate-200">
            {t("common.no_data")}
          </div>
        )}
      </div>
    </div>
  );
}

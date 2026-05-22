import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "../i18n";
import { useAdminStore } from "../store/useAdminStore";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Search,
  Building2,
  Hash,
  Calendar,
  User,
  ShoppingBag,
  ArrowRight,
  X,
  AlertTriangle,
  Loader2,
  Plus,
} from "lucide-react";

type UserRow = {
  id: string;
  telegram_id: number;
  name: string | null;
  role: string;
  created_at: string;
  country: string | null;
  whatsapp: string | null;
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

interface DistributorDetailsModalProps {
  distributor: UserRow;
  onClose: () => void;
}

export function DistributorDetailsModal({
  distributor,
  onClose,
}: DistributorDetailsModalProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { setFilters } = useAdminStore();

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["distributor-orders", distributor.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("id, total_amount, status, created_at")
        .eq("distributor_id", distributor.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const orderCount = orders.length;
  const totalAmount = orders.reduce(
    (sum, o) => sum + (o.total_amount || 0),
    0,
  );
  const averageCheck = orderCount > 0 ? totalAmount / orderCount : 0;
  const latestOrderDate =
    orderCount > 0
      ? new Date(orders[0].created_at).toLocaleDateString()
      : "—";

  const recentOrders = orders.slice(0, 5);

  const handleShowAllOrders = () => {
    setFilters({ search: distributor.name || "" });
    navigate("/admin/orders");
    onClose();
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      new: "bg-blue-50 text-blue-700 border-blue-100",
      confirmed: "bg-amber-50 text-amber-700 border-amber-100",
      processing: "bg-indigo-50 text-indigo-700 border-indigo-100",
      shipped: "bg-purple-50 text-purple-700 border-purple-100",
      delivered: "bg-emerald-50 text-emerald-700 border-emerald-100",
      cancelled: "bg-rose-50 text-rose-700 border-rose-100",
    };
    const statusVal = status.toLowerCase();
    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
          styles[statusVal] || "bg-slate-50 text-slate-700 border-slate-100"
        }`}
      >
        {t(`orders.status.${statusVal}`, { defaultValue: status })}
      </span>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border border-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <Building2 size={20} className="text-slate-600" />
            <h3 className="font-bold text-lg text-slate-800">
              {t("distributors.details_title")}
            </h3>
            <span className="text-sm font-semibold text-slate-400">
              #{distributor.id.slice(0, 8)}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Секция 1: Информация */}
          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 space-y-4">
            <h4 className="text-xs uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1.5 border-b border-slate-200/60 pb-2">
              <User size={14} />
              {t("distributors.info_section")}
            </h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-xs text-slate-400 block mb-0.5">
                  {t("distributors.name_label")}
                </span>
                <span className="font-semibold text-slate-800 break-all">
                  {distributor.name || "—"}
                </span>
              </div>
              <div>
                <span className="text-xs text-slate-400 block mb-0.5">
                  {t("distributors.country_label")}
                </span>
                <span className="font-semibold text-slate-800">
                  {distributor.country
                    ? t(`countries.${distributor.country.toLowerCase()}`, {
                        defaultValue: distributor.country,
                      })
                    : "—"}
                </span>
              </div>
              <div>
                <span className="text-xs text-slate-400 block mb-0.5">
                  {t("distributors.whatsapp_label")}
                </span>
                <span className="font-semibold text-slate-800">
                  {distributor.whatsapp || "—"}
                </span>
              </div>
              <div>
                <span className="text-xs text-slate-400 block mb-0.5">
                  {t("distributors.telegram_label")}
                </span>
                <span className="font-semibold text-slate-800">
                  {distributor.telegram_id || "—"}
                </span>
              </div>
              <div className="col-span-2">
                <span className="text-xs text-slate-400 block mb-0.5">
                  {t("distributors.registered_label")}
                </span>
                <span className="font-semibold text-slate-800">
                  {new Date(distributor.created_at).toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Секция 2: Статистика */}
          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 space-y-4">
            <h4 className="text-xs uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1.5 border-b border-slate-200/60 pb-2">
              <ShoppingBag size={14} />
              {t("distributors.stats_section")}
            </h4>
            {isLoading ? (
              <div className="text-center py-4 text-slate-400 text-sm">
                {t("common.loading")}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                  <span className="text-xs text-slate-400 block mb-1">
                    {t("distributors.orders_count_stat")}
                  </span>
                  <span className="text-lg font-bold text-slate-800">
                    {orderCount}
                  </span>
                </div>
                <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                  <span className="text-xs text-slate-400 block mb-1">
                    {t("distributors.total_amount")}
                  </span>
                  <span className="text-lg font-bold text-indigo-600">
                    ${totalAmount.toLocaleString()}
                  </span>
                </div>
                <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                  <span className="text-xs text-slate-400 block mb-1">
                    {t("distributors.avg_check")}
                  </span>
                  <span className="text-lg font-bold text-slate-800">
                    ${Math.round(averageCheck).toLocaleString()}
                  </span>
                </div>
                <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                  <span className="text-xs text-slate-400 block mb-1">
                    {t("distributors.latest_order")}
                  </span>
                  <span className="text-xs font-bold text-slate-800 leading-7">
                    {latestOrderDate}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Секция 3: История заказов */}
          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 space-y-4">
            <h4 className="text-xs uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1.5 border-b border-slate-200/60 pb-2">
              <Calendar size={14} />
              {t("distributors.order_history")}
            </h4>
            {isLoading ? (
              <div className="text-center py-4 text-slate-400 text-sm">
                {t("common.loading")}
              </div>
            ) : orders.length > 0 ? (
              <div className="space-y-4">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-400 font-semibold pb-2">
                        <th className="pb-2">{t("orders.order_id")}</th>
                        <th className="pb-2">{t("common.date")}</th>
                        <th className="pb-2">{t("orders.amount")}</th>
                        <th className="pb-2 text-right">
                          {t("orders.status")}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {recentOrders.map((o) => (
                        <tr key={o.id} className="text-slate-700">
                          <td className="py-2.5 font-mono text-xs font-semibold text-slate-500">
                            #{o.id.slice(0, 8)}
                          </td>
                          <td className="py-2.5">
                            {new Date(o.created_at).toLocaleDateString()}
                          </td>
                          <td className="py-2.5 font-bold">
                            ${(o.total_amount || 0).toLocaleString()}
                          </td>
                          <td className="py-2.5 text-right">
                            {getStatusBadge(o.status)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="pt-2">
                  <button
                    onClick={handleShowAllOrders}
                    className="w-full py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 border border-indigo-100"
                  >
                    <ArrowRight size={14} />
                    {t("distributors.show_all_orders")}
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-4 text-slate-400 text-sm">
                {t("common.no_data")}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-6 py-4 border-t border-slate-100 bg-slate-50/50">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-bold transition-colors shadow-sm"
          >
            {t("leads.close_btn")}
          </button>
        </div>
      </div>
    </div>
  );
}

interface CreateDistributorModalProps {
  onClose: () => void;
  isReadOnly: boolean;
}

export function CreateDistributorModal({
  onClose,
  isReadOnly,
}: CreateDistributorModalProps) {
  const { t } = useTranslation();
  const { user, role } = useAuth();
  const queryClient = useQueryClient();

  const [name, setName] = useState("");
  const [country, setCountry] = useState("KZ");
  const [telegramId, setTelegramId] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [username, setUsername] = useState("");
  const [language, setLanguage] = useState("RU");
  const [notes, setNotes] = useState("");

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!name.trim()) {
        throw new Error(t("distributors.errors.name_required"));
      }
      if (!telegramId.trim()) {
        throw new Error(t("distributors.errors.telegram_id_required"));
      }

      const tgIdNum = Number(telegramId.trim());
      if (isNaN(tgIdNum)) {
        throw new Error(t("distributors.errors.telegram_id_invalid"));
      }

      // Check if telegram_id exists
      const { data: existingUser, error: checkErr } = await supabase
        .from("users")
        .select("id")
        .eq("telegram_id", tgIdNum)
        .maybeSingle();

      if (checkErr) throw checkErr;
      if (existingUser) {
        throw new Error(t("distributors.errors.telegram_id_exists"));
      }

      // 1. Insert user — only columns that exist in live DB
      const { data: newUser, error: userErr } = await supabase
        .from("users")
        .insert({
          telegram_id: tgIdNum,
          name: name.trim(),
          role: "user",
          whatsapp: whatsapp.trim() || null,
        })
        .select("id")
        .single();
      if (userErr) {
        console.error("[createDistributor INSERT error]", {
          message: userErr.message,
          details: userErr.details,
          hint: userErr.hint,
          code: userErr.code,
        });
        throw userErr;
      }

      // 2. Get admin user ID for activity log
      const dbUserId = await (async () => {
        if (user && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(user.id)) {
          return user.id;
        }
        const { data } = await supabase
          .from("users")
          .select("id")
          .eq("role", role || "admin")
          .limit(1)
          .maybeSingle();
        return data?.id || null;
      })();

      // 3. Log activity
      const { error: logErr } = await supabase
        .from("activity_log")
        .insert({
          user_id: dbUserId,
          action: "distributor_created",
          entity_type: "user",
          entity_id: newUser.id,
          details: {
            name: name.trim(),
            country,
            telegram_id: tgIdNum,
            whatsapp: whatsapp.trim() || null,
            username: username.trim() || null,
            language_code: language,
            notes: notes.trim() || null,
          },
        });
      if (logErr) throw logErr;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["distributors"] });
      onClose();
    },
    onError: (error: any) => {
      console.error("[createDistributor error]", {
        message: error?.message,
        details: error?.details,
        hint: error?.hint,
        code: error?.code,
        raw: error,
      });
    },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border border-slate-100 font-sans">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <Building2 size={20} className="text-slate-600" />
            <h3 className="font-bold text-lg text-slate-800">
              {t("distributors.create_title")}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createMutation.mutate();
          }}
          className="flex-1 overflow-y-auto p-6 space-y-4 text-left"
        >
          {createMutation.isError && (
            <div className="p-3 bg-red-50 border border-red-100 text-red-600 rounded-xl text-xs font-semibold flex items-center gap-2">
              <AlertTriangle size={16} />
              <span>
                {createMutation.error instanceof Error
                  ? createMutation.error.message
                  : "Error creating distributor"}
              </span>
            </div>
          )}

          {/* Name */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              {t("distributors.name_label")} *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isReadOnly || createMutation.isPending}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-950 focus:bg-white transition-all font-semibold disabled:opacity-50"
              required
            />
          </div>

          {/* Country */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              {t("distributors.country_label")} *
            </label>
            <select
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              disabled={isReadOnly || createMutation.isPending}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-950 focus:bg-white transition-all font-semibold disabled:opacity-50"
            >
              {["KZ", "UZ", "KG", "TM", "Other"].map((code) => (
                <option key={code} value={code}>
                  {t(`countries.${code.toLowerCase()}`, { defaultValue: code })}
                </option>
              ))}
            </select>
          </div>

          {/* Telegram ID */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              {t("distributors.telegram_label")} *
            </label>
            <input
              type="text"
              pattern="\d+"
              value={telegramId}
              onChange={(e) => setTelegramId(e.target.value.replace(/\D/g, ""))}
              disabled={isReadOnly || createMutation.isPending}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-950 focus:bg-white transition-all font-semibold disabled:opacity-50 font-mono"
              required
            />
          </div>

          {/* WhatsApp */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              {t("distributors.whatsapp_label", { defaultValue: "WhatsApp" })}
            </label>
            <input
              type="text"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              disabled={isReadOnly || createMutation.isPending}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-950 focus:bg-white transition-all font-semibold disabled:opacity-50"
            />
          </div>

          {/* Username */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              {t("distributors.username_label")}
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={isReadOnly || createMutation.isPending}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-950 focus:bg-white transition-all font-semibold disabled:opacity-50"
            />
          </div>

          {/* Language */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              {t("distributors.language_label")} *
            </label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              disabled={isReadOnly || createMutation.isPending}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-950 focus:bg-white transition-all font-semibold disabled:opacity-50"
            >
              <option value="RU">RU</option>
              <option value="EN">EN</option>
              <option value="KO">KO</option>
            </select>
          </div>

          {/* Notes */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              {t("distributors.notes_label")}
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={isReadOnly || createMutation.isPending}
              rows={3}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-950 focus:bg-white transition-all font-semibold disabled:opacity-50"
            />
          </div>

          {/* Hidden Submit Button to allow enter key submission */}
          <button type="submit" className="hidden" />
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-slate-100 bg-slate-50/50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-sm font-bold transition-colors"
          >
            {t("common.cancel")}
          </button>
          <button
            type="button"
            onClick={() => createMutation.mutate()}
            disabled={
              isReadOnly ||
              createMutation.isPending ||
              !name.trim() ||
              !telegramId.trim()
            }
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-xl text-sm font-bold transition-all flex items-center gap-2"
          >
            {createMutation.isPending && (
              <Loader2 size={14} className="animate-spin" />
            )}
            {t("distributors.create_btn")}
          </button>
        </div>
      </div>
    </div>
  );
}

export function Distributors() {
  const { t } = useTranslation();
  const { filters, setFilters } = useAdminStore();
  const { role } = useAuth();
  const isReadOnly = role === "owner";
  const [selectedDistributor, setSelectedDistributor] =
    useState<UserRow | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const {
    data: distributors = [],
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["distributors"],
    queryFn: fetchDistributors,
  });

  const filtered = useMemo(() => {
    const q = filters.search.toLowerCase();
    return distributors.filter((u) => {
      const hay = [u.name ?? "", String(u.telegram_id ?? ""), u.id]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [distributors, filters.search]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">
            {t("distributors.title")}
          </h2>
          <p className="text-slate-500 mt-1">{t("distributors.subtitle")}</p>
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
          {t("distributors.new_distributor_btn")}
        </button>
      </div>

      {isError ? (
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between gap-4">
          <span className="text-sm font-semibold text-slate-600">
            {t("distributors.failed_to_load")}
          </span>
          <button
            type="button"
            onClick={() => refetch()}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold border bg-slate-900 text-white border-slate-900 shadow-sm"
          >
            {t("common.retry")}
          </button>
        </div>
      ) : null}

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
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
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {isLoading ? (
          <div className="col-span-2 py-12 text-center text-slate-400 font-medium bg-white rounded-2xl border border-slate-200">
            {t("common.loading")}
          </div>
        ) : filtered.length > 0 ? (
          filtered.map((u) => (
            <div
              key={u.id}
              onClick={() => setSelectedDistributor(u)}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between hover:shadow-md transition-all cursor-pointer"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
                      <Building2 size={20} />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-950 text-base">
                        {u.name ?? t("distributors.unnamed")}
                      </h3>
                      <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mt-0.5">
                        {u.id.slice(0, 8)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 space-y-3 text-sm border-t border-slate-100 pt-4">
                  <div className="flex items-center gap-2 text-slate-600 font-medium">
                    <Hash size={16} className="text-slate-400" />
                    <span>
                      {t("distributors.telegram")}: {u.telegram_id}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600 font-medium">
                    <Calendar size={16} className="text-slate-400" />
                    <span>
                      {t("distributors.created")}: {u.created_at}
                    </span>
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

      {selectedDistributor && (
        <DistributorDetailsModal
          distributor={selectedDistributor}
          onClose={() => setSelectedDistributor(null)}
        />
      )}

      {isCreateOpen && (
        <CreateDistributorModal
          onClose={() => setIsCreateOpen(false)}
          isReadOnly={isReadOnly}
        />
      )}
    </div>
  );
}

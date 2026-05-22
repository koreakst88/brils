import React, { useState } from "react";
import { useTranslation } from "../i18n";
import { useAdminStore } from "../store/useAdminStore";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Search,
  ShoppingBag,
  Eye,
  Calendar,
  Package,
  ArrowRight,
  X,
  Plus,
  Trash2,
  DollarSign,
  Check,
  User,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Loader2,
  Edit2
} from "lucide-react";

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
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as OrderRow[];
}

function timeAgo(dateString: string, locale: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (seconds < 0) return date.toLocaleDateString();

  const intervals = [
    { label: { en: "year", ru: "г.", ko: "년 전" }, seconds: 31536000 },
    { label: { en: "month", ru: "мес.", ko: "달 전" }, seconds: 2592000 },
    { label: { en: "day", ru: "d.", ko: "일 전" }, seconds: 86400 },
    { label: { en: "hour", ru: "h.", ko: "시간 전" }, seconds: 3600 },
    { label: { en: "minute", ru: "m.", ko: "분 전" }, seconds: 60 },
  ];

  for (const interval of intervals) {
    const count = Math.floor(seconds / interval.seconds);
    if (count >= 1) {
      if (locale === "ru") {
        if (interval.seconds === 86400) return `${count} дн. назад`;
        if (interval.seconds === 3600) return `${count} ч. назад`;
        if (interval.seconds === 60) return `${count} мин. назад`;
        return `${count} ${interval.label.ru} назад`;
      } else if (locale === "ko") {
        return `${count}${interval.label.ko}`;
      } else {
        return `${count} ${interval.label.en}${count > 1 ? "s" : ""} ago`;
      }
    }
  }
  
  if (locale === "ru") return "только что";
  if (locale === "ko") return "방금 전";
  return "just now";
}

interface OrderDetailsModalProps {
  orderId: string;
  onClose: () => void;
  isReadOnly: boolean;
}

export function OrderDetailsModal({ orderId, onClose, isReadOnly }: OrderDetailsModalProps) {
  const { t, language } = useTranslation();
  const { user, role } = useAuth();
  const queryClient = useQueryClient();

  const [selectedStatus, setSelectedStatus] = useState("");
  const [isAddPaymentOpen, setIsAddPaymentOpen] = useState(false);
  const [newPaymentAmount, setNewPaymentAmount] = useState("");
  const [newPaymentDueDate, setNewPaymentDueDate] = useState("");

  const [editingPaymentId, setEditingPaymentId] = useState<string | null>(null);
  const [editPaymentDueDate, setEditPaymentDueDate] = useState("");

  const { data: order, isLoading: isOrderLoading, isError: isOrderError } = useQuery({
    queryKey: ["order-details", orderId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("id, distributor_id, items, total_amount, status, shipped_at, created_at, users(name)")
        .eq("id", orderId)
        .single();
      if (error) throw error;
      return data as OrderRow;
    },
    enabled: !!orderId,
  });

  React.useEffect(() => {
    if (order) {
      setSelectedStatus(order.status);
    }
  }, [order]);

  const { data: payments = [], isLoading: isPaymentsLoading } = useQuery({
    queryKey: ["order-payments", orderId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payments")
        .select("*")
        .eq("order_id", orderId)
        .order("due_date", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!orderId,
  });

  const { data: activityLog = [], isLoading: isActivityLoading } = useQuery({
    queryKey: ["order-activity", orderId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("activity_log")
        .select("*")
        .eq("entity_type", "order")
        .eq("entity_id", orderId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!orderId,
  });

  const getPaymentStatus = (p: any) => {
    if (p.status === "paid") return "paid";
    const todayStr = new Date().toISOString().split("T")[0];
    if (p.due_date < todayStr) return "overdue";
    return p.status;
  };

  const getPaymentStatusStyle = (status: string) => {
    const styles: Record<string, string> = {
      paid: "bg-emerald-50 text-emerald-700 border-emerald-100",
      pending: "bg-blue-50 text-blue-700 border-blue-100",
      overdue: "bg-red-50 text-red-700 border-red-100",
    };
    return styles[status] || "bg-slate-100 text-slate-600";
  };

  const getActionLabel = (action: string, details: any) => {
    if (action === "new_order") {
      if (language === "ru") return "Заказ создан";
      if (language === "ko") return "주문이 생성됨";
      return "Order created";
    }
    if (action === "update_status" || action === "status_changed") {
      const toStatus = details?.status || details?.to || "";
      const translatedStatus = t(`orders.status.${toStatus.toLowerCase()}`, { defaultValue: toStatus });
      if (language === "ru") return `Статус изменен на: ${translatedStatus}`;
      if (language === "ko") return `상태가 변경됨: ${translatedStatus}`;
      return `Status changed to: ${translatedStatus}`;
    }
    return action;
  };

  const updateStatusMutation = useMutation({
    mutationFn: async () => {
      if (!order) return;
      
      const updates: any = { status: selectedStatus };
      if (selectedStatus === "shipped") {
        updates.shipped_at = new Date().toISOString();
      }
      
      const { error: updateErr } = await supabase
        .from("orders")
        .update(updates)
        .eq("id", orderId);
      if (updateErr) throw updateErr;

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

      const { error: logErr } = await supabase
        .from("activity_log")
        .insert({
          user_id: dbUserId,
          action: "update_status",
          entity_type: "order",
          entity_id: orderId,
          details: { from: order.status, to: selectedStatus },
        });
      if (logErr) throw logErr;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["order-details", orderId] });
      queryClient.invalidateQueries({ queryKey: ["order-activity", orderId] });
    },
  });

  const addPaymentMutation = useMutation({
    mutationFn: async () => {
      const amount = Number(newPaymentAmount);
      if (isNaN(amount) || amount <= 0) throw new Error("Invalid payment amount");
      if (!newPaymentDueDate) throw new Error("Due date is required");

      const { error } = await supabase
        .from("payments")
        .insert({
          order_id: orderId,
          amount,
          due_date: newPaymentDueDate,
          status: "pending",
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["order-payments", orderId] });
      setIsAddPaymentOpen(false);
      setNewPaymentAmount("");
      setNewPaymentDueDate("");
    },
  });

  const updateDueDateMutation = useMutation({
    mutationFn: async ({ paymentId, dueDate }: { paymentId: string; dueDate: string }) => {
      if (!dueDate) throw new Error("Due date is required");
      
      const { error } = await supabase
        .from("payments")
        .update({ due_date: dueDate })
        .eq("id", paymentId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["order-payments", orderId] });
      setEditingPaymentId(null);
      setEditPaymentDueDate("");
    },
  });

  const markPaidMutation = useMutation({
    mutationFn: async (paymentId: string) => {
      const { error } = await supabase
        .from("payments")
        .update({
          status: "paid",
          paid_date: new Date().toISOString().split("T")[0],
        })
        .eq("id", paymentId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["order-payments", orderId] });
    },
  });

  if (isOrderLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
        <div className="bg-white rounded-2xl p-8 flex flex-col items-center justify-center space-y-4">
          <Loader2 size={32} className="animate-spin text-slate-600" />
          <span className="text-sm font-semibold text-slate-500">{t("common.loading")}</span>
        </div>
      </div>
    );
  }

  if (isOrderError || !order) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
        <div className="bg-white rounded-2xl p-8 max-w-sm flex flex-col items-center text-center space-y-4">
          <AlertTriangle size={32} className="text-red-500" />
          <span className="text-sm font-semibold text-slate-600">{t("orders.failed_to_load")}</span>
          <button onClick={onClose} className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold">
            {t("orders.close_btn")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-5xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border border-slate-100">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <ShoppingBag size={20} className="text-slate-600" />
            <h3 className="font-bold text-lg text-slate-800">
              {t("orders.details_title")}
            </h3>
            <span className="text-sm font-semibold text-slate-400">
              #{order.id.slice(0, 8)}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Left Column */}
          <div className="space-y-6">
            
            {/* Section 1: Order Information */}
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 space-y-4">
              <h4 className="text-xs uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1.5 border-b border-slate-200/60 pb-2">
                <User size={14} />
                Information
              </h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-xs text-slate-400 block mb-0.5">{t("orders.distributor")}</span>
                  <span className="font-semibold text-slate-800">
                    {order.users?.[0]?.name || t("distributors.unnamed")}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block mb-0.5">{t("common.date")}</span>
                  <span className="font-semibold text-slate-800">
                    {new Date(order.created_at).toLocaleDateString()}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block mb-0.5">{t("leads.status")}</span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border bg-blue-50 text-blue-700 border-blue-100">
                    {t(`orders.status.${order.status.toLowerCase()}`, { defaultValue: order.status })}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block mb-0.5">{t("orders.amount")}</span>
                  <span className="font-black text-slate-900 text-base">
                    ${Number(order.total_amount || 0).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Section 2: Items Table */}
            <div className="border border-slate-100 rounded-2xl overflow-hidden bg-white shadow-sm">
              <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-100 flex items-center gap-1.5">
                <Package size={14} className="text-slate-500" />
                <h4 className="text-xs uppercase font-bold text-slate-400 tracking-wider">
                  {t("orders.items_list")}
                </h4>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50 border-b border-slate-100 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                      <th className="px-5 py-3">{t("orders.product_col")}</th>
                      <th className="px-5 py-3 text-center">{t("orders.quantity_placeholder")}</th>
                      <th className="px-5 py-3 text-right">{t("orders.price_col")}</th>
                      <th className="px-5 py-3 text-right">{t("orders.total_col")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {(order.items ?? []).map((item, idx) => {
                      const price = item.price ?? 0;
                      const total = item.quantity * price;
                      return (
                        <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-5 py-3 font-semibold text-slate-800">
                            {t(`products.${item.product}`, { defaultValue: item.product })}
                          </td>
                          <td className="px-5 py-3 text-center font-bold text-slate-700">
                            {item.quantity} {t("common.units")}
                          </td>
                          <td className="px-5 py-3 text-right text-slate-500">
                            ${price.toFixed(2)}
                          </td>
                          <td className="px-5 py-3 text-right font-black text-slate-900">
                            ${total.toFixed(2)}
                          </td>
                        </tr>
                      );
                    })}
                    <tr className="bg-slate-50/30">
                      <td colSpan={3} className="px-5 py-4 text-right font-bold text-slate-600">
                        {t("orders.subtotal")}:
                      </td>
                      <td className="px-5 py-4 text-right font-black text-slate-900 text-sm">
                        ${Number(order.total_amount || 0).toFixed(2)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Section 5: Status Management */}
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 space-y-4">
              <h4 className="text-xs uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1.5 border-b border-slate-200/60 pb-2">
                <CheckCircle2 size={14} />
                {t("orders.save_status_btn")}
              </h4>
              <div className="flex flex-col sm:flex-row gap-3">
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  disabled={isReadOnly || updateStatusMutation.isPending}
                  className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all disabled:opacity-50 font-semibold hover:bg-slate-50"
                >
                  {["new", "confirmed", "processing", "shipped", "delivered", "cancelled"].map((status) => (
                    <option key={status} value={status}>
                      {t(`orders.status.${status.toLowerCase()}`, { defaultValue: status })}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => updateStatusMutation.mutate()}
                  disabled={isReadOnly || selectedStatus === order.status || updateStatusMutation.isPending}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2"
                >
                  {updateStatusMutation.isPending && <Loader2 size={14} className="animate-spin" />}
                  {t("orders.save_status_btn")}
                </button>
              </div>
            </div>

          </div>

          {/* Right Column */}
          <div className="space-y-6">

            {/* Section 4: Payments */}
            <div className="border border-slate-100 rounded-2xl overflow-hidden bg-white shadow-sm flex flex-col">
              <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <DollarSign size={14} className="text-slate-500" />
                  <h4 className="text-xs uppercase font-bold text-slate-400 tracking-wider">
                    {t("orders.payments_section")}
                  </h4>
                </div>
                <button
                  onClick={() => setIsAddPaymentOpen(true)}
                  disabled={isReadOnly || isAddPaymentOpen}
                  className="flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 disabled:opacity-50"
                >
                  <Plus size={14} />
                  {t("orders.add_payment_btn")}
                </button>
              </div>

              {/* Add Payment Sub-form */}
              {isAddPaymentOpen && (
                <div className="p-4 bg-slate-50 border-b border-slate-100 space-y-3">
                  <h5 className="text-xs font-bold text-slate-700">{t("orders.new_payment_title")}</h5>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="relative">
                      <DollarSign size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="number"
                        min="0.01"
                        step="0.01"
                        placeholder={t("orders.amount_col")}
                        value={newPaymentAmount}
                        onChange={(e) => setNewPaymentAmount(e.target.value)}
                        className="w-full pl-6 pr-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all font-bold"
                      />
                    </div>
                    <input
                      type="date"
                      value={newPaymentDueDate}
                      onChange={(e) => setNewPaymentDueDate(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all font-bold"
                    />
                  </div>
                  <div className="flex justify-end gap-2 text-xs">
                    <button
                      onClick={() => setIsAddPaymentOpen(false)}
                      className="px-2.5 py-1.5 border border-slate-200 rounded-lg hover:bg-white text-slate-600 transition-colors"
                    >
                      {t("common.cancel")}
                    </button>
                    <button
                      onClick={() => addPaymentMutation.mutate()}
                      disabled={!newPaymentAmount || !newPaymentDueDate || addPaymentMutation.isPending}
                      className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50"
                    >
                      {addPaymentMutation.isPending ? t("common.loading") : t("common.save")}
                    </button>
                  </div>
                </div>
              )}

              {/* Payments Table */}
              <div className="overflow-x-auto flex-1">
                {isPaymentsLoading ? (
                  <div className="py-8 text-center text-xs text-slate-400 font-medium">{t("common.loading")}</div>
                ) : payments.length > 0 ? (
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/50 border-b border-slate-100 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                        <th className="px-5 py-3">{t("orders.amount_col")}</th>
                        <th className="px-5 py-3">{t("orders.due_date")}</th>
                        <th className="px-5 py-3">{t("orders.status_col")}</th>
                        <th className="px-5 py-3">{t("orders.paid_date")}</th>
                        <th className="px-5 py-3 text-right">{t("orders.actions_col")}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {payments.map((p) => {
                        const status = getPaymentStatus(p);
                        const isEditing = editingPaymentId === p.id;
                        return (
                          <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-5 py-3 font-bold text-slate-900">
                              ${Number(p.amount).toFixed(2)}
                            </td>
                            <td className="px-5 py-3">
                              {isEditing ? (
                                <input
                                  type="date"
                                  value={editPaymentDueDate}
                                  onChange={(e) => setEditPaymentDueDate(e.target.value)}
                                  className="px-2 py-1 bg-white border border-slate-200 rounded text-xs focus:ring-1 focus:ring-slate-900 transition-all font-bold"
                                />
                              ) : (
                                <span className="font-medium text-slate-700">{p.due_date}</span>
                              )}
                            </td>
                            <td className="px-5 py-3">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${getPaymentStatusStyle(status)}`}>
                                {t(`orders.payment_status.${status}`)}
                              </span>
                            </td>
                            <td className="px-5 py-3 text-slate-500 font-medium">
                              {p.paid_date || "-"}
                            </td>
                            <td className="px-5 py-3 text-right">
                              <div className="flex items-center justify-end gap-2">
                                {isEditing ? (
                                  <>
                                    <button
                                      onClick={() => updateDueDateMutation.mutate({ paymentId: p.id, dueDate: editPaymentDueDate })}
                                      disabled={isReadOnly || updateDueDateMutation.isPending}
                                      className="p-1 hover:text-emerald-600 bg-emerald-50 rounded text-emerald-500 transition-colors disabled:opacity-50"
                                    >
                                      <Check size={12} />
                                    </button>
                                    <button
                                      onClick={() => setEditingPaymentId(null)}
                                      disabled={isReadOnly}
                                      className="p-1 hover:text-slate-600 bg-slate-50 rounded text-slate-400 transition-colors disabled:opacity-50"
                                    >
                                      <X size={12} />
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    <button
                                      onClick={() => {
                                        setEditingPaymentId(p.id);
                                        setEditPaymentDueDate(p.due_date);
                                      }}
                                      disabled={isReadOnly}
                                      title={t("orders.change_term")}
                                      className="p-1 hover:text-indigo-600 bg-slate-50 hover:bg-indigo-50 border border-slate-100 rounded text-slate-400 transition-all disabled:opacity-50"
                                    >
                                      <Edit2 size={12} />
                                    </button>
                                    {(status === "pending" || status === "overdue") && (
                                      <button
                                        onClick={() => markPaidMutation.mutate(p.id)}
                                        disabled={isReadOnly || markPaidMutation.isPending}
                                        className="px-2 py-1 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 text-white rounded font-bold text-[10px] transition-all disabled:opacity-50"
                                      >
                                        {t("orders.mark_paid_btn")}
                                      </button>
                                    )}
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                ) : (
                  <div className="py-8 text-center text-xs text-slate-400 font-medium">{t("common.no_data")}</div>
                )}
              </div>
            </div>

            {/* Section 3: Status History */}
            <div className="border border-slate-100 rounded-2xl overflow-hidden bg-white shadow-sm flex flex-col max-h-[300px]">
              <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-100 flex items-center gap-1.5">
                <Clock size={14} className="text-slate-500" />
                <h4 className="text-xs uppercase font-bold text-slate-400 tracking-wider">
                  {t("orders.status_history")}
                </h4>
              </div>
              <div className="p-5 overflow-y-auto flex-1">
                {isActivityLoading ? (
                  <div className="py-4 text-center text-xs text-slate-400 font-medium">{t("common.loading")}</div>
                ) : activityLog.length > 0 ? (
                  <div className="relative border-l-2 border-slate-100 pl-4 space-y-5">
                    {activityLog.map((log) => (
                      <div key={log.id} className="relative">
                        <div className="absolute -left-[23px] top-1 bg-white border-2 border-slate-200 rounded-full h-3 w-3" />
                        <div className="text-xs font-semibold text-slate-800">
                          {getActionLabel(log.action, log.details)}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5 font-medium">
                          {timeAgo(log.created_at, language)}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-4 text-center text-xs text-slate-400 font-medium">{t("common.no_data")}</div>
                )}
              </div>
            </div>

          </div>

        </div>

        {/* Buttons Footer */}
        <div className="flex items-center justify-end px-6 py-4 border-t border-slate-100 bg-slate-50/50">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-bold transition-colors shadow-sm"
          >
            {t("orders.close_btn")}
          </button>
        </div>

      </div>
    </div>
  );
}

interface CreateOrderModalProps {
  onClose: () => void;
  isReadOnly: boolean;
}

export function CreateOrderModal({ onClose, isReadOnly }: CreateOrderModalProps) {
  const { t } = useTranslation();
  const { user, role } = useAuth();
  const queryClient = useQueryClient();

  const [distributorId, setDistributorId] = useState("");
  const [selectedItems, setSelectedItems] = useState<Record<string, { checked: boolean; quantity: number }>>({});
  const [installments, setInstallments] = useState<Array<{ amount: number; dueDate: string }>>([]);

  const { data: distributors = [], isLoading: isDistributorsLoading } = useQuery({
    queryKey: ["distributors-select"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("users")
        .select("id, name, telegram_id")
        .eq("role", "user")
        .order("name", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const { data: pricing = [], isLoading: isPricingLoading } = useQuery({
    queryKey: ["pricing-select"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pricing")
        .select("product, price")
        .order("product", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  React.useEffect(() => {
    if (pricing.length > 0) {
      const initial: Record<string, { checked: boolean; quantity: number }> = {};
      pricing.forEach((p) => {
        initial[p.product] = { checked: false, quantity: 1 };
      });
      setSelectedItems(initial);
    }
  }, [pricing]);

  const handleCheckboxChange = (product: string, checked: boolean) => {
    setSelectedItems((prev) => ({
      ...prev,
      [product]: { ...prev[product], checked },
    }));
  };

  const handleQuantityChange = (product: string, quantity: number) => {
    setSelectedItems((prev) => ({
      ...prev,
      [product]: { ...prev[product], quantity: Math.max(1, quantity) },
    }));
  };

  const totalAmount = pricing.reduce((sum, p) => {
    const item = selectedItems[p.product];
    if (item?.checked) {
      return sum + p.price * item.quantity;
    }
    return sum;
  }, 0);

  const addInstallment = () => {
    const today = new Date().toISOString().split("T")[0];
    const currentInstallmentsTotal = installments.reduce((sum, inst) => sum + inst.amount, 0);
    const remaining = Math.max(0, totalAmount - currentInstallmentsTotal);
    setInstallments((prev) => [...prev, { amount: remaining, dueDate: today }]);
  };

  const updateInstallment = (index: number, field: "amount" | "dueDate", value: any) => {
    setInstallments((prev) => {
      const next = [...prev];
      if (field === "amount") {
        next[index] = { ...next[index], amount: Math.max(0, Number(value)) };
      } else {
        next[index] = { ...next[index], dueDate: value };
      }
      return next;
    });
  };

  const removeInstallment = (index: number) => {
    setInstallments((prev) => prev.filter((_, i) => i !== index));
  };

  const createOrderMutation = useMutation({
    mutationFn: async () => {
      const itemsList = pricing
        .filter((p) => selectedItems[p.product]?.checked)
        .map((p) => ({
          product: p.product,
          quantity: selectedItems[p.product].quantity,
          price: p.price,
        }));

      if (!distributorId) throw new Error("Distributor is required");
      if (itemsList.length === 0) throw new Error("At least one product must be selected");

      const { data: newOrder, error: orderErr } = await supabase
        .from("orders")
        .insert({
          distributor_id: distributorId,
          items: itemsList,
          total_amount: totalAmount,
          status: "new",
        })
        .select()
        .single();
      if (orderErr) throw orderErr;

      if (installments.length > 0) {
        const { error: payErr } = await supabase
          .from("payments")
          .insert(
            installments.map((inst) => ({
              order_id: newOrder.id,
              amount: inst.amount,
              due_date: inst.dueDate,
              status: "pending",
            }))
          );
        if (payErr) throw payErr;
      }

      const { error: invErr } = await supabase
        .from("inventory_transactions")
        .insert(
          itemsList.map((item) => ({
            product: item.product,
            quantity: -item.quantity,
            type: "outgoing",
            order_id: newOrder.id,
            notes: `Order created: ${newOrder.id.slice(0, 8)}`,
          }))
        );
      if (invErr) throw invErr;

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

      const { error: logErr } = await supabase
        .from("activity_log")
        .insert({
          user_id: dbUserId,
          action: "new_order",
          entity_type: "order",
          entity_id: newOrder.id,
          details: { total_amount: totalAmount, items_count: itemsList.length },
        });
      if (logErr) throw logErr;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      queryClient.invalidateQueries({ queryKey: ["activity_log"] });
      onClose();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly) return;
    createOrderMutation.mutate();
  };

  const isFormValid =
    distributorId &&
    pricing.some((p) => selectedItems[p.product]?.checked) &&
    !isReadOnly;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border border-slate-100">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
            <ShoppingBag size={20} className="text-slate-600" />
            {t("orders.new_order_title")}
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {createOrderMutation.isError && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-xs font-semibold">
              {(createOrderMutation.error as any)?.message || "Failed to create order"}
            </div>
          )}

          {/* Distributor Select */}
          <div className="space-y-2">
            <label className="text-xs uppercase font-bold text-slate-400 tracking-wider">
              {t("orders.distributor")} <span className="text-red-500">*</span>
            </label>
            <select
              value={distributorId}
              onChange={(e) => setDistributorId(e.target.value)}
              disabled={isReadOnly || isDistributorsLoading}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all disabled:opacity-50 hover:bg-slate-100/50"
            >
              <option value="">{t("orders.select_distributor_placeholder")}</option>
              {distributors.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name || `${t("distributors.unnamed")} (${d.telegram_id})`}
                </option>
              ))}
            </select>
          </div>

          {/* Products Section */}
          <div className="space-y-2">
            <label className="text-xs uppercase font-bold text-slate-400 tracking-wider block">
              {t("orders.items_list")} <span className="text-red-500">*</span>
            </label>
            {isPricingLoading ? (
              <div className="text-center py-4 text-xs text-slate-400 font-medium">{t("common.loading")}</div>
            ) : (
              <div className="border border-slate-100 rounded-xl divide-y divide-slate-100 bg-slate-50/30 overflow-hidden">
                {pricing.map((p) => {
                  const state = selectedItems[p.product] || { checked: false, quantity: 1 };
                  return (
                    <div key={p.product} className="flex items-center justify-between p-3 gap-4">
                      <label className="flex items-center gap-3 cursor-pointer flex-1 select-none">
                        <input
                          type="checkbox"
                          checked={state.checked}
                          onChange={(e) => handleCheckboxChange(p.product, e.target.checked)}
                          disabled={isReadOnly}
                          className="h-4.5 w-4.5 rounded border-slate-300 text-slate-900 focus:ring-slate-900 disabled:opacity-50"
                        />
                        <div>
                          <span className="text-sm font-semibold text-slate-800">
                            {t(`products.${p.product}`, { defaultValue: p.product })}
                          </span>
                          <span className="text-xs text-slate-400 block mt-0.5">
                            ${Number(p.price).toFixed(2)}
                          </span>
                        </div>
                      </label>

                      {state.checked && (
                        <div className="flex items-center gap-2">
                          <label className="text-xs text-slate-400 font-medium">
                            {t("orders.quantity_placeholder")}:
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={state.quantity}
                            onChange={(e) => handleQuantityChange(p.product, parseInt(e.target.value) || 1)}
                            disabled={isReadOnly}
                            className="w-16 px-2 py-1 text-center bg-white border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all disabled:opacity-50 font-bold"
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Dynamic Sum & Payment installments */}
          <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-bold text-slate-600">{t("orders.subtotal")}:</span>
              <span className="text-xl font-black text-slate-900">${totalAmount.toFixed(2)}</span>
            </div>

            {/* Installments builder */}
            <div className="border-t border-slate-200/60 pt-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs uppercase font-bold text-slate-400 tracking-wider">
                  {t("orders.optional_payments")}
                </span>
                <button
                  type="button"
                  onClick={addInstallment}
                  disabled={isReadOnly || totalAmount === 0}
                  className="flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 disabled:opacity-50"
                >
                  <Plus size={14} />
                  {t("orders.add_payment_btn")}
                </button>
              </div>

              {installments.length > 0 && (
                <div className="space-y-2">
                  {installments.map((inst, index) => (
                    <div key={index} className="flex items-center gap-2.5 bg-white border border-slate-100 p-2.5 rounded-lg">
                      <div className="flex-1 flex gap-2">
                        <div className="relative flex-1">
                          <DollarSign size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder={t("orders.amount_col")}
                            value={inst.amount || ""}
                            onChange={(e) => updateInstallment(index, "amount", e.target.value)}
                            disabled={isReadOnly}
                            className="w-full pl-7 pr-2.5 py-1.5 bg-slate-50/50 border border-slate-200 rounded-lg text-xs font-bold focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all disabled:opacity-50"
                          />
                        </div>
                        <input
                          type="date"
                          value={inst.dueDate}
                          onChange={(e) => updateInstallment(index, "dueDate", e.target.value)}
                          disabled={isReadOnly}
                          className="flex-1 px-2.5 py-1.5 bg-slate-50/50 border border-slate-200 rounded-lg text-xs font-bold focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all disabled:opacity-50"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeInstallment(index)}
                        disabled={isReadOnly}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}

                  {/* Installments sum warning */}
                  {Math.abs(installments.reduce((sum, inst) => sum + inst.amount, 0) - totalAmount) > 0.01 && (
                    <p className="text-[11px] font-semibold text-amber-600 flex items-center gap-1 mt-1.5">
                      <AlertTriangle size={12} />
                      Installments sum (${installments.reduce((sum, inst) => sum + inst.amount, 0).toFixed(2)}) differs from Order Total (${totalAmount.toFixed(2)})
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Buttons Footer */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              {t("common.cancel")}
            </button>
            <button
              type="submit"
              disabled={!isFormValid || createOrderMutation.isPending}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-xl text-sm font-bold shadow-sm transition-all flex items-center gap-2"
            >
              {createOrderMutation.isPending && <Loader2 size={16} className="animate-spin" />}
              {t("orders.create_order_btn")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function Orders() {
  const { t } = useTranslation();
  const { filters, setFilters } = useAdminStore();
  const { role } = useAuth();
  const isReadOnly = role === "owner";

  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const { data: orders = [], isLoading, isError, refetch } = useQuery({
    queryKey: ["orders"],
    queryFn: fetchOrders,
  });

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
        {t(`orders.status.${status.toLowerCase()}`)}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">{t("orders.title")}</h2>
          <p className="text-slate-500 mt-1">{t("orders.subtitle")}</p>
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
          {t("orders.new_order_btn")}
        </button>
      </div>

      {isError ? (
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between gap-4">
          <span className="text-sm font-semibold text-slate-600">{t("orders.failed_to_load")}</span>
          <button
            type="button"
            onClick={() => refetch()}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold border bg-slate-900 text-white border-slate-900 shadow-sm"
          >
            {t("common.retry")}
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
              {status === "all" ? t("common.filter_all") : t(`orders.status.${status}`)}
            </button>
          ))}
        </div>
      </div>

      {/* Orders list */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="py-12 text-center text-slate-400 font-medium bg-white rounded-2xl border border-slate-200">
            {t("common.loading")}
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
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">{t("orders.items_list")}</span>
                  <div className="flex flex-wrap gap-4 text-xs font-semibold text-slate-700">
                    {(order.items ?? []).map((item, idx) => (
                      <span key={idx} className="flex items-center gap-1.5 bg-white border border-slate-200 px-2.5 py-1 rounded-lg">
                        <Package size={12} className="text-slate-400" />
                        {t("products." + item.product, { defaultValue: item.product })}: <strong className="text-slate-950">{item.quantity} {t("common.units")}</strong>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Delivery details */}
                <div className="text-left md:text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">{t("orders.logistics_delivery")}</span>
                  <span className="text-xs text-slate-600 font-bold block mt-1">
                    {order.shipped_at ? `${t("orders.shipped")}: ${order.shipped_at.split("T")[0]}` : "-"}
                  </span>
                </div>
              </div>

              {/* Card actions */}
              <div className="px-6 py-3 flex items-center justify-between border-t border-slate-100 text-xs">
                <span className="text-slate-400 font-semibold">{t("orders.payment_terms_value")}</span>
                <button
                  onClick={() => setSelectedOrderId(order.id)}
                  className="flex items-center gap-1.5 text-slate-700 hover:text-slate-950 font-bold hover:underline transition-all"
                >
                  {t("orders.process_logistics")}
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

      {selectedOrderId && (
        <OrderDetailsModal
          orderId={selectedOrderId}
          onClose={() => setSelectedOrderId(null)}
          isReadOnly={isReadOnly}
        />
      )}

      {isCreateOpen && (
        <CreateOrderModal
          onClose={() => setIsCreateOpen(false)}
          isReadOnly={isReadOnly}
        />
      )}
    </div>
  );
}

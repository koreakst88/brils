import React, { useState } from "react";
import { useTranslation } from "../i18n";
import { useAdminStore } from "../store/useAdminStore";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Search,
  MessageSquare,
  Check,
  X,
  Eye,
  Loader2,
  Calendar,
  Globe,
  Tag,
  Phone,
  User,
  ArrowRight,
  AlertTriangle,
  Award
} from "lucide-react";

type LeadRow = {
  id: string;
  telegram_id: number;
  country: string;
  intent: string | null;
  products: string[] | null;
  created_at: string;
  status: string;
  name: string | null;
  whatsapp: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
};

async function fetchLeads(): Promise<LeadRow[]> {
  const { data, error } = await supabase
    .from("leads")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as LeadRow[];
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

interface LeadDetailsModalProps {
  lead: LeadRow;
  onClose: () => void;
  onConvert: (lead: LeadRow) => void;
  isReadOnly: boolean;
  onUpdateStatus: (status: string) => void;
  isUpdating: boolean;
}

export function LeadDetailsModal({
  lead,
  onClose,
  onConvert,
  isReadOnly,
  onUpdateStatus,
  isUpdating,
}: LeadDetailsModalProps) {
  const { t, language } = useTranslation();
  const [status, setStatus] = useState(lead.status || "new");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border border-slate-100">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <User size={20} className="text-slate-600" />
            <h3 className="font-bold text-lg text-slate-800">
              {t("leads.details_title")}
            </h3>
            <span className="text-sm font-semibold text-slate-400">
              #{lead.id.slice(0, 8)}
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
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Section 1: Lead Information */}
          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 space-y-4">
            <h4 className="text-xs uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1.5 border-b border-slate-200/60 pb-2">
              <User size={14} />
              {t("protected.identity")}
            </h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-xs text-slate-400 block mb-0.5">{t("leads.name")}</span>
                <span className="font-semibold text-slate-800 break-all">{lead.name || "—"}</span>
              </div>
              <div>
                <span className="text-xs text-slate-400 block mb-0.5">{t("leads.whatsapp")}</span>
                <span className="font-semibold text-slate-800">{lead.whatsapp || "—"}</span>
              </div>
              <div>
                <span className="text-xs text-slate-400 block mb-0.5">{t("leads.country")}</span>
                <span className="font-semibold text-slate-800">
                  {t(`countries.${lead.country.toLowerCase()}`, { defaultValue: lead.country })}
                </span>
              </div>
              <div>
                <span className="text-xs text-slate-400 block mb-0.5">{t("leads.intent")}</span>
                <span className="font-semibold text-slate-800 break-all">
                  {lead.intent ? t(`leads.intent_${lead.intent.toLowerCase()}`, { defaultValue: lead.intent }) : "—"}
                </span>
              </div>
              <div>
                <span className="text-xs text-slate-400 block mb-0.5">{t("leads.status")}</span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border bg-blue-50 text-blue-700 border-blue-100">
                  {t(`leads.status_${(lead.status || "new").toLowerCase()}`)}
                </span>
              </div>
              <div>
                <span className="text-xs text-slate-400 block mb-0.5">{t("leads.date_created")}</span>
                <span className="font-semibold text-slate-800">
                  {timeAgo(lead.created_at, language)}
                </span>
              </div>
            </div>
          </div>

          {/* Section 2: Selected Products */}
          <div className="space-y-2">
            <h4 className="text-xs uppercase font-bold text-slate-400 tracking-wider">
              {t("leads.products")}
            </h4>
            <div className="flex flex-wrap gap-2">
              {(lead.products ?? []).length > 0 ? (
                (lead.products ?? []).map((p, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100"
                  >
                    {t(`products.${p}`, { defaultValue: p })}
                  </span>
                ))
              ) : (
                <span className="text-sm text-slate-400">—</span>
              )}
            </div>
          </div>

          {/* Section 3: UTM Tags */}
          {(lead.utm_source || lead.utm_medium || lead.utm_campaign) && (
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 space-y-3">
              <h4 className="text-xs uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1.5 border-b border-slate-200/60 pb-2">
                <Tag size={14} />
                {t("leads.utm_tags")}
              </h4>
              <div className="grid grid-cols-3 gap-4 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block mb-0.5">Source</span>
                  <span className="font-semibold text-slate-800 break-all">{lead.utm_source || "—"}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block mb-0.5">Medium</span>
                  <span className="font-semibold text-slate-800 break-all">{lead.utm_medium || "—"}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block mb-0.5">Campaign</span>
                  <span className="font-semibold text-slate-800 break-all">{lead.utm_campaign || "—"}</span>
                </div>
              </div>
            </div>
          )}

          {/* Section 4: Actions */}
          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 space-y-4">
            <h4 className="text-xs uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1.5 border-b border-slate-200/60 pb-2">
              <Award size={14} />
              {t("leads.action")}
            </h4>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                disabled={isReadOnly || isUpdating}
                className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all disabled:opacity-50 font-semibold hover:bg-slate-50"
              >
                {["new", "contacted", "qualified", "converted", "lost"].map(
                  (st) => (
                    <option key={st} value={st}>
                      {t(`leads.status_${st.toLowerCase()}`)}
                    </option>
                  ),
                )}
              </select>
              <button
                onClick={() => onUpdateStatus(status)}
                disabled={
                  isReadOnly ||
                  status === lead.status ||
                  isUpdating
                }
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2"
              >
                {isUpdating && (
                  <Loader2 size={14} className="animate-spin" />
                )}
                {t("leads.save_status")}
              </button>
            </div>

            {(lead.status === "qualified" || lead.status === "contacted") && (
              <div className="pt-2 border-t border-slate-200/60">
                <button
                  type="button"
                  disabled={isReadOnly}
                  onClick={() => onConvert(lead)}
                  className="w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
                >
                  <ArrowRight size={16} />
                  {t("leads.convert_btn")}
                </button>
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

interface ConvertDistributorModalProps {
  lead: LeadRow;
  onClose: () => void;
  isReadOnly: boolean;
}

export function ConvertDistributorModal({ lead, onClose, isReadOnly }: ConvertDistributorModalProps) {
  const { t, language } = useTranslation();
  const { user, role } = useAuth();
  const queryClient = useQueryClient();

  const [name, setName] = useState(lead.name || "");
  const [whatsapp, setWhatsapp] = useState(lead.whatsapp || "");
  const [country, setCountry] = useState(lead.country || "Other");
  const [telegramId, setTelegramId] = useState(
    lead.telegram_id ? String(lead.telegram_id) : "",
  );
  const [notes, setNotes] = useState("");

  const convertMutation = useMutation({
    mutationFn: async () => {
      // 1. Generate unique telegram_id: timestamp * 10000 + random(0-9999)
      const tgIdNum =
        Date.now() * 10000 + Math.floor(Math.random() * 10000);

      // 2. Insert new user (distributor)
      const { data: newUser, error: userErr } = await supabase
        .from("users")
        .insert({
          telegram_id: tgIdNum,
          name: name.trim(),
          role: "user",
          whatsapp: whatsapp.trim() || null,
        })
        .select()
        .single();
      if (userErr) {
        console.error("[users INSERT error]", {
          message: userErr.message,
          details: userErr.details,
          hint: userErr.hint,
          code: userErr.code,
        });
        throw userErr;
      }

      // 3. Update lead status to converted
      const { error: leadErr } = await supabase
        .from("leads")
        .update({ status: "converted" })
        .eq("id", lead.id);
      if (leadErr) throw leadErr;

      // 4. Resolve admin user id for activity log
      const dbUserId = await (async () => {
        if (
          user &&
          /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
            user.id,
          )
        ) {
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

      // 5. Log conversion activity
      const { error: logErr } = await supabase
        .from("activity_log")
        .insert({
          user_id: dbUserId,
          action: "lead_converted",
          entity_type: "lead",
          entity_id: lead.id,
          details: {
            distributor_id: newUser.id,
            name: name.trim(),
            telegram_id: tgIdNum,
            notes: notes.trim() || null,
          },
        });
      if (logErr) throw logErr;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      onClose();
    },
    onError: (error: any) => {
      console.error("[convertMutation error]", {
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
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border border-slate-100">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <Award size={20} className="text-indigo-600" />
            <h3 className="font-bold text-lg text-slate-800">
              {t("leads.convert_title")}
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
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {convertMutation.isError && (
            <div className="p-3 bg-red-50 border border-red-100 text-red-600 rounded-xl text-xs font-semibold flex items-center gap-2">
              <AlertTriangle size={16} />
              <span>{convertMutation.error instanceof Error ? convertMutation.error.message : "Error converting lead"}</span>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t("leads.name")}</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isReadOnly || convertMutation.isPending}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-950 focus:bg-white transition-all font-semibold disabled:opacity-50"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t("leads.whatsapp")}</label>
            <input
              type="text"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              disabled={isReadOnly || convertMutation.isPending}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-950 focus:bg-white transition-all font-semibold disabled:opacity-50"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t("leads.country")}</label>
            <select
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              disabled={isReadOnly || convertMutation.isPending}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-950 focus:bg-white transition-all font-semibold disabled:opacity-50"
            >
              {["KZ", "UZ", "KG", "TM", "Other"].map((code) => (
                <option key={code} value={code}>
                  {t(`countries.${code.toLowerCase()}`, { defaultValue: code })}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {t("leads.telegram_id")}
            </label>
            <input
              type="number"
              value={telegramId}
              onChange={(e) => setTelegramId(e.target.value)}
              disabled={isReadOnly || convertMutation.isPending}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-950 focus:bg-white transition-all font-semibold disabled:opacity-50 font-mono"
              placeholder={t("leads.telegram_id_placeholder")}
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t("leads.notes")}</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={isReadOnly || convertMutation.isPending}
              rows={3}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-950 focus:bg-white transition-all font-semibold disabled:opacity-50"
              placeholder={t("leads.notes_placeholder")}
            />
          </div>
        </div>

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
            onClick={() => convertMutation.mutate()}
            disabled={isReadOnly || convertMutation.isPending || !name.trim() || !telegramId.trim()}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-xl text-sm font-bold transition-all flex items-center gap-2"
          >
            {convertMutation.isPending && <Loader2 size={14} className="animate-spin" />}
            {t("leads.create_distributor_btn")}
          </button>
        </div>

      </div>
    </div>
  );
}

export function Leads() {
  const { t } = useTranslation();
  const { filters, setFilters } = useAdminStore();
  const { role } = useAuth();
  const isReadOnly = role === "owner";
  const queryClient = useQueryClient();

  const [selectedLead, setSelectedLead] = useState<LeadRow | null>(null);
  const [convertingLead, setConvertingLead] = useState<LeadRow | null>(null);

  const { data: leads = [], isLoading, isError, refetch } = useQuery({
    queryKey: ["leads"],
    queryFn: fetchLeads,
  });

  const updateLeadStatus = useMutation({
    mutationFn: async ({
      leadId,
      status,
    }: {
      leadId: string;
      status: string;
    }) => {
      const { error } = await supabase
        .from("leads")
        .update({ status })
        .eq("id", leadId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
    },
  });

  const filteredLeads = leads.filter((lead) => {
    const haystack = [
      lead.id,
      String(lead.telegram_id ?? ""),
      lead.country,
      lead.intent ?? "",
      ...(lead.products ?? []),
      lead.name ?? "",
      lead.whatsapp ?? "",
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    const matchesSearch = haystack.includes(filters.search.toLowerCase());

    const matchesStatus =
      filters.status === "all" ||
      (lead.status || "new").toLowerCase() === filters.status.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      new: "bg-blue-50 text-blue-700 border-blue-100",
      contacted: "bg-amber-50 text-amber-700 border-amber-100",
      qualified: "bg-violet-50 text-violet-700 border-violet-100",
      converted: "bg-emerald-50 text-emerald-700 border-emerald-100",
      lost: "bg-rose-50 text-rose-700 border-rose-100",
      closed: "bg-slate-100 text-slate-600 border-slate-200",
    };

    const statusVal = status.toLowerCase();

    return (
      <span
        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${styles[statusVal] || "bg-slate-50 text-slate-700 border-slate-100"}`}
      >
        {t(`leads.status_${statusVal}`)}
      </span>
    );
  };

  const handleOpenConvert = (lead: LeadRow) => {
    setSelectedLead(null);
    setConvertingLead(lead);
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
            {t("leads.failed_to_load")}
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
          {["all", "new", "contacted", "qualified", "converted", "lost"].map(
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
                {status === "all" ? t("common.filter_all") : t(`leads.status_${status.toLowerCase()}`)}
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
                <th className="px-6 py-4">{t("leads.products")}</th>
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
                    {t("common.loading")}
                  </td>
                </tr>
              ) : filteredLeads.length > 0 ? (
                filteredLeads.map((lead) => (
                  <tr
                    key={lead.id}
                    className="hover:bg-slate-50 transition-colors cursor-pointer"
                    onClick={(e) => {
                      const target = e.target as HTMLElement;
                      if (target.closest("button") || target.closest("select")) return;
                      setSelectedLead(lead);
                    }}
                  >
                    <td className="px-6 py-4 font-mono font-semibold text-slate-600">
                      {lead.id.slice(0, 8)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900">
                        {lead.name ? lead.name : `${t("common.telegram_id")}: ${lead.telegram_id}`}
                      </div>
                      <div className="text-xs text-slate-400 font-medium flex items-center gap-1.5 mt-0.5">
                        <MessageSquare size={12} />
                        {t(`countries.${lead.country.toLowerCase()}`, { defaultValue: lead.country })}
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
                            {t(`products.${p}`, { defaultValue: p })}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4">{getStatusBadge(lead.status || "new")}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          disabled={
                            isReadOnly ||
                            updateLeadStatus.isPending ||
                            lead.status === "qualified"
                          }
                          title={
                            isReadOnly
                              ? t("common.readonly_tooltip")
                              : t("leads.qualify")
                          }
                          onClick={() =>
                            updateLeadStatus.mutate({
                              leadId: lead.id,
                              status: "qualified",
                            })
                          }
                          className={`p-1.5 rounded-lg transition-colors ${
                            isReadOnly || lead.status === "qualified"
                              ? "text-slate-200 cursor-not-allowed opacity-50"
                              : "text-slate-400 hover:text-emerald-600 hover:bg-emerald-50"
                          }`}
                        >
                          <Check size={16} />
                        </button>
                        <button
                          disabled={
                            isReadOnly ||
                            updateLeadStatus.isPending ||
                            lead.status === "lost"
                          }
                          title={
                            isReadOnly
                              ? t("common.readonly_tooltip")
                              : t("leads.reject")
                          }
                          onClick={() =>
                            updateLeadStatus.mutate({
                              leadId: lead.id,
                              status: "lost",
                            })
                          }
                          className={`p-1.5 rounded-lg transition-colors ${
                            isReadOnly || lead.status === "lost"
                              ? "text-slate-200 cursor-not-allowed opacity-50"
                              : "text-slate-400 hover:text-red-600 hover:bg-red-50"
                          }`}
                        >
                          <X size={16} />
                        </button>
                        <button
                          title={t("common.view_details")}
                          onClick={() => setSelectedLead(lead)}
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

      {selectedLead && (
        <LeadDetailsModal
          lead={selectedLead}
          onClose={() => setSelectedLead(null)}
          onConvert={handleOpenConvert}
          isReadOnly={isReadOnly}
          onUpdateStatus={(newStatus) => {
            updateLeadStatus.mutate(
              { leadId: selectedLead.id, status: newStatus },
              {
                onSuccess: () => {
                  setSelectedLead(null);
                },
              },
            );
          }}
          isUpdating={updateLeadStatus.isPending}
        />
      )}

      {convertingLead && (
        <ConvertDistributorModal
          lead={convertingLead}
          onClose={() => setConvertingLead(null)}
          isReadOnly={isReadOnly}
        />
      )}
    </div>
  );
}

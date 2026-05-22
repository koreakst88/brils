import React from "react";
import { useTranslation } from "../i18n";
import { useAdminStore } from "../store/useAdminStore";
import { supabase } from "../lib/supabase";
import { useQuery } from "@tanstack/react-query";
import {
  TrendingUp,
  Users,
  Building2,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  AlertCircle,
  RefreshCw,
  MessageSquare,
  CheckSquare,
  Package,
  Activity as ActivityIcon,
  Tag,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

interface DashboardData {
  stats: {
    totalSales: number;
    salesChange: number;
    leadsCount: number;
    leadsChange: number;
    activeDistributors: number;
    distributorsChange: number;
    pendingOrders: number;
    pendingChange: number;
  };
  chartData: Array<{ date: string; amount: number }>;
  activities: Array<{
    id: string;
    action: string;
    entity_type: string;
    entity_id: string;
    created_at: string;
    user_name?: string;
  }>;
}

const fetchDashboardData = async (): Promise<DashboardData> => {
  const now = new Date();
  const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();

  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

  // Queries using Promise.all
  const [
    currentMonthSalesRes,
    lastMonthSalesRes,
    currentLeadsRes,
    lastLeadsRes,
    currentDistributorsRes,
    lastDistributorsRes,
    currentPendingRes,
    lastPendingRes,
    chartOrdersRes,
    activitiesRes,
  ] = await Promise.all([
    supabase
      .from("orders")
      .select("total_amount.sum()")
      .gte("created_at", startOfCurrentMonth)
      .eq("is_deleted", false),
    supabase
      .from("orders")
      .select("total_amount.sum()")
      .gte("created_at", startOfLastMonth)
      .lt("created_at", startOfCurrentMonth)
      .eq("is_deleted", false),
    supabase.from("leads").select("id", { count: "exact", head: true }).gte("created_at", sevenDaysAgo),
    supabase.from("leads").select("id", { count: "exact", head: true }).gte("created_at", fourteenDaysAgo).lt("created_at", sevenDaysAgo),
    supabase.from("users").select("id", { count: "exact", head: true }).eq("role", "user"),
    supabase.from("users").select("id", { count: "exact", head: true }).eq("role", "user").lt("created_at", startOfCurrentMonth),
    supabase.from("orders").select("id", { count: "exact", head: true }).in("status", ["new", "confirmed", "processing"]).eq("is_deleted", false),
    supabase.from("orders").select("id", { count: "exact", head: true }).in("status", ["new", "confirmed", "processing"]).lt("created_at", sevenDaysAgo).eq("is_deleted", false),
    supabase.from("orders").select("created_at, total_amount").gte("created_at", thirtyDaysAgo).eq("is_deleted", false).order("created_at", { ascending: true }),
    supabase.from("activity_log").select("id, action, entity_type, entity_id, created_at, user_id").order("created_at", { ascending: false }).limit(5),
  ]);

  if (currentMonthSalesRes.error) throw currentMonthSalesRes.error;
  if (lastMonthSalesRes.error) throw lastMonthSalesRes.error;
  if (currentLeadsRes.error) throw currentLeadsRes.error;
  if (lastLeadsRes.error) throw lastLeadsRes.error;
  if (currentDistributorsRes.error) throw currentDistributorsRes.error;
  if (lastDistributorsRes.error) throw lastDistributorsRes.error;
  if (currentPendingRes.error) throw currentPendingRes.error;
  if (lastPendingRes.error) throw lastPendingRes.error;
  if (chartOrdersRes.error) throw chartOrdersRes.error;
  if (activitiesRes.error) throw activitiesRes.error;

  const totalSales = Number((currentMonthSalesRes.data?.[0] as any)?.sum ?? 0);
  const lastSales = Number((lastMonthSalesRes.data?.[0] as any)?.sum ?? 0);
  const salesChange = lastSales > 0 ? ((totalSales - lastSales) / lastSales) * 100 : 0;

  const leadsCount = currentLeadsRes.count || 0;
  const lastLeads = lastLeadsRes.count || 0;
  const leadsChange = lastLeads > 0 ? ((leadsCount - lastLeads) / lastLeads) * 100 : 0;

  const activeDistributors = currentDistributorsRes.count || 0;
  const lastDistributors = lastDistributorsRes.count || 0;
  const distributorsChange = lastDistributors > 0 ? ((activeDistributors - lastDistributors) / lastDistributors) * 100 : 0;

  const pendingOrders = currentPendingRes.count || 0;
  const lastPending = lastPendingRes.count || 0;
  const pendingChange = lastPending > 0 ? ((pendingOrders - lastPending) / lastPending) * 100 : 0;

  const dailyDataMap: Record<string, number> = {};
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const dateStr = d.toISOString().split("T")[0];
    dailyDataMap[dateStr] = 0;
  }

  chartOrdersRes.data.forEach((o) => {
    const dateStr = o.created_at.split("T")[0];
    if (dailyDataMap[dateStr] !== undefined) {
      dailyDataMap[dateStr] += Number(o.total_amount);
    }
  });

  const chartData = Object.entries(dailyDataMap).map(([date, amount]) => ({
    date: date.substring(5), // MM-DD
    amount,
  }));

  const userIds = activitiesRes.data.map(a => a.user_id).filter(Boolean) as string[];
  let userNamesMap: Record<string, string> = {};
  if (userIds.length > 0) {
    const { data: usersData } = await supabase.from("users").select("id, name").in("id", userIds);
    if (usersData) {
      usersData.forEach(u => {
        userNamesMap[u.id] = u.name || "";
      });
    }
  }

  const activities = activitiesRes.data.map((a) => ({
    id: a.id,
    action: a.action,
    entity_type: a.entity_type,
    entity_id: a.entity_id,
    created_at: a.created_at,
    user_name: userNamesMap[a.user_id || ""] || "System",
  }));

  return {
    stats: {
      totalSales,
      salesChange,
      leadsCount,
      leadsChange,
      activeDistributors,
      distributorsChange,
      pendingOrders,
      pendingChange,
    },
    chartData,
    activities,
  };
};

function formatRelativeTime(dateStr: string, currentLang: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (60 * 1000));
  const diffHours = Math.floor(diffMs / (60 * 60 * 1000));
  const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));

  if (currentLang === "ru") {
    if (diffMins < 1) return "Только что";
    if (diffMins < 60) return `${diffMins} мин. назад`;
    if (diffHours < 24) return `${diffHours} ч. назад`;
    return `${diffDays} дн. назад`;
  } else if (currentLang === "ko") {
    if (diffMins < 1) return "방금 전";
    if (diffMins < 60) return `${diffMins}분 전`;
    if (diffHours < 24) return `${diffHours}시간 전`;
    return `${diffDays}일 전`;
  } else {
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  }
}

function getActivityIcon(entityType: string) {
  switch (entityType) {
    case "lead":
      return { icon: MessageSquare, bg: "bg-blue-50 text-blue-600 border-blue-100" };
    case "order":
      return { icon: CheckSquare, bg: "bg-emerald-50 text-emerald-600 border-emerald-100" };
    case "inventory":
      return { icon: Package, bg: "bg-amber-50 text-amber-600 border-amber-100" };
    case "distributor":
      return { icon: Building2, bg: "bg-purple-50 text-purple-600 border-purple-100" };
    case "pricing":
      return { icon: Tag, bg: "bg-pink-50 text-pink-600 border-pink-100" };
    default:
      return { icon: ActivityIcon, bg: "bg-slate-50 text-slate-600 border-slate-100" };
  }
}

function formatActivityMessage(act: any, currentLang: string): string {
  const { action, entity_type, user_name } = act;
  const target = user_name || "System";

  if (currentLang === "ru") {
    switch (entity_type) {
      case "lead":
        return `${target} создал новый лид`;
      case "order":
        return `${target} изменил статус заказа на "${action}"`;
      case "inventory":
        return `Система: низкий остаток на складе`;
      case "distributor":
        return `${target} подписал контракт дистрибьютора`;
      case "pricing":
        return `${target} обновил цены на продукты`;
      default:
        return `${target} совершил действие ${action} для ${entity_type}`;
    }
  } else if (currentLang === "ko") {
    switch (entity_type) {
      case "lead":
        return `${target}님이 새 리드를 생성했습니다`;
      case "order":
        return `${target}님이 주문 상태를 "${action}"(으)로 변경했습니다`;
      case "inventory":
        return `시스템: 재고 부족 경고`;
      case "distributor":
        return `${target}님이 파트너 계약을 체결했습니다`;
      case "pricing":
        return `${target}님이 제품 가격을 업데이트했습니다`;
      default:
        return `${target}님이 ${entity_type}에 ${action} 작업을 수행했습니다`;
    }
  } else {
    switch (entity_type) {
      case "lead":
        return `${target} created a new lead`;
      case "order":
        return `${target} updated order status to "${action}"`;
      case "inventory":
        return `System: low stock warning`;
      case "distributor":
        return `${target} signed a distributor contract`;
      case "pricing":
        return `${target} updated product pricing`;
      default:
        return `${target} performed ${action} on ${entity_type}`;
    }
  }
}

export function Dashboard() {
  const { t, language: currentLang } = useTranslation();
  const { filters, setFilters } = useAdminStore();

  const { data, isLoading, isError, refetch } = useQuery<DashboardData>({
    queryKey: ["dashboardData"],
    queryFn: fetchDashboardData,
  });

  const currencyFormatter = new Intl.NumberFormat(currentLang === "ru" ? "ru-RU" : "en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900/95 backdrop-blur-md text-white p-3.5 rounded-2xl border border-slate-800 shadow-2xl text-xs font-sans">
          <p className="font-bold text-slate-400">{payload[0].payload.date}</p>
          <p className="text-indigo-400 font-bold mt-1 text-sm">
            {currencyFormatter.format(payload[0].value)}
          </p>
        </div>
      );
    }
    return null;
  };

  if (isError) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <AlertCircle size={40} className="text-red-500" />
        <p className="text-slate-600 font-semibold">{t("dashboard.error_loading")}</p>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-bold py-2 px-4 rounded-xl shadow transition-all"
        >
          <RefreshCw size={14} />
          <span>{t("dashboard.refresh_data")}</span>
        </button>
      </div>
    );
  }

  const isEmpty =
    !isLoading &&
    data &&
    data.stats.totalSales === 0 &&
    data.stats.leadsCount === 0 &&
    data.stats.activeDistributors === 0 &&
    data.stats.pendingOrders === 0 &&
    data.activities.length === 0;

  if (isEmpty) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6 bg-white border border-slate-100 rounded-3xl shadow-sm">
        <div className="bg-slate-50 p-4 rounded-full mb-4">
          <TrendingUp size={36} className="text-slate-400" />
        </div>
        <h3 className="text-xl font-bold text-slate-900 mb-2">{t("common.no_data")}</h3>
        <p className="text-slate-500 text-sm max-w-sm mb-6">
          Welcome to your new Brils dashboard! Once you start registering leads or orders, the key metrics and sales curves will automatically show up here.
        </p>
        <button
          onClick={() => refetch()}
          className="bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 px-6 rounded-xl transition-all"
        >
          {t("dashboard.refresh_data")}
        </button>
      </div>
    );
  }

  // Define stats blocks
  const statsBlocks = data
    ? [
        {
          title: t("dashboard.total_sales"),
          value: currencyFormatter.format(data.stats.totalSales),
          change: `${data.stats.salesChange >= 0 ? "+" : ""}${data.stats.salesChange.toFixed(1)}%`,
          isPositive: data.stats.salesChange >= 0,
          comparison: t("dashboard.vs_last_month"),
          icon: TrendingUp,
          bg: "bg-emerald-50 text-emerald-600 border-emerald-100/50",
        },
        {
          title: t("dashboard.leads_count"),
          value: data.stats.leadsCount.toString(),
          change: `${data.stats.leadsChange >= 0 ? "+" : ""}${data.stats.leadsChange.toFixed(1)}%`,
          isPositive: data.stats.leadsChange >= 0,
          comparison: t("dashboard.vs_last_week"),
          icon: Users,
          bg: "bg-blue-50 text-blue-600 border-blue-100/50",
        },
        {
          title: t("dashboard.active_distributors"),
          value: data.stats.activeDistributors.toString(),
          change: `${data.stats.distributorsChange >= 0 ? "+" : ""}${data.stats.distributorsChange.toFixed(1)}%`,
          isPositive: data.stats.distributorsChange >= 0,
          comparison: t("dashboard.vs_last_month"),
          icon: Building2,
          bg: "bg-purple-50 text-purple-600 border-purple-100/50",
        },
        {
          title: t("dashboard.pending_orders"),
          value: data.stats.pendingOrders.toString(),
          change: `${data.stats.pendingChange >= 0 ? "+" : ""}${data.stats.pendingChange.toFixed(1)}%`,
          isPositive: data.stats.pendingChange >= 0,
          comparison: t("dashboard.vs_last_week"),
          icon: Clock,
          bg: "bg-amber-50 text-amber-600 border-amber-100/50",
        },
      ]
    : [];

  return (
    <div className="space-y-8 font-sans">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">{t("dashboard.title")}</h2>
          <p className="text-slate-500 mt-1">{t("dashboard.subtitle")}</p>
        </div>
        <div className="flex items-center gap-2">
          <Calendar size={16} className="text-slate-400" />
          <select
            value={filters.dateRange}
            onChange={(e) => setFilters({ dateRange: e.target.value })}
            className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-semibold text-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-950 transition-all cursor-pointer"
          >
            <option value="today">{currentLang === "ru" ? "Сегодня" : currentLang === "ko" ? "오늘" : "Today"}</option>
            <option value="week">{currentLang === "ru" ? "На этой неделе" : currentLang === "ko" ? "이번 주" : "This Week"}</option>
            <option value="month">{currentLang === "ru" ? "В этом месяце" : currentLang === "ko" ? "이번 달" : "This Month"}</option>
            <option value="all">{currentLang === "ru" ? "За все время" : currentLang === "ko" ? "전체 기간" : "All Time"}</option>
          </select>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm animate-pulse space-y-4">
                <div className="flex justify-between items-center">
                  <div className="h-4 bg-slate-150 rounded w-2/3" />
                  <div className="h-9 w-9 bg-slate-150 rounded-xl" />
                </div>
                <div className="space-y-2">
                  <div className="h-7 bg-slate-150 rounded w-1/2" />
                  <div className="h-3 bg-slate-150 rounded w-5/6" />
                </div>
              </div>
            ))
          : statsBlocks.map((stat, i) => {
              const Icon = stat.icon;
              return (
                <div
                  key={i}
                  className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-all duration-350 hover:-translate-y-0.5 group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-slate-500 group-hover:text-slate-700 transition-colors">
                      {stat.title}
                    </span>
                    <div className={`p-2.5 rounded-2xl border ${stat.bg} transition-transform group-hover:scale-105 duration-300`}>
                      <Icon size={18} />
                    </div>
                  </div>
                  <div className="mt-5">
                    <h3 className="text-2xl font-bold tracking-tight text-slate-900 font-sans">{stat.value}</h3>
                    <div className="flex flex-wrap items-center gap-1.5 mt-1.5 text-xs">
                      <span className={`flex items-center font-bold ${stat.isPositive ? "text-emerald-600" : "text-amber-600"}`}>
                        {stat.isPositive ? <ArrowUpRight size={14} className="mr-0.5" /> : <ArrowDownRight size={14} className="mr-0.5" />}
                        {stat.change}
                      </span>
                      <span className="text-slate-400 font-medium">{stat.comparison}</span>
                    </div>
                  </div>
                </div>
              );
            })}
      </div>

      {/* Main Grid Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sales Chart Card */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between min-h-[380px] hover:shadow-md transition-shadow">
          <div className="w-full">
            <div className="flex items-center justify-between mb-6">
              <h4 className="font-bold text-slate-900 text-lg">{t("dashboard.sales_analytics")}</h4>
              <span className="text-xs text-indigo-600 bg-indigo-50 border border-indigo-100/50 px-3 py-1 rounded-full font-bold">
                {currentLang === "ru" ? "В реальном времени" : currentLang === "ko" ? "실시간 데이터" : "Live Data"}
              </span>
            </div>

            {isLoading ? (
              <div className="h-64 w-full bg-slate-50 rounded-2xl animate-pulse flex items-center justify-center">
                <div className="h-8 w-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
              </div>
            ) : data ? (
              <div className="h-64 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.12} />
                        <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis
                      dataKey="date"
                      tickLine={false}
                      axisLine={false}
                      stroke="#94a3b8"
                      fontSize={11}
                      dy={8}
                      fontWeight={600}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      stroke="#94a3b8"
                      fontSize={11}
                      tickFormatter={(v) => `$${v}`}
                      dx={-4}
                      fontWeight={600}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="amount"
                      stroke="#4f46e5"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#colorSales)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : null}
          </div>
        </div>

        {/* Recent Activity Card */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
          <div>
            <h4 className="font-bold text-slate-900 text-lg mb-6">{t("dashboard.recent_activity")}</h4>
            <div className="space-y-4">
              {isLoading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex gap-4 items-start animate-pulse">
                      <div className="h-9 w-9 rounded-xl bg-slate-150 flex-shrink-0" />
                      <div className="flex-1 space-y-2 py-1">
                        <div className="h-4 bg-slate-150 rounded w-5/6" />
                        <div className="h-3 bg-slate-150 rounded w-1/3" />
                      </div>
                    </div>
                  ))
                : data && data.activities.length > 0
                ? data.activities.map((act) => {
                    const iconConfig = getActivityIcon(act.entity_type);
                    const Icon = iconConfig.icon;
                    return (
                      <div key={act.id} className="flex items-start gap-4 transition-colors hover:bg-slate-50/50 p-2 -mx-2 rounded-xl group">
                        <div className={`p-2 rounded-xl border ${iconConfig.bg} flex-shrink-0 transition-transform group-hover:scale-105`}>
                          <Icon size={16} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                            {act.entity_type}
                          </span>
                          <p className="text-sm font-semibold text-slate-800 leading-snug mt-0.5 break-words">
                            {formatActivityMessage(act, currentLang)}
                          </p>
                          <span className="text-[11px] text-slate-400 font-medium block mt-1">
                            {formatRelativeTime(act.created_at, currentLang)}
                          </span>
                        </div>
                      </div>
                    );
                  })
                : (
                  <p className="text-sm text-slate-400 text-center py-12 font-medium">
                    {t("dashboard.no_activity")}
                  </p>
                )}
            </div>
          </div>
          <button className="w-full mt-6 bg-slate-50 text-slate-700 hover:bg-slate-100 font-bold py-3 rounded-2xl border border-slate-200/60 text-xs transition-all hover:shadow-sm duration-300">
            {t("dashboard.view_all")}
          </button>
        </div>
      </div>
    </div>
  );
}

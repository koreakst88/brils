import React, { useState } from "react";
import { X, Bell, AlertTriangle, UserPlus, FileText } from "lucide-react";
import { useTranslation } from "../i18n";

interface Notification {
  id: string;
  title: string;
  description: string;
  time: string;
  type: "overdue" | "leads" | "other";
  read: boolean;
}

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  unreadCount: number;
  setUnreadCount: (count: number) => void;
}

const mockNotifications: Notification[] = [
  {
    id: "1",
    title: "Новый лид с формы",
    description: "Алексей Иванов (Казахстан) проявил интерес к BRILS Bean Essence.",
    time: "5 мин. назад",
    type: "leads",
    read: false,
  },
  {
    id: "2",
    title: "Просрочка платежа",
    description: "Срок оплаты заказа #1204 для дистрибьютора в Узбекистане истек.",
    time: "2 ч. назад",
    type: "overdue",
    read: false,
  },
  {
    id: "3",
    title: "Новый лид с формы",
    description: "Kim Ji-won (Южная Корея) оставил заявку на BB Cream.",
    time: "4 ч. назад",
    type: "leads",
    read: false,
  },
  {
    id: "4",
    title: "Заказ подтвержден",
    description: "Заказ #1205 успешно подтвержден администратором.",
    time: "1 дн. назад",
    type: "other",
    read: true,
  },
  {
    id: "5",
    title: "Лимит остатков товара",
    description: "BRILS Collagen Sleeping Mask: количество на складе менее 10 шт.",
    time: "1 дн. назад",
    type: "overdue",
    read: true,
  },
  {
    id: "6",
    title: "Новый лид с формы",
    description: "Мария Смирнова (Кыргызстан) заполнила форму дистрибьютора.",
    time: "2 дн. назад",
    type: "leads",
    read: true,
  },
  {
    id: "7",
    title: "Просрочка платежа",
    description: "Оплата по инвойсу #902 превысила допустимый срок на 3 дня.",
    time: "3 дн. назад",
    type: "overdue",
    read: true,
  },
  {
    id: "8",
    title: "Изменение цены",
    description: "Базовая цена на Collagen Cushion Pact обновлена.",
    time: "4 дн. назад",
    type: "other",
    read: true,
  },
  {
    id: "9",
    title: "Заказ доставлен",
    description: "Заказ #1198 успешно доставлен и закрыт.",
    time: "5 дн. назад",
    type: "other",
    read: true,
  },
  {
    id: "10",
    title: "Новый лид с формы",
    description: "John Doe (Другие страны) оставил контакты для связи.",
    time: "1 нед. назад",
    type: "leads",
    read: true,
  },
];

export function NotificationsModal({
  isOpen,
  onClose,
  unreadCount,
  setUnreadCount,
}: NotificationsModalProps) {
  const { t } = useTranslation();
  const [filter, setFilter] = useState<"all" | "overdue" | "leads">("all");
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);

  if (!isOpen) return null;

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const handleNotificationClick = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => {
        if (n.id === id && !n.read) {
          setUnreadCount(Math.max(0, unreadCount - 1));
          return { ...n, read: true };
        }
        return n;
      })
    );
  };

  const filteredNotifications = notifications.filter((n) => {
    if (filter === "all") return true;
    return n.type === filter;
  });

  const getIcon = (type: Notification["type"]) => {
    switch (type) {
      case "overdue":
        return <AlertTriangle className="text-red-500 h-5 w-5" />;
      case "leads":
        return <UserPlus className="text-blue-500 h-5 w-5" />;
      default:
        return <FileText className="text-slate-500 h-5 w-5" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[85vh] overflow-hidden border border-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Bell className="text-slate-600 h-5 w-5" />
            <h3 className="font-bold text-lg text-slate-800">
              {t("common.notifications")}
            </h3>
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {unreadCount}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Filters */}
        <div className="flex gap-2 px-6 py-3 bg-slate-50/50 border-b border-slate-100">
          <button
            onClick={() => setFilter("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filter === "all"
                ? "bg-slate-900 text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            {t("common.filter_all")}
          </button>
          <button
            onClick={() => setFilter("overdue")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filter === "overdue"
                ? "bg-slate-900 text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            {t("common.filter_overdue")}
          </button>
          <button
            onClick={() => setFilter("leads")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filter === "leads"
                ? "bg-slate-900 text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            {t("common.filter_leads")}
          </button>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
          {filteredNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <Bell size={32} className="stroke-[1.5] mb-2 text-slate-300" />
              <p className="text-sm font-medium">{t("common.no_notifications")}</p>
            </div>
          ) : (
            filteredNotifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => handleNotificationClick(notif.id)}
                className={`p-4 flex gap-4 cursor-pointer transition-colors relative ${
                  notif.read ? "bg-white hover:bg-slate-50/50" : "bg-slate-50/60 hover:bg-slate-50"
                }`}
              >
                {!notif.read && (
                  <span className="absolute left-1 top-5 h-2 w-2 rounded-full bg-blue-600" />
                )}
                <div className="h-9 w-9 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                  {getIcon(notif.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <p className={`text-sm leading-snug truncate ${notif.read ? "text-slate-600" : "font-semibold text-slate-900"}`}>
                      {notif.title}
                    </p>
                    <span className="text-[10px] text-slate-400 whitespace-nowrap">{notif.time}</span>
                  </div>
                  <p className="text-xs text-slate-500 leading-normal line-clamp-2">
                    {notif.description}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {unreadCount > 0 && (
          <div className="p-4 border-t border-slate-100 bg-slate-50/50 text-center">
            <button
              onClick={handleMarkAllRead}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors"
            >
              {t("common.mark_read")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

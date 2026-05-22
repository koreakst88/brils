import React from "react";
import { NavLink } from "react-router-dom";
import { useTranslation } from "../i18n";
import { useAuth } from "../contexts/AuthContext";
import {
  LayoutDashboard,
  Users,
  Building2,
  ShoppingBag,
  Package,
  DollarSign,
  ClipboardList,
  Eye,
} from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { t } = useTranslation();
  const { role } = useAuth();

  const menuItems = [
    { path: "/admin/dashboard", label: t("nav.dashboard"), icon: LayoutDashboard },
    { path: "/admin/leads", label: t("nav.leads"), icon: Users },
    { path: "/admin/distributors", label: t("nav.distributors"), icon: Building2 },
    { path: "/admin/orders", label: t("nav.orders"), icon: ShoppingBag },
    { path: "/admin/inventory", label: t("nav.inventory"), icon: Package },
    { path: "/admin/pricing", label: t("nav.pricing"), icon: DollarSign },
    { path: "/admin/activity", label: t("nav.activity"), icon: ClipboardList },
  ];

  return (
    <aside
      className={`fixed top-16 bottom-0 left-0 z-30 w-64 bg-white border-r border-slate-200 flex flex-col justify-between transform transition-transform duration-200 ease-in-out md:translate-x-0 ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      {/* Menu items */}
      <div className="flex-1 py-6 px-4 overflow-y-auto">
        <nav className="space-y-1.5">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? "bg-slate-900 text-white shadow-md shadow-slate-900/10"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon size={18} className={isActive ? "text-white" : "text-slate-400"} />
                    <span>{item.label}</span>
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Bottom Info Banner */}
      {role === "owner" && (
        <div className="p-4 border-t border-slate-100 bg-amber-50/50">
          <div className="bg-amber-50 border border-amber-200 text-amber-800 p-3 rounded-xl flex items-center gap-2.5 text-xs font-semibold">
            <Eye size={16} className="text-amber-600 flex-shrink-0" />
            <span className="leading-normal">{t("common.readonly_banner")}</span>
          </div>
        </div>
      )}
    </aside>
  );
}

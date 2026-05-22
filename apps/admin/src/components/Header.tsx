import React, { useState, useRef, useEffect } from "react";
import { Bell, Globe, LogOut, User as UserIcon, ChevronDown, ShieldAlert, Menu } from "lucide-react";
import { useTranslation } from "../i18n";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { NotificationsModal } from "./NotificationsModal";

interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const { t, language, setLanguage } = useTranslation();
  const { user, role, signOut } = useAuth();
  const navigate = useNavigate();

  const [langOpen, setLangOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(3); // Mock initial unread count

  const langRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  // Close dropdowns on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (langRef.current && !langRef.current.contains(event.target as Node)) {
        setLangOpen(false);
      }
      if (userRef.current && !userRef.current.contains(event.target as Node)) {
        setUserOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const languages = [
    { code: "ru", label: "Русский" },
    { code: "en", label: "English" },
    { code: "ko", label: "한국어" },
  ] as const;

  return (
    <>
      <header className="h-16 fixed top-0 left-0 right-0 z-40 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-6 shadow-sm">
        {/* Left Side: Brand Logo */}
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuClick}
            className="p-1.5 text-slate-600 hover:bg-slate-50 rounded-lg md:hidden transition-colors"
          >
            <Menu size={20} />
          </button>
          
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-slate-950 flex items-center justify-center text-white font-black text-sm shadow-sm">
              B
            </div>
            <span className="font-bold text-base md:text-lg tracking-tight text-slate-800">
              BRILS Admin
            </span>
          </div>
        </div>

        {/* Center: Language Switcher Dropdown */}
        <div className="relative" ref={langRef}>
          <button
            onClick={() => setLangOpen(!langOpen)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors border border-slate-200"
          >
            <Globe size={14} className="text-slate-400" />
            <span className="uppercase">{language}</span>
            <ChevronDown size={12} className={`text-slate-400 transition-transform ${langOpen ? "rotate-180" : ""}`} />
          </button>

          {langOpen && (
            <div className="absolute left-1/2 -translate-x-1/2 mt-2 w-32 bg-white border border-slate-100 rounded-xl shadow-lg py-1 z-50 animate-in fade-in slide-in-from-top-2 duration-100">
              {languages.map((lng) => (
                <button
                  key={lng.code}
                  onClick={() => {
                    setLanguage(lng.code);
                    setLangOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-xs font-medium transition-colors hover:bg-slate-50 ${
                    language === lng.code ? "text-blue-600 font-bold bg-slate-50/50" : "text-slate-700"
                  }`}
                >
                  {lng.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Side: Notifications & User Avatar */}
        <div className="flex items-center gap-3">
          {/* Notifications Trigger */}
          <button
            onClick={() => setNotifOpen(true)}
            className="relative p-2 text-slate-500 hover:text-slate-800 rounded-full hover:bg-slate-50 transition-colors border border-slate-100"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white" />
            )}
          </button>

          {/* Divider */}
          <div className="h-6 w-[1px] bg-slate-200" />

          {/* User Profile Trigger & Dropdown */}
          <div className="relative flex items-center gap-2" ref={userRef}>
            {role === "owner" && (
              <span className="hidden sm:inline-flex items-center gap-1 bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                <ShieldAlert size={10} className="text-amber-600" />
                {t("common.readonly")}
              </span>
            )}
            
            <button
              onClick={() => setUserOpen(!userOpen)}
              className="flex items-center gap-2 hover:bg-slate-50 p-1 rounded-lg transition-colors"
            >
              <div className="h-8 w-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 font-bold text-sm shadow-sm uppercase">
                {user?.email?.charAt(0) || <UserIcon size={14} />}
              </div>
              <ChevronDown size={14} className={`text-slate-400 hidden sm:block transition-transform ${userOpen ? "rotate-180" : ""}`} />
            </button>

            {userOpen && (
              <div className="absolute right-0 mt-2 top-full w-56 bg-white border border-slate-100 rounded-xl shadow-lg py-1 z-50 animate-in fade-in slide-in-from-top-2 duration-100">
                <div className="px-4 py-3 border-b border-slate-100">
                  <p className="text-xs font-semibold text-slate-800 truncate">{user?.email || "Admin User"}</p>
                  <p className="text-[10px] text-slate-400 truncate font-bold tracking-wider uppercase mt-0.5">{role || "User"}</p>
                </div>
                
                <button
                  onClick={() => {
                    setUserOpen(false);
                    // Add navigate to profile if path exists, otherwise just dummy action
                  }}
                  className="w-full text-left px-4 py-2.5 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 font-medium"
                >
                  <UserIcon size={14} className="text-slate-400" />
                  {t("common.profile")}
                </button>
                
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2.5 text-xs text-red-600 hover:bg-red-50/50 flex items-center gap-2 font-semibold border-t border-slate-100"
                >
                  <LogOut size={14} className="text-red-500" />
                  {t("nav.logout")}
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Notifications Modal */}
      <NotificationsModal
        isOpen={notifOpen}
        onClose={() => setNotifOpen(false)}
        unreadCount={unreadCount}
        setUnreadCount={setUnreadCount}
      />
    </>
  );
}

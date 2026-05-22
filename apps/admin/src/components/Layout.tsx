import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";
import { useAuth } from "../contexts/AuthContext";

export function Layout() {
  const { role } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div
      data-readonly={role === "owner" ? "true" : undefined}
      className="min-h-screen bg-slate-50 text-slate-900 font-sans"
    >
      {/* Header */}
      <Header onMenuClick={() => setSidebarOpen(true)} />

      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area */}
      <main className="pt-16 md:pl-64 min-h-screen transition-all duration-200">
        <div className="p-6 md:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </div>
      </main>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-20 md:hidden"
        />
      )}
    </div>
  );
}

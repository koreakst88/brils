import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useAdminStore } from "../store/useAdminStore";

interface AuthContextType {
  user: any | null;
  role: "admin" | "owner" | null;
  loading: boolean;
  login: (telegramId: number) => Promise<void>;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
  const [role, setRole] = useState<"admin" | "owner" | null>(null);
  const [loading, setLoading] = useState(true);

  const setLanguage = useAdminStore((state) => state.setLanguage);

  useEffect(() => {
    if (role === "owner") {
      setLanguage("ko");
    }
  }, [role, setLanguage]);

  useEffect(() => {
    const initAuth = () => {
      try {
        const saved = localStorage.getItem("brils_admin_user");
        if (saved) {
          const parsedUser = JSON.parse(saved);
          setUser(parsedUser);
          setRole(parsedUser.role);
        }
      } catch (err) {
        console.error("Failed to parse saved user", err);
      } finally {
        setLoading(false);
      }
    };
    initAuth();
  }, []);

  const login = async (telegramId: number) => {
    const { data, error } = await supabase
      .from("users")
      .select("id, telegram_id, name, role, language_code")
      .eq("telegram_id", telegramId)
      .single();

    if (error || !data) {
      throw new Error("User not found");
    }

    if (data.role !== "admin" && data.role !== "owner") {
      throw new Error("Access denied: You must be an admin or owner");
    }

    localStorage.setItem("brils_admin_user", JSON.stringify(data));
    setUser(data);
    setRole(data.role as "admin" | "owner");
  };

  const signOut = () => {
    localStorage.removeItem("brils_admin_user");
    setUser(null);
    setRole(null);
  };

  return (
    <AuthContext.Provider value={{ user, role, loading, login, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}


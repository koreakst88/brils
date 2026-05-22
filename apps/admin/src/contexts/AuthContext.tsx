import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useAdminStore } from "../store/useAdminStore";
import { User } from "@supabase/supabase-js";

interface AuthContextType {
  user: User | null;
  role: "user" | "admin" | "owner" | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<"user" | "admin" | "owner" | null>(null);
  const [loading, setLoading] = useState(true);

  const setLanguage = useAdminStore((state) => state.setLanguage);

  useEffect(() => {
    if (role === "owner") {
      setLanguage("ko");
    }
  }, [role, setLanguage]);

  const fetchUserRole = async (currentUser: User) => {
    try {
      // Get telegram_id from metadata or sub (which is provider UID)
      const tgIdRaw = currentUser.user_metadata?.telegram_id || currentUser.user_metadata?.sub;
      const telegramId = tgIdRaw ? parseInt(tgIdRaw, 10) : null;

      if (!telegramId || isNaN(telegramId)) {
        console.warn("No valid telegram_id found in user metadata");
        setRole(null);
        return;
      }

      const { data, error } = await supabase
        .from("users")
        .select("role")
        .eq("telegram_id", telegramId)
        .single();

      if (error) {
        console.error("Error fetching user role from database:", error);
        setRole(null);
        return;
      }

      const userRole = data?.role as "user" | "admin" | "owner";
      setRole(userRole || null);
    } catch (err) {
      console.error("Unexpected error fetching user role:", err);
      setRole(null);
    }
  };

  useEffect(() => {
    // Initial fetch of current user
    const initAuth = async () => {
      try {
        if (import.meta.env.DEV) {
          const demoUserJson = localStorage.getItem("demo_user");
          if (demoUserJson) {
            const parsed = JSON.parse(demoUserJson);
            setUser({
              id: parsed.id,
              email: parsed.email,
              user_metadata: { role: parsed.role },
              app_metadata: {},
              aud: "authenticated",
              created_at: new Date().toISOString(),
            } as any);
            setRole(parsed.role);
            setLoading(false);
            return;
          }
        }

        const { data: { user: currentUser } } = await supabase.auth.getUser();
        setUser(currentUser);
        if (currentUser) {
          await fetchUserRole(currentUser);
        }
      } catch (err) {
        console.error("Error initializing auth:", err);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (import.meta.env.DEV && localStorage.getItem("demo_user")) {
        return;
      }

      const currentUser = session?.user || null;
      setUser(currentUser);
      if (currentUser) {
        setLoading(true);
        await fetchUserRole(currentUser);
        setLoading(false);
      } else {
        setRole(null);
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    if (import.meta.env.DEV && localStorage.getItem("demo_user")) {
      localStorage.removeItem("demo_user");
      setUser(null);
      setRole(null);
      return;
    }
    
    setLoading(true);
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error("Error during sign out:", err);
    } finally {
      setUser(null);
      setRole(null);
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, role, loading, signOut }}>
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

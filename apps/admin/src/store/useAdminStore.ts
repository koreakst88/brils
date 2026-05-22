import { create } from "zustand";

export type AdminLanguage = "ru" | "en" | "ko";

export interface User {
  email: string;
  name: string;
  role: string;
}

export interface Filters {
  search: string;
  status: string;
  dateRange: string;
}

interface AdminStore {
  // Auth
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, name: string) => void;
  logout: () => void;

  // Language
  language: AdminLanguage;
  setLanguage: (language: AdminLanguage) => void;

  // Filters
  filters: Filters;
  setFilters: (filters: Partial<Filters>) => void;
  resetFilters: () => void;
}

const initialFilters: Filters = {
  search: "",
  status: "all",
  dateRange: "all",
};

export const useAdminStore = create<AdminStore>((set) => ({
  // Auth
  user: {
    email: "admin@brils.com",
    name: "Brils Administrator",
    role: "Superadmin",
  }, // Logged in by default for easier dev experience
  isAuthenticated: true,
  login: (email, name) =>
    set({
      user: { email, name, role: "Administrator" },
      isAuthenticated: true,
    }),
  logout: () => set({ user: null, isAuthenticated: false }),

  // Language
  language: "ru",
  setLanguage: (language) => set({ language }),

  // Filters
  filters: initialFilters,
  setFilters: (newFilters) =>
    set((state) => ({
      filters: { ...state.filters, ...newFilters },
    })),
  resetFilters: () => set({ filters: initialFilters }),
}));

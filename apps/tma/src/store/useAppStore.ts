import { create } from "zustand";

export type AppLanguage = "ru" | "en" | "ko";

export type LeadData = {
  name: string;
  company: string;
  whatsapp: string;
};

type AppStore = {
  language: AppLanguage;
  country: string | null;
  intent: string | null;
  selectedProducts: string[];
  leadData: LeadData | null;
  setLanguage: (language: AppLanguage) => void;
  setCountry: (country: string | null) => void;
  setIntent: (intent: string | null) => void;
  toggleSelectedProduct: (product: string) => void;
  setLeadData: (leadData: LeadData | null) => void;
  resetFlow: () => void;
};

export const useAppStore = create<AppStore>((set) => ({
  language: "ru",
  country: null,
  intent: null,
  selectedProducts: [],
  leadData: null,
  setLanguage: (language) => set({ language }),
  setCountry: (country) => set({ country }),
  setIntent: (intent) => set({ intent }),
  toggleSelectedProduct: (product) =>
    set((state) => ({
      selectedProducts: state.selectedProducts.includes(product)
        ? state.selectedProducts.filter((item) => item !== product)
        : [...state.selectedProducts, product],
    })),
  setLeadData: (leadData) => set({ leadData }),
  resetFlow: () =>
    set({
      country: null,
      intent: null,
      selectedProducts: [],
      leadData: null,
    }),
}));

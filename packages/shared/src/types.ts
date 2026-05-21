export type UserRole = "user" | "admin" | "owner";
export type CountryCode = "KZ" | "UZ" | "KG" | "TM" | "Other";

export interface User {
  id: string;
  telegramId: number;
  name: string;
  role: UserRole;
  createdAt: string;
}

export interface Lead {
  id: string;
  telegramId: number;
  country: CountryCode;
  intent: string;
  products: string[];
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  createdAt: string;
}

export interface Distributor {
  id: string;
  country: CountryCode;
  telegramId: number;
  whatsapp: string;
}

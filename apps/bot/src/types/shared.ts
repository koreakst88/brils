export type UserRole = "user" | "admin" | "owner";

export interface User {
  id: string;
  telegramId: number;
  name: string;
  role: UserRole;
  createdAt: string;
}

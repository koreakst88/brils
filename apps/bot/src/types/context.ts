import type { Context } from "grammy";
import type { User, UserRole } from "./shared";

export type BotContext = Context & {
  role: UserRole;
  dbUser: User;
};

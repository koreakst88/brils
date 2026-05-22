import type { MiddlewareFn } from "grammy";
import { supabaseRequest } from "../lib/supabase.js";
import type { BotContext } from "../types/context";
import type { User, UserRole } from "../types/shared";

type SupabaseUserRow = {
  id: string;
  telegram_id: number;
  name: string | null;
  role: UserRole;
  created_at: string;
};

function mapUserRow(row: SupabaseUserRow): User {
  return {
    id: row.id,
    telegramId: row.telegram_id,
    name: row.name ?? "",
    role: row.role,
    createdAt: row.created_at,
  };
}

export const rolesMiddleware: MiddlewareFn<BotContext> = async (ctx, next) => {
  const telegramId = ctx.from?.id;

  if (!telegramId) {
    await next();
    return;
  }

  const existingUsers = await supabaseRequest<SupabaseUserRow[]>(
    `users?telegram_id=eq.${telegramId}&select=id,telegram_id,name,role,created_at&limit=1`,
    {
      method: "GET",
    },
  );

  let dbUser: User;

  if (existingUsers.length > 0) {
    dbUser = mapUserRow(existingUsers[0]);
  } else {
    const createdUsers = await supabaseRequest<SupabaseUserRow[]>("users", {
      method: "POST",
      body: JSON.stringify({
        telegram_id: telegramId,
        name: ctx.from?.first_name ?? null,
        role: "user",
      }),
    });

    dbUser = mapUserRow(createdUsers[0]);
  }

  ctx.role = dbUser.role;
  ctx.dbUser = dbUser;

  await next();
};

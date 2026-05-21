import type { Bot } from "grammy";
import { supabaseRequest } from "../lib/supabase";
import type { BotContext } from "../types/context";

type LeadRow = {
  id: string;
  telegram_id: number;
  country: string;
  intent: string | null;
  products: string[] | null;
  created_at: string;
};

type OrderRow = {
  id: string;
  user_id: string | null;
  items: unknown;
  quantity: number | null;
  status: string;
};

type InventoryRow = {
  id: string;
  product: string;
  total: number;
  shipped: number;
  available: number;
};

type UserRow = {
  telegram_id: number;
};

type BroadcastSegment = "all_users" | "viewed_catalog" | "no_leads" | "leads";

type BroadcastDraft = {
  step: "awaiting_text" | "awaiting_segment";
  text?: string;
};

const ACCESS_DENIED = "Access denied";
const broadcastDrafts = new Map<number, BroadcastDraft>();
const availableSegments: BroadcastSegment[] = [
  "all_users",
  "viewed_catalog",
  "no_leads",
  "leads",
];

function isAdminRole(role: BotContext["role"]) {
  return role === "admin";
}

function canReadAdmin(role: BotContext["role"]) {
  return role === "admin" || role === "owner";
}

async function countLeadsSince(isoDate?: string) {
  const path = isoDate
    ? `leads?select=id&created_at=gte.${encodeURIComponent(isoDate)}`
    : "leads?select=id";
  const rows = await supabaseRequest<Array<{ id: string }>>(path, { method: "GET" });
  return rows.length;
}

export async function getRecentLeads() {
  return supabaseRequest<LeadRow[]>(
    "leads?select=id,telegram_id,country,intent,products,created_at&order=created_at.desc&limit=10",
    { method: "GET" },
  );
}

export async function getLeadStats() {
  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);

  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const [today, last7Days, total] = await Promise.all([
    countLeadsSince(todayStart.toISOString()),
    countLeadsSince(sevenDaysAgo.toISOString()),
    countLeadsSince(),
  ]);

  return { today, last7Days, total };
}

export async function getRecentOrders() {
  return supabaseRequest<OrderRow[]>(
    "orders?select=id,user_id,items,quantity,status&order=id.desc&limit=10",
    { method: "GET" },
  );
}

export async function getInventorySnapshot() {
  return supabaseRequest<InventoryRow[]>(
    "inventory?select=id,product,total,shipped,available&order=product.asc",
    { method: "GET" },
  );
}

async function getAllUserTelegramIds() {
  const rows = await supabaseRequest<UserRow[]>("users?select=telegram_id", {
    method: "GET",
  });
  return rows.map((row) => row.telegram_id);
}

async function getLeadTelegramIds() {
  const rows = await supabaseRequest<Array<Pick<LeadRow, "telegram_id">>>(
    "leads?select=telegram_id",
    { method: "GET" },
  );
  return rows.map((row) => row.telegram_id);
}

async function resolveSegmentRecipients(segment: BroadcastSegment) {
  const [userIds, leadIds] = await Promise.all([
    getAllUserTelegramIds(),
    getLeadTelegramIds(),
  ]);

  const allUsers = [...new Set(userIds)];
  const usersWithLeads = new Set(leadIds);

  if (segment === "all_users") {
    return allUsers;
  }

  if (segment === "leads") {
    return [...usersWithLeads];
  }

  if (segment === "no_leads") {
    return allUsers.filter((id) => !usersWithLeads.has(id));
  }

  return allUsers.filter((id) => !usersWithLeads.has(id));
}

function formatProducts(products: string[] | null) {
  return products && products.length > 0 ? products.join(", ") : "-";
}

function formatRecentLeads(leads: LeadRow[]) {
  if (leads.length === 0) {
    return "No leads found.";
  }

  return leads
    .map(
      (lead, index) =>
        `${index + 1}. ${lead.id}\nCountry: ${lead.country}\nIntent: ${lead.intent ?? "-"}\nProducts: ${formatProducts(lead.products)}\nCreated: ${lead.created_at}`,
    )
    .join("\n\n");
}

function formatStats(stats: Awaited<ReturnType<typeof getLeadStats>>) {
  return [
    "Lead stats",
    `Today: ${stats.today}`,
    `Last 7 days: ${stats.last7Days}`,
    `Total: ${stats.total}`,
  ].join("\n");
}

function formatOrders(orders: OrderRow[]) {
  if (orders.length === 0) {
    return "No orders found.";
  }

  return orders
    .map(
      (order, index) =>
        `${index + 1}. ${order.id}\nUser: ${order.user_id ?? "-"}\nQuantity: ${order.quantity ?? "-"}\nStatus: ${order.status}\nItems: ${JSON.stringify(order.items ?? [])}`,
    )
    .join("\n\n");
}

function formatInventory(items: InventoryRow[]) {
  if (items.length === 0) {
    return "Inventory is empty.";
  }

  return items
    .map(
      (item, index) =>
        `${index + 1}. ${item.product}\nTotal: ${item.total}\nShipped: ${item.shipped}\nAvailable: ${item.available}`,
    )
    .join("\n\n");
}

async function sendAccessDenied(ctx: BotContext) {
  await ctx.reply(ACCESS_DENIED);
}

export function registerAdminHandlers(bot: Bot<BotContext>) {
  bot.command("admin", async (ctx) => {
    if (ctx.role === "owner") {
      return;
    }

    if (!canReadAdmin(ctx.role)) {
      await sendAccessDenied(ctx);
      return;
    }

    await ctx.reply(
      [
        "Admin menu",
        "/leads - Recent leads",
        "/stats - Lead stats",
        "/broadcast - Send broadcast",
        "/orders - Recent orders",
        "/inventory - Inventory snapshot",
      ].join("\n"),
    );
  });

  bot.command("leads", async (ctx) => {
    if (ctx.role === "owner") {
      return;
    }

    if (!canReadAdmin(ctx.role)) {
      await sendAccessDenied(ctx);
      return;
    }

    const leads = await getRecentLeads();
    await ctx.reply(formatRecentLeads(leads));
  });

  bot.command("stats", async (ctx) => {
    if (ctx.role === "owner") {
      return;
    }

    if (!canReadAdmin(ctx.role)) {
      await sendAccessDenied(ctx);
      return;
    }

    const stats = await getLeadStats();
    await ctx.reply(formatStats(stats));
  });

  bot.command("broadcast", async (ctx) => {
    const adminId = ctx.from?.id;

    if (!isAdminRole(ctx.role) || !adminId) {
      await sendAccessDenied(ctx);
      return;
    }

    broadcastDrafts.set(adminId, { step: "awaiting_text" });
    await ctx.reply("Send broadcast text.");
  });

  bot.command("orders", async (ctx) => {
    if (ctx.role === "owner") {
      return;
    }

    if (!canReadAdmin(ctx.role)) {
      await sendAccessDenied(ctx);
      return;
    }

    const orders = await getRecentOrders();
    await ctx.reply(formatOrders(orders));
  });

  bot.command("inventory", async (ctx) => {
    if (ctx.role === "owner") {
      return;
    }

    if (!canReadAdmin(ctx.role)) {
      await sendAccessDenied(ctx);
      return;
    }

    const inventory = await getInventorySnapshot();
    await ctx.reply(formatInventory(inventory));
  });

  bot.on("message:text", async (ctx, next) => {
    const adminId = ctx.from?.id;

    if (!isAdminRole(ctx.role) || !adminId) {
      await next();
      return;
    }

    const draft = broadcastDrafts.get(adminId);

    if (!draft) {
      await next();
      return;
    }

    const text = ctx.message.text.trim();

    if (text.startsWith("/")) {
      broadcastDrafts.delete(ctx.from.id);
      await next();
      return;
    }

    if (draft.step === "awaiting_text") {
      broadcastDrafts.set(adminId, {
        step: "awaiting_segment",
        text,
      });

      await ctx.reply(
        `Choose segment: ${availableSegments.join(" / ")}`,
      );
      return;
    }

    const segment = text as BroadcastSegment;

    if (!availableSegments.includes(segment)) {
      await ctx.reply(`Unknown segment. Use: ${availableSegments.join(" / ")}`);
      return;
    }

    const recipients = await resolveSegmentRecipients(segment);
    let sent = 0;

    for (const recipientId of recipients) {
      try {
        await ctx.api.sendMessage(recipientId, draft.text ?? "");
        sent += 1;
      } catch {
        continue;
      }
    }

    broadcastDrafts.delete(adminId);
    await ctx.reply(`Broadcast finished. Sent: ${sent}`);
  });
}

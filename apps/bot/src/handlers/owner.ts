import type { Bot } from "grammy";
import {
  getInventorySnapshot,
  getLeadStats,
  getRecentLeads,
  getRecentOrders,
} from "./admin";
import type { BotContext } from "../types/context";

const ACCESS_DENIED = "접근이 거부되었습니다";

function formatProducts(products: string[] | null) {
  return products && products.length > 0 ? products.join(", ") : "-";
}

function formatRecentLeadsKo(
  leads: Awaited<ReturnType<typeof getRecentLeads>>,
) {
  if (leads.length === 0) {
    return "리드가 없습니다.";
  }

  return leads
    .map(
      (lead, index) =>
        `${index + 1}. ${lead.id}\n국가: ${lead.country}\n의도: ${lead.intent ?? "-"}\n상품: ${formatProducts(lead.products)}\n생성일: ${lead.created_at}`,
    )
    .join("\n\n");
}

function formatStatsKo(stats: Awaited<ReturnType<typeof getLeadStats>>) {
  return [
    "통계",
    `오늘 리드: ${stats.today}`,
    `최근 7일: ${stats.last7Days}`,
    `전체 리드: ${stats.total}`,
  ].join("\n");
}

function formatOrdersKo(
  orders: Awaited<ReturnType<typeof getRecentOrders>>,
) {
  if (orders.length === 0) {
    return "주문이 없습니다.";
  }

  return orders
    .map(
      (order, index) =>
        `${index + 1}. ${order.id}\n사용자: ${order.user_id ?? "-"}\n수량: ${order.quantity ?? "-"}\n상태: ${order.status}\n항목: ${JSON.stringify(order.items ?? [])}`,
    )
    .join("\n\n");
}

function formatInventoryKo(
  items: Awaited<ReturnType<typeof getInventorySnapshot>>,
) {
  if (items.length === 0) {
    return "재고 데이터가 없습니다.";
  }

  return items
    .map(
      (item, index) =>
        `${index + 1}. ${item.product}\n총수량: ${item.total}\n출고: ${item.shipped}\n가용재고: ${item.available}`,
    )
    .join("\n\n");
}

export function registerOwnerHandlers(bot: Bot<BotContext>) {
  bot.command("admin", async (ctx, next) => {
    if (ctx.role !== "owner") {
      await next();
      return;
    }

    await ctx.reply(
      [
        "관리자 메뉴",
        "/leads - 최근 리드",
        "/stats - 통계",
        "/orders - 최근 주문",
        "/inventory - 재고 현황",
      ].join("\n"),
    );
  });

  bot.command("leads", async (ctx, next) => {
    if (ctx.role !== "owner") {
      await next();
      return;
    }

    const leads = await getRecentLeads();
    await ctx.reply(formatRecentLeadsKo(leads));
  });

  bot.command("stats", async (ctx, next) => {
    if (ctx.role !== "owner") {
      await next();
      return;
    }

    const stats = await getLeadStats();
    await ctx.reply(formatStatsKo(stats));
  });

  bot.command("orders", async (ctx, next) => {
    if (ctx.role !== "owner") {
      await next();
      return;
    }

    const orders = await getRecentOrders();
    await ctx.reply(formatOrdersKo(orders));
  });

  bot.command("inventory", async (ctx, next) => {
    if (ctx.role !== "owner") {
      await next();
      return;
    }

    const inventory = await getInventorySnapshot();
    await ctx.reply(formatInventoryKo(inventory));
  });

  bot.command("broadcast", async (ctx, next) => {
    if (ctx.role !== "owner") {
      await next();
      return;
    }

    await ctx.reply(ACCESS_DENIED);
  });
}

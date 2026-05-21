import { Bot } from "grammy";
import { registerAdminHandlers } from "./handlers/admin";
import { registerOwnerHandlers } from "./handlers/owner";
import { rolesMiddleware } from "./middleware/roles";
import { registerStartHandler } from "./handlers/start";
import type { BotContext } from "./types/context";

const token = process.env.BOT_TOKEN;

if (!token) {
  throw new Error("BOT_TOKEN is not set");
}

const bot = new Bot<BotContext>(token);

bot.use(rolesMiddleware);
registerStartHandler(bot);
registerOwnerHandlers(bot);
registerAdminHandlers(bot);

void bot.start();

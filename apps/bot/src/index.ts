import { Bot } from "grammy";
import { registerAdminHandlers } from "./handlers/admin.js";
import { registerOwnerHandlers } from "./handlers/owner.js";
import { rolesMiddleware } from "./middleware/roles.js";
import { registerStartHandler } from "./handlers/start.js";
import type { BotContext } from "./types/context";

const token = process.env.BOT_TOKEN;

if (!token) {
  throw new Error("BOT_TOKEN is not set");
}

const bot = new Bot<BotContext>(token);

// Ensure the Telegram bottom-right menu button shows bot commands.
// Commands are configured to be English per the requirement.
await bot.api.setMyCommands([
  { command: "start", description: "Start" },
  { command: "admin", description: "Admin panel" },
]);
await bot.api.setChatMenuButton({
  menu_button: { type: "commands" },
});

bot.use(rolesMiddleware);
registerStartHandler(bot);
registerOwnerHandlers(bot);
registerAdminHandlers(bot);

void bot.start();

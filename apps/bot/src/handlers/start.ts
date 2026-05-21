import path from "node:path";
import { InlineKeyboard, InputFile } from "grammy";
import type { Bot } from "grammy";
import type { BotContext } from "../types/context";

type Locale = "ru" | "en" | "ko";

function requireEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is not set`);
  }

  return value;
}

const tmaUrl = requireEnv("VITE_TMA_URL");
const logoPath = path.resolve(process.cwd(), "assets/logo.png");

const welcomeContent: Record<
  Locale,
  {
    text: string;
    button: string;
  }
> = {
  ru: {
    text: "BRILS — корейская косметика для вашего бизнеса. Оптовые условия, прямые поставки из Кореи.",
    button: "Узнать условия",
  },
  en: {
    text: "BRILS — Korean cosmetics for your business. Wholesale pricing, direct delivery from Korea.",
    button: "Learn conditions",
  },
  ko: {
    text: "BRILS — 비즈니스를 위한 한국 화장품. 도매 가격, 한국 직배송.",
    button: "조건 확인하기",
  },
};

function resolveLocale(languageCode?: string): Locale {
  if (languageCode === "ru") {
    return "ru";
  }

  if (languageCode === "ko") {
    return "ko";
  }

  return "en";
}

export function registerStartHandler(bot: Bot<BotContext>) {
  bot.command("start", async (ctx) => {
    const locale = resolveLocale(ctx.from?.language_code);
    const content = welcomeContent[locale];
    const keyboard = new InlineKeyboard().webApp(content.button, tmaUrl);

    await ctx.replyWithPhoto(new InputFile(logoPath), {
      caption: content.text,
      reply_markup: keyboard,
    });
  });
}

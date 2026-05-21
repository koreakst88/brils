type NotifyRequestBody = {
  country?: string | null;
  intent?: string | null;
  nameOrCompany?: string;
  products?: string[];
  telegramId?: number;
  utmCampaign?: string | null;
  utmMedium?: string | null;
  utmSource?: string | null;
  whatsapp?: string;
};

type DistributorRow = {
  country: string;
  telegram_id: number | null;
};

type ApiRequest = {
  body?: NotifyRequestBody;
  method?: string;
};

type ApiResponse = {
  end: (body?: string) => void;
  setHeader: (name: string, value: string) => void;
  status: (code: number) => ApiResponse;
};

function formatList(items?: string[]) {
  return items && items.length > 0 ? items.join(", ") : "-";
}

async function findDistributor(country: string | null | undefined) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey || !country) {
    return null;
  }

  const response = await fetch(
    `${supabaseUrl}/rest/v1/distributors?country=eq.${encodeURIComponent(country)}&select=country,telegram_id&limit=1`,
    {
      method: "GET",
      headers: {
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${supabaseAnonKey}`,
        "Content-Type": "application/json",
      },
    },
  );

  if (!response.ok) {
    throw new Error(`Distributor lookup failed: ${response.status}`);
  }

  const rows = (await response.json()) as DistributorRow[];

  return rows[0] ?? null;
}

async function sendTelegramMessage(token: string, chatId: string | number, text: string) {
  const response = await fetch(
    `https://api.telegram.org/bot${token}/sendMessage`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: chatId,
        text,
      }),
    },
  );

  if (!response.ok) {
    throw new Error(`Telegram notify failed: ${response.status}`);
  }
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  res.setHeader("Content-Type", "application/json");

  if (req.method !== "POST") {
    res.status(405).end(JSON.stringify({ error: "Method not allowed" }));
    return;
  }

  const token = process.env.BOT_TOKEN;
  const adminTelegramId = process.env.BOT_ADMIN_ID;

  if (!token) {
    console.error("BOT_TOKEN is not set");
    res.status(200).end(JSON.stringify({ ok: false }));
    return;
  }

  const body = req.body ?? {};
  const createdAt = new Date().toISOString();

  const message = [
    "🆕 Новый лид",
    `🌍 Страна: ${body.country ?? "-"}`,
    `👤 Имя/Компания: ${body.nameOrCompany ?? "-"}`,
    `📱 WhatsApp: ${body.whatsapp ?? "-"}`,
    `🎯 Интерес: ${body.intent ?? "-"}`,
    `📦 Продукты: ${formatList(body.products)}`,
    `📅 ${createdAt}`,
  ].join("\n");

  try {
    const distributor = await findDistributor(body.country);
    const targetChatId = distributor?.telegram_id ?? adminTelegramId;

    if (!targetChatId) {
      console.error("No distributor telegram_id found and BOT_ADMIN_ID is not set", {
        country: body.country,
      });
      res.status(200).end(JSON.stringify({ ok: false }));
      return;
    }

    await sendTelegramMessage(token, targetChatId, message);
  } catch (error) {
    console.error("Lead routing failed", error);
  }

  res.status(200).end(JSON.stringify({ ok: true }));
}

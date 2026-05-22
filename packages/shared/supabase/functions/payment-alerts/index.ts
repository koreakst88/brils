import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req: Request) => {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const botToken = Deno.env.get("BOT_TOKEN");

    if (!supabaseUrl || !supabaseKey || !botToken) {
      throw new Error("Missing required environment variables.");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Получить завтрашнюю дату
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split("T")[0];

    // 2. Найти платежи с просрочкой завтра
    const { data: payments, error: paymentsError } = await supabase
      .from("payments")
      .select("*, orders(*, users(name))")
      .eq("status", "pending")
      .gte("due_date", tomorrowStr)
      .lt("due_date", new Date(tomorrow.getTime() + 86400000).toISOString());

    if (paymentsError) {
      throw paymentsError;
    }

    if (!payments || payments.length === 0) {
      return new Response(
        JSON.stringify({ message: "No payments due tomorrow." }),
        { headers: { "Content-Type": "application/json" } }
      );
    }

    // 3. Получить всех ADMIN
    const { data: admins, error: adminsError } = await supabase
      .from("users")
      .select("telegram_id")
      .eq("role", "admin")
      .not("telegram_id", "is", null);

    if (adminsError) {
      throw adminsError;
    }

    if (!admins || admins.length === 0) {
      return new Response(
        JSON.stringify({ message: "No admins found with telegram_id." }),
        { headers: { "Content-Type": "application/json" } }
      );
    }

    let sentCount = 0;

    // 4. Для каждого платежа отправить уведомление всем админам
    for (const payment of payments) {
      const distributorName = payment.orders?.users?.name || "Неизвестно";
      const orderId = payment.order_id?.slice(0, 8) || "N/A";

      const message = `
⚠️ <b>Напоминание о платеже</b>

Дистрибьютор: ${distributorName}
Заказ: #${orderId}
Сумма: $${payment.amount}
Срок: ${payment.due_date}

Платёж должен быть оплачен завтра!
      `.trim();

      for (const admin of admins) {
        if (!admin.telegram_id) continue;

        await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: admin.telegram_id,
            text: message,
            parse_mode: "HTML",
          }),
        });
        sentCount++;
      }
    }

    return new Response(
      JSON.stringify({ message: "Alerts sent successfully", count: sentCount }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMsg }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});

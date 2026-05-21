import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "../i18n";
import { track } from "../lib/amplitude";
import { useAppStore } from "../store/useAppStore";

type NotifyPayload = {
  country: string | null;
  intent: string | null;
  nameOrCompany: string;
  products: string[];
  telegramId: number;
  utmCampaign: string | null;
  utmMedium: string | null;
  utmSource: string | null;
  whatsapp: string;
};

function getTelegramId() {
  const telegramUserId = window.Telegram?.WebApp?.initDataUnsafe?.user?.id;

  if (telegramUserId) {
    return telegramUserId;
  }

  const params = new URLSearchParams(window.location.search);
  const fallbackTelegramId = params.get("telegram_id");

  if (!fallbackTelegramId) {
    return null;
  }

  const parsedTelegramId = Number(fallbackTelegramId);

  return Number.isFinite(parsedTelegramId) ? parsedTelegramId : null;
}

function getUtmParams() {
  const params = new URLSearchParams(window.location.search);

  return {
    utmSource: params.get("utm_source"),
    utmMedium: params.get("utm_medium"),
    utmCampaign: params.get("utm_campaign"),
  };
}

function getWhatsappDigits(value: string) {
  return value.replace(/\D/g, "");
}

export function FormScreen() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const country = useAppStore((state) => state.country);
  const intent = useAppStore((state) => state.intent);
  const selectedProducts = useAppStore((state) => state.selectedProducts);
  const existingLeadData = useAppStore((state) => state.leadData);
  const setLeadData = useAppStore((state) => state.setLeadData);

  const [nameOrCompany, setNameOrCompany] = useState(
    existingLeadData?.name || existingLeadData?.company || "",
  );
  const [whatsapp, setWhatsapp] = useState(existingLeadData?.whatsapp ?? "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const hasValidWhatsapp = getWhatsappDigits(whatsapp).length >= 7;
  const canSubmit = Boolean(nameOrCompany.trim() && whatsapp.trim() && hasValidWhatsapp);

  async function handleSubmit() {
    if (!canSubmit || isSubmitting) {
      return;
    }

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    const telegramId = getTelegramId();

    setIsSubmitting(true);

    const { utmSource, utmMedium, utmCampaign } = getUtmParams();

    const leadPayload = {
      telegram_id: telegramId,
      country,
      intent,
      products: selectedProducts,
      utm_source: utmSource,
      utm_medium: utmMedium,
      utm_campaign: utmCampaign,
    };

    const notifyPayload: NotifyPayload = {
      telegramId: telegramId ?? 0,
      country,
      intent,
      products: selectedProducts,
      nameOrCompany: nameOrCompany.trim(),
      whatsapp: whatsapp.trim(),
      utmSource,
      utmMedium,
      utmCampaign,
    };

    try {
      const notifyApiUrl = import.meta.env.VITE_NOTIFY_API_URL || "/api/notify";
      const requests: Promise<Response>[] = [];

      if (supabaseUrl && supabaseAnonKey && telegramId) {
        requests.push(
          fetch(`${supabaseUrl}/rest/v1/leads`, {
            method: "POST",
            headers: {
              apikey: supabaseAnonKey,
              Authorization: `Bearer ${supabaseAnonKey}`,
              "Content-Type": "application/json",
              Prefer: "return=representation",
            },
            body: JSON.stringify(leadPayload),
          }),
        );
      } else {
        console.error("Lead save skipped due to missing configuration or telegram user", {
          hasSupabaseUrl: Boolean(supabaseUrl),
          hasSupabaseAnonKey: Boolean(supabaseAnonKey),
          telegramId,
        });
      }

      requests.push(
        fetch(notifyApiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(notifyPayload),
        }),
      );

      const results = await Promise.allSettled(requests);

      results.forEach((result, index) => {
        if (result.status === "rejected") {
          console.error(`Lead request ${index} failed`, result.reason);
          return;
        }

        if (!result.value.ok) {
          console.error(`Lead request ${index} returned non-ok status`, result.value.status);
        }
      });

      setLeadData({
        name: nameOrCompany.trim(),
        company: nameOrCompany.trim(),
        whatsapp: whatsapp.trim(),
      });

      await track("form_submit", {
        country,
        intent,
        products: selectedProducts,
      });
    } catch {
      console.error("Lead submit flow failed");
    } finally {
      setIsSubmitting(false);
      navigate("/final");
    }
  }

  return (
    <section className="screen">
      <div className="screen-card">
        <span className="screen-eyebrow">{t("screens.form.eyebrow")}</span>
        <h1 className="screen-title">{t("screens.form.title")}</h1>
        <p className="screen-description">{t("screens.form.description")}</p>

        <div className="form-stack">
          <label className="input-group">
            <span>{t("screens.form.fields.nameOrCompany")}</span>
            <input
              className="text-input"
              type="text"
              value={nameOrCompany}
              onChange={(event) => setNameOrCompany(event.target.value)}
              placeholder={t("screens.form.placeholders.nameOrCompany")}
            />
          </label>

          <label className="input-group">
            <span>{t("screens.form.fields.whatsapp")}</span>
            <input
              className="text-input"
              type="tel"
              value={whatsapp}
              onChange={(event) => setWhatsapp(event.target.value)}
              placeholder={t("screens.form.placeholders.whatsapp")}
            />
            <small className="field-hint">{t("screens.form.whatsappPlaceholder")}</small>
          </label>
        </div>

        <button
          type="button"
          className="primary-button primary-button--full"
          disabled={!canSubmit}
          onClick={handleSubmit}
        >
          {isSubmitting ? t("screens.form.loading") : t("screens.form.cta")}
        </button>
      </div>
    </section>
  );
}

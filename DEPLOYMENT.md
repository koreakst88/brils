# BRILS TMA Deployment

## Vercel Setup

Deploy the repository root on Vercel:
- Root directory: repository root (`brils`)
- Frontend output: `apps/tma/dist`
- Serverless endpoint: `apps/bot/api/notify.ts`

Vercel provides HTTPS automatically, which is required for Telegram Mini Apps.

## Environment Variables

Add these variables in the Vercel project dashboard.

### Backend / bot variables

- `SUPABASE_URL`
  Supabase project URL. Use the same project URL you use for REST access.

- `SUPABASE_ANON_KEY`
  Supabase anon public key. Used by the serverless notify endpoint for lightweight table lookups.

- `BOT_TOKEN`
  Telegram bot token from BotFather.

- `BOT_ADMIN_ID`
  Default Telegram chat ID that receives a lead notification when no distributor is found for a country.

### Frontend / TMA variables

- `VITE_AMPLITUDE_API_KEY`
  Amplitude browser API key for TMA analytics.

- `VITE_TMA_URL`
  Public HTTPS URL of the deployed TMA. Use the Vercel production domain or your custom domain.

- `VITE_SUPABASE_URL`
  Supabase project URL used directly by the frontend.

- `VITE_SUPABASE_ANON_KEY`
  Supabase anon public key used directly by the frontend.

- `VITE_NOTIFY_API_URL`
  Public HTTPS endpoint for lead notifications. In production this can be your Vercel URL plus `/api/notify`.

- `VITE_MANAGER_TG`
  Telegram username of the manager for the final CTA button. Use the username without extra URL formatting, for example `brils_manager`.

## Notes

- Keep all frontend URLs on HTTPS only. Do not use `http://` resources inside the TMA.
- Product images are served from the local Vite/Vercel public assets, so they do not introduce mixed content.
- If you use a custom domain, update both `VITE_TMA_URL` and `VITE_NOTIFY_API_URL` to that HTTPS domain.

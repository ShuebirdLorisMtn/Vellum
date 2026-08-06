# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Vellum is a minimal Node.js/Express backend (plus a small static frontend) for an AI document-generation product: Claude API integration, magic-link auth via SendGrid, a one-free-document paywall, and Whop payment webhooks. Plain CommonJS, no build step, no linter, no test framework.

## Commands

```bash
npm install
npm start          # node src/server.js (port 3000, override with PORT)
npm run dev        # nodemon, restarts on src/ changes
```

There is no test suite. The only test tooling is a manual webhook script:

```bash
WHOP_WEBHOOK_SECRET=... WEBHOOK_URL=http://localhost:3000/webhooks/whop node scripts/test-whop-webhook.js
```

Configuration comes from a `.env` file (loaded via dotenv) — copy `.env.example` and fill in `CLAUDE_API_KEY`, `DATABASE_URL` (Postgres), `JWT_SECRET`, `SENDGRID_API_KEY`, `WHOP_WEBHOOK_SECRET`, `WHOP_PRODUCT_URL`, `APP_BASE_URL`.

## Notes on recent structure

- **`src/claude.js`** implements `generateFromClaude(apiKey, model, prompt, maxTokens, system)` using the official `@anthropic-ai/sdk`. Default model is `claude-opus-5` (override with `CLAUDE_MODEL`). For Opus 5 / Fable 5 models it opts into the server-side refusal-fallback beta (`fallbacks: "default"`), and it throws a `claude_refused` error on `stop_reason: "refusal"`.
- **`public/index.html`** is the canonical landing page (the same HTML is also embedded in `README.md` — beware drift; index.html is what's served). It contains the auth/app section whose DOM ids `public/app.js` depends on: `signup`, `email`, `auth`, `app`, `who`, `signout`, `generate`, `prompt`, `title`, `output`.
- `scripts/test-whop-webhook.js` uses the global `fetch` built into Node 18+ (no node-fetch dependency).
- The free document is decremented only **after** a successful generation, so a failed Claude call doesn't burn the user's free doc.

## Local development

Start Postgres, create the DB, and load the schema (`psql -d vellum -f db/schema.sql` — or let `src/db.js` self-provision), then copy `.env.example` to `.env` and set at least `DATABASE_URL` and `JWT_SECRET`. The server boots and serves the frontend without `CLAUDE_API_KEY`/`SENDGRID_API_KEY`; those endpoints return 500 until configured.

## Architecture

Everything server-side is in two files:

- **`src/server.js`** — all routes, auth middleware, and webhook handling.
- **`src/db.js`** — Postgres access via a `pg` pool. It runs `ensureSchema()` on import (best-effort `CREATE TABLE IF NOT EXISTS`), so the app self-provisions its tables. **`db/schema.sql` duplicates that schema and must be kept in sync with `src/db.js`** when tables change.

Three tables: `users` (with `free_docs_remaining`, default 1, and `subscription_active`), `documents`, and `webhook_events` (webhook idempotency, keyed by event id).

### Auth flow

Magic-link only (plus a legacy `/api/signup` that creates a session immediately):
1. `POST /api/send-magic-link` — signs a 30-minute JWT with `{ email, type: 'magic' }` and emails a link to `${APP_BASE_URL}/magic.html?token=...` via SendGrid.
2. `public/magic.html` posts the token to `POST /api/magic-consume`, which verifies `type === 'magic'`, creates the user if needed, and returns a 30-day session JWT.
3. The frontend stores the session JWT in `localStorage` (`vellum_token`) and sends it as `Authorization: Bearer` — verified by `authMiddleware` in server.js.

Both token types are signed with the same `JWT_SECRET`; the `type` claim is what distinguishes a magic token from a session token.

### Paywall flow

`POST /api/generate` (authenticated): if `free_docs_remaining > 0`, decrement it; otherwise, if `subscription_active` is false, return **402 with `purchase_url`** (the Whop product URL, also exposed to the frontend via `GET /config`). The frontend treats 402 as "show the purchase link."

### Whop webhook (`POST /webhooks/whop`)

The trickiest code in the repo — see `README.deploy.md` for deploy/test details:
- The global `express.json` middleware has a `verify` hook that captures the **raw body bytes** into `req.rawBody` for this route only. HMAC verification must use those exact bytes, never a re-serialized `req.body`.
- Signature verification is HMAC-SHA256 with `WHOP_WEBHOOK_SECRET`, using `crypto.timingSafeEqual`, accepting the signature in hex or base64, with or without a `sha256=` prefix, from either `x-whop-signature` or `whop-signature`. Preserve all of these behaviors if you touch this code. Note: if `WHOP_WEBHOOK_SECRET` is unset, verification is skipped entirely.
- Events are stored in `webhook_events` (`ON CONFLICT DO NOTHING`) for idempotency. The buyer email is extracted from several possible payload shapes; a matching user gets `subscription_active = true`, otherwise the user is created and activated.
- Do not log secrets or raw webhook payloads in production.

## Deployment

**Netlify (active):** the site `vellum-docs-app` (https://vellum-docs-app.netlify.app) serves `public/` as static assets and runs the Express app as a serverless function. `src/app.js` exports the app (no `listen`); `src/server.js` wraps it for local `npm start`; `netlify/functions/api.js` wraps it with `serverless-http`; `netlify.toml` rewrites `/api/*`, `/webhooks/*`, `/config`, and `/health` to the function. Keep new dynamic routes covered by those redirects. `src/db.js` falls back to `NETLIFY_DATABASE_URL` and enables TLS when the connection string has `sslmode=require`. Test locally with `netlify dev --offline` (port 8888). Deploys are pushed via the Netlify MCP `deploy-site` flow, not git-linked CI.

**Azure (dormant):** `.github/workflows/azure-webapps-node.yml` deploys to an Azure Web App on push to `main` (Node 20). It requires `AZURE_WEBAPP_NAME` in the workflow (currently the `your-app-name` placeholder) and the `AZURE_WEBAPP_PUBLISH_PROFILE` repo secret — it fails until those are configured or the workflow is removed.

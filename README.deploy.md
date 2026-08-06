# Vellum backend deployment notes

This branch adds a minimal Node/Express backend that:
- Provides a very small auth flow (signup -> JWT)
- Enforces "one free document" per user, then requires purchase
- Calls Anthropic Claude to generate documents
- Accepts Whop webhooks to grant paid access

Files added
- src/server.js       Express app (api endpoints + webhooks)
- src/claude.js       Thin Anthropic wrapper
- src/db.js           Postgres helper functions
- migrations/init.sql SQL to create users/documents/webhook_events
- Dockerfile
- docker-compose.yml (local dev: postgres + web)
- .env.example        Example env vars
- README.deploy.md    Deployment + Render steps

Environment variables (required)
- DATABASE_URL        Postgres connection string (postgres://user:pass@host:5432/db)
- CLAUDE_API_KEY      Anthropic API key
- CLAUDE_MODEL        e.g. claude-2.1 (default set in code)
- WHOP_WEBHOOK_SECRET Secret used to verify Whop webhooks
- JWT_SECRET          Secret for signing auth tokens
- PORT                (optional) server port, default 3000

Quick local dev
1. Copy .env.example -> .env and fill values
2. docker-compose up --build
3. Run migrations: psql postgres://postgres:postgres@localhost:5432/vellum -f migrations/init.sql
4. curl examples in README.deploy.md to test


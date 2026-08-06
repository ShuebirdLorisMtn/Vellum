Updated deployment notes: This branch now includes SendGrid magic-link email flow.

New environment variables
- SENDGRID_API_KEY (your SendGrid API key) — required if you want magic links to work
- APP_BASE_URL (public URL where users open magic links, e.g. https://app.example.com)
- WHOP_PRODUCT_URL is prefilled in .env.example to your product URL.

Please set these before deploying.

Deploy / Whop webhook notes

Add the following to your deployment docs so Whop can POST to your webhook and you can test it locally:

1) Configure Whop
- Webhook URL: https://<your-domain>/webhooks/whop
- Secret: set this to the same WHOP_WEBHOOK_SECRET used by your server

2) Environment variables (examples)
- WHOP_WEBHOOK_SECRET=your_webhook_secret_here
- WHOP_PRODUCT_URL=https://your-whop-product-url
- APP_BASE_URL=https://your-domain

3) Local test using ngrok (example)
- Start your server: PORT=3000 node src/server.js
- Expose locally: ngrok http 3000
- Configure Whop to POST to the ngrok URL + /webhooks/whop and set the secret

4) Quick test script
- Use the provided script to POST a signed test payload against your endpoint:

  WHOP_WEBHOOK_SECRET=your_webhook_secret_here WEBHOOK_URL=http://localhost:3000/webhooks/whop node scripts/test-whop-webhook.js

The script signs the payload using HMAC-SHA256 and sets the x-whop-signature header in the form sha256=<hex>; the server will verify both hex and base64 signature formats and will accept the common sha256=<sig> prefix.

Notes
- The server captures the raw request body (req.rawBody) for the webhook route so HMAC verification uses the exact bytes Whop sent.
- Do not log secrets or raw payloads in production.

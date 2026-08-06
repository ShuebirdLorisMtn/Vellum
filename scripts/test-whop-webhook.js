#!/usr/bin/env node
// scripts/test-whop-webhook.js
// Small helper to POST a signed test payload to your /webhooks/whop endpoint.

const fetch = require('node-fetch');
const crypto = require('crypto');

const webhookUrl = process.env.WEBHOOK_URL || 'http://localhost:3000/webhooks/whop';
const secret = process.env.WHOP_WEBHOOK_SECRET;

if (!secret) {
  console.error('Please set WHOP_WEBHOOK_SECRET in the environment');
  process.exit(1);
}

const payload = {
  id: `test-${Date.now()}`,
  event: 'test.event',
  buyer: {
    email: 'test@example.com'
  },
  data: { test: true }
};

const body = JSON.stringify(payload);
const sigHex = crypto.createHmac('sha256', secret).update(body).digest('hex');
const sigHeader = `sha256=${sigHex}`;

(async () => {
  try {
    console.log('POST', webhookUrl);
    const res = await fetch(webhookUrl, {
      method: 'POST',
      body,
      headers: {
        'Content-Type': 'application/json',
        'x-whop-signature': sigHeader
      }
    });
    console.log('Response', res.status);
    const txt = await res.text();
    console.log(txt);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();

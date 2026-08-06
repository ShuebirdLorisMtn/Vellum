const express = require('express');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const path = require('path');
const sgMail = require('@sendgrid/mail');

require('dotenv').config();

const { generateFromClaude } = require('./claude');
const db = require('./db');

const app = express();

// Use express.json with a verify hook so we capture raw bytes for the Whop webhook route.
// This lets us both have parsed JSON for normal endpoints and the raw payload for HMAC verification.
app.use(express.json({
  limit: '1mb',
  verify: (req, res, buf, encoding) => {
    try {
      if (req && req.originalUrl && req.originalUrl.startsWith('/webhooks/whop')) {
        req.rawBody = buf;
      }
    } catch (e) {
      // ignore verify errors, normal json parsing will handle them
    }
  }
}));

const PORT = process.env.PORT || 3000;
const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;
const CLAUDE_MODEL = process.env.CLAUDE_MODEL || 'claude-2.1';
const WHOP_WEBHOOK_SECRET = process.env.WHOP_WEBHOOK_SECRET || '';
const JWT_SECRET = process.env.JWT_SECRET || 'change_this_in_production';
const WHOP_PRODUCT_URL = process.env.WHOP_PRODUCT_URL || '';
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY || '';
const APP_BASE_URL = process.env.APP_BASE_URL || `http://localhost:${PORT}`;

if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY);
}

function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ error: 'Missing Authorization header' });
  const parts = header.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') return res.status(401).json({ error: 'Invalid Authorization header' });
  try {
    const payload = jwt.verify(parts[1], JWT_SECRET);
    req.user = payload;
    return next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

app.get('/health', (req, res) => res.json({ status: 'ok' }));

// Serve static frontend
app.use(express.static(path.join(__dirname, '..', 'public')));

// Expose a small config endpoint used by the frontend to discover WHOP_PRODUCT_URL
app.get('/config', (req, res) => {
  res.json({ WHOP_PRODUCT_URL });
});

// Signup: retains legacy immediate-create behavior for compatibility
app.post('/api/signup', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'email required' });
  try {
    const user = await db.createUser(email.toLowerCase());
    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '30d' });
    res.json({ token, user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server error' });
  }
});

// Send magic link via SendGrid
app.post('/api/send-magic-link', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'email required' });
  if (!SENDGRID_API_KEY) return res.status(500).json({ error: 'sendgrid_not_configured' });
  try {
    const magicToken = jwt.sign({ email: email.toLowerCase(), type: 'magic' }, JWT_SECRET, { expiresIn: '30m' });
    const link = `${APP_BASE_URL.replace(/\/$/, '')}/magic.html?token=${magicToken}`;
    const msg = {
      to: email,
      from: 'no-reply@vellum.example',
      subject: 'Your Vellum sign-in link',
      html: `<p>Click the link below to sign in to Vellum (valid 30 minutes):</p><p><a href="${link}">Open Vellum</a></p>`
    };
    await sgMail.send(msg);
    res.json({ ok: true });
  } catch (err) {
    console.error('send-magic-link error', err);
    res.status(500).json({ error: 'server error' });
  }
});

// Consume magic token and return session JWT
app.post('/api/magic-consume', async (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ error: 'token required' });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    if (payload.type !== 'magic') return res.status(400).json({ error: 'invalid token type' });
    const email = payload.email;
    let user = await db.findUserByEmail(email);
    if (!user) {
      user = await db.createUser(email);
    }
    const sessionToken = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '30d' });
    res.json({ token: sessionToken, user });
  } catch (err) {
    console.error('magic-consume error', err);
    res.status(400).json({ error: 'invalid_or_expired_token' });
  }
});

// Generate endpoint: body { prompt, title }
app.post('/api/generate', authMiddleware, async (req, res) => {
  const { prompt, title } = req.body;
  if (!prompt) return res.status(400).json({ error: 'prompt required' });
  try {
    const user = await db.getUserById(req.user.userId);
    if (!user) return res.status(404).json({ error: 'user not found' });

    if (user.free_docs_remaining > 0) {
      // consume free doc
      await db.decrementFreeDoc(user.id);
    } else if (!user.subscription_active) {
      // require purchase
      return res.status(402).json({ error: 'payment_required', purchase_url: WHOP_PRODUCT_URL || 'https://your-whop-product-url' });
    }

    // call Claude
    const system = `You are Vellum — a document architect. Produce a concise document based on the user's prompt.`;
    const fullPrompt = `${system}\nUSER PROMPT:\n${prompt}`;
    const output = await generateFromClaude(CLAUDE_API_KEY, CLAUDE_MODEL, fullPrompt, 1500);

    const doc = await db.saveDocument(user.id, title || null, output);
    res.json({ document: doc });
  } catch (err) {
    console.error('generate error', err);
    res.status(500).json({ error: 'server error' });
  }
});

// Whop webhook endpoint (verify HMAC)
app.post('/webhooks/whop', async (req, res) => {
  // Signature headers: try common variants
  const sigHeader = (req.headers['x-whop-signature'] || req.headers['whop-signature'] || '').toString();

  // Prefer the raw body captured by the express.json verify hook; fall back to the parsed body.
  const payloadRaw = req.rawBody || Buffer.from(JSON.stringify(req.body || {}));
  let payloadJson;
  try {
    payloadJson = JSON.parse(payloadRaw.toString('utf8'));
  } catch (e) {
    return res.status(400).send('invalid json');
  }

  // Verify HMAC-SHA256 signature. Whop may provide hex or base64 and sometimes prefix with "sha256=".
  if (WHOP_WEBHOOK_SECRET) {
    const incoming = sigHeader.replace(/^sha256=/i, '').trim();
    let verified = false;
    try {
      const expectedHex = crypto.createHmac('sha256', WHOP_WEBHOOK_SECRET).update(payloadRaw).digest('hex');
      const expectedBase64 = crypto.createHmac('sha256', WHOP_WEBHOOK_SECRET).update(payloadRaw).digest('base64');

      // Try hex
      try {
        const incBuf = Buffer.from(incoming, 'hex');
        const expBuf = Buffer.from(expectedHex, 'hex');
        if (incBuf.length === expBuf.length && crypto.timingSafeEqual(incBuf, expBuf)) verified = true;
      } catch (e) {
        // not hex or mismatch
      }

      // Try base64
      if (!verified) {
        try {
          const incBuf2 = Buffer.from(incoming, 'base64');
          const expBuf2 = Buffer.from(expectedBase64, 'base64');
          if (incBuf2.length === expBuf2.length && crypto.timingSafeEqual(incBuf2, expBuf2)) verified = true;
        } catch (e) {
          // not base64 or mismatch
        }
      }

      if (!verified) {
        console.warn('Invalid webhook signature', { got: sigHeader });
        return res.status(401).send('invalid signature');
      }
    } catch (err) {
      console.error('signature verification failure', err);
      return res.status(500).send('signature_verification_error');
    }
  }

  // idempotency: store event id
  try {
    const eventId = payloadJson.id || payloadJson.event_id || (payloadJson.data && payloadJson.data.id) || null;
    if (eventId) {
      await db.storeWebhookEvent(eventId, payloadJson);
    }
    // Example: payload contains buyer email and product info
    const email = (payloadJson.buyer && payloadJson.buyer.email) || (payloadJson.data && payloadJson.data.buyer && payloadJson.data.buyer.email) || payloadJson.email || null;
    if (email) {
      const user = await db.findUserByEmail(email.toLowerCase());
      if (user) {
        await db.setSubscriptionActive(user.id, true);
        console.log('Enabled subscription for', email);
      } else {
        // Optionally create the user and activate
        const newUser = await db.createUser(email.toLowerCase());
        await db.setSubscriptionActive(newUser.id, true);
        console.log('Created and activated user for', email);
      }
    }

    res.status(200).send('ok');
  } catch (err) {
    console.error('webhook handling error', err);
    res.status(500).send('server error');
  }
});

app.listen(PORT, () => console.log(`Vellum backend listening on ${PORT}`));

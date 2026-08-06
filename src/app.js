const express = require('express');
const crypto = require('crypto');
const path = require('path');

require('dotenv').config();

const { generateFromClaude } = require('./claude');
const sb = require('./supabase');

const app = express();

// Capture raw body bytes for webhook HMAC/signature verification.
// Whop and Stripe both require the exact bytes that were sent.
app.use(express.json({
  limit: '1mb',
  verify: (req, res, buf) => {
    try {
      if (req && req.originalUrl && req.originalUrl.startsWith('/webhooks/')) {
        req.rawBody = buf;
      }
    } catch (e) {
      // ignore verify errors, normal json parsing will handle them
    }
  }
}));

const PORT = process.env.PORT || 3000;
const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;
const CLAUDE_MODEL = process.env.CLAUDE_MODEL || 'claude-opus-5';
const WHOP_WEBHOOK_SECRET = process.env.WHOP_WEBHOOK_SECRET || '';
const WHOP_PRODUCT_URL = process.env.WHOP_PRODUCT_URL || '';
const APP_BASE_URL = (process.env.APP_BASE_URL || `http://localhost:${PORT}`).replace(/\/$/, '');
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || '';
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || '';
const STRIPE_PRICE_MONTHLY = process.env.STRIPE_PRICE_MONTHLY || '';
const STRIPE_PRICE_YEARLY = process.env.STRIPE_PRICE_YEARLY || '';

const stripe = STRIPE_SECRET_KEY ? require('stripe')(STRIPE_SECRET_KEY) : null;

app.get('/health', (req, res) => res.json({ status: 'ok' }));

// Serve static frontend
app.use(express.static(path.join(__dirname, '..', 'public')));

// Public runtime config for the frontend. The anon key is public by design
// (RLS enforces access); the service-role key must never appear here.
app.get('/config', (req, res) => {
  res.json({
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    WHOP_PRODUCT_URL,
    STRIPE_ENABLED: !!(stripe && STRIPE_PRICE_MONTHLY),
  });
});

// Auth middleware: expects a Supabase access token as Bearer auth.
async function authMiddleware(req, res, next) {
  if (!sb.configured()) return res.status(503).json({ error: 'backend_not_configured' });
  const header = req.headers.authorization || '';
  const parts = header.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({ error: 'Missing or invalid Authorization header' });
  }
  try {
    const user = await sb.getUserFromToken(parts[1]);
    if (!user) return res.status(401).json({ error: 'Invalid token' });
    req.user = user;
    return next();
  } catch (err) {
    console.error('auth error', err);
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// Generate endpoint: body { prompt, title, tone, genes }
app.post('/api/generate', authMiddleware, async (req, res) => {
  const { prompt, title, tone, genes } = req.body;
  if (!prompt) return res.status(400).json({ error: 'prompt required' });
  try {
    const profile = await sb.ensureProfile(req.user.id, req.user.email);

    const usingFreeDoc = !profile.subscription_active && profile.free_docs_remaining > 0;
    if (!profile.subscription_active && profile.free_docs_remaining <= 0) {
      return res.status(402).json({
        error: 'payment_required',
        purchase_url: WHOP_PRODUCT_URL || null,
        stripe_available: !!(stripe && STRIPE_PRICE_MONTHLY),
      });
    }

    // Voiceprint calibration: after 5 documents the profile carries learned
    // preferences; fold them into the system prompt.
    let system = 'You are Vellum — a cognitive document architect. Produce a precise, ready-to-send document from the user\'s answers.';
    if (profile.voiceprint && profile.voiceprint.preferred_tone) {
      system += ` This author's documents historically land best in a "${profile.voiceprint.preferred_tone}" register — let that inform cadence and word choice unless the requested tone says otherwise.`;
    }

    const output = await generateFromClaude(CLAUDE_API_KEY, CLAUDE_MODEL, prompt, 2000, system);

    const doc = await sb.saveDocument(req.user.id, { title: title || null, content: output, tone, genes });

    const updates = { docs_generated: (profile.docs_generated || 0) + 1 };
    if (usingFreeDoc) updates.free_docs_remaining = Math.max(0, profile.free_docs_remaining - 1);
    const updated = await sb.updateProfile(req.user.id, updates);

    res.json({
      document: doc,
      free_docs_remaining: updated.free_docs_remaining,
      subscription_active: updated.subscription_active,
      docs_generated: updated.docs_generated,
    });
  } catch (err) {
    if (err && err.code === 'claude_refused') {
      return res.status(422).json({ error: 'claude_refused' });
    }
    console.error('generate error', err);
    res.status(500).json({ error: 'server error' });
  }
});

// ============================================================
// Stripe: hosted Checkout ($29/month, $199/year)
// ============================================================
app.post('/api/stripe/checkout', authMiddleware, async (req, res) => {
  if (!stripe) return res.status(503).json({ error: 'stripe_not_configured' });
  const plan = req.body.plan === 'yearly' ? 'yearly' : 'monthly';
  const price = plan === 'yearly' ? STRIPE_PRICE_YEARLY : STRIPE_PRICE_MONTHLY;
  if (!price) return res.status(503).json({ error: 'stripe_price_not_configured' });
  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price, quantity: 1 }],
      customer_email: req.user.email,
      client_reference_id: req.user.id,
      metadata: { user_id: req.user.id, plan },
      subscription_data: { metadata: { user_id: req.user.id } },
      success_url: `${APP_BASE_URL}/?checkout=success`,
      cancel_url: `${APP_BASE_URL}/?checkout=cancelled`,
    });
    res.json({ url: session.url });
  } catch (err) {
    console.error('stripe checkout error', err);
    res.status(500).json({ error: 'server error' });
  }
});

// Stripe webhook: signature-verified against the raw body.
app.post('/webhooks/stripe', async (req, res) => {
  if (!stripe || !STRIPE_WEBHOOK_SECRET) return res.status(503).send('stripe_not_configured');
  if (!sb.configured()) return res.status(503).send('backend_not_configured');
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.rawBody, req.headers['stripe-signature'], STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.warn('stripe signature verification failed');
    return res.status(400).send('invalid signature');
  }
  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const userId = session.client_reference_id || (session.metadata && session.metadata.user_id);
      if (userId) {
        await sb.updateProfile(userId, {
          subscription_active: true,
          plan: (session.metadata && session.metadata.plan) || 'monthly',
          stripe_customer_id: typeof session.customer === 'string' ? session.customer : null,
        });
      }
    } else if (event.type === 'customer.subscription.deleted') {
      const sub = event.data.object;
      const userId = sub.metadata && sub.metadata.user_id;
      if (userId) {
        await sb.updateProfile(userId, { subscription_active: false, plan: null });
      }
    }
    res.json({ received: true });
  } catch (err) {
    console.error('stripe webhook handling error', err);
    res.status(500).send('server error');
  }
});

// ============================================================
// Whop webhook (HMAC-SHA256, hex or base64, optional sha256= prefix)
// ============================================================
app.post('/webhooks/whop', async (req, res) => {
  const sigHeader = (req.headers['x-whop-signature'] || req.headers['whop-signature'] || '').toString();

  const payloadRaw = req.rawBody || Buffer.from(JSON.stringify(req.body || {}));
  let payloadJson;
  try {
    payloadJson = JSON.parse(payloadRaw.toString('utf8'));
  } catch (e) {
    return res.status(400).send('invalid json');
  }

  if (WHOP_WEBHOOK_SECRET) {
    const incoming = sigHeader.replace(/^sha256=/i, '').trim();
    let verified = false;
    try {
      const expectedHex = crypto.createHmac('sha256', WHOP_WEBHOOK_SECRET).update(payloadRaw).digest('hex');
      const expectedBase64 = crypto.createHmac('sha256', WHOP_WEBHOOK_SECRET).update(payloadRaw).digest('base64');

      try {
        const incBuf = Buffer.from(incoming, 'hex');
        const expBuf = Buffer.from(expectedHex, 'hex');
        if (incBuf.length === expBuf.length && crypto.timingSafeEqual(incBuf, expBuf)) verified = true;
      } catch (e) { /* not hex */ }

      if (!verified) {
        try {
          const incBuf2 = Buffer.from(incoming, 'base64');
          const expBuf2 = Buffer.from(expectedBase64, 'base64');
          if (incBuf2.length === expBuf2.length && crypto.timingSafeEqual(incBuf2, expBuf2)) verified = true;
        } catch (e) { /* not base64 */ }
      }

      if (!verified) {
        console.warn('Invalid webhook signature');
        return res.status(401).send('invalid signature');
      }
    } catch (err) {
      console.error('signature verification failure', err);
      return res.status(500).send('signature_verification_error');
    }
  }

  if (!sb.configured()) return res.status(503).send('backend_not_configured');

  try {
    const email = (payloadJson.buyer && payloadJson.buyer.email)
      || (payloadJson.data && payloadJson.data.buyer && payloadJson.data.buyer.email)
      || payloadJson.email || null;
    if (email) {
      const normalized = email.toLowerCase();
      let profile = await sb.findProfileByEmail(normalized);
      if (!profile) profile = await sb.createUserWithEmail(normalized);
      await sb.updateProfile(profile.id, { subscription_active: true, plan: 'whop' });
      console.log('Enabled subscription (whop) for', normalized);
    }
    res.status(200).send('ok');
  } catch (err) {
    console.error('webhook handling error', err);
    res.status(500).send('server error');
  }
});

module.exports = app;

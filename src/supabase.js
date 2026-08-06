const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.warn('SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set — backend endpoints will 503 until configured');
}

// Service-role client: bypasses RLS. Server-side only — never expose this key.
const admin = (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY)
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
  : null;

function configured() {
  return !!admin;
}

// Resolve a Supabase access token (from the Authorization header) to a user.
async function getUserFromToken(token) {
  if (!admin || !token) return null;
  const { data, error } = await admin.auth.getUser(token);
  if (error || !data || !data.user) return null;
  return data.user;
}

async function getProfile(userId) {
  const { data, error } = await admin.from('profiles').select('*').eq('id', userId).maybeSingle();
  if (error) throw error;
  return data;
}

// The on_auth_user_created trigger normally creates the profile; this covers
// users created before the trigger existed.
async function ensureProfile(userId, email) {
  const existing = await getProfile(userId);
  if (existing) return existing;
  const { data, error } = await admin
    .from('profiles')
    .upsert({ id: userId, email }, { onConflict: 'id' })
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function findProfileByEmail(email) {
  const { data, error } = await admin.from('profiles').select('*').eq('email', email).maybeSingle();
  if (error) throw error;
  return data;
}

// Create an auth user (and via trigger, a profile) for someone who purchased
// before ever signing in — e.g. a Whop webhook arriving first.
async function createUserWithEmail(email) {
  const { data, error } = await admin.auth.admin.createUser({ email, email_confirm: true });
  if (error) throw error;
  return ensureProfile(data.user.id, email);
}

async function updateProfile(userId, fields) {
  const { data, error } = await admin.from('profiles').update(fields).eq('id', userId).select().single();
  if (error) throw error;
  return data;
}

async function saveDocument(userId, { title, content, tone, genes }) {
  const { data, error } = await admin
    .from('documents')
    .insert({ user_id: userId, title, content, tone, genes: genes || [] })
    .select('id, title, content, tone, genes, share_id, share_enabled, created_at')
    .single();
  if (error) throw error;
  return data;
}

module.exports = {
  admin,
  configured,
  getUserFromToken,
  getProfile,
  ensureProfile,
  findProfileByEmail,
  createUserWithEmail,
  updateProfile,
  saveDocument,
};

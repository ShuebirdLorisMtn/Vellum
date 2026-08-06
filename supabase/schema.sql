-- Vellum — Supabase schema
-- Run this once in the Supabase SQL editor (or `supabase db push`).
-- Idempotent: safe to re-run.

-- ============================================================
-- PROFILES (one per auth user)
-- ============================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text unique not null,
  free_docs_remaining integer not null default 3,
  subscription_active boolean not null default false,
  plan text,                                -- 'monthly' | 'yearly' | 'whop'
  stripe_customer_id text,
  docs_generated integer not null default 0,
  voiceprint jsonb,                         -- per-user calibration after 5 docs
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "profiles: read own" on public.profiles;
create policy "profiles: read own" on public.profiles
  for select using (auth.uid() = id);

-- All writes to profiles happen via the service role (quota, subscriptions).

-- Auto-create a profile when a user signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- DOCUMENTS
-- ============================================================
create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  title text,
  content text not null,
  tone text,
  genes text[] not null default '{}',
  share_id text unique not null default encode(gen_random_bytes(9), 'base64url'),
  share_enabled boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists documents_user_idx on public.documents (user_id, created_at desc);
create index if not exists documents_share_idx on public.documents (share_id) where share_enabled;

alter table public.documents enable row level security;

drop policy if exists "documents: read own" on public.documents;
create policy "documents: read own" on public.documents
  for select using (auth.uid() = user_id);

drop policy if exists "documents: read shared" on public.documents;
create policy "documents: read shared" on public.documents
  for select using (share_enabled = true);

drop policy if exists "documents: share own" on public.documents;
create policy "documents: share own" on public.documents
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Inserts happen via the service role (the generate function).

-- ============================================================
-- FEEDBACK (thumbs up/down per document)
-- ============================================================
create table if not exists public.feedback (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  document_id uuid references public.documents (id) on delete set null,
  rating text not null check (rating in ('up', 'down')),
  tone text,
  genes text[] not null default '{}',
  created_at timestamptz not null default now()
);

create index if not exists feedback_user_idx on public.feedback (user_id, created_at desc);

alter table public.feedback enable row level security;

drop policy if exists "feedback: read own" on public.feedback;
create policy "feedback: read own" on public.feedback
  for select using (auth.uid() = user_id);

-- Inserts happen only through the record_feedback RPC below.

-- ============================================================
-- EVENTS (copy / download / regenerate / share_view / generate)
-- ============================================================
create table if not exists public.events (
  id bigint generated always as identity primary key,
  user_id uuid references public.profiles (id) on delete cascade,
  document_id uuid references public.documents (id) on delete set null,
  event_type text not null check (event_type in ('copy', 'download', 'regenerate', 'share_view', 'generate', 'share_created')),
  created_at timestamptz not null default now()
);

create index if not exists events_user_idx on public.events (user_id, created_at desc);
create index if not exists events_type_idx on public.events (event_type, created_at desc);

alter table public.events enable row level security;

drop policy if exists "events: insert own" on public.events;
create policy "events: insert own" on public.events
  for insert with check (auth.uid() = user_id);

-- Anonymous share-view tracking (no auth): user_id must be null
drop policy if exists "events: anon share views" on public.events;
create policy "events: anon share views" on public.events
  for insert to anon with check (user_id is null and event_type = 'share_view');

drop policy if exists "events: read own" on public.events;
create policy "events: read own" on public.events
  for select using (auth.uid() = user_id);

-- ============================================================
-- TONE PREFERENCES (per-user aggregate)
-- ============================================================
create table if not exists public.tone_preferences (
  user_id uuid not null references public.profiles (id) on delete cascade,
  tone text not null,
  up integer not null default 0,
  down integer not null default 0,
  primary key (user_id, tone)
);

alter table public.tone_preferences enable row level security;

drop policy if exists "tone_preferences: read own" on public.tone_preferences;
create policy "tone_preferences: read own" on public.tone_preferences
  for select using (auth.uid() = user_id);

-- ============================================================
-- GENE WEIGHTS (global — the learning flywheel)
-- ============================================================
create table if not exists public.gene_weights (
  gene text primary key,
  weight double precision not null default 1.0,
  votes_up integer not null default 0,
  votes_down integer not null default 0,
  updated_at timestamptz not null default now()
);

insert into public.gene_weights (gene) values
  ('mirror'), ('rosetta'), ('arbiter'), ('catalyst'), ('magna')
on conflict (gene) do nothing;

alter table public.gene_weights enable row level security;

drop policy if exists "gene_weights: readable by all" on public.gene_weights;
create policy "gene_weights: readable by all" on public.gene_weights
  for select using (true);

-- Writes happen only through the record_feedback RPC (security definer).

-- ============================================================
-- RPC: record_feedback
-- One call records the thumbs vote, updates the user's tone
-- preferences, nudges the GLOBAL gene weights, and recalibrates
-- the user's voiceprint once they have 5+ documents.
-- ============================================================
create or replace function public.record_feedback(
  p_document_id uuid,
  p_rating text,
  p_tone text,
  p_genes text[]
)
returns jsonb
language plpgsql
security definer set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_gene text;
  v_docs integer;
  v_voiceprint jsonb;
begin
  if v_user is null then
    raise exception 'not authenticated';
  end if;
  if p_rating not in ('up', 'down') then
    raise exception 'invalid rating';
  end if;

  insert into feedback (user_id, document_id, rating, tone, genes)
  values (v_user, p_document_id, p_rating, p_tone, coalesce(p_genes, '{}'));

  -- Per-user tone preference
  insert into tone_preferences as tp (user_id, tone, up, down)
  values (v_user, p_tone, (p_rating = 'up')::int, (p_rating = 'down')::int)
  on conflict (user_id, tone) do update
    set up = tp.up + (p_rating = 'up')::int,
        down = tp.down + (p_rating = 'down')::int;

  -- Global gene weights: +0.01 per up-vote, -0.005 per down-vote, clamped [0.5, 2.0]
  foreach v_gene in array coalesce(p_genes, '{}')
  loop
    update gene_weights
      set weight = greatest(0.5, least(2.0,
            weight + case when p_rating = 'up' then 0.01 else -0.005 end)),
          votes_up = votes_up + (p_rating = 'up')::int,
          votes_down = votes_down + (p_rating = 'down')::int,
          updated_at = now()
      where gene = v_gene;
  end loop;

  -- Voiceprint calibration once the user has 5+ documents
  select docs_generated into v_docs from profiles where id = v_user;
  if v_docs >= 5 then
    select jsonb_build_object(
      'docs', v_docs,
      'calibrated_at', now(),
      'tones', coalesce((
        select jsonb_object_agg(tone, jsonb_build_object('up', up, 'down', down))
        from tone_preferences where user_id = v_user
      ), '{}'::jsonb),
      'preferred_tone', (
        select tone from tone_preferences
        where user_id = v_user and (up + down) > 0
        order by (up - down) desc, up desc limit 1
      )
    ) into v_voiceprint;
    update profiles set voiceprint = v_voiceprint where id = v_user;
  end if;

  return jsonb_build_object('ok', true, 'docs_generated', v_docs);
end;
$$;

-- ============================================================
-- ROLE PRIVILEGES
-- RLS policies decide *which rows* a role may touch, but Postgres
-- still requires a table-level GRANT before RLS is evaluated at
-- all — otherwise every request 42501s with "permission denied"
-- regardless of policy. Supabase's Table Editor does this
-- automatically for tables created there; these were created via
-- the SQL editor, so it's explicit here.
-- ============================================================
grant usage on schema public to anon, authenticated, service_role;

grant select on public.profiles to authenticated;
grant select, update on public.documents to authenticated;
grant select on public.documents to anon;              -- gated by the "read shared" RLS policy
grant select on public.feedback to authenticated;
grant select, insert on public.events to authenticated;
grant insert on public.events to anon;                  -- gated by the "anon share views" RLS policy
grant select on public.tone_preferences to authenticated;
grant select on public.gene_weights to anon, authenticated;
grant execute on function public.record_feedback(uuid, text, text, text[]) to authenticated;

grant all privileges on all tables in schema public to service_role;
grant usage, select on all sequences in schema public to service_role;
grant execute on all functions in schema public to service_role;

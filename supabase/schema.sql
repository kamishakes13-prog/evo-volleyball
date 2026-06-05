create extension if not exists "pgcrypto";

create type app_role as enum ('admin', 'coach', 'parent_player');
create type invoice_status as enum ('unpaid', 'paid', 'partial', 'overdue', 'waived');
create type invoice_category as enum (
  'monthly_dues',
  'tournament_fee',
  'uniform',
  'camp',
  'private_session',
  'custom'
);
create type payment_method as enum (
  'cash',
  'zelle',
  'venmo',
  'cash_app',
  'card',
  'other'
);
create type private_session_type as enum (
  'one_on_one',
  'small_group',
  'skills_training'
);
create type attendance_status as enum ('present', 'absent', 'late', 'excused');

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role app_role not null default 'parent_player',
  full_name text not null,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table coaches (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid unique references profiles(id) on delete set null,
  name text not null,
  email text,
  phone text,
  bio text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table teams (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  age_group text not null,
  coach_id uuid references coaches(id) on delete set null,
  max_player_count integer not null check (max_player_count > 0),
  monthly_dues_cents integer not null default 0 check (monthly_dues_cents >= 0),
  schedule text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table players (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete set null,
  team_id uuid references teams(id) on delete set null,
  player_name text not null,
  parent_name text not null,
  phone text,
  email text,
  jersey_number integer,
  notes text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint jersey_number_positive check (
    jersey_number is null or jersey_number > 0
  )
);

create table invoices (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references players(id) on delete cascade,
  created_by uuid references profiles(id) on delete set null,
  title text not null,
  category invoice_category not null,
  amount_cents integer not null check (amount_cents >= 0),
  paid_cents integer not null default 0 check (paid_cents >= 0),
  due_date date,
  status invoice_status not null default 'unpaid',
  stripe_checkout_session_id text,
  stripe_payment_intent_id text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint paid_not_above_amount check (paid_cents <= amount_cents)
);

create table payments (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references invoices(id) on delete cascade,
  amount_cents integer not null check (amount_cents > 0),
  method payment_method not null,
  paid_at timestamptz not null default now()
);

create table coach_availability (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null references coaches(id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  price_cents integer not null default 0 check (price_cents >= 0),
  is_booked boolean not null default false,
  created_at timestamptz not null default now(),
  constraint availability_has_duration check (ends_at > starts_at),
  constraint one_slot_per_coach unique (coach_id, starts_at, ends_at)
);

create table private_sessions (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null references coaches(id) on delete restrict,
  player_id uuid not null references players(id) on delete cascade,
  invoice_id uuid references invoices(id) on delete set null,
  session_type private_session_type not null,
  price_cents integer not null check (price_cents >= 0),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  payment_status invoice_status not null default 'unpaid',
  notes text,
  created_at timestamptz not null default now(),
  constraint private_session_has_duration check (ends_at > starts_at),
  constraint prevent_double_booking unique (coach_id, starts_at, ends_at)
);

create table calendar_events (
  id uuid primary key default gen_random_uuid(),
  team_id uuid references teams(id) on delete cascade,
  coach_id uuid references coaches(id) on delete set null,
  title text not null,
  location text,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  event_type text not null default 'practice',
  created_at timestamptz not null default now(),
  constraint event_has_duration check (ends_at > starts_at)
);

create table attendance (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references players(id) on delete cascade,
  team_id uuid not null references teams(id) on delete cascade,
  event_id uuid references calendar_events(id) on delete cascade,
  status attendance_status not null,
  notes text,
  recorded_by uuid references profiles(id) on delete set null,
  recorded_at timestamptz not null default now()
);

create table parent_consents (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  player_id uuid references players(id) on delete cascade,
  terms_accepted_at timestamptz,
  privacy_accepted_at timestamptz,
  data_consent_at timestamptz,
  created_at timestamptz not null default now()
);

create table audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references profiles(id) on delete set null,
  actor_email text,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index teams_coach_id_idx on teams(coach_id);
create index players_team_id_idx on players(team_id);
create index players_user_id_idx on players(user_id);
create index invoices_player_id_idx on invoices(player_id);
create index invoices_status_idx on invoices(status);
create index payments_invoice_id_idx on payments(invoice_id);
create index private_sessions_player_id_idx on private_sessions(player_id);
create index private_sessions_coach_time_idx on private_sessions(coach_id, starts_at);
create index attendance_player_id_idx on attendance(player_id);
create index attendance_team_id_idx on attendance(team_id);
create index audit_logs_created_at_idx on audit_logs(created_at);

alter table profiles enable row level security;
alter table coaches enable row level security;
alter table teams enable row level security;
alter table players enable row level security;
alter table invoices enable row level security;
alter table payments enable row level security;
alter table coach_availability enable row level security;
alter table private_sessions enable row level security;
alter table calendar_events enable row level security;
alter table attendance enable row level security;
alter table parent_consents enable row level security;
alter table audit_logs enable row level security;

create or replace function current_app_role()
returns app_role
language sql
stable
security definer
set search_path = public
as $$
  select role from profiles where id = auth.uid()
$$;

create or replace function is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select current_app_role() = 'admin'
$$;

create or replace function is_assigned_coach(p_team_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from teams
    join coaches on coaches.id = teams.coach_id
    where teams.id = p_team_id
    and coaches.profile_id = auth.uid()
  )
$$;

create or replace function is_parent_for_player(p_player_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from players
    where players.id = p_player_id
    and players.user_id = auth.uid()
  )
$$;

create policy "profiles self read"
on profiles for select
using (id = auth.uid() or is_admin());

create policy "profiles admin manage"
on profiles for all
using (is_admin())
with check (is_admin());

create policy "coaches admin manage"
on coaches for all
using (is_admin())
with check (is_admin());

create policy "coaches self read"
on coaches for select
using (is_admin() or profile_id = auth.uid());

create policy "teams scoped read"
on teams for select
using (
  is_admin()
  or is_assigned_coach(id)
  or exists (
    select 1 from players
    where players.team_id = teams.id
    and players.user_id = auth.uid()
  )
);

create policy "teams admin manage"
on teams for all
using (is_admin())
with check (is_admin());

create policy "players scoped read"
on players for select
using (
  is_admin()
  or is_assigned_coach(team_id)
  or user_id = auth.uid()
);

create policy "players admin manage"
on players for all
using (is_admin())
with check (is_admin());

create policy "invoices scoped read"
on invoices for select
using (
  is_admin()
  or is_parent_for_player(player_id)
);

create policy "invoices admin manage"
on invoices for all
using (is_admin())
with check (is_admin());

create policy "payments scoped read"
on payments for select
using (
  is_admin()
  or exists (
    select 1
    from invoices
    where invoices.id = payments.invoice_id
    and is_parent_for_player(invoices.player_id)
  )
);

create policy "payments admin manage"
on payments for all
using (is_admin())
with check (is_admin());

create policy "availability scoped read"
on coach_availability for select
using (
  is_admin()
  or exists (
    select 1 from coaches
    where coaches.id = coach_availability.coach_id
    and coaches.profile_id = auth.uid()
  )
);

create policy "availability admin or coach manage own"
on coach_availability for all
using (
  is_admin()
  or exists (
    select 1 from coaches
    where coaches.id = coach_availability.coach_id
    and coaches.profile_id = auth.uid()
  )
)
with check (
  is_admin()
  or exists (
    select 1 from coaches
    where coaches.id = coach_availability.coach_id
    and coaches.profile_id = auth.uid()
  )
);

create policy "private sessions scoped read"
on private_sessions for select
using (
  is_admin()
  or is_parent_for_player(player_id)
  or exists (
    select 1 from coaches
    where coaches.id = private_sessions.coach_id
    and coaches.profile_id = auth.uid()
  )
);

create policy "private sessions admin manage"
on private_sessions for all
using (is_admin())
with check (is_admin());

create policy "calendar scoped read"
on calendar_events for select
using (
  is_admin()
  or is_assigned_coach(team_id)
  or exists (
    select 1 from players
    where players.team_id = calendar_events.team_id
    and players.user_id = auth.uid()
  )
);

create policy "calendar admin manage"
on calendar_events for all
using (is_admin())
with check (is_admin());

create policy "attendance scoped read"
on attendance for select
using (
  is_admin()
  or is_assigned_coach(team_id)
  or is_parent_for_player(player_id)
);

create policy "attendance admin or coach manage assigned"
on attendance for all
using (is_admin() or is_assigned_coach(team_id))
with check (is_admin() or is_assigned_coach(team_id));

create policy "consents self read"
on parent_consents for select
using (is_admin() or profile_id = auth.uid());

create policy "consents self create"
on parent_consents for insert
with check (profile_id = auth.uid());

create policy "audit logs admin read"
on audit_logs for select
using (is_admin());

create policy "audit logs authenticated create"
on audit_logs for insert
to authenticated
with check (actor_id = auth.uid() or actor_id is null);

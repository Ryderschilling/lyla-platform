-- The Progress Club — initial schema
-- Users (Lyla creates every client login herself; no self-serve signup)
create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  password_hash text not null,
  full_name text not null,
  role text not null default 'client' check (role in ('admin','client')),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Workouts drop automatically at launch_at (America/Chicago mornings)
create table if not exists workouts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  subtitle text,
  coach_note text,
  launch_at timestamptz not null,
  timer_config jsonb not null default '{}'::jsonb,
  published boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists workouts_launch_idx on workouts (launch_at desc);

create table if not exists movements (
  id uuid primary key default gen_random_uuid(),
  workout_id uuid not null references workouts(id) on delete cascade,
  group_label text,
  seq integer not null default 0,
  name text not null,
  detail text,
  media_url text,
  media_type text check (media_type in ('video','image') or media_type is null)
);
create index if not exists movements_workout_idx on movements (workout_id, seq);

create table if not exists completions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  workout_id uuid not null references workouts(id) on delete cascade,
  completed_at timestamptz not null default now(),
  unique (user_id, workout_id)
);
create index if not exists completions_user_idx on completions (user_id, completed_at desc);

create table if not exists reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  workout_id uuid not null references workouts(id) on delete cascade,
  difficulty text not null check (difficulty in ('too_easy','just_right','too_hard')),
  favorite_movement_id uuid references movements(id) on delete set null,
  note text,
  created_at timestamptz not null default now(),
  unique (user_id, workout_id)
);
create index if not exists reviews_workout_idx on reviews (workout_id, created_at desc);

-- sender_id null = guest message from the public contact form (guest_* fields set)
create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid references users(id) on delete cascade,
  recipient_id uuid not null references users(id) on delete cascade,
  guest_name text,
  guest_email text,
  body text not null,
  read_at timestamptz,
  created_at timestamptz not null default now(),
  check (sender_id is not null or guest_email is not null)
);
create index if not exists messages_thread_idx on messages (recipient_id, sender_id, created_at desc);

create table if not exists referral_codes (
  id uuid primary key default gen_random_uuid(),
  brand text not null,
  code text not null,
  url text,
  blurb text,
  sort integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists leads (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  source text,
  created_at timestamptz not null default now()
);

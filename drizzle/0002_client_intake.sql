-- What the member tells us about themselves on first login, the note Lyla writes
-- for the AI coach, and the record of them accepting the waiver.
-- Kept off the users table so auth/billing stays clean.
create table if not exists client_profiles (
  user_id uuid primary key references users(id) on delete cascade,
  age integer,
  height_in integer,
  weight_lb integer,
  shirt_size text,
  experience text,
  days_per_week integer,
  goal text,
  injuries text,
  equipment text,
  anything_else text,
  coach_context text,
  completed_at timestamptz,
  -- consent record: who agreed, to which version, when, from where
  agreed_at timestamptz,
  agreed_version text,
  agreed_ip text,
  updated_at timestamptz not null default now()
);
create index if not exists client_profiles_completed_idx on client_profiles (completed_at);

-- One row per member per America/Chicago calendar day they showed up.
--
-- The composite primary key IS the once-per-24h cap: the insert is
-- ON CONFLICT DO NOTHING, so logging out and back in twenty times on the same
-- day writes exactly one row. No timestamp arithmetic, no way to double-count,
-- and it can't drift when the clock crosses DST.
--
-- `day` is the Chicago calendar day, not UTC — a 7pm CT session must not land on
-- tomorrow's square.
create table if not exists active_days (
  user_id uuid not null references users(id) on delete cascade,
  day date not null,
  first_seen_at timestamptz not null default now(),
  primary key (user_id, day)
);

create index if not exists active_days_user_day_idx on active_days (user_id, day desc);

-- Backfill so nobody's existing streak resets: every day someone finished a
-- workout is obviously a day they showed up.
insert into active_days (user_id, day, first_seen_at)
select user_id, (completed_at at time zone 'America/Chicago')::date as day, min(completed_at)
from completions
group by user_id, 2
on conflict do nothing;

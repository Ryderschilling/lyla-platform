-- Client billing + profile fields. Lyla sets what each member pays; HQ rolls it into MRR.
alter table users add column if not exists monthly_price_cents integer not null default 0;
alter table users add column if not exists phone text;
alter table users add column if not exists notes text;
alter table users add column if not exists started_at timestamptz;
update users set started_at = created_at where started_at is null;

-- Shirt size pulled from the welcome questions — Lyla isn't shipping apparel,
-- so it was a question that cost the member time and bought nothing.
-- Dropped from the intake form, the HQ client modal, and the payload schema.
alter table client_profiles drop column if exists shirt_size;

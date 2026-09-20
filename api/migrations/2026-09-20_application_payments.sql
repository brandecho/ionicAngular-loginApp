-- =====================================================================
--  Migration: application plan + payment tracking (fast-track / Stripe)
--  Run ONCE against your existing myvipclubs_vip database.
--
--  If you get "Duplicate column name" errors, it means this migration has
--  already been applied — that's fine, you can ignore those.
-- =====================================================================

ALTER TABLE members
  ADD COLUMN application_plan     VARCHAR(20)  NULL AFTER application_status,
  ADD COLUMN application_fee_paid TINYINT(1)   NOT NULL DEFAULT 0 AFTER application_plan,
  ADD COLUMN stripe_checkout_id   VARCHAR(120) NULL AFTER application_fee_paid;

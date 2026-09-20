-- =====================================================================
--  My VIP Clubs — ONE-FILE database setup
--  Import in phpMyAdmin: select the myvipclubs_vip database → Import tab
--  → choose this file → Go.
--
--  Safe to run more than once (CREATE TABLE IF NOT EXISTS + INSERT IGNORE).
--  Part 1 = schema (all tables). Part 2 = sample admin/venues/members.
--  Admin login after import:  admin@myvipclubs.app  /  admin123
-- =====================================================================

-- ############  PART 1 — SCHEMA  ############
-- =====================================================================
--  My VIP Clubs — MySQL schema (MySQL 8+)
--  Mirrors the JotForm "MyVIPClubs Membership Application" (form 262304451128045)
--  plus the app's venue / staff / notification entities.
--
--  Apply:  mysql -u <user> -p <database> < schema.sql
-- =====================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ---------- accounts (login for every persona) ----------
CREATE TABLE IF NOT EXISTS accounts (
  id            CHAR(36)      NOT NULL,
  role          ENUM('member','owner','manager','staff','admin') NOT NULL,
  name          VARCHAR(160)  NOT NULL,
  email         VARCHAR(190)  NOT NULL,
  phone         VARCHAR(32)   NULL,            -- E.164, for SMS
  password_hash VARCHAR(255)  NOT NULL,
  venue_id      CHAR(36)      NULL,            -- owner/manager/staff belong to a venue
  member_id     CHAR(36)      NULL,            -- role='member' -> members.id
  created_at    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_accounts_email (email),
  KEY idx_accounts_venue (venue_id),
  KEY idx_accounts_member (member_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------- members (VIP profile == membership application) ----------
CREATE TABLE IF NOT EXISTS members (
  id                       CHAR(36)     NOT NULL,
  account_id               CHAR(36)     NULL,
  vip_number               VARCHAR(24)  NULL,

  -- Section 1: About You
  first_name               VARCHAR(80)  NOT NULL,
  last_name                VARCHAR(80)  NOT NULL,
  preferred_name           VARCHAR(80)  NULL,
  over_21                  TINYINT(1)   NULL,
  email                    VARCHAR(190) NOT NULL,
  phone                    VARCHAR(32)  NULL,   -- NOTE: add a Mobile field to the JotForm
  address_street1          VARCHAR(160) NULL,
  address_street2          VARCHAR(160) NULL,
  address_city             VARCHAR(100) NULL,
  address_state            VARCHAR(100) NULL,
  address_postal           VARCHAR(24)  NULL,
  linkedin_url             VARCHAR(255) NULL,
  social_profile           VARCHAR(255) NULL,
  relationship_status      VARCHAR(60)  NULL,
  how_heard                VARCHAR(255) NULL,

  -- Section 2: Referral
  referral_first           VARCHAR(80)  NULL,
  referral_last            VARCHAR(80)  NULL,
  referral_vip_number      VARCHAR(24)  NULL,
  referral_relationship    VARCHAR(160) NULL,
  referral_known_duration  VARCHAR(80)  NULL,
  referral_knows_personally TINYINT(1)  NULL,

  -- Section 3: Professional
  employer                 VARCHAR(160) NULL,
  industry                 VARCHAR(120) NULL,
  job_title                VARCHAR(120) NULL,
  is_business_owner        TINYINT(1)   NULL,

  -- Section 4: Membership & Interests
  establishment_types      JSON         NULL,   -- ["Upscale restaurants","Lounges",...]
  visit_frequency          VARCHAR(80)  NULL,
  visit_company            VARCHAR(80)  NULL,    -- alone / couple / group
  interested_events        TINYINT(1)   NULL,
  interested_offers        TINYINT(1)   NULL,

  -- Section 5 & 6: VIP preferences + recognition
  favorite_foods           VARCHAR(500) NULL,
  favorite_restaurants     VARCHAR(500) NULL,
  preferred_beverages      VARCHAR(500) NULL,
  dietary_restrictions     VARCHAR(500) NULL,
  favorite_wine_spirits    VARCHAR(500) NULL,
  preferred_seating        VARCHAR(160) NULL,
  preferred_atmosphere     VARCHAR(160) NULL,
  music                    VARCHAR(255) NULL,
  smoking                  VARCHAR(160) NULL,
  special_occasions        JSON         NULL,
  hospitality_details      TEXT         NULL,
  what_makes_vip           TEXT         NULL,
  do_not_share             TEXT         NULL,
  additional_notes         TEXT         NULL,
  consent_share_with_venues TINYINT(1)  NULL,
  membership_photo_url     VARCHAR(255) NULL,

  -- Sections 7-11: acknowledgments / consent / certification
  standards_ack            TINYINT(1)   NULL,
  gratuity_agreed          TINYINT(1)   NULL,
  privacy_consented        TINYINT(1)   NULL,
  authorize_verification   TINYINT(1)   NULL,
  final_certification      TINYINT(1)   NULL,
  application_date         DATE         NULL,
  application_status       ENUM('pending','approved','declined') NOT NULL DEFAULT 'pending',

  -- App / derived
  tier                     ENUM('silver','gold','platinum','black','noir') NULL,
  total_spent              DECIMAL(12,2) NOT NULL DEFAULT 0,
  total_tips               DECIMAL(12,2) NOT NULL DEFAULT 0,
  visits_this_year         INT          NOT NULL DEFAULT 0,
  member_since             YEAR         NULL,

  created_at               TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at               TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_members_email (email),
  KEY idx_members_status (application_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------- venues ----------
CREATE TABLE IF NOT EXISTS venues (
  id               CHAR(36)     NOT NULL,
  name             VARCHAR(160) NOT NULL,
  type             VARCHAR(60)  NULL,
  address          VARCHAR(255) NULL,
  neighborhood     VARCHAR(120) NULL,
  city             VARCHAR(120) NULL,
  lat              DECIMAL(10,7) NULL,
  lng              DECIMAL(10,7) NULL,
  geofence_radius  INT          NULL DEFAULT 250,
  tier_required    ENUM('silver','gold','platinum','black','noir') NOT NULL DEFAULT 'silver',
  status           ENUM('pending','active','declined') NOT NULL DEFAULT 'pending',
  owner_account_id CHAR(36)     NULL,
  created_at       TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_venues_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------- staff memberships (staff <-> venue, needs approval) ----------
CREATE TABLE IF NOT EXISTS staff_memberships (
  id            CHAR(36)     NOT NULL,
  account_id    CHAR(36)     NOT NULL,
  venue_id      CHAR(36)     NOT NULL,
  name          VARCHAR(160) NOT NULL,
  email         VARCHAR(190) NULL,
  phone         VARCHAR(32)  NULL,
  role          ENUM('Manager','Bartender','Server','Host','Sommelier','Security') NOT NULL,
  status        ENUM('pending','approved','declined') NOT NULL DEFAULT 'pending',
  requested_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  decided_by    CHAR(36)     NULL,
  PRIMARY KEY (id),
  KEY idx_staff_venue (venue_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------- member <-> venue access (the VIP roster) ----------
CREATE TABLE IF NOT EXISTS member_venue_access (
  member_id   CHAR(36)   NOT NULL,
  venue_id    CHAR(36)   NOT NULL,
  granted_at  TIMESTAMP  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (member_id, venue_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------- venue access requests (member asks for the hookup) ----------
CREATE TABLE IF NOT EXISTS venue_requests (
  id            CHAR(36)   NOT NULL,
  member_id     CHAR(36)   NOT NULL,
  venue_id      CHAR(36)   NOT NULL,
  status        ENUM('requested','in_review','approved','declined') NOT NULL DEFAULT 'requested',
  note          VARCHAR(500) NULL,
  requested_at  TIMESTAMP  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  decided_by    CHAR(36)   NULL,
  PRIMARY KEY (id),
  KEY idx_req_venue (venue_id, status),
  KEY idx_req_member (member_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------- notifications (in-app inbox) ----------
CREATE TABLE IF NOT EXISTS notifications (
  id            CHAR(36)   NOT NULL,
  audience_kind ENUM('account','venue','role') NOT NULL,
  audience_id   VARCHAR(64) NOT NULL,          -- account id / venue id / role name
  type          VARCHAR(48) NOT NULL,
  title         VARCHAR(160) NOT NULL,
  body          VARCHAR(500) NOT NULL,
  deep_link     VARCHAR(255) NULL,
  read_flag     TINYINT(1)  NOT NULL DEFAULT 0,
  created_at    TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_notif_aud (audience_kind, audience_id, read_flag)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------- sms outbox (Twilio send log) ----------
CREATE TABLE IF NOT EXISTS sms_outbox (
  id            CHAR(36)   NOT NULL,
  to_phone      VARCHAR(32) NOT NULL,
  body          VARCHAR(640) NOT NULL,
  related_type  VARCHAR(48) NULL,
  status        ENUM('queued','sent','failed') NOT NULL DEFAULT 'queued',
  provider_sid  VARCHAR(64) NULL,
  error         VARCHAR(255) NULL,
  created_at    TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_sms_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

SET FOREIGN_KEY_CHECKS = 1;


-- ############  PART 2 — SEED DATA  ############
-- =====================================================================
--  My VIP Clubs — sample/seed data for testing the admin panel.
--  Safe to re-run (INSERT IGNORE skips rows that already exist).
--  Admin login:  admin@myvipclubs.app  /  admin123
-- =====================================================================

INSERT IGNORE INTO accounts (id, role, name, email, password_hash) VALUES
  ('acct-admin-0001', 'admin', 'MVC Admin', 'admin@myvipclubs.app', '$2y$12$v/5zDBg70I8oO9mpSS9u.OgU02m.6xfUn9c3oi28HCKUj8aCzkWzK');

INSERT IGNORE INTO venues (id, name, type, address, neighborhood, city, lat, lng, tier_required, status) VALUES
  ('ven-0001','Skyline 88','Rooftop','88 SE 3rd Ave, Miami, FL 33131','Downtown','Miami',25.7690,-80.1900,'silver','active'),
  ('ven-0002','Velvet Room','Nightclub','1235 Washington Ave, Miami Beach, FL 33139','South Beach','Miami',25.7860,-80.1300,'gold','active'),
  ('ven-0003','The Cellar','Speakeasy','167 NW 23rd St, Miami, FL 33127','Wynwood','Miami',25.7998,-80.1990,'gold','active'),
  ('ven-0004','Noir Society','Members Club','140 NE 39th St, Miami, FL 33137','Design District','Miami',25.8130,-80.1930,'platinum','active');

INSERT IGNORE INTO members
  (id, first_name, last_name, email, phone, tier, application_status, member_since,
   preferred_beverages, preferred_seating, dietary_restrictions, music) VALUES
  ('mem-0001','Alex','Morgan','alex@example.com','+13055550111','platinum','approved',2022,
   'Old Fashioned','Corner banquette','Shellfish','Deep house'),
  ('mem-0002','Jordan','Blake','jordan@example.com','+13055550122','black','approved',2020,
   'Macallan 18','Center booth','None','Live jazz'),
  ('mem-0003','Riley','Chen','riley@example.com','+13055550133','gold','approved',2023,
   'Espresso Martini','High-top near DJ','Peanuts','Techno');

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

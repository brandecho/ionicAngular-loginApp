# My VIP Clubs — Project Plan & Status

> Master reference for the whole project. Read this first to pick up where we
> left off. Owner: Peter (brandechomedia@gmail.com). App lives in `myvipclubs/`.

## Vision

Give members VIP access to venues they normally couldn't get into on their own
("the hookup"), and let venues **recognize a VIP before they walk in the door** —
so there's no line, and staff already know the guest's name and tastes. It's
SMS-first (this industry lives on text, not email).

## Current status (snapshot)

- **Branch:** `claude/my-vip-clubs-app-qhwtmc` (all work pushed here).
- **Preview:** Netlify — connect the repo once (see `NETLIFY.md`). Auto-deploys
  on every push. (`netlify.toml` holds the build config.)
- **Stack:** Ionic 8 + Angular 20 (standalone components, signals). Zero backend
  yet — all data is in-memory mock data, so a hard refresh resets to seed.

## What's built (working today)

**Member app** (tabbed)
- Dashboard: tier (Silver → Gold → Platinum → Black → Noir) earned from
  **total spend + tips**, lifetime value, progress to next tier, perks.
- My Venues, My People (staff), Discover (request access), Profile (editable
  tastes), venue detail (address + Google Maps directions + request a table).
- Recognition flow: "I'm here" → GPS-arrival simulation → venue is notified →
  manager opens the member's "how to take care of them" card.

**Venue portal** (per venue)
- Tonight (VIPs inbound), Requests (approve/decline member access), Members
  (VIP roster), Team (approve/decline staff join requests), inbox bell.

**Platform admin**
- Vet new venue registrations (approve → venue goes live), and an **SMS outbox**
  showing every text the system would send.

**Accounts, roles & registration**
- Roles: Platform Admin > Venue Owner/Manager > Staff > Member.
- Login: email + password. Every account has a mobile number for SMS.
- Registration: member (instant), venue (→ admin vetting), staff (pick venue +
  role → owner/manager confirms).

**Notifications**
- In-app **Inbox** is the source of truth (addressed to an account, a venue, or
  the admin role); deep-links to the right screen.
- **Twilio SMS** is the nudge. Runs in **mock mode** now (records exact payloads
  to the outbox); flip to a backend endpoint to send for real.

**Demo accounts** (login screen has one-tap buttons; passwords `demo`, admin `admin`)
| Persona | Email |
| --- | --- |
| Member (Alex, Platinum) | brandechomedia@gmail.com |
| Venue owner (Velvet Room) | elena@velvetroom.com |
| Venue manager (Velvet Room) | sofia@velvetroom.com |
| Platform admin | admin@myvipclubs.app |
| Staff — pending (Nina) | nina@example.com |
| Owner — pending venue (Lumen) | priya@lumenrooftop.com |

## Where things live (code map)

```
myvipclubs/src/app/
  pages/        all screens (login, tabs+home/venues/people/discover/profile,
                venue-detail, checkin, manager, venue-portal, venue-dashboard,
                register, inbox, admin, staff-status)
  accounts/     account.models.ts, account.service.ts (roles, registration, approvals)
  notify/       notification.service.ts, twilio-sms.channel.ts, twilio.config.ts
  native/       platform.ts, push.service.ts, geofence.service.ts,
                geocoding.service.ts, *.config.ts   (Cordova/Pushwoosh/Google)
  vip.service.ts   domain store (venues, members-as-VIPs, tiers, requests, check-in)
  mock-data.ts     seed venues, members, staff, tiers
config.xml        Cordova app + plugins (Pushwoosh, geofence, geolocation)
netlify.toml      Netlify build config
```

## Decisions locked in

- **Auth:** email + password; phone for SMS (not phone-OTP login).
- **Venue approval:** vetted by My VIP Clubs (platform admin).
- **Staff approval:** venue Owner **and** Managers can confirm.
- **Notifications:** SMS-first via **Twilio**, backed by an in-app inbox.
- **Coordinates:** real addresses baked in + a Google Geocoding service ready
  for new venues (no key needed to run today).
- **Native push/geofencing (Cordova + Pushwoosh):** scaffolded but **deferred** —
  intentionally not the current focus.

## What's mocked vs. real (important)

| Area | Today | Needs |
| --- | --- | --- |
| Data (accounts, venues, requests, notifications) | in-memory, resets on refresh | backend + database |
| SMS (Twilio) | mock outbox (records payloads) | backend endpoint + Twilio account + A2P 10DLC |
| GPS arrival | simulated in the browser | native geolocation/geofencing (Cordova) |
| Push notifications | scaffolded, dormant | Pushwoosh + native build |
| Passwords | plaintext demo values | real hashing + sessions |
| Geocoding | baked coords / optional Google key | Google Maps API key |

## Roadmap (proposed order)

1. **Backend + persistence** *(unblocks everything).* Database + API for
   accounts, venues, staff memberships, access requests, notifications. Real
   auth (hashed passwords, sessions). → data stops resetting; multi-device.
2. **Twilio live.** Thin `POST /notifications/sms` endpoint (holds the Twilio
   token), flip `twilio.config.ts` to `backend`. Register **A2P 10DLC** brand +
   campaign for US SMS delivery.
3. **Spend capture → tiers.** Where do spend + tips come from? (POS/manual venue
   entry/receipts.) This is the engine behind tier status — needs a source.
4. **Native app.** Cordova build with real **GPS geofencing** + **Pushwoosh**
   push, so "recognized before you walk in" works for real. iOS + Android.
5. **Product depth.** Two-sided reservations (table requests), owner invites
   managers/staff, member spend history, richer venue profiles + photos + maps,
   search/discovery, ratings of staff ("my people").
6. **Polish & launch.** Onboarding, branding, App Store / Play Store submission,
   real venue + staff data.

## What I'll need from you (when ready)

- **Twilio** account (Account SID, Auth Token, a Messaging Service / number) and
  A2P 10DLC registration.
- **Google Maps** API key (Geocoding + optionally Maps display).
- **Pushwoosh** account (App ID) + Firebase (Android) / Apple Push key (iOS) —
  for the native phase.
- **Apple Developer** + **Google Play** accounts for store submission.
- Branding (logo, colors, app name) and any **real venue/staff** data to seed.

## Next action

Pick the next phase — I recommend **#1 Backend + persistence** so the demo data
stops resetting and everything becomes real and multi-user. Say the word and I'll
propose the specific stack (e.g., a lightweight API + Postgres, or a
backend-as-a-service) and start wiring it.

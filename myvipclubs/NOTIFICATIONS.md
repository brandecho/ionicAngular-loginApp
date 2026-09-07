# Notifications, roles & registration (interim build)

This is the SMS-first notification + account model. It runs today with mock data
and a **mock Twilio adapter**; going live is mostly a backend + config change.

## Roles / hierarchy

```
Platform Admin (My VIP Clubs)   → approves VENUES
  Venue Owner / Manager         → approve STAFF, get VIP alerts
    Staff (bartender/server/…)  → join a venue, get VIP alerts once approved
Member (VIP)                    → the guest
```

- Login is **email + password**; every account also has a **mobile number** used
  only for SMS.
- Venue is confirmed by **My VIP Clubs** (`/admin`).
- Staff is confirmed by the venue's **Owner or a Manager** (venue portal → Team).

## Registration flows

| Who | Where | Result |
| --- | --- | --- |
| Member | `/register` → "I'm a member" | Account created, straight into the app |
| Venue | `/register` → "I run a venue" | Pending → **admin** approves → venue goes live |
| Staff | `/register` → "I'm venue staff" (pick venue + role) | Pending → **venue** approves → gets VIP alerts |

Each step notifies the level above (inbox + SMS): staff→venue, venue→admin;
and the decision notifies back down: venue→staff, admin→owner.

## Notification architecture

- **In-app Inbox** is the source of truth. Every event writes an `AppNotification`
  addressed to an audience: a specific account, a whole venue (owner+managers+staff),
  or the platform-admin role. Actionable items deep-link to the right screen.
- **SMS (Twilio)** is the nudge that pulls people back to the inbox.

Code:
- `notify/notification.service.ts` — `notify({ audience, type, title, body, deepLink, sms })`
  writes the inbox item and hands any SMS to the channel.
- `notify/twilio-sms.channel.ts` — the SMS channel. **Mock mode** records the exact
  payload into an outbox (visible at `/admin` → *SMS outbox*). **Backend mode** POSTs
  to your endpoint.
- `notify/twilio.config.ts` — mode + backend endpoint + (non-secret) Twilio refs.

Wired events: `access_request`, `access_approved/declined`, `vip_arriving`,
`staff_join_request`, `staff_approved/declined`, `venue_pending_review`,
`venue_approved/declined` (`table_request` type reserved).

## Going live (Phase 2) — Twilio

Twilio's Auth Token is a secret and must never ship in the app, so:

1. Stand up a tiny backend endpoint: `POST /notifications/sms { to, body }` that
   calls Twilio (Programmable Messaging + a Messaging Service) with the token.
2. Set `twilio.config.ts` → `mode: 'backend'`, `backendSendEndpoint: '<url>'`.
   No page code changes — the outbox calls flip to real sends.
3. **Twilio Verify** is the natural add for phone verification later (we chose
   email+password login for now, so it's optional).
4. **A2P 10DLC**: register your brand + campaign before US SMS will deliver
   reliably.

Deep links: SMS bodies should carry a short link that opens the app to the
notification's `deepLink` (e.g. `/manager/:memberId?venue=:id`,
`/venue-portal/:id`, `/staff-status/:id`).

## Try it (demo)

- **Staff approval:** `/venue-portal` → Velvet Room → **Team** → approve *Nina Torres*.
- **Venue vetting + SMS log:** login → *Platform admin* → approve *Lumen Rooftop*,
  then open **SMS outbox** to see every text that would have been sent.
- **VIP arrival → venue:** member Home → *I'm here* → Velvet Room → then the venue's
  inbox (bell) shows the arrival.

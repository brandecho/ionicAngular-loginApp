# My VIP Clubs

**The hookup. Recognized before you walk in the door.**

My VIP Clubs is a members app that gives people VIP access to venues they
normally couldn't get into on their own — and lets those venues recognize a VIP
*before* they reach the door. No calling a manager, no waiting in line.

Built with **Ionic 8 + Angular 20** (standalone components, Angular signals).

## What it does

### For the member
- **Tier & status** — see your tier (Silver → Gold → Platinum → Black → Noir),
  your lifetime value, and live progress toward the next tier. Tiers are earned
  automatically from **total spent + total tips**.
- **Total spent / total tips / visits** at a glance.
- **My Venues** — the places that already take care of you, with your access status.
- **My People** — your favorite bartenders, servers, hosts, sommeliers and event
  managers, including notes on how they look after you.
- **Discover** — browse venues you don't have access to yet and tap
  *"I'm interested — get me in."* My VIP Clubs makes the call for you; the request
  moves from *sent* → *concierge is on it* → *access granted*.
- **Profile / My tastes** — your go-to drink, spirit, seating, music, allergies,
  celebrations and house notes. Editable. This is what venues see.

### The recognition flow (the core idea)
1. The member taps **"I'm here"** (in production this is triggered automatically by
   **GPS** when they enter the area around a venue).
2. The app confirms location, then sends a **push notification to the venue
   manager**: *"VIP inbound · Platinum — Alex Morgan is 1.1 mi away (~4 min)."*
3. The manager taps the notification and opens the **recognition view**
   (`/manager/:memberId`) — the member's name, photo, tier, lifetime value, ETA,
   and a **"How to take care of them"** card (drink, spirit, seating, music,
   **allergies**, occasion, notes).
4. The manager taps **"Welcome [name]"** — the host, bar and floor are notified.
   The member walks in, greeted by name, no line, no wait.

## View it in a browser

**Hosted — Netlify (recommended):** connect the repo once and Netlify gives you
a live, auto-updating URL. Build settings are pre-filled by `netlify.toml`.
Step-by-step (first-timer friendly): **[NETLIFY.md](../NETLIFY.md)**.

**Locally:**

```bash
cd myvipclubs
npm install
npm start                 # http://localhost:4200
# or a fixed port:
npx ng serve --port 8100  # http://localhost:8100
```

## Demo accounts (for testing)

On the login screen, tap a **demo account** to sign straight in as that persona,
or type the email + password. Passwords are `demo` (admin is `admin`).

| Persona | Email | Password | Lands on |
| --- | --- | --- | --- |
| Member (Alex Morgan, Platinum) | brandechomedia@gmail.com | demo | Member app |
| Venue owner (Velvet Room) | elena@velvetroom.com | demo | Venue dashboard |
| Venue manager (Velvet Room) | sofia@velvetroom.com | demo | Venue dashboard |
| Platform admin | admin@myvipclubs.app | admin | Admin (venue vetting + SMS outbox) |
| Staff — pending (Nina) | nina@example.com | demo | Staff status |
| Owner — pending venue (Lumen) | priya@lumenrooftop.com | demo | Venue portal |

### Things to try
- **Recognition:** Member → Home → **I'm here** → pick a venue → **Open the
  manager's view** (or open `/#/manager/m1?venue=v2`).
- **Staff approval:** Venue owner → **Team** tab → confirm *Nina Torres*.
- **Venue vetting + SMS log:** Platform admin → approve *Lumen Rooftop*, then
  open **SMS outbox** to see every text Twilio would send.
- **Access request:** Member → **Discover** → *get me in* → then sign in as the
  venue owner to approve it.

## Project structure

```
myvipclubs/
  src/app/
    pages/
      login.page.ts          Login
      tabs.page.ts           Bottom tab shell
      home.page.ts           Dashboard: tier, spend, tips, progress, perks
      venues.page.ts         My favorite venues
      people.page.ts         My People (staff)
      discover.page.ts       Request access to new venues
      profile.page.ts        Member profile + editable tastes
      venue-detail.page.ts   Single venue + its staff + check-in
      checkin.page.ts        GPS arrival -> push simulation
      manager.page.ts        Venue-side recognition view (from the push)
    components/tier-badge.component.ts
    vip.service.ts           Signals store: tier logic, favorites, requests, check-in
    models.ts                Types
    mock-data.ts             Demo member, venues, staff, tiers
```

## Native app (Cordova + Pushwoosh + geofencing)

The app is packaged for iOS/Android with **Apache Cordova**:

- **Push** via the **Pushwoosh** Cordova plugin (`pushwoosh-cordova-plugin`) —
  registration, device tagging by member id, and deep-linking a tapped push
  (e.g. a manager opening the "VIP arriving" alert → the recognition view).
- **Geofencing** via `cordova-plugin-geofence` — a geofence is armed around every
  venue the member can enter; on **arrival** it fires the same `checkIn()` that
  the "I'm here" button does, which is what alerts the venue manager.

The native integration lives in `src/app/native/` and is fully guarded by
`isCordova()`, so `ng serve` / the web build are unaffected. Web build outputs to
`./www`, which Cordova packages.

See **[CORDOVA.md](./CORDOVA.md)** for the full build guide (credentials,
`cordova platform add`, run/build scripts, permissions, and the backend piece).

## Notes
This is a functional client prototype. Data is in-memory mock data
(`mock-data.ts`); on the web the GPS/push steps are simulated. In a Cordova build
the geofence + Pushwoosh plugins are real — the remaining production piece is a
backend that delivers the manager push (see CORDOVA.md §7).

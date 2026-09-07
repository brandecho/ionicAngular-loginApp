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

## Run it locally

```bash
cd myvipclubs
npm install
npm start          # ng serve on http://localhost:8100  (see angular.json / package.json)
# or:
npx ng serve --port 8100
```

Then open http://localhost:8100. On the login screen tap **"Enter the club"** to
sign in as the demo member (Alex Morgan).

### Try the recognition flow
- From **Home**, tap **I'm here** → pick a venue → watch the GPS/push sequence →
  tap **Open the manager's view** to see what the venue receives.
- Or open the venue-side link directly: **`/manager/m1?venue=v2`**.

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

## Notes
This is a functional front-end prototype. Data is in-memory mock data
(`mock-data.ts`) and the GPS/push steps are simulated in the browser. Wiring up a
real backend, geolocation, and push notifications (e.g. Capacitor Geolocation +
Push Notifications / FCM) are the natural next steps.

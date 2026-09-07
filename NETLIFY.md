# Preview My VIP Clubs on Netlify (first-time setup)

Netlify gives you a free, always-on URL that rebuilds automatically every time
we push. This repo already contains `netlify.toml`, so Netlify auto-detects how
to build — you don't type any build settings.

## One-time setup (~2 minutes)

1. Go to **https://app.netlify.com** and click **Sign up** → **Sign up with
   GitHub** (log in with your GitHub account).
2. Click **Add new site** → **Import an existing project**.
3. Choose **GitHub** and authorize Netlify when asked. (You can grant access to
   just the `ionicAngular-loginApp` repo.)
4. Pick the repository **`brandecho/ionicAngular-loginApp`**.
5. **Branch to deploy:** choose **`claude/my-vip-clubs-app-qhwtmc`**.
   - Netlify auto-fills the rest from `netlify.toml`:
     Base `myvipclubs`, Build command `npm run build`, Publish `myvipclubs/www`.
   - If any field is blank, use those exact values.
6. Click **Deploy**. First build takes ~2–3 minutes.
7. Netlify gives you a URL like `https://<random-name>.netlify.app`. Open it —
   that's the live app. You can rename it under **Site configuration → Change
   site name**.

That's it. From now on, **every push auto-deploys** — no clicking required.

## Using the app

On the login screen, tap a **demo account** (passwords are `demo`, admin is
`admin`):

| Persona | Email |
| --- | --- |
| Member (Alex, Platinum) | brandechomedia@gmail.com |
| Venue owner (Velvet Room) | elena@velvetroom.com |
| Venue manager (Velvet Room) | sofia@velvetroom.com |
| Platform admin | admin@myvipclubs.app |
| Staff — pending (Nina) | nina@example.com |
| Owner — pending venue (Lumen) | priya@lumenrooftop.com |

Note: demo data lives in memory, so a hard refresh resets it to the seed state
(handy for repeatable testing). Persistence comes with the backend.

## Troubleshooting

- **Build fails:** open the deploy log on Netlify. The most common cause is Node
  version — this is pinned to 22 in `netlify.toml`, which Angular 20 needs.
- **Page is blank:** make sure the publish directory resolved to
  `myvipclubs/www` and that the branch is `claude/my-vip-clubs-app-qhwtmc`.

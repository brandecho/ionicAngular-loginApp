# My VIP Clubs API (Node + Express + MySQL)

The backend for My VIP Clubs. Runs on your GoDaddy **VPS/dedicated server**,
talks to your **MySQL** database, sends SMS via **Twilio**, and receives
**JotForm** membership applications by webhook.

```
Ionic app  ─┐
JotForm     ─┼─►  api.myvipclubs.com  ──►  MySQL (on the VPS)
Twilio  ◄────┘        (this Node API)
```

## What's here

- `schema.sql` — the MySQL schema (mirrors the JotForm application).
- `src/index.js` — Express app + routes.
- `src/routes/auth.js` — register / login (bcrypt + JWT).
- `src/routes/members.js` — `GET/PATCH /api/members/me`.
- `src/routes/venues.js` — list venues, request access (notifies venue + SMS).
- `src/routes/jotform.js` — `POST /api/webhooks/jotform` intake mapping.
- `src/services/twilio.js` — SMS send + `sms_outbox` logging.

> Implemented so far: health, auth, member profile, venue list + access request,
> JotForm intake, Twilio send. Still stubbed for later: venue approval endpoints,
> staff join/approve, notifications read API, tier calculation. (The Ionic app
> still uses its in-memory mock service — wiring it to this API is the next step.)

## Deploy on your GoDaddy VPS

SSH into the server, then:

### 1. Install prerequisites (Ubuntu example)
```bash
# Node 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs git
# MySQL (skip if already installed on the VPS)
sudo apt-get install -y mysql-server
sudo mysql_secure_installation
```

### 2. Create the database + user
```bash
sudo mysql
```
```sql
CREATE DATABASE myvipclubs CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'myvipclubs'@'localhost' IDENTIFIED BY 'a-strong-password';
GRANT ALL PRIVILEGES ON myvipclubs.* TO 'myvipclubs'@'localhost';
FLUSH PRIVILEGES;  EXIT;
```

### 3. Get the code + configure
```bash
git clone -b claude/my-vip-clubs-app-qhwtmc https://github.com/brandecho/ionicAngular-loginApp
cd ionicAngular-loginApp/server
npm install
cp .env.example .env
nano .env      # set DB_*, JWT_SECRET, CORS_ORIGIN, Twilio, JotForm token
npm run migrate   # applies schema.sql
```

### 4. Run it with PM2 (keeps it alive + restarts on boot)
```bash
sudo npm install -g pm2
pm2 start src/index.js --name myvipclubs-api
pm2 save && pm2 startup   # run the command it prints
curl http://127.0.0.1:8080/api/health    # {"ok":true,"db":"up"}
```

### 5. Point api.myvipclubs.com at it (nginx + SSL)
- DNS: add an **A record** `api` → your VPS IP.
- Reverse proxy with nginx:
```nginx
server {
  server_name api.myvipclubs.com;
  location / { proxy_pass http://127.0.0.1:8080; proxy_set_header Host $host; }
}
```
- Free HTTPS: `sudo apt-get install -y certbot python3-certbot-nginx && sudo certbot --nginx -d api.myvipclubs.com`

### 6. Wire JotForm
In the form's **Settings → Integrations → Webhooks**, add:
```
https://api.myvipclubs.com/api/webhooks/jotform
```
(Optionally set `JOTFORM_WEBHOOK_TOKEN` in `.env` and append `?token=...`.)
Submit the form once, then check the `members` table — verify the fields landed
and adjust `src/routes/jotform.js` if any `q<n>_` key differs.

## Local development
```bash
cp .env.example .env   # point DB_* at a local MySQL
npm run migrate
npm run dev            # http://localhost:8080/api/health
```

## Security notes
- Keep `.env` out of git (it is, via `.gitignore`). Rotate `JWT_SECRET` if leaked.
- The Twilio Auth Token lives only in `.env` on the server — never in the app.
- Put the API behind HTTPS (step 5) before going live.

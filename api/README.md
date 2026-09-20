# My VIP Clubs API (PHP + MySQL, for Apache)

The backend, written in **plain PHP (8.0+)** so it runs on your existing GoDaddy
**Apache + MySQL** server. **No Node, no Composer, no dependencies** — just copy
the files and point Apache at `api/public/`. Needs the `pdo_mysql` and `curl`
PHP extensions (both standard on GoDaddy).

```
Ionic app  ─┐
JotForm     ─┼─►  api.myvipclubs.com  ──►  MySQL (on your server)
Twilio  ◄───┘        (this PHP API)
```

## Endpoints
- `GET  /api/health` — DB connectivity check
- `POST /api/auth/register` · `POST /api/auth/login` — email/password (bcrypt) → JWT
- `GET  /api/members/me` · `PATCH /api/members/me` — member profile (JWT required)
- `GET  /api/venues` · `GET /api/venues/{id}`
- `POST /api/venues/{id}/request` — member requests access (notifies venue + SMS)
- `POST /api/webhooks/jotform` — membership-application intake

## Layout
```
api/
  schema.sql            MySQL schema
  config.example.php    copy to config.php and fill in (config.php is git-ignored)
  public/               <-- Apache document root points HERE
    index.php           front controller (router)
    .htaccess           routes everything to index.php
  src/                  Db, Jwt, Response, Twilio, and route handlers
```

## Deploy on your GoDaddy Apache server

### 1. Import the database
In cPanel → MySQL Databases (or via SSH), create a database + user, then import:
```bash
mysql -u <user> -p <database> < api/schema.sql
```

### 2. Configure
```bash
cp api/config.example.php api/config.php
# edit api/config.php: db credentials, a long jwt_secret, cors_origins, Twilio (optional)
# generate a secret:  php -r "echo bin2hex(random_bytes(48));"
```

### 3. Put the files on the server
Upload the `api/` folder somewhere **outside** your public web root (so `src/`
and `config.php` are never web-served), e.g. `/home/<you>/myvipclubs-api/`.

### 4. Point the subdomain at `api/public`
Create subdomain **api.myvipclubs.com** and set its **document root** to
`.../myvipclubs-api/api/public`. (cPanel → Domains → Create A New Domain, or an
Apache vhost `DocumentRoot`.) Ensure `AllowOverride All` is set for that dir so
`.htaccess` works, and `mod_rewrite` is enabled.

Apache vhost example:
```apache
<VirtualHost *:80>
  ServerName api.myvipclubs.com
  DocumentRoot /home/you/myvipclubs-api/api/public
  <Directory /home/you/myvipclubs-api/api/public>
    AllowOverride All
    Require all granted
  </Directory>
</VirtualHost>
```

### 5. HTTPS
Turn on SSL for the subdomain (cPanel → SSL/TLS Status → Run AutoSSL, or
`certbot --apache -d api.myvipclubs.com`). Then test:
```
https://api.myvipclubs.com/api/health   ->  {"ok":true,"db":"up"}
```

### 6. Wire JotForm
Form → **Settings → Integrations → Webhooks** → add:
```
https://api.myvipclubs.com/api/webhooks/jotform
```
Submit once, then check the `members` table. If a `q<n>_` key differs, adjust
`src/routes/Jotform.php` (mapping is by field name, resilient to the q-number).

## Local test (with a local MySQL)
```bash
cp config.example.php config.php   # point db.* at local MySQL, import schema.sql
php -S 127.0.0.1:8080 -t public
curl http://127.0.0.1:8080/api/health
```

## Security
- `config.php` holds all secrets and is git-ignored — never commit it.
- The Twilio Auth Token lives only in `config.php` on the server, never in the app.
- Keep `src/` and `config.php` outside the web root (step 3); only `public/` is served.
- Serve over HTTPS before going live.

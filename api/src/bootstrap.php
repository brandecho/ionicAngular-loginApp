<?php
declare(strict_types=1);

// Load config (config.php overrides; falls back to example so linting works).
$__cfgFile = file_exists(__DIR__ . '/../config.php')
  ? __DIR__ . '/../config.php'
  : __DIR__ . '/../config.example.php';
$GLOBALS['CONFIG'] = require $__cfgFile;

require __DIR__ . '/Db.php';
require __DIR__ . '/Jwt.php';
require __DIR__ . '/Response.php';
require __DIR__ . '/Twilio.php';
require __DIR__ . '/Stripe.php';
require __DIR__ . '/routes/Auth.php';
require __DIR__ . '/routes/Members.php';
require __DIR__ . '/routes/Venues.php';
require __DIR__ . '/routes/Jotform.php';
require __DIR__ . '/routes/Admin.php';
require __DIR__ . '/routes/Payments.php';

function cfg(string $key, $default = null) {
  return $GLOBALS['CONFIG'][$key] ?? $default;
}

/** Parsed JSON body, or urlencoded $_POST (JotForm) as a fallback. */
function body(): array {
  $raw = file_get_contents('php://input');
  if ($raw) {
    $j = json_decode($raw, true);
    if (is_array($j)) return $j;
  }
  return $_POST ?: [];
}

/** RFC-4122 v4 UUID. */
function uuid4(): string {
  $d = random_bytes(16);
  $d[6] = chr((ord($d[6]) & 0x0f) | 0x40);
  $d[8] = chr((ord($d[8]) & 0x3f) | 0x80);
  return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($d), 4));
}

/** Authorization: Bearer token from any of the places Apache may put it. */
function bearerToken(): ?string {
  $h = $_SERVER['HTTP_AUTHORIZATION']
    ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION']
    ?? '';
  if (!$h && function_exists('getallheaders')) {
    foreach (getallheaders() as $k => $v) {
      if (strcasecmp($k, 'Authorization') === 0) { $h = $v; break; }
    }
  }
  if (preg_match('/Bearer\s+(.+)/i', $h, $m)) return trim($m[1]);
  return null;
}

/** Require a valid session; returns claims or sends 401. */
function requireAuth(): array {
  $token = bearerToken();
  $claims = $token ? Jwt::verify($token) : null;
  if (!$claims) Response::error('unauthorized', 401);
  return $claims;
}

/** Require an admin session; returns claims or sends 401/403. */
function requireAdmin(): array {
  $claims = requireAuth();
  if (($claims['role'] ?? '') !== 'admin') Response::error('admin only', 403);
  return $claims;
}
